package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.service.CapatazService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Gestión de capataces (personal de campo con cuenta de usuario).
 * <ul>
 *   <li>{@code GET /api/capataces} — listado (admin + supervisor para asignación)</li>
 *   <li>{@code POST /api/capataces} — alta completa RRHH + usuario (solo admin)</li>
 * </ul>
 * Distinto de asignar OT: el supervisor asigna OT existentes; el admin registra nuevos capataces.
 */
@RestController
@RequestMapping("/api/capataces")
@RequiredArgsConstructor
public class CapatazController {

    private final CapatazService capatazService;

    /** Lista capataces activos para asignación (supervisor) o gestión (admin). */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar() {
        return ResponseEntity.ok(new ApiResponse<>(true, null, capatazService.listarActivos()));
    }

    /** Alta de capataz: usuario + trabajador + registro RRHH. Solo administrador. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registrar(@RequestBody Map<String, Object> body) {
        try {
            String email = body.get("email") != null ? body.get("email").toString() : null;
            String username = body.get("username") != null ? body.get("username").toString() : null;
            String nombres = body.get("nombres") != null ? body.get("nombres").toString() : null;
            String apellidos = body.get("apellidos") != null ? body.get("apellidos").toString() : null;
            String dni = body.get("dni") != null ? body.get("dni").toString() : null;
            String password = body.get("password") != null ? body.get("password").toString() : null;
            Map<String, Object> creado = capatazService.registrar(email, username, nombres, apellidos, dni, password);
            return ResponseEntity.ok(new ApiResponse<>(true, "Capataz registrado correctamente", creado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/inactivar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> inactivar(@PathVariable Long id) {
        try {
            capatazService.inactivarCapataz(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Capataz inactivado correctamente", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
