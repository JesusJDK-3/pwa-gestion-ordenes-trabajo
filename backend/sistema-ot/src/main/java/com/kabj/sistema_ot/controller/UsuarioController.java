package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar() {
        List<Map<String, Object>> usuarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getActivo())
                .map(u -> Map.<String, Object>of(
                        "id",     u.getIdUsuario(),
                        "nombre", u.getNombres() + " " + u.getApellidos(),
                        "email",  u.getEmail(),
                        "rol",    u.getRol().getCodigo()
                )).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, null, usuarios));
    }
}
