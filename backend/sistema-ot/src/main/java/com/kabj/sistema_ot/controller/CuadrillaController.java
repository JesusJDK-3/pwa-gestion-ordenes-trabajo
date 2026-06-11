package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.OpCuadrilla;
import com.kabj.sistema_ot.entity.OpCuadrillaMiembroPlantilla;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.CuadrillaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cuadrilla")
@RequiredArgsConstructor
public class CuadrillaController {

    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;
    private final CuadrillaService cuadrillaService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtener(Authentication auth) {
        RrhhCapataz capataz = getCapataz(auth);
        Optional<OpCuadrilla> cuadrillaOpt = cuadrillaService.buscarPorCapataz(capataz);
        if (cuadrillaOpt.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(true, null, Map.of(
                    "cuadrillaId", null,
                    "nombre", "",
                    "miembros", List.of()
            )));
        }
        OpCuadrilla cuadrilla = cuadrillaOpt.get();
        List<Map<String, Object>> miembros = cuadrillaService.listarMiembros(cuadrilla).stream()
                .map(this::toMiembroMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, null, Map.of(
                "cuadrillaId", cuadrilla.getIdCuadrilla(),
                "nombre", cuadrilla.getNombre(),
                "miembros", miembros
        )));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> guardar(@RequestBody Map<String, Object> body,
                                                                     Authentication auth) {
        String nombre = body.get("nombre") != null ? body.get("nombre").toString().trim() : null;
        if (nombre == null || nombre.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "El nombre de la cuadrilla es obligatorio", null));
        }
        RrhhCapataz capataz = getCapataz(auth);
        OpCuadrilla cuadrilla = cuadrillaService.crearOActualizarCuadrilla(capataz, nombre);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cuadrilla guardada", Map.of(
                "cuadrillaId", cuadrilla.getIdCuadrilla(),
                "nombre", cuadrilla.getNombre()
        )));
    }

    @PostMapping("/miembros")
    public ResponseEntity<ApiResponse<Map<String, Object>>> agregarMiembro(@RequestBody Map<String, Object> body,
                                                                           Authentication auth) {
        RrhhCapataz capataz = getCapataz(auth);
        String nombreCuadrilla = body.get("nombreCuadrilla") != null ? body.get("nombreCuadrilla").toString().trim() : null;
        OpCuadrilla cuadrilla = null;
        if (nombreCuadrilla != null && !nombreCuadrilla.isBlank()) {
            cuadrilla = cuadrillaService.crearOActualizarCuadrilla(capataz, nombreCuadrilla);
        } else {
            cuadrilla = cuadrillaService.buscarPorCapataz(capataz)
                    .orElse(null);
        }
        if (cuadrilla == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "El nombre de la cuadrilla es obligatorio cuando no hay una cuadrilla previa", null));
        }
        Long asistenteId = body.get("asistenteId") != null ? parseLong(body.get("asistenteId")) : null;
        RrhhTrabajador trabajador;
        if (asistenteId != null) {
            var trabajadorOpt = cuadrillaService.buscarTrabajadorPorId(asistenteId);
            if (trabajadorOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Trabajador no encontrado", null));
            }
            trabajador = trabajadorOpt.get();
        } else {
            String dni = body.get("dni") != null ? body.get("dni").toString().trim() : null;
            String nombres = body.get("nombres") != null ? body.get("nombres").toString().trim() : null;
            String apellidos = body.get("apellidos") != null ? body.get("apellidos").toString().trim() : null;
            String cargo = body.get("cargo") != null ? body.get("cargo").toString().trim() : null;
            if ((dni == null || dni.isBlank()) && ((nombres == null || nombres.isBlank()) || (apellidos == null || apellidos.isBlank()))) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Debe indicar un trabajador existente o crear uno nuevo", null));
            }
            trabajador = cuadrillaService.crearOEncontrarTrabajador(dni, nombres, apellidos, cargo);
        }
        String cargoEnCuadrilla = body.get("cargoEnCuadrilla") != null ? body.get("cargoEnCuadrilla").toString().trim() : null;
        var miembro = cuadrillaService.asegurarMiembroPlantilla(cuadrilla, trabajador, cargoEnCuadrilla);
        return ResponseEntity.ok(new ApiResponse<>(true, "Miembro agregado a la cuadrilla", Map.of(
                "id", miembro.getIdMiembroPlantilla(),
                "idTrabajador", trabajador.getIdTrabajador(),
                "dni", trabajador.getDni(),
                "nombres", trabajador.getNombres(),
                "apellidos", trabajador.getApellidos(),
                "cargo", trabajador.getCargo(),
                "cargoEnCuadrilla", miembro.getCargoEnCuadrilla()
        )));
    }

    private RrhhCapataz getCapataz(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Usuario no autenticado");
        }
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
    }

    private Map<String, Object> toMiembroMap(OpCuadrillaMiembroPlantilla miembro) {
        var t = miembro.getTrabajador();
        return Map.of(
                "id", miembro.getIdMiembroPlantilla(),
                "idTrabajador", t.getIdTrabajador(),
                "dni", t.getDni(),
                "nombres", t.getNombres(),
                "apellidos", t.getApellidos(),
                "cargo", t.getCargo(),
                "cargoEnCuadrilla", miembro.getCargoEnCuadrilla(),
                "activo", miembro.getActivo()
        );
    }

    private Long parseLong(Object o) {
        if (o == null) return null;
        try { return Long.valueOf(o.toString()); } catch (Exception e) { return null; }
    }
}
