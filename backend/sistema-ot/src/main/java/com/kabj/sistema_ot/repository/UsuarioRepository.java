package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM Usuario u WHERE u.rol.codigo = :codigo AND u.activo = true")
    List<Usuario> findByRolCodigo(@Param("codigo") String codigo);
}
