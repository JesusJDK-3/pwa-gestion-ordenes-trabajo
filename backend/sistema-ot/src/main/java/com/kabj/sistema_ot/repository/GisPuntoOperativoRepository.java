package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.GisPuntoOperativo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GisPuntoOperativoRepository extends JpaRepository<GisPuntoOperativo, Long> {
    List<GisPuntoOperativo> findByActivoTrue();
}
