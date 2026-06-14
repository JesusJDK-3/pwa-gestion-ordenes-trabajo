package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.LoginRequest;
import com.kabj.sistema_ot.dto.LoginResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Autenticación JWT del sistema.
 * <ul>
 *   <li>{@code POST /api/auth/login} — credenciales → token Bearer + rol</li>
 *   <li>{@code GET /api/auth/me} — usuario autenticado (requiere token)</li>
 * </ul>
 * El token se valida en {@link com.kabj.sistema_ot.security.JwtFilter}.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException("No autenticado");
        }
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        Map<String, Object> data = Map.of(
                "id",      usuario.getIdUsuario(),
                "nombre",  usuario.getNombres() + " " + usuario.getApellidos(),
                "email",   usuario.getEmail() != null ? usuario.getEmail() : "",
                "rol",     usuario.getRol().getCodigo()
        );
        return ResponseEntity.ok(new ApiResponse<>(true, null, data));
    }
}
