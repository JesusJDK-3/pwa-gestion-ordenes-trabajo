package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.AlertaResponse;
import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;
    private final UsuarioRepository usuarioRepo;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<AlertaResponse>>> listar(Authentication auth) {
        Usuario usuario = getUsuario(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, null, alertaService.getNoLeidas(usuario.getIdUsuario())));
    }

    @PutMapping("/{id}/leer")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> marcarLeida(@PathVariable Long id) {
        alertaService.marcarLeida(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Alerta marcada como leída", null));
    }

    @PostMapping("/generar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Integer>> generar() {
        int count = alertaService.generarAlertasSinActividad();
        return ResponseEntity.ok(new ApiResponse<>(true, "Alertas generadas: " + count, count));
    }

    private Usuario getUsuario(Authentication auth) {
        return usuarioRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
    }
}
