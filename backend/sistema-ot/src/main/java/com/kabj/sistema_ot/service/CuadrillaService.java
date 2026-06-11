package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpCuadrilla;
import com.kabj.sistema_ot.entity.OpCuadrillaMiembroPlantilla;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.repository.OpCuadrillaMiembroPlantillaRepository;
import com.kabj.sistema_ot.repository.OpCuadrillaRepository;
import com.kabj.sistema_ot.repository.RrhhTrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CuadrillaService {

    private final OpCuadrillaRepository cuadrillaRepository;
    private final OpCuadrillaMiembroPlantillaRepository miembroRepository;
    private final RrhhTrabajadorRepository trabajadorRepository;

    @Transactional(readOnly = true)
    public Optional<OpCuadrilla> buscarPorCapatazYNombre(RrhhCapataz capataz, String nombre) {
        return cuadrillaRepository.findByCapatazAndNombreIgnoreCase(capataz, nombre.trim());
    }

    @Transactional(readOnly = true)
    public Optional<OpCuadrilla> buscarPorCapataz(RrhhCapataz capataz) {
        return cuadrillaRepository.findByCapataz(capataz);
    }

    @Transactional
    public OpCuadrilla crearOActualizarCuadrilla(RrhhCapataz capataz, String nombre) {
        String trimmed = nombre != null ? nombre.trim() : "";
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("El nombre de la cuadrilla es requerido.");
        }
        return cuadrillaRepository.findByCapataz(capataz)
                .map(cuadrilla -> {
                    cuadrilla.setNombre(trimmed);
                    return cuadrillaRepository.save(cuadrilla);
                })
                .orElseGet(() -> {
                    OpCuadrilla cuadrilla = new OpCuadrilla();
                    cuadrilla.setCapataz(capataz);
                    cuadrilla.setNombre(trimmed);
                    cuadrilla.setActivo(true);
                    return cuadrillaRepository.save(cuadrilla);
                });
    }

    @Transactional(readOnly = true)
    public Optional<OpCuadrilla> buscarPorIdYCapataz(Long idCuadrilla, RrhhCapataz capataz) {
        return cuadrillaRepository.findById(idCuadrilla)
                .filter(c -> c.getCapataz().getIdCapataz().equals(capataz.getIdCapataz()));
    }

    @Transactional(readOnly = true)
    public Optional<RrhhTrabajador> buscarTrabajadorPorDni(String dni) {
        if (dni == null || dni.isBlank()) return Optional.empty();
        return trabajadorRepository.findByDni(dni.trim());
    }

    @Transactional(readOnly = true)
    public Optional<RrhhTrabajador> buscarTrabajadorPorId(Long id) {
        if (id == null) return Optional.empty();
        return trabajadorRepository.findById(id);
    }

    @Transactional
    public RrhhTrabajador crearOEncontrarTrabajador(String dni, String nombres, String apellidos, String cargo) {
        String trimmedDni = dni != null ? dni.trim() : null;
        if (trimmedDni != null && !trimmedDni.isEmpty()) {
            return trabajadorRepository.findByDni(trimmedDni)
                    .orElseGet(() -> guardarTrabajador(trimmedDni, nombres, apellidos, cargo));
        }
        if ((nombres == null || nombres.isBlank()) || (apellidos == null || apellidos.isBlank())) {
            throw new IllegalArgumentException("DNI o nombre/apellidos del trabajador son requeridos.");
        }
        return guardarTrabajador(trimmedDni, nombres, apellidos, cargo);
    }

    @Transactional
    public OpCuadrillaMiembroPlantilla asegurarMiembroPlantilla(OpCuadrilla cuadrilla,
                                                                 RrhhTrabajador trabajador,
                                                                 String cargoEnCuadrilla) {
        if (cuadrilla == null || trabajador == null) {
            throw new IllegalArgumentException("Cuadrilla y trabajador son requeridos.");
        }
        return miembroRepository.findByCuadrillaAndTrabajador(cuadrilla, trabajador)
                .orElseGet(() -> {
                    OpCuadrillaMiembroPlantilla miembro = new OpCuadrillaMiembroPlantilla();
                    miembro.setCuadrilla(cuadrilla);
                    miembro.setTrabajador(trabajador);
                    miembro.setCargoEnCuadrilla(cargoEnCuadrilla != null ? cargoEnCuadrilla.trim() : null);
                    miembro.setActivo(true);
                    return miembroRepository.save(miembro);
                });
    }

    @Transactional(readOnly = true)
    public List<OpCuadrillaMiembroPlantilla> listarMiembros(OpCuadrilla cuadrilla) {
        return miembroRepository.findByCuadrilla(cuadrilla);
    }

    private RrhhTrabajador guardarTrabajador(String dni, String nombres, String apellidos, String cargo) {
        RrhhTrabajador trabajador = new RrhhTrabajador();
        trabajador.setDni(dni);
        trabajador.setNombres(nombres != null ? nombres.trim() : "");
        trabajador.setApellidos(apellidos != null ? apellidos.trim() : "");
        trabajador.setCargo(cargo != null ? cargo.trim() : null);
        trabajador.setActivo(true);
        return trabajadorRepository.save(trabajador);
    }
}
