package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST de alertas operativas derivadas del estado de las OT.
 * <p>
 * Las alertas se generan automáticamente en {@link com.kabj.sistema_ot.service.AlertaService}
 * (SIN_ASIGNAR, OBSERVADA, RETRASADA). Solo OBSERVADA puede resolverse manualmente
 * por admin/supervisor; el resto se cierra al corregir la causa.
 * </p>
 * <ul>
 *   <li>{@code GET /api/alertas} — listado filtrado por rol</li>
 *   <li>{@code GET /api/alertas/count} — contador para badges en UI</li>
 *   <li>{@code PUT /api/alertas/{id}/resolver} — marcar OBSERVADA como revisada</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                alertaService.listarActivas(auth.getName())));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> contar(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                Map.of("activas", alertaService.contarActivas(auth.getName()))));
    }

    @PutMapping("/{id}/resolver")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<Void>> resolver(@PathVariable Long id, Authentication auth) {
        alertaService.marcarResuelta(id, auth.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Alerta marcada como resuelta", null));
    }
}
