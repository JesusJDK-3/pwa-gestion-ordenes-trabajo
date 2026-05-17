package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;

    @GetMapping("/auditoria")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditoria() {
        long totalOt  = ordenRepo.count();
        long totalCap = capatazRepository.count();
        long totalUsr = usuarioRepository.count();
        Map<String, Object> data = Map.of(
                "totalOrdenes",  totalOt,
                "totalCapataces", totalCap,
                "totalUsuarios", totalUsr
        );
        return ResponseEntity.ok(new ApiResponse<>(true, null, data));
    }

    @GetMapping("/mensual")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mensual(
            @RequestParam(required = false, defaultValue = "0") int mes,
            @RequestParam(required = false, defaultValue = "0") int anio) {
        var todas = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        long total       = todas.size();
        long completadas = todas.stream().filter(o -> o.getEstadoOt() != null && "COMPLETADA".equals(o.getEstadoOt().getCodigo())).count();
        long enProgreso  = todas.stream().filter(o -> o.getEstadoOt() != null && "EN_PROGRESO".equals(o.getEstadoOt().getCodigo())).count();
        long pendientes  = todas.stream().filter(o -> o.getEstadoOt() != null && "PENDIENTE".equals(o.getEstadoOt().getCodigo())).count();
        Map<String, Object> data = Map.of(
                "total", total,
                "completadas", completadas,
                "enProgreso", enProgreso,
                "pendientes", pendientes,
                "periodo", (mes > 0 ? mes + "/" + anio : "general")
        );
        return ResponseEntity.ok(new ApiResponse<>(true, null, data));
    }

    @GetMapping("/diario")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> diario(@RequestParam(required = false) String fecha) {
        var ordenes = ordenRepo.findByActivoTrueOrderByCreatedAtDesc()
                .stream().limit(20)
                .map(ot -> Map.<String, Object>of(
                        "sgio",    ot.getSgio(),
                        "estado",  ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "",
                        "direccion", ot.getDireccion() != null ? ot.getDireccion() : ""
                )).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, null, ordenes));
    }
}
