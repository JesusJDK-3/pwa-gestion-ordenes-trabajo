package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOtEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OpOtEventoRepository extends JpaRepository<OpOtEvento, Long> {

    @Query("""
        SELECT e FROM OpOtEvento e
        JOIN FETCH e.orden o
        LEFT JOIN FETCH e.usuario u
        WHERE (:idOt < 0 OR o.idOt = :idOt)
          AND (:tipo = '' OR e.tipoEvento = :tipo)
          AND (:idUsuario < 0 OR u.idUsuario = :idUsuario)
          AND e.fechaEvento >= :desde
          AND e.fechaEvento < :hasta
        ORDER BY e.fechaEvento DESC
        """)
    List<OpOtEvento> buscarFiltrados(@Param("idOt") Long idOt,
                                     @Param("tipo") String tipo,
                                     @Param("idUsuario") Long idUsuario,
                                     @Param("desde") LocalDateTime desde,
                                     @Param("hasta") LocalDateTime hasta);
}
