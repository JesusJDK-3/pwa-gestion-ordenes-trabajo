package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.RrhhTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RrhhTrabajadorRepository extends JpaRepository<RrhhTrabajador, Long> {
    Optional<RrhhTrabajador> findByDni(String dni);
}
