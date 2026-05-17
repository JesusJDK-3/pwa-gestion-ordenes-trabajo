package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.CatEstadoOt;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenService;
    private final OpOrdenTrabajoRepository ordenRepo;
    private final RrhhCapatazRepository capatazRepository;
    private final CatEstadoOtRepository estadoRepo;

    @GetMapping("/ordenes")
    public ResponseEntity<List<OrdenTrabajoResponse>> listar() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    @GetMapping("/ordenes/{id}")
    public ResponseEntity<OrdenTrabajoResponse> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(ordenService.detalle(id));
    }

    @GetMapping("/puntos/mis-puntos")
    public ResponseEntity<List<OrdenTrabajoResponse>> misPuntos(Authentication auth) {
        return ResponseEntity.ok(ordenService.misPuntos(auth.getName()));
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
        var ot = ordenRepo.findById(id);
        var cap = capatazRepository.findById(capatazId);
        if (ot.isEmpty() || cap.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "OT o capataz no encontrado", null));
        }
        ot.get().setCapataz(cap.get());
        ot.get().setUpdatedAt(LocalDateTime.now());
        ordenRepo.save(ot.get());
        return ResponseEntity.ok(new ApiResponse<>(true, "Capataz asignado", Map.of("ok", true)));
    }

    @PutMapping("/puntos/{id}/estado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String estado = body.get("estado") != null ? body.get("estado").toString() : null;
        if (estado == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "estado requerido", null));
        }
        var ot  = ordenRepo.findById(id);
        var est = estadoRepo.findByCodigo(estado);
        if (ot.isEmpty() || est.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "OT o estado no encontrado", null));
        }
        ot.get().setEstadoOt(est.get());
        ot.get().setUpdatedAt(LocalDateTime.now());
        ordenRepo.save(ot.get());
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado actualizado", Map.of("ok", true)));
    }
}
