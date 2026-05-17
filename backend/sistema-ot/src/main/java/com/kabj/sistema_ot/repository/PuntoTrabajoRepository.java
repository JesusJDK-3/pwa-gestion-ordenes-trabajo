package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.PuntoTrabajo;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PuntoTrabajoRepository extends JpaRepository<PuntoTrabajo, Long> {

    List<PuntoTrabajo> findByCapataz_IdUsuario(Long capatazId);

    List<PuntoTrabajo> findByOrden_Id(Long ordenId);

    @Query("SELECT p FROM PuntoTrabajo p WHERE p.capataz.idUsuario = :capatazId AND p.estado = :estado")
    List<PuntoTrabajo> findByCapatazAndEstado(@Param("capatazId") Long capatazId, @Param("estado") EstadoPunto estado);

    @Query("SELECT p FROM PuntoTrabajo p WHERE p.capataz.idUsuario = :capatazId AND p.estado IN ('PENDIENTE','EN_PROGRESO')")
    List<PuntoTrabajo> findActivosByCapataz(@Param("capatazId") Long capatazId);
}
