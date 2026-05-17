package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.dto.PuntoTrabajoResponse;
import com.kabj.sistema_ot.dto.SeguimientoCapatazDTO;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.PuntoTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/puntos")
@RequiredArgsConstructor
public class PuntoTrabajoController {

    private final PuntoTrabajoService puntoService;
    private final UsuarioRepository usuarioRepo;

    @GetMapping("/mis-puntos")
    @PreAuthorize("hasRole('CAPATAZ')")
    public ResponseEntity<ApiResponse<List<PuntoTrabajoResponse>>> misPuntos(Authentication auth) {
        Usuario usuario = getUsuario(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, null, puntoService.getMisPuntos(usuario.getIdUsuario())));
    }

    @GetMapping("/todos")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<PuntoTrabajoResponse>>> todos(
            @RequestParam(required = false) Long ordenId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long capatazId) {
        return ResponseEntity.ok(new ApiResponse<>(true, null, puntoService.getTodos(ordenId, estado, capatazId)));
    }

    @PutMapping("/{id}/asignar")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<PuntoTrabajoResponse>> asignar(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Punto asignado", puntoService.asignar(id, body.get("capatazId"))));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<ApiResponse<PuntoTrabajoResponse>> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado actualizado", puntoService.cambiarEstado(id, body.get("estado"))));
    }

    @GetMapping("/seguimiento")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<SeguimientoCapatazDTO>>> seguimiento() {
        return ResponseEntity.ok(new ApiResponse<>(true, null, puntoService.getSeguimiento()));
    }

    private Usuario getUsuario(Authentication auth) {
        return usuarioRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
    }
}
