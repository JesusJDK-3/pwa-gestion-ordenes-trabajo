package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.CatEstadoOt;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.service.ExcelCargaService;
import com.kabj.sistema_ot.service.EventoService;
import com.kabj.sistema_ot.service.OrdenTrabajoService;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final UsuarioRepository usuarioRepository;
    private final EventoService eventoService;

    @GetMapping("/ordenes")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<List<OrdenTrabajoResponse>> listar() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    @PostMapping("/ordenes/preview-excel")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> previewExcel(
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Preview generado",
                    excelCargaService.previewExcel(file)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /** Solo el supervisor importa el Excel de mantenimiento (OT). */
    @PostMapping("/ordenes/carga-excel")
    @PreAuthorize("hasRole('SUPERVISOR')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<OrdenTrabajoResponse> detalle(@PathVariable Long id, Authentication auth) {
        var otOpt = ordenRepo.findById(id);
        if (otOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (auth != null) {
            var usuarioOpt = usuarioRepository.findByUsername(auth.getName());
            if (usuarioOpt.isPresent()
                    && usuarioOpt.get().getRol() != null
                    && "capataz".equalsIgnoreCase(usuarioOpt.get().getRol().getCodigo())) {
                var capOpt = capatazRepository.findByUsuario(usuarioOpt.get());
                if (capOpt.isEmpty()) {
                    return ResponseEntity.status(403).build();
                }
                try {
                    ordenService.validarPropiedadCapataz(otOpt.get(), capOpt.get());
                } catch (RuntimeException ex) {
                    return ResponseEntity.status(403).build();
                }
            }
        }
        return ResponseEntity.ok(ordenService.detalle(id));
    }

    @GetMapping("/ordenes/coordenadas-pendientes")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<List<OrdenTrabajoResponse>> coordenadasPendientes(Authentication auth) {
        return ResponseEntity.ok(ordenService.listarCoordenadasPendientes(auth.getName()));
    }

    @PutMapping("/puntos/{id}/coordenadas")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<OrdenTrabajoResponse>> corregirCoordenadas(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            BigDecimal lat = body.get("latitud") != null
                    ? new BigDecimal(body.get("latitud").toString()) : null;
            BigDecimal lng = body.get("longitud") != null
                    ? new BigDecimal(body.get("longitud").toString()) : null;
            if (lat == null || lng == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "latitud y longitud son requeridas", null));
            }
            OrdenTrabajoResponse actualizada = ordenService.corregirCoordenadas(id, lat, lng, auth.getName());
            return ResponseEntity.ok(new ApiResponse<>(true, "Coordenadas actualizadas", actualizada));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/puntos/mapa-monitoreo")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<List<OrdenTrabajoResponse>> mapaMonitoreo() {
        return ResponseEntity.ok(ordenService.listarMapaMonitoreo());
    }

    @GetMapping("/puntos/mis-puntos")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<List<OrdenTrabajoResponse>> misPuntos(Authentication auth) {
        return ResponseEntity.ok(ordenService.misPuntos(auth.getName()));
    }

    @GetMapping("/puntos/mis-completadas")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<List<OrdenTrabajoResponse>> misCompletadas(Authentication auth) {
        return ResponseEntity.ok(ordenService.misCompletadas(auth.getName()));
    }

    @GetMapping("/puntos/mis-asignaciones-dia")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<List<OrdenTrabajoResponse>> misAsignacionesDia(
            Authentication auth,
            @RequestParam(required = false) String sgio,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ordenService.asignacionesDiaCapataz(auth.getName(), sgio, estado));
    }

    @GetMapping("/puntos/historial")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<List<OrdenTrabajoResponse>> historialCapataz(
            Authentication auth,
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String sgio,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ordenService.historialCapataz(auth.getName(), fecha, sgio, estado));
    }

    @GetMapping("/ordenes/historial")
    @PreAuthorize("hasAnyRole('SUPERVISOR','ADMIN')")
    public ResponseEntity<List<OrdenTrabajoResponse>> historialSupervisor(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String sgio,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ordenService.historialSupervisor(fecha, sgio, estado));
    }

    @GetMapping("/puntos/seguimiento")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> seguimiento() {
        return ResponseEntity.ok(ordenService.seguimiento());
    }

    @GetMapping("/puntos/seguimiento-resumen")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> seguimientoResumen() {
        return ResponseEntity.ok(new ApiResponse<>(true, null, ordenService.seguimientoResumenCapataces()));
    }

    @GetMapping("/ordenes/{id}/validacion-foto")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validacionFoto(@PathVariable Long id,
                                                                              Authentication auth) {
        var otOpt = ordenRepo.findById(id);
        if (otOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (auth != null) {
            var usuarioOpt = usuarioRepository.findByUsername(auth.getName());
            if (usuarioOpt.isPresent()
                    && usuarioOpt.get().getRol() != null
                    && "capataz".equalsIgnoreCase(usuarioOpt.get().getRol().getCodigo())) {
                var capOpt = capatazRepository.findByUsuario(usuarioOpt.get());
                if (capOpt.isEmpty()) {
                    return ResponseEntity.status(403).build();
                }
                try {
                    ordenService.validarPropiedadCapataz(otOpt.get(), capOpt.get());
                } catch (RuntimeException ex) {
                    return ResponseEntity.status(403).build();
                }
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                ordenService.estadoValidacionFoto(id)));
    }

    @GetMapping("/puntos/todos")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<OrdenTrabajoResponse>> todos() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    @PutMapping("/puntos/{id}/asignar")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> asignar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
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
        if (auth != null) {
            usuarioRepository.findByUsername(auth.getName()).ifPresent(u ->
                    eventoService.registrar(ot, "ASIGNACION", null, null, "Capataz asignado", u, "WEB"));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Capataz asignado", Map.of("ok", true)));
    }

    @PutMapping("/puntos/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String nuevoEstado = body.get("estado") != null ? body.get("estado").toString() : null;
        if (nuevoEstado == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "estado requerido", null));
        }
        try {
            Map<String, Object> res = ordenService.cambiarEstadoSupervisor(
                    id, nuevoEstado, auth != null ? auth.getName() : "sistema");
            return ResponseEntity.ok(new ApiResponse<>(true,
                    "Estado actualizado a " + nuevoEstado, res));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
