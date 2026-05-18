package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RegistroController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final CatEstadoOtRepository estadoRepo;

    /**
     * Registra actividad de campo del capataz.
     *
     * Body esperado:
     *   puntoId       (Long)   - ID de la OT
     *   tipoActividad (String) - tipo de trabajo realizado: Inspección, Mantenimiento, etc.
     *   estado        (String) - nuevo estado de la OT (opcional): EN_PROGRESO | COMPLETADA | OBSERVADA
     *   observaciones (String) - notas del capataz
     *   fechaRegistro (String) - fecha del trabajo
     *   creadoOffline (Boolean)
     */
    @PostMapping("/registros")
    public ResponseEntity<ApiResponse<Map<String, Object>>> crear(@RequestBody Map<String, Object> body) {
        Long idOt          = parseLong(body.get("puntoId"));
        String nuevoEstado = str(body.get("estado"));
        String tipo        = str(body.get("tipoActividad"));
        String obs         = str(body.get("observaciones"));

        if (idOt == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Se requiere puntoId", null));
        }

        var otOpt = ordenRepo.findById(idOt);
        if (otOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "OT no encontrada: " + idOt, null));
        }

        var ot = otOpt.get();
        String estadoAnterior = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";

        // Guardar observación y tipo en la OT
        if (obs != null && !obs.isBlank()) {
            String obsExistente = ot.getObservacion() != null ? ot.getObservacion() + "\n" : "";
            String prefijo = tipo != null ? "[" + tipo + "] " : "";
            ot.setObservacion(obsExistente + prefijo + obs);
        }

        // Actualizar estado solo si se indica uno distinto al actual y válido para el capataz
        boolean estadoCambiado = false;
        if (nuevoEstado != null && !nuevoEstado.isBlank()
                && !nuevoEstado.equals("SIN_CAMBIO")
                && !nuevoEstado.equals(estadoAnterior)) {

            // El capataz no puede ANULAR una OT
            if ("ANULADA".equals(nuevoEstado)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "El capataz no puede anular una OT", null));
            }

            // HU10/HU11: Validación simulada antes de COMPLETAR
            // El sistema valida que el punto tenga observaciones antes de cerrar
            if ("COMPLETADA".equals(nuevoEstado)) {
                boolean tieneObservaciones = (obs != null && !obs.isBlank())
                        || (ot.getObservacion() != null && !ot.getObservacion().isBlank());
                if (!tieneObservaciones) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false,
                                    "Validación fallida: debe registrar observaciones antes de completar la OT. " +
                                    "Documente el trabajo realizado para cerrar el punto.", null));
                }
                // HU09: Validación simulada de evidencias externas — verifica que la OT esté en estado correcto
                if (!"EN_PROGRESO".equals(estadoAnterior) && !"OBSERVADA".equals(estadoAnterior)) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false,
                                    "Validación fallida: la OT debe estar EN PROGRESO u OBSERVADA antes de completarse. " +
                                    "Actualice primero el estado de avance.", null));
                }
                log.info("Validación OK — OT-{} apta para COMPLETAR (obs={} chars)", idOt,
                        obs != null ? obs.length() : 0);
            }

            var estOpt = estadoRepo.findByCodigo(nuevoEstado);
            if (estOpt.isPresent()) {
                var est = estOpt.get();
                ot.setEstadoOt(est);

                // Registrar fechas automáticamente según el estado
                if ("EN_PROGRESO".equals(nuevoEstado) && ot.getFechaInicio() == null) {
                    ot.setFechaInicio(LocalDateTime.now());
                }
                if (est.getEsFinal() != null && est.getEsFinal()) {
                    ot.setFechaFin(LocalDateTime.now());
                    // OT completada/anulada no se muestra en el mapa
                    ot.setVisibleEnMapa(false);
                }
                estadoCambiado = true;
            } else {
                log.warn("Estado '{}' no encontrado en cat_estado_ot", nuevoEstado);
            }
        }

        ot.setUpdatedAt(LocalDateTime.now());
        ordenRepo.save(ot);

        String estadoFinal = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
        String mensaje = estadoCambiado
                ? "Actividad registrada — OT actualizada a " + estadoFinal
                : "Actividad registrada";

        log.info("Registro OT-{} | tipo={} | {} → {}", idOt, tipo, estadoAnterior, estadoFinal);

        return ResponseEntity.ok(new ApiResponse<>(true, mensaje, Map.of(
                "idOt",          idOt,
                "estadoAnterior", estadoAnterior,
                "estadoActual",  estadoFinal,
                "cambiado",      estadoCambiado
        )));
    }

    @PostMapping("/registros/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sync(@RequestBody List<Map<String, Object>> registros) {
        int ok = 0;
        for (Map<String, Object> reg : registros) {
            try { crear(reg); ok++; } catch (Exception e) {
                log.warn("Error en sync registro: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Sync completado",
                Map.of("procesados", ok, "total", registros.size())));
    }

    @GetMapping("/registros/punto/{puntoId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> porPunto(@PathVariable Long puntoId) {
        var ot = ordenRepo.findById(puntoId);
        if (ot.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "OT no encontrada", null));
        }
        var o = ot.get();
        return ResponseEntity.ok(new ApiResponse<>(true, null, Map.of(
                "idOt",         o.getIdOt(),
                "sgio",         o.getSgio(),
                "estado",       o.getEstadoOt() != null ? o.getEstadoOt().getCodigo() : "PENDIENTE",
                "observacion",  o.getObservacion() != null ? o.getObservacion() : "",
                "fechaInicio",  o.getFechaInicio() != null ? o.getFechaInicio().toString() : "",
                "fechaFin",     o.getFechaFin()    != null ? o.getFechaFin().toString()    : ""
        )));
    }

    @PutMapping("/alertas/{id}/leer")
    public ResponseEntity<ApiResponse<Void>> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", null));
    }

    // ── Helpers ───────────────────────────────────────────────────
    private Long parseLong(Object o) {
        if (o == null) return null;
        try { return Long.valueOf(o.toString()); } catch (Exception e) { return null; }
    }

    private String str(Object o) {
        return o != null ? o.toString().trim() : null;
    }
}
