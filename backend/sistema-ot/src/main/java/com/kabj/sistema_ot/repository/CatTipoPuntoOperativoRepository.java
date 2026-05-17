package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.CatTipoPuntoOperativo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CatTipoPuntoOperativoRepository extends JpaRepository<CatTipoPuntoOperativo, Long> {
    Optional<CatTipoPuntoOperativo> findByCodigo(String codigo);
}
