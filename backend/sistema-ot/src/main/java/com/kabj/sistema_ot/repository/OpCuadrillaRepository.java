package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpCuadrilla;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OpCuadrillaRepository extends JpaRepository<OpCuadrilla, Long> {
    Optional<OpCuadrilla> findByCapatazAndNombreIgnoreCase(RrhhCapataz capataz, String nombre);
    Optional<OpCuadrilla> findByCapataz(RrhhCapataz capataz);
}
