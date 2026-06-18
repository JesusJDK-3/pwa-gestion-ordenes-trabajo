package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.GisVpa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GisVpaRepository extends JpaRepository<GisVpa, Long> {
    Optional<GisVpa> findByVca(String vca);
    Optional<GisVpa> findByNis(String nis);
    List<GisVpa> findByVcaIn(Collection<String> vcas);
    List<GisVpa> findByNisIn(Collection<String> nis);
}
