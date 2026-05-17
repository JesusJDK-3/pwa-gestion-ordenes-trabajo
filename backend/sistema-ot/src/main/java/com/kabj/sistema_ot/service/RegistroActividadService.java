package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.RegistroActividadResponse;
import com.kabj.sistema_ot.dto.RegistroSyncRequest;
import com.kabj.sistema_ot.entity.PuntoTrabajo;
import com.kabj.sistema_ot.entity.RegistroActividad;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.repository.PuntoTrabajoRepository;
import com.kabj.sistema_ot.repository.RegistroActividadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistroActividadService {

    private final RegistroActividadRepository registroRepo;
    private final PuntoTrabajoRepository puntoRepo;

    @Transactional
    public RegistroActividadResponse crear(RegistroSyncRequest req, Usuario capataz) {
        PuntoTrabajo punto = puntoRepo.findById(req.puntoId())
                .orElseThrow(() -> new RuntimeException("Punto no encontrado"));

        RegistroActividad registro = buildRegistro(req, punto, capataz);
        registro = registroRepo.save(registro);

        if ("COMPLETADO".equalsIgnoreCase(req.tipoActividad())) {
            punto.setEstado(EstadoPunto.COMPLETADO);
            puntoRepo.save(punto);
        } else if ("OBSERVADO".equalsIgnoreCase(req.tipoActividad())) {
            punto.setEstado(EstadoPunto.OBSERVADO);
            puntoRepo.save(punto);
        } else if (punto.getEstado() == EstadoPunto.PENDIENTE) {
            punto.setEstado(EstadoPunto.EN_PROGRESO);
            puntoRepo.save(punto);
        }

        return toResponse(registro);
    }

    @Transactional
    public int syncBulk(List<RegistroSyncRequest> requests, Usuario capataz) {
        int count = 0;
        for (RegistroSyncRequest req : requests) {
            try {
                crear(req, capataz);
                count++;
            } catch (Exception ignored) {
                // continuar con el siguiente registro
            }
        }
        return count;
    }

    public List<RegistroActividadResponse> getPorPunto(Long puntoId) {
        return registroRepo.findByPunto_IdOrderByFechaRegistroDesc(puntoId)
                .stream().map(this::toResponse).toList();
    }

    private RegistroActividad buildRegistro(RegistroSyncRequest req, PuntoTrabajo punto, Usuario capataz) {
        RegistroActividad r = new RegistroActividad();
        r.setPunto(punto);
        r.setCapataz(capataz);
        r.setTipoActividad(req.tipoActividad());
        r.setObservaciones(req.observaciones());
        r.setDatosAdicionales(req.datosAdicionales());
        r.setCreadoOffline(req.creadoOffline());
        r.setSincronizado(true);

        if (req.fechaRegistro() != null && !req.fechaRegistro().isBlank()) {
            try {
                r.setFechaRegistro(LocalDateTime.parse(req.fechaRegistro(),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            } catch (Exception e) {
                r.setFechaRegistro(LocalDateTime.now());
            }
        } else {
            r.setFechaRegistro(LocalDateTime.now());
        }
        return r;
    }

    public RegistroActividadResponse toResponse(RegistroActividad r) {
        return new RegistroActividadResponse(
                r.getId(),
                r.getPunto() != null ? r.getPunto().getId() : null,
                r.getPunto() != null ? r.getPunto().getDescripcion() : null,
                r.getCapataz() != null ? r.getCapataz().getIdUsuario() : null,
                r.getCapataz() != null ? r.getCapataz().getNombres() + " " + r.getCapataz().getApellidos() : null,
                r.getTipoActividad(),
                r.getObservaciones(),
                r.getFechaRegistro(),
                r.isValidado(),
                r.isSincronizado(),
                r.isCreadoOffline()
        );
    }
}
