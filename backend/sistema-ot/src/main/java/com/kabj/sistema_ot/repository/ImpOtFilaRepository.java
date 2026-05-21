package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.ImpOtFila;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImpOtFilaRepository extends JpaRepository<ImpOtFila, Long> {
    Optional<ImpOtFila> findBySgio(String sgio);
}
