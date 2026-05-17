package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    @Query("SELECT a FROM Alerta a WHERE a.supervisor.idUsuario = :supervisorId AND a.leida = false ORDER BY a.createdAt DESC")
    List<Alerta> findNoLeidas(@Param("supervisorId") Long supervisorId);
}
