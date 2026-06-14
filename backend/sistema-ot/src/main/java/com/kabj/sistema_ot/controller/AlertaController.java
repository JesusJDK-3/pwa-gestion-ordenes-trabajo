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
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<ApiResponse<Void>> resolver(@PathVariable Long id, Authentication auth) {
        alertaService.marcarResuelta(id, auth.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Alerta marcada como resuelta", null));
    }
}
