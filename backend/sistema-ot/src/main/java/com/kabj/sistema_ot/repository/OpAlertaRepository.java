package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpAlerta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OpAlertaRepository extends JpaRepository<OpAlerta, Long> {
    List<OpAlerta> findByResueltaFalseOrderByCreatedAtDesc();
    long countByResueltaFalse();
    Optional<OpAlerta> findByOrden_IdOtAndTipoAndResueltaFalse(Long idOt, String tipo);
    Optional<OpAlerta> findFirstByOrden_IdOtAndTipoAndResueltaTrue(Long idOt, String tipo);
    boolean existsByOrden_IdOtAndTipoAndResueltaTrue(Long idOt, String tipo);
    void deleteByOrden_IdOtAndTipo(Long idOt, String tipo);
    void deleteByTipo(String tipo);
}
