package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.RegistroActividadResponse;
import com.kabj.sistema_ot.dto.RegistroSyncRequest;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.RegistroActividadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
public class RegistroController {

    private final RegistroActividadService registroService;
    private final UsuarioRepository usuarioRepo;

    @PostMapping
    public ResponseEntity<ApiResponse<RegistroActividadResponse>> crear(
            @Valid @RequestBody RegistroSyncRequest request,
            Authentication auth) {
        Usuario usuario = getUsuario(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, "Registro creado", registroService.crear(request, usuario)));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Integer>> syncBulk(
            @RequestBody List<RegistroSyncRequest> requests,
            Authentication auth) {
        Usuario usuario = getUsuario(auth);
        int procesados = registroService.syncBulk(requests, usuario);
        return ResponseEntity.ok(new ApiResponse<>(true, "Sincronizados: " + procesados, procesados));
    }

    @GetMapping("/punto/{puntoId}")
    public ResponseEntity<ApiResponse<List<RegistroActividadResponse>>> porPunto(@PathVariable Long puntoId) {
        return ResponseEntity.ok(new ApiResponse<>(true, null, registroService.getPorPunto(puntoId)));
    }

    private Usuario getUsuario(Authentication auth) {
        return usuarioRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
    }
}
