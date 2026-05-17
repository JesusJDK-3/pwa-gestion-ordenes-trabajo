package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.Evidencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {

    List<Evidencia> findByPunto_Id(Long puntoId);

    List<Evidencia> findByRegistro_Id(Long registroId);
}
