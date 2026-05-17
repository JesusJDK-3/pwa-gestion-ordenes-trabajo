package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OpOrdenTrabajoRepository extends JpaRepository<OpOrdenTrabajo, Long> {

    List<OpOrdenTrabajo> findByCapatazAndActivoTrueOrderByFechaProgramadaAsc(RrhhCapataz capataz);

    List<OpOrdenTrabajo> findByActivoTrueOrderByCreatedAtDesc();

    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.activo = true AND ot.visibleEnMapa = true")
    List<OpOrdenTrabajo> findVisiblesEnMapa();

    @Query("SELECT COUNT(ot) FROM OpOrdenTrabajo ot WHERE ot.capataz = :capataz AND ot.estadoOt.codigo = :estado AND ot.activo = true")
    long countByCapatazAndEstado(@Param("capataz") RrhhCapataz capataz, @Param("estado") String estado);
}
