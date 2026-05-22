package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpOtFormulario;
import com.kabj.sistema_ot.entity.OpOtPurgadoHidrante;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.repository.OpOtPurgadoHidranteRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OpOtPurgadoHidranteService {

    private final OpOtPurgadoHidranteRepository purgadoRepository;
    private final OpOrdenTrabajoRepository ordenTrabajoRepository;

    @Transactional
    public OpOtPurgadoHidrante crearOActualizarPurgado(Long idOt, OpOtPurgadoHidrante purgado) {
        OpOrdenTrabajo ordenTrabajo = ordenTrabajoRepository.findById(idOt)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));

        // Si ya existe un purgado para este formulario, actualizarlo
        if (purgado.getFormulario() != null) {
            Optional<OpOtPurgadoHidrante> existente = purgadoRepository.findByFormulario(purgado.getFormulario());
            if (existente.isPresent()) {
                return actualizarPurgadoExistente(existente.get(), purgado);
            }
        }

        // Crear nuevo
        purgado.setOrdenTrabajo(ordenTrabajo);
        purgado.setCreatedAt(LocalDateTime.now());
        purgado.setUpdatedAt(LocalDateTime.now());
        return purgadoRepository.save(purgado);
    }

    @Transactional
    private OpOtPurgadoHidrante actualizarPurgadoExistente(OpOtPurgadoHidrante existente, OpOtPurgadoHidrante datosNuevos) {
        if (datosNuevos.getMarcaHidrante() != null) existente.setMarcaHidrante(datosNuevos.getMarcaHidrante());
        if (datosNuevos.getNumeroBocamazas() != null) existente.setNumeroBocamazas(datosNuevos.getNumeroBocamazas());
        if (datosNuevos.getPresionPsiHidrante() != null) existente.setPresionPsiHidrante(datosNuevos.getPresionPsiHidrante());
        if (datosNuevos.getTiempoInicioPurgado() != null) existente.setTiempoInicioPurgado(datosNuevos.getTiempoInicioPurgado());
        if (datosNuevos.getTiempoFinPurgado() != null) existente.setTiempoFinPurgado(datosNuevos.getTiempoFinPurgado());
        if (datosNuevos.getMedicionCloroPpm() != null) existente.setMedicionCloroPpm(datosNuevos.getMedicionCloroPpm());
        if (datosNuevos.getObservaciones() != null) existente.setObservaciones(datosNuevos.getObservaciones());

        existente.setUpdatedAt(LocalDateTime.now());
        return purgadoRepository.save(existente);
    }

    @Transactional(readOnly = true)
    public Optional<OpOtPurgadoHidrante> obtenerPurgadoDelFormulario(OpOtFormulario formulario) {
        return purgadoRepository.findByFormulario(formulario);
    }

    @Transactional(readOnly = true)
    public Optional<OpOtPurgadoHidrante> obtenerPorId(Long idPurgado) {
        return purgadoRepository.findById(idPurgado);
    }

    @Transactional
    public void eliminarPurgado(Long idPurgado) {
        if (purgadoRepository.existsById(idPurgado)) {
            purgadoRepository.deleteById(idPurgado);
        }
    }
}
