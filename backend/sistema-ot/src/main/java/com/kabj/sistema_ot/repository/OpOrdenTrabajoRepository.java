package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface OpOrdenTrabajoRepository extends JpaRepository<OpOrdenTrabajo, Long> {

    Optional<OpOrdenTrabajo> findBySgio(String sgio);

    // Solo OTs visibles en mapa (operativas: no completadas ni anuladas)
    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.capataz = :capataz AND ot.activo = true AND ot.visibleEnMapa = true ORDER BY ot.fechaProgramada ASC NULLS LAST")
    List<OpOrdenTrabajo> findByCapatazActivasVisibles(@Param("capataz") RrhhCapataz capataz);

    // Todas las OTs del capataz (incluyendo historial)
    List<OpOrdenTrabajo> findByCapatazAndActivoTrueOrderByFechaProgramadaAsc(RrhhCapataz capataz);

    // Completadas del capataz (para historial)
    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.capataz = :capataz AND ot.activo = true AND ot.estadoOt.codigo = 'COMPLETADA' ORDER BY ot.fechaFin DESC NULLS LAST")
    List<OpOrdenTrabajo> findCompletadasByCapataz(@Param("capataz") RrhhCapataz capataz);

    // OTs actualizadas en una fecha específica (para reporte diario)
    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.activo = true AND CAST(ot.updatedAt AS date) = CAST(:fecha AS date)")
    List<OpOrdenTrabajo> findByFechaActualizacion(@Param("fecha") java.time.LocalDateTime fecha);

    // OTs finalizadas en un mes/año específico (para reporte mensual)
    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.activo = true AND FUNCTION('MONTH', ot.fechaFin) = :mes AND FUNCTION('YEAR', ot.fechaFin) = :anio")
    List<OpOrdenTrabajo> findByMesAnioFin(@Param("mes") int mes, @Param("anio") int anio);

    List<OpOrdenTrabajo> findByActivoTrueOrderByCreatedAtDesc();

    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.activo = true AND ot.visibleEnMapa = true")
    List<OpOrdenTrabajo> findVisiblesEnMapa();

    @Query("SELECT COUNT(ot) FROM OpOrdenTrabajo ot WHERE ot.capataz = :capataz AND ot.estadoOt.codigo = :estado AND ot.activo = true")
    long countByCapatazAndEstado(@Param("capataz") RrhhCapataz capataz, @Param("estado") String estado);

    @Query("""
            SELECT ot FROM OpOrdenTrabajo ot
            WHERE ot.activo = true
            AND ot.estadoOt.codigo NOT IN ('COMPLETADA', 'ANULADA')
            AND (
                ot.latitud IS NULL OR ot.longitud IS NULL
                OR ot.visibleEnMapa = false
                OR (ot.filaImportacion IS NOT NULL AND ot.filaImportacion.requiereCoordenadaManual = true)
            )
            ORDER BY ot.createdAt DESC
            """)
    List<OpOrdenTrabajo> findConCoordenadasPendientes();
}
