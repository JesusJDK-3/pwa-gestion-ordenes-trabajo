package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.service.RegistroActividadService;
import com.kabj.sistema_ot.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;
    private final RegistroActividadService registroService;

    @GetMapping("/diario")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> diario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(new ApiResponse<>(true, null, reporteService.getResumenDiario(fecha)));
    }

    @GetMapping("/mensual")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mensual(
            @RequestParam int mes,
            @RequestParam int anio) {
        return ResponseEntity.ok(new ApiResponse<>(true, null, reporteService.getResumenMensual(mes, anio)));
    }

    @GetMapping("/exportar-excel")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) throws IOException {
        byte[] data = reporteService.exportarExcel(fecha);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte-" + fecha + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/auditoria")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<Object>>> auditoria() {
        var registros = reporteService.getAuditoria().stream()
                .map(registroService::toResponse)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, null, (List<Object>) (List<?>) registros));
    }
}
