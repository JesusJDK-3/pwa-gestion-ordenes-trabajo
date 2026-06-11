package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.CatEstadoOt;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.service.ExcelCargaService;
import com.kabj.sistema_ot.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenService;
    private final ExcelCargaService excelCargaService;
    private final OpOrdenTrabajoRepository ordenRepo;
    private final RrhhCapatazRepository capatazRepository;
    private final CatEstadoOtRepository estadoRepo;

    @GetMapping("/ordenes")
    public ResponseEntity<List<OrdenTrabajoResponse>> listar() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    @PostMapping("/ordenes/carga-excel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cargarExcel(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        try {
            String username = auth != null ? auth.getName() : "sistema";
            Map<String, Object> resultado = excelCargaService.cargarExcel(file, username);
            return ResponseEntity.ok(new ApiResponse<>(true,
                    resultado.get("message").toString(), resultado));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error al procesar Excel: " + e.getMessage(), null));
        }
    }

    /**
     * Endpoint para que Admin cargue el Excel de VPA
     * POST /api/admin/vpa/carga-excel
     */
    @PostMapping("/admin/vpa/carga-excel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cargarVpaExcel(
            @RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> resultado = excelCargaService.cargarVpaExcel(file);
            return ResponseEntity.ok(new ApiResponse<>(true,
                    resultado.get("message").toString(), resultado));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error al procesar Excel VPA: " + e.getMessage(), null));
        }
    }

    /**
     * Endpoint para que Admin cargue el Excel de Hidrantes
     * POST /api/admin/hidrantes/carga-excel
     */
    @PostMapping("/admin/hidrantes/carga-excel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cargarHidranteExcel(
            @RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> resultado = excelCargaService.cargarHidranteExcel(file);
            return ResponseEntity.ok(new ApiResponse<>(true,
                    resultado.get("message").toString(), resultado));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error al procesar Excel Hidrantes: " + e.getMessage(), null));
        }
    }

    @GetMapping("/ordenes/{id}")
    public ResponseEntity<OrdenTrabajoResponse> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(ordenService.detalle(id));
    }

    @GetMapping("/ordenes/coordenadas-pendientes")
    public ResponseEntity<List<OrdenTrabajoResponse>> coordenadasPendientes() {
        return ResponseEntity.ok(ordenService.listarCoordenadasPendientes());
    }

    @PutMapping("/puntos/{id}/coordenadas")
    public ResponseEntity<ApiResponse<OrdenTrabajoResponse>> corregirCoordenadas(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal lat = body.get("latitud") != null
                    ? new BigDecimal(body.get("latitud").toString()) : null;
            BigDecimal lng = body.get("longitud") != null
                    ? new BigDecimal(body.get("longitud").toString()) : null;
            if (lat == null || lng == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "latitud y longitud son requeridas", null));
            }
            OrdenTrabajoResponse actualizada = ordenService.corregirCoordenadas(id, lat, lng);
            return ResponseEntity.ok(new ApiResponse<>(true, "Coordenadas actualizadas", actualizada));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/puntos/mis-puntos")
    public ResponseEntity<List<OrdenTrabajoResponse>> misPuntos(Authentication auth) {
        return ResponseEntity.ok(ordenService.misPuntos(auth.getName()));
    }

    /** Historial de OTs completadas del capataz (HU18) */
    @GetMapping("/puntos/mis-completadas")
    public ResponseEntity<List<OrdenTrabajoResponse>> misCompletadas(Authentication auth) {
        return ResponseEntity.ok(ordenService.misCompletadas(auth.getName()));
    }

    @GetMapping("/puntos/seguimiento")
    public ResponseEntity<List<Map<String, Object>>> seguimiento() {
        return ResponseEntity.ok(ordenService.seguimiento());
    }

    @GetMapping("/puntos/todos")
    public ResponseEntity<List<OrdenTrabajoResponse>> todos() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    @PutMapping("/puntos/{id}/asignar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> asignar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long capatazId = body.get("capatazId") != null ? Long.valueOf(body.get("capatazId").toString()) : null;
        if (capatazId == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "capatazId requerido", null));
        }
        var otOpt = ordenRepo.findById(id);
        var cap   = capatazRepository.findById(capatazId);
        if (otOpt.isEmpty() || cap.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "OT o capataz no encontrado", null));
        }
        var ot = otOpt.get();
        // Una OT finalizada (COMPLETADA o ANULADA) no se puede reasignar
        String estadoActual = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
        if ("COMPLETADA".equals(estadoActual) || "ANULADA".equals(estadoActual)) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false,
                            "No se puede asignar un capataz a una OT " + estadoActual, null));
        }
        ot.setCapataz(cap.get());
        ot.setUpdatedAt(LocalDateTime.now());
        ordenRepo.save(ot);
        return ResponseEntity.ok(new ApiResponse<>(true, "Capataz asignado", Map.of("ok", true)));
    }

    @PutMapping("/puntos/{id}/estado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String nuevoEstado = body.get("estado") != null ? body.get("estado").toString() : null;
        if (nuevoEstado == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "estado requerido", null));
        }
        var otOpt = ordenRepo.findById(id);
        var estOpt = estadoRepo.findByCodigo(nuevoEstado);
        if (otOpt.isEmpty() || estOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "OT o estado no encontrado", null));
        }
        var ot  = otOpt.get();
        var est = estOpt.get();
        // Una OT ya finalizada no puede cambiar de estado
        String estadoActual = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
        if ("ANULADA".equals(estadoActual)) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Una OT anulada no puede cambiar de estado", null));
        }
        ot.setEstadoOt(est);
        ot.setUpdatedAt(LocalDateTime.now());
        // Registrar fechas según el estado final
        if (est.getEsFinal() != null && est.getEsFinal()) {
            ot.setFechaFin(LocalDateTime.now());
            ot.setVisibleEnMapa(false);
        }
        ordenRepo.save(ot);
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado actualizado a " + nuevoEstado,
                Map.of("estadoAnterior", estadoActual, "estadoActual", nuevoEstado)));
    }
}
