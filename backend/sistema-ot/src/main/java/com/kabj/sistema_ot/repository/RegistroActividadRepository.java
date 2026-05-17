package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.RegistroActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RegistroActividadRepository extends JpaRepository<RegistroActividad, Long> {

    List<RegistroActividad> findByPunto_IdOrderByFechaRegistroDesc(Long puntoId);

    @Query("SELECT r FROM RegistroActividad r WHERE r.capataz.idUsuario = :capatazId AND r.sincronizado = false")
    List<RegistroActividad> findPendientesSync(@Param("capatazId") Long capatazId);

    @Query("SELECT r FROM RegistroActividad r WHERE r.fechaRegistro BETWEEN :inicio AND :fin ORDER BY r.fechaRegistro DESC")
    List<RegistroActividad> findByFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
