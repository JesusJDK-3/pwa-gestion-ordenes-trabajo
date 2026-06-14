package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOtValidacionFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OpOtValidacionFotoRepository extends JpaRepository<OpOtValidacionFoto, Long> {
    Optional<OpOtValidacionFoto> findByOrden_IdOt(Long idOt);
}
