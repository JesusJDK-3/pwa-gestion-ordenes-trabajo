package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.GisHidrante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GisHidranteRepository extends JpaRepository<GisHidrante, Long> {
    Optional<GisHidrante> findByHia(String hia);
    Optional<GisHidrante> findBySuministro(String suministro);
    List<GisHidrante> findByHiaIn(Collection<String> hias);
    List<GisHidrante> findBySuministroIn(Collection<String> suministros);
}
