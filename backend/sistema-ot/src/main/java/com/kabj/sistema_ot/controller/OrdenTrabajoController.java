package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenService;
    private final UsuarioRepository usuarioRepo;

    @PostMapping("/carga-excel")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Object>> cargarExcel(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        Usuario usuario = getUsuario(auth);
        int puntos = ordenService.cargarDesdeExcel(file, usuario.getIdUsuario());
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Se crearon " + puntos + " puntos de trabajo.", puntos));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrdenTrabajoResponse>>> listar(Authentication auth) {
        Usuario usuario = getUsuario(auth);
        String rol = usuario.getRol().getCodigo();
        Long supervisorId = rol.equals("SUPERVISOR") ? usuario.getIdUsuario() : null;
        return ResponseEntity.ok(new ApiResponse<>(true, null, ordenService.listar(supervisorId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrdenTrabajoResponse>> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, null, ordenService.obtenerDetalle(id)));
    }

    private Usuario getUsuario(Authentication auth) {
        return usuarioRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
    }
}
