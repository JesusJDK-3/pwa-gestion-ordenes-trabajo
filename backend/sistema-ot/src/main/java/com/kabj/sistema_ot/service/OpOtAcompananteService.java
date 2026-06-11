package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpOtAcompanante;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.repository.OpOtAcompananteRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhTrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OpOtAcompananteService {

    private final OpOtAcompananteRepository acompananteRepository;
    private final OpOrdenTrabajoRepository ordenTrabajoRepository;
    private final RrhhTrabajadorRepository trabajadorRepository;

    private static final int MAX_ACOMPANANTES = 10;

    @Transactional
    public OpOtAcompanante crearAcompanante(Long idOt, OpOtAcompanante acompanante) {
        OpOrdenTrabajo ordenTrabajo = ordenTrabajoRepository.findById(idOt)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));

        long countActuales = acompananteRepository.countByOrdenTrabajoActivo(ordenTrabajo);
        if (countActuales >= MAX_ACOMPANANTES) {
            throw new RuntimeException("No se pueden agregar más de " + MAX_ACOMPANANTES + " acompañantes a una orden de trabajo");
        }

        acompanante.setOrdenTrabajo(ordenTrabajo);
        acompanante.setCreatedAt(LocalDateTime.now());
        acompanante.setUpdatedAt(LocalDateTime.now());

        if (acompanante.getOrdenEnLista() == null) {
            acompanante.setOrdenEnLista((int) (countActuales + 1));
        }

        return acompananteRepository.save(acompanante);
    }

    @Transactional(readOnly = true)
    public List<OpOtAcompanante> listarPorOT(Long idOt) {
        OpOrdenTrabajo ordenTrabajo = ordenTrabajoRepository.findById(idOt)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));
        return acompananteRepository.findByOrdenTrabajoAndActivoTrueOrderByOrdenEnLista(ordenTrabajo);
    }

    @Transactional
    public void eliminarAcompanante(Long idAcompanante) {
        OpOtAcompanante acompanante = acompananteRepository.findById(idAcompanante)
                .orElseThrow(() -> new RuntimeException("Acompañante no encontrado"));
        acompanante.setActivo(false);
        acompanante.setUpdatedAt(LocalDateTime.now());
        acompananteRepository.save(acompanante);
    }

    @Transactional
    public OpOtAcompanante actualizarAcompanante(Long idAcompanante, OpOtAcompanante datosActualizar) {
        OpOtAcompanante acompanante = acompananteRepository.findById(idAcompanante)
                .orElseThrow(() -> new RuntimeException("Acompañante no encontrado"));

        if (datosActualizar.getDni() != null) acompanante.setDni(datosActualizar.getDni());
        if (datosActualizar.getNombres() != null) acompanante.setNombres(datosActualizar.getNombres());
        if (datosActualizar.getApellidos() != null) acompanante.setApellidos(datosActualizar.getApellidos());
        if (datosActualizar.getCargo() != null) acompanante.setCargo(datosActualizar.getCargo());
        if (datosActualizar.getRol() != null) acompanante.setRol(datosActualizar.getRol());
        if (datosActualizar.getOrdenEnLista() != null) acompanante.setOrdenEnLista(datosActualizar.getOrdenEnLista());
        if (datosActualizar.getTrabajador() != null) acompanante.setTrabajador(datosActualizar.getTrabajador());

        acompanante.setUpdatedAt(LocalDateTime.now());
        return acompananteRepository.save(acompanante);
    }
}
