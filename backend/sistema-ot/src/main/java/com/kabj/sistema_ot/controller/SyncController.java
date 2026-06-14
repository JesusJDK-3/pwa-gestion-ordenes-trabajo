package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping("/operacion")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncOperacion(
            @RequestBody List<Map<String, Object>> operaciones,
            Authentication auth) {
        Map<String, Object> resultado = syncService.procesarOperaciones(operaciones, auth.getName());
        int ok = (int) resultado.get("procesados");
        return ResponseEntity.ok(new ApiResponse<>(true,
                ok + " actividades sincronizadas correctamente", resultado));
    }
}
