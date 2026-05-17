package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.UsuarioResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public ResponseEntity<List<UsuarioResponse>> listar() {
        List<UsuarioResponse> usuarios = usuarioRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(usuarios);
    }

    private UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(
                u.getIdUsuario(),
                u.getUsername(),
                u.getEmail(),
                u.getNombres(),
                u.getApellidos(),
                u.getFotoUrl(),
                u.getActivo(),
                u.getUltimoLogin(),
                u.getRol().getCodigo(),
                u.getRol().getNombre()
        );
    }
}
