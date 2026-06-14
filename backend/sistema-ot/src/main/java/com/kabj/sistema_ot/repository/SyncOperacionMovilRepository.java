package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.SyncOperacionMovil;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SyncOperacionMovilRepository extends JpaRepository<SyncOperacionMovil, Long> {
    Optional<SyncOperacionMovil> findByClientOpUuid(UUID clientOpUuid);
}
