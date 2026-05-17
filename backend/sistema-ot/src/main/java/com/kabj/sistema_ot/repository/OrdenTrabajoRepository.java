package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {

    List<OrdenTrabajo> findBySupervisor_IdUsuario(Long supervisorId);
}
