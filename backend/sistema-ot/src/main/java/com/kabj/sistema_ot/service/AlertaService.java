package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.AlertaResponse;
import com.kabj.sistema_ot.entity.Alerta;
import com.kabj.sistema_ot.entity.PuntoTrabajo;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.repository.AlertaRepository;
import com.kabj.sistema_ot.repository.PuntoTrabajoRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final AlertaRepository alertaRepo;
    private final PuntoTrabajoRepository puntoRepo;
    private final UsuarioRepository usuarioRepo;

    public List<AlertaResponse> getNoLeidas(Long supervisorId) {
        return alertaRepo.findNoLeidas(supervisorId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void marcarLeida(Long alertaId) {
        alertaRepo.findById(alertaId).ifPresent(a -> {
            a.setLeida(true);
            alertaRepo.save(a);
        });
    }

    @Transactional
    public int generarAlertasSinActividad() {
        LocalDateTime limite = LocalDateTime.now().minusHours(48);
        int count = 0;

        List<PuntoTrabajo> puntosSinCambio = puntoRepo.findAll().stream()
                .filter(p -> p.getEstado() == EstadoPunto.PENDIENTE || p.getEstado() == EstadoPunto.EN_PROGRESO)
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isBefore(limite))
                .toList();

        for (PuntoTrabajo punto : puntosSinCambio) {
            if (punto.getOrden() != null && punto.getOrden().getSupervisor() != null) {
                Alerta alerta = new Alerta();
                alerta.setPunto(punto);
                alerta.setSupervisor(punto.getOrden().getSupervisor());
                alerta.setMensaje("El punto '" + punto.getDescripcion() + "' lleva más de 48h sin actividad.");
                alertaRepo.save(alerta);
                count++;
            }
        }
        return count;
    }

    private AlertaResponse toResponse(Alerta a) {
        return new AlertaResponse(
                a.getId(),
                a.getMensaje(),
                a.getPunto() != null ? a.getPunto().getId() : null,
                a.getPunto() != null ? a.getPunto().getDescripcion() : null,
                a.isLeida(),
                a.getCreatedAt()
        );
    }
}
