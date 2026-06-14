package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.CatFormulario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CatFormularioRepository extends JpaRepository<CatFormulario, Long> {

    Optional<CatFormulario> findByCodigo(String codigo);
}
