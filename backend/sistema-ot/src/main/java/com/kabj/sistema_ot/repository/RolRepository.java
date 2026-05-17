package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByCodigo(String codigo);
}
