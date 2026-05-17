package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.CatEstadoOt;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RegistroController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final CatEstadoOtRepository estadoRepo;

    @PostMapping("/registros")
    public ResponseEntity<ApiResponse<Map<String, Object>>> crear(@RequestBody Map<String, Object> body) {
        Long idOt = body.get("puntoId") != null ? Long.valueOf(body.get("puntoId").toString()) : null;
        String nuevoEstado = body.get("estado") != null ? body.get("estado").toString() : null;

        if (idOt != null && nuevoEstado != null) {
            ordenRepo.findById(idOt).ifPresent(ot -> {
                estadoRepo.findByCodigo(nuevoEstado).ifPresent(est -> {
                    ot.setEstadoOt(est);
                    ot.setUpdatedAt(LocalDateTime.now());
                    if ("EN_PROGRESO".equals(nuevoEstado) && ot.getFechaInicio() == null) {
                        ot.setFechaInicio(LocalDateTime.now());
                    }
                    if (est.getEsFinal() != null && est.getEsFinal()) {
                        ot.setFechaFin(LocalDateTime.now());
                        ot.setVisibleEnMapa(false);
                    }
                    ordenRepo.save(ot);
                });
            });
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Registro guardado", Map.of("ok", true)));
    }

    @PostMapping("/registros/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sync(@RequestBody List<Map<String, Object>> registros) {
        for (Map<String, Object> reg : registros) {
            crear(reg);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Sync completado", Map.of("procesados", registros.size())));
    }

    @GetMapping("/registros/punto/{puntoId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> porPunto(@PathVariable Long puntoId) {
        var ot = ordenRepo.findById(puntoId);
        if (ot.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "OT no encontrada", null));
        }
        Map<String, Object> data = Map.of(
                "idOt",   ot.get().getIdOt(),
                "sgio",   ot.get().getSgio(),
                "estado", ot.get().getEstadoOt() != null ? ot.get().getEstadoOt().getCodigo() : "PENDIENTE"
        );
        return ResponseEntity.ok(new ApiResponse<>(true, null, data));
    }

    @GetMapping("/alertas")
    public ResponseEntity<ApiResponse<List<Object>>> alertas() {
        return ResponseEntity.ok(new ApiResponse<>(true, null, List.of()));
    }

    @PutMapping("/alertas/{id}/leer")
    public ResponseEntity<ApiResponse<Void>> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", null));
    }
}
