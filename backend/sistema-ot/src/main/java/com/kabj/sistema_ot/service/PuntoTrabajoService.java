package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.PuntoTrabajoResponse;
import com.kabj.sistema_ot.dto.SeguimientoCapatazDTO;
import com.kabj.sistema_ot.entity.PuntoTrabajo;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.repository.PuntoTrabajoRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PuntoTrabajoService {

    private final PuntoTrabajoRepository puntoRepo;
    private final UsuarioRepository usuarioRepo;
    private final OrdenTrabajoService ordenService;

    public List<PuntoTrabajoResponse> getMisPuntos(Long capatazId) {
        return puntoRepo.findActivosByCapataz(capatazId)
                .stream().map(ordenService::toPuntoResponse).toList();
    }

    public List<PuntoTrabajoResponse> getTodos(Long ordenId, String estado, Long capatazId) {
        List<PuntoTrabajo> puntos;
        if (ordenId != null) {
            puntos = puntoRepo.findByOrden_Id(ordenId);
        } else if (capatazId != null) {
            puntos = puntoRepo.findByCapataz_IdUsuario(capatazId);
        } else {
            puntos = puntoRepo.findAll();
        }

        if (estado != null && !estado.isBlank()) {
            EstadoPunto estadoEnum = EstadoPunto.valueOf(estado);
            puntos = puntos.stream().filter(p -> p.getEstado() == estadoEnum).toList();
        }

        return puntos.stream().map(ordenService::toPuntoResponse).toList();
    }

    @Transactional
    public PuntoTrabajoResponse asignar(Long puntoId, Long capatazId) {
        PuntoTrabajo punto = puntoRepo.findById(puntoId)
                .orElseThrow(() -> new RuntimeException("Punto no encontrado"));
        Usuario capataz = usuarioRepo.findById(capatazId)
                .orElseThrow(() -> new RuntimeException("Capataz no encontrado"));
        punto.setCapataz(capataz);
        return ordenService.toPuntoResponse(puntoRepo.save(punto));
    }

    @Transactional
    public PuntoTrabajoResponse cambiarEstado(Long puntoId, String estadoStr) {
        PuntoTrabajo punto = puntoRepo.findById(puntoId)
                .orElseThrow(() -> new RuntimeException("Punto no encontrado"));
        punto.setEstado(EstadoPunto.valueOf(estadoStr));
        return ordenService.toPuntoResponse(puntoRepo.save(punto));
    }

    public List<SeguimientoCapatazDTO> getSeguimiento() {
        return puntoRepo.findAll().stream()
                .filter(p -> p.getCapataz() != null)
                .collect(Collectors.groupingBy(p -> p.getCapataz()))
                .entrySet().stream()
                .map(entry -> {
                    Usuario cap = entry.getKey();
                    List<PuntoTrabajo> puntos = entry.getValue();
                    long completados = puntos.stream().filter(p -> p.getEstado() == EstadoPunto.COMPLETADO).count();
                    long pendientes  = puntos.stream().filter(p -> p.getEstado() == EstadoPunto.PENDIENTE).count();
                    long enProgreso  = puntos.stream().filter(p -> p.getEstado() == EstadoPunto.EN_PROGRESO).count();
                    return new SeguimientoCapatazDTO(
                            cap.getIdUsuario(),
                            cap.getNombres() + " " + cap.getApellidos(),
                            puntos.size(),
                            (int) completados,
                            (int) pendientes,
                            (int) enProgreso
                    );
                }).toList();
    }
}
