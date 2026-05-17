package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.ImpOtLote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImpOtLoteRepository extends JpaRepository<ImpOtLote, Long> {
    List<ImpOtLote> findByOrderByFechaCargaDesc();
}
