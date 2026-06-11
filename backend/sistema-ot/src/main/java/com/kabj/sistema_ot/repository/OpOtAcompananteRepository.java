package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOtAcompanante;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OpOtAcompananteRepository extends JpaRepository<OpOtAcompanante, Long> {

    List<OpOtAcompanante> findByOrdenTrabajoAndActivoTrueOrderByOrdenEnLista(OpOrdenTrabajo ordenTrabajo);

    @Query("SELECT COUNT(a) FROM OpOtAcompanante a WHERE a.ordenTrabajo = :ot AND a.activo = true")
    long countByOrdenTrabajoActivo(@Param("ot") OpOrdenTrabajo ordenTrabajo);

    List<OpOtAcompanante> findByOrdenTrabajo(OpOrdenTrabajo ordenTrabajo);
}
