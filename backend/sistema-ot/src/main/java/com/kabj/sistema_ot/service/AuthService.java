package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.LoginRequest;
import com.kabj.sistema_ot.dto.LoginResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!usuario.getActivo()) {
            throw new RuntimeException("Usuario inactivo");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);

        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getRol().getCodigo());

        return new LoginResponse(
                token,
                usuario.getUsername(),
                usuario.getRol().getCodigo(),
                usuario.getNombres(),
                usuario.getApellidos()
        );
    }
}