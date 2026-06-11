package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.util.CoordenadaValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
        // Solo OTs operativas (no completadas/anuladas) — HU13
        return ordenRepo.findByCapatazActivasVisibles(capataz)
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> misCompletadas(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
        return ordenRepo.findCompletadasByCapataz(capataz)
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

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> listarCoordenadasPendientes() {
        return ordenRepo.findConCoordenadasPendientes()
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional
    public OrdenTrabajoResponse corregirCoordenadas(Long id, BigDecimal latitud, BigDecimal longitud) {
        CoordenadaValidator.Resultado res = CoordenadaValidator.validar(latitud, longitud);
        if (!res.valida()) {
            throw new RuntimeException(res.mensaje());
        }
        OpOrdenTrabajo ot = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OT no encontrada"));
        ot.setLatitud(latitud);
        ot.setLongitud(longitud);
        ot.setVisibleEnMapa(true);
        ot.setUpdatedAt(LocalDateTime.now());
        if (ot.getFilaImportacion() != null) {
            var fila = ot.getFilaImportacion();
            fila.setLatitudManual(latitud);
            fila.setLongitudManual(longitud);
            fila.setRequiereCoordenadaManual(res.requiereCorreccion());
            fila.setEstadoValidacion(res.requiereCorreccion() ? "PENDIENTE" : "APROBADO");
            fila.setMensajeValidacion(res.mensaje());
            fila.setRequiereRevision(res.requiereCorreccion());
            fila.setUpdatedAt(LocalDateTime.now());
        }
        ordenRepo.save(ot);
        return OrdenTrabajoResponse.from(ot);
    }
}
