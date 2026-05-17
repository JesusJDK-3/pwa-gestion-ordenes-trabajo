package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> listarTodas() {
        return ordenRepo.findByActivoTrueOrderByCreatedAtDesc()
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> misPuntos(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
        return ordenRepo.findByCapatazAndActivoTrueOrderByFechaProgramadaAsc(capataz)
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrdenTrabajoResponse detalle(Long id) {
        OpOrdenTrabajo ot = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OT no encontrada"));
        return OrdenTrabajoResponse.from(ot);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> seguimiento() {
        return ordenRepo.findByActivoTrueOrderByCreatedAtDesc().stream()
                .filter(ot -> ot.getCapataz() != null)
                .map(ot -> {
                    String nombre = "Sin nombre";
                    if (ot.getCapataz().getTrabajador() != null) {
                        nombre = ot.getCapataz().getTrabajador().getNombres()
                                + " " + ot.getCapataz().getTrabajador().getApellidos();
                    }
                    return Map.<String, Object>of(
                            "idOt",      ot.getIdOt(),
                            "sgio",      ot.getSgio(),
                            "capataz",   nombre,
                            "estado",    ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE",
                            "direccion", ot.getDireccion() != null ? ot.getDireccion() : "",
                            "latitud",   ot.getLatitud(),
                            "longitud",  ot.getLongitud()
                    );
                }).toList();
    }
}
