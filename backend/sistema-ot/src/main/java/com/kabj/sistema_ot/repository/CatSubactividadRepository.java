package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.CatSubactividad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CatSubactividadRepository extends JpaRepository<CatSubactividad, Long> {
    Optional<CatSubactividad> findByCodigo(String codigo);
    Optional<CatSubactividad> findByNombreIgnoreCase(String nombre);
}
