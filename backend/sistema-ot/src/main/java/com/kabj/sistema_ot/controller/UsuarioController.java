package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
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
}
