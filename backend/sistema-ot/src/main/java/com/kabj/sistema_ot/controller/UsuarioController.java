package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.CapatazService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository    usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;
    private final CapatazService          capatazService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar() {
        List<Map<String, Object>> usuarios = new ArrayList<>();

        for (Usuario u : usuarioRepository.findAll()) {
            if (!Boolean.TRUE.equals(u.getActivo())) continue;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("usuarioId", u.getIdUsuario());
            m.put("nombre",    u.getNombres() + " " + u.getApellidos());
            m.put("email",     u.getEmail() != null ? u.getEmail() : "");
            m.put("username",  u.getUsername());
            m.put("rol",       u.getRol().getCodigo());

            // Para capataces, exponer id_capataz (que es el FK en op_orden_trabajo)
            // así el dropdown del supervisor puede asignar con el ID correcto
            if ("capataz".equalsIgnoreCase(u.getRol().getCodigo())) {
                var capOpt = capatazRepository.findByUsuario(u);
                if (capOpt.isPresent()) {
                    m.put("id", capOpt.get().getIdCapataz());
                    usuarios.add(m);
                }
                continue;
            } else {
                m.put("id", u.getIdUsuario());
            }

            usuarios.add(m);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, null, usuarios));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registrarSupervisor(@RequestBody Map<String, Object> body) {
        try {
            String email = body.get("email") != null ? body.get("email").toString() : null;
            String username = body.get("username") != null ? body.get("username").toString() : null;
            String nombres = body.get("nombres") != null ? body.get("nombres").toString() : null;
            String apellidos = body.get("apellidos") != null ? body.get("apellidos").toString() : null;
            String password = body.get("password") != null ? body.get("password").toString() : null;
            Map<String, Object> creado = capatazService.registrarSupervisor(email, username, nombres, apellidos, password);
            return ResponseEntity.ok(new ApiResponse<>(true, "Supervisor registrado correctamente", creado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/inactivar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> inactivarSupervisor(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Supervisor no encontrado."));
            if (!"supervisor".equalsIgnoreCase(usuario.getRol().getCodigo())) {
                throw new IllegalArgumentException("Solo se pueden inactivar supervisores desde este endpoint.");
            }
            usuario.setActivo(false);
            usuarioRepository.save(usuario);
            return ResponseEntity.ok(new ApiResponse<>(true, "Supervisor inactivado correctamente", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
