package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.CatEstadoOt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CatEstadoOtRepository extends JpaRepository<CatEstadoOt, Long> {
    Optional<CatEstadoOt> findByCodigo(String codigo);
}
