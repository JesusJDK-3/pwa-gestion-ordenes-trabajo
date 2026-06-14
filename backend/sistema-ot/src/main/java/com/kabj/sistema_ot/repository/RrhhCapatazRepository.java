package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RrhhCapatazRepository extends JpaRepository<RrhhCapataz, Long> {
    Optional<RrhhCapataz> findByUsuario(Usuario usuario);
    Optional<RrhhCapataz> findByCodigoCapataz(String codigoCapataz);
    Optional<RrhhCapataz> findByTrabajador_IdTrabajador(Long idTrabajador);
}
