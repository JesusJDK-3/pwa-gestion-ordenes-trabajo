package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.service.CuadrillaService;
import com.kabj.sistema_ot.repository.RrhhTrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trabajadores")
@RequiredArgsConstructor
public class TrabajadorController {

    private final CuadrillaService cuadrillaService;
    private final RrhhTrabajadorRepository trabajadorRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar() {
        List<Map<String, Object>> trabajadores = trabajadorRepository.findAll().stream()
                .filter(t -> t.getActivo() != null && t.getActivo())
                .filter(t -> t.getCargo() != null && t.getCargo().toLowerCase().contains("ayudante"))
                .map(t -> {
                    Map<String, Object> trabajador = new java.util.HashMap<>();
                    trabajador.put("idTrabajador", t.getIdTrabajador());
                    trabajador.put("dni", t.getDni());
                    trabajador.put("nombres", t.getNombres());
                    trabajador.put("apellidos", t.getApellidos());
                    trabajador.put("cargo", t.getCargo());
                    return trabajador;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, null, trabajadores));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> crear(@RequestBody Map<String, Object> body) {
        String dni = body.get("dni") != null ? body.get("dni").toString().trim() : null;
        String nombres = body.get("nombres") != null ? body.get("nombres").toString().trim() : null;
        String apellidos = body.get("apellidos") != null ? body.get("apellidos").toString().trim() : null;
        String cargo = "Ayudante";

        if ((dni == null || dni.isBlank()) && ((nombres == null || nombres.isBlank()) || (apellidos == null || apellidos.isBlank()))) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "DNI o nombres/apellidos son obligatorios", null));
        }

        RrhhTrabajador trabajador = cuadrillaService.crearOEncontrarTrabajador(dni, nombres, apellidos, cargo);
        return ResponseEntity.ok(new ApiResponse<>(true, "Ayudante registrado", Map.of(
                "idTrabajador", trabajador.getIdTrabajador(),
                "dni", trabajador.getDni(),
                "nombres", trabajador.getNombres(),
                "apellidos", trabajador.getApellidos(),
                "cargo", trabajador.getCargo()
        )));
    }
}
