package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpCuadrilla;
import com.kabj.sistema_ot.entity.OpCuadrillaMiembroPlantilla;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface OpCuadrillaMiembroPlantillaRepository extends JpaRepository<OpCuadrillaMiembroPlantilla, Long> {
    Optional<OpCuadrillaMiembroPlantilla> findByCuadrillaAndTrabajador(OpCuadrilla cuadrilla, RrhhTrabajador trabajador);
    List<OpCuadrillaMiembroPlantilla> findByCuadrilla(OpCuadrilla cuadrilla);
}
