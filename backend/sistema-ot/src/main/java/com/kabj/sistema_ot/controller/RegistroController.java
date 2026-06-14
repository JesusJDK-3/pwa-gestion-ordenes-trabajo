package com.kabj.sistema_ot.controller;
import java.util.stream.Collectors;
import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.OpCuadrilla;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.OpOtAcompanante;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.CuadrillaService;
import com.kabj.sistema_ot.service.EventoService;
import com.kabj.sistema_ot.service.OpOtAcompananteService;
import com.kabj.sistema_ot.service.OpOtFormularioService;
import com.kabj.sistema_ot.service.OpOtPurgadoHidranteService;
import com.kabj.sistema_ot.service.OrdenTrabajoService;
import com.kabj.sistema_ot.service.SyncService;
import com.kabj.sistema_ot.entity.OpOtPurgadoHidrante;
import com.kabj.sistema_ot.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RegistroController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final CatEstadoOtRepository estadoRepo;
    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;
    private final CuadrillaService cuadrillaService;
    private final OpOtAcompananteService acompananteService;
    private final SyncService syncService;
    private final EventoService eventoService;
    private final OrdenTrabajoService ordenService;
    private final OpOtFormularioService formularioService;
    private final OpOtPurgadoHidranteService purgadoService;

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
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> crear(@RequestBody Map<String, Object> body,
                                                                   Authentication auth) {
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
        RrhhCapataz capatazAuth = getCapataz(auth);
        try {
            ordenService.validarPropiedadCapataz(ot, capatazAuth);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }

        String estadoAnterior = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";

        // Guardar observación y tipo en la OT
        if (obs != null && !obs.isBlank()) {
            String obsExistente = ot.getObservacion() != null ? ot.getObservacion() + "\n" : "";
            String prefijo = tipo != null ? "[" + tipo + "] " : "";
            ot.setObservacion(obsExistente + prefijo + obs);
        }

        String cuadrillaNombre = str(body.get("cuadrillaNombre"));
        Long cuadrillaId = parseLong(body.get("cuadrillaId"));
        List<Long> asistenteIds = parseLongList(body.get("asistenteIds"));
        Long asistenteId = parseLong(body.get("asistenteId"));
        String asistenteDni = str(body.get("asistenteDni"));
        String asistenteNombres = str(body.get("asistenteNombres"));
        String asistenteApellidos = str(body.get("asistenteApellidos"));
        String asistenteCargo = str(body.get("asistenteCargo"));
        String cargoEnCuadrilla = str(body.get("cargoEnCuadrilla"));

        RrhhCapataz capataz = capatazAuth;
        OpCuadrilla cuadrilla = null;
        if (cuadrillaId != null) {
            var cuadrillaOpt = cuadrillaService.buscarPorIdYCapataz(cuadrillaId, capataz);
            if (cuadrillaOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Cuadrilla no encontrada o no corresponde al capataz", null));
            }
            cuadrilla = cuadrillaOpt.get();
        } else if (cuadrillaNombre != null && !cuadrillaNombre.isBlank()) {
            cuadrilla = cuadrillaService.crearOActualizarCuadrilla(capataz, cuadrillaNombre);
        }

        RrhhTrabajador asistente = null;
        List<RrhhTrabajador> asistentes = new java.util.ArrayList<>();
        if (asistenteIds != null && !asistenteIds.isEmpty()) {
            for (Long id : asistenteIds) {
                var asistenteOpt = cuadrillaService.buscarTrabajadorPorId(id);
                if (asistenteOpt.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false, "Trabajador no encontrado: " + id, null));
                }
                asistentes.add(asistenteOpt.get());
            }
            asistente = asistentes.get(0);
        } else if (asistenteId != null) {
            var asistenteOpt = cuadrillaService.buscarTrabajadorPorId(asistenteId);
            if (asistenteOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Trabajador no encontrado", null));
            }
            asistente = asistenteOpt.get();
            asistentes.add(asistente);
        } else if ((asistenteDni != null && !asistenteDni.isBlank())
                || ((asistenteNombres != null && !asistenteNombres.isBlank())
                && (asistenteApellidos != null && !asistenteApellidos.isBlank()))) {
            asistente = cuadrillaService.crearOEncontrarTrabajador(asistenteDni, asistenteNombres, asistenteApellidos, asistenteCargo);
            asistentes.add(asistente);
        }

        if (cuadrilla != null && asistente != null) {
            cuadrillaService.asegurarMiembroPlantilla(cuadrilla, asistente, cargoEnCuadrilla);
        }

        if (cuadrilla != null) {
            ot.setCuadrilla(cuadrilla);
        }
        if (asistente != null) {
            ot.setAsistente(asistente);
        }

        if (!asistentes.isEmpty()) {
            for (RrhhTrabajador cadaAsistente : asistentes) {
                OpOtAcompanante acompanante = new OpOtAcompanante();
                acompanante.setTrabajador(cadaAsistente);
                acompanante.setDni(cadaAsistente.getDni());
                acompanante.setNombres(cadaAsistente.getNombres());
                acompanante.setApellidos(cadaAsistente.getApellidos());
                acompanante.setCargo(cadaAsistente.getCargo());
                acompanante.setRol("AYUDANTE");
                acompananteService.crearAcompanante(idOt, acompanante);
            }
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

            if ("OBSERVADA".equals(nuevoEstado) && (obs == null || obs.isBlank())) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false,
                                "Las observaciones son obligatorias para estado OBSERVADA", null));
            }

            // HU10/HU11: Validación simulada antes de COMPLETAR
            // El sistema valida que el punto tenga observaciones antes de cerrar
            if ("COMPLETADA".equals(nuevoEstado)) {
                try {
                    syncService.validarNoBloqueada(idOt);
                } catch (RuntimeException ex) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false, ex.getMessage(), null));
                }
                boolean tieneObservaciones = (obs != null && !obs.isBlank())
                        || (ot.getObservacion() != null && !ot.getObservacion().isBlank());
                if (!tieneObservaciones) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false,
                                    "Validación fallida: debe registrar observaciones antes de completar la OT. " +
                                    "Documente el trabajo realizado para cerrar el punto.", null));
                }
                if (!"EN_PROGRESO".equals(estadoAnterior) && !"OBSERVADA".equals(estadoAnterior)) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false,
                                    "Validación fallida: la OT debe estar EN PROGRESO u OBSERVADA antes de completarse. " +
                                    "Actualice primero el estado de avance.", null));
                }
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

        try {
            var usuario = usuarioRepository.findByUsername(auth.getName()).orElse(null);
            guardarPurgadoSiAplica(ot, body, usuario);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }

        if (estadoCambiado) {
            var usuario = usuarioRepository.findByUsername(auth.getName()).orElse(null);
            String origen = Boolean.TRUE.equals(body.get("creadoOffline")) ? "MOVIL" : "WEB";
            eventoService.registrar(ot, "CAMBIO_ESTADO", estadoAnterior,
                    ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : estadoAnterior,
                    obs, usuario, origen);
        }

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

    @GetMapping("/registros/historial-apoyo")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> historialApoyo(Authentication auth) {
        RrhhCapataz capataz = getCapataz(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                acompananteService.historialPorCapataz(capataz.getIdCapataz())));
    }

    @GetMapping("/registros/punto/{puntoId}")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> porPunto(@PathVariable Long puntoId,
                                                                      Authentication auth) {
        var ot = ordenRepo.findById(puntoId);
        if (ot.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "OT no encontrada", null));
        }
        var o = ot.get();
        try {
            ordenService.validarPropiedadCapataz(o, getCapataz(auth));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
        var acompanantes = acompananteService.listarPorOT(puntoId);
        var asistentes = acompanantes.stream()
                .map(a -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("idTrabajador", a.getTrabajador() != null ? a.getTrabajador().getIdTrabajador() : null);
                    item.put("dni", a.getDni());
                    item.put("nombres", a.getNombres());
                    item.put("apellidos", a.getApellidos());
                    item.put("cargo", a.getCargo());
                    return item;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, null, Map.of(
                "idOt",         o.getIdOt(),
                "sgio",         o.getSgio(),
                "estado",       o.getEstadoOt() != null ? o.getEstadoOt().getCodigo() : "PENDIENTE",
                "observacion",  o.getObservacion() != null ? o.getObservacion() : "",
                "fechaInicio",  o.getFechaInicio() != null ? o.getFechaInicio().toString() : "",
                "fechaFin",     o.getFechaFin()    != null ? o.getFechaFin().toString()    : "",
                "asistentes",   asistentes
        )));
    }

    // ── Helpers ───────────────────────────────────────────────────
    private Long parseLong(Object o) {
        if (o == null) return null;
        try { return Long.valueOf(o.toString()); } catch (Exception e) { return null; }
    }

    private List<Long> parseLongList(Object o) {
        if (!(o instanceof List<?> rawList)) return null;
        List<Long> list = new java.util.ArrayList<>();
        for (Object item : rawList) {
            Long parsed = parseLong(item);
            if (parsed != null) {
                list.add(parsed);
            }
        }
        return list;
    }

    private String str(Object o) {
        return o != null ? o.toString().trim() : null;
    }

    private RrhhCapataz getCapataz(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Usuario no autenticado");
        }
        var usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
    }

    @SuppressWarnings("unchecked")
    private void guardarPurgadoSiAplica(OpOrdenTrabajo ot, Map<String, Object> body, Usuario usuario) {
        Object raw = body.get("purgado");
        if (!(raw instanceof Map<?, ?> purgadoMap) || purgadoMap.isEmpty()) {
            return;
        }

        Long idFormulario = formularioService.idFormularioPurgadoRedes();
        var formulario = formularioService.asegurar(ot, idFormulario, usuario);

        OpOtPurgadoHidrante purgado = new OpOtPurgadoHidrante();
        purgado.setFormulario(formulario);
        purgado.setMarcaHidrante(str(purgadoMap.get("marcaHidrante")));
        purgado.setNumeroBocamazas(parseInteger(purgadoMap.get("numeroBocamazas")));
        purgado.setPresionPsiHidrante(parseDecimal(purgadoMap.get("presionPsiHidrante")));
        purgado.setTiempoInicioPurgado(parseDateTime(purgadoMap.get("tiempoInicioPurgado")));
        purgado.setTiempoFinPurgado(parseDateTime(purgadoMap.get("tiempoFinPurgado")));
        purgado.setMedicionCloroPpm(parseDecimal(purgadoMap.get("medicionCloroPpm")));
        purgado.setObservaciones(str(purgadoMap.get("observaciones")));

        purgadoService.crearOActualizarPurgado(ot.getIdOt(), purgado);
    }

    private Integer parseInteger(Object o) {
        if (o == null) return null;
        try {
            return Integer.valueOf(o.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal parseDecimal(Object o) {
        if (o == null) return null;
        try {
            return new BigDecimal(o.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return LocalDateTime.parse(s);
        } catch (Exception e) {
            try {
                return java.time.LocalDate.parse(s).atStartOfDay();
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
