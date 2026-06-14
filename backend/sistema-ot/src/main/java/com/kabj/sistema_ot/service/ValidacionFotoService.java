package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpOtValidacionFoto;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.repository.OpOtValidacionFotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ValidacionFotoService {

    private final OpOtValidacionFotoRepository validacionRepo;

    @Transactional(readOnly = true)
    public Map<String, Object> estadoPorOt(Long idOt) {
        return validacionRepo.findByOrden_IdOt(idOt)
                .map(this::toMap)
                .orElseGet(() -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("bloqueada", false);
                    m.put("estadoValidacion", "PENDIENTE");
                    return m;
                });
    }

    @Transactional
    public OpOtValidacionFoto obtenerOCrear(OpOrdenTrabajo ot) {
        return validacionRepo.findByOrden_IdOt(ot.getIdOt()).orElseGet(() -> {
            OpOtValidacionFoto v = new OpOtValidacionFoto();
            v.setOrden(ot);
            v.setBloqueada(false);
            v.setEstadoValidacion("PENDIENTE");
            return validacionRepo.save(v);
        });
    }

    private Map<String, Object> toMap(OpOtValidacionFoto v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bloqueada", Boolean.TRUE.equals(v.getBloqueada()));
        m.put("estadoValidacion", v.getEstadoValidacion());
        return m;
    }
}
