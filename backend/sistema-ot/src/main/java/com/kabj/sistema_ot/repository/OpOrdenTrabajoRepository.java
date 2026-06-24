package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de órdenes de trabajo ({@link OpOrdenTrabajo}).
 * <p>
 * Consultas clave para capataz: {@link #findByCapatazActivas} (incluye sin coords),
 * {@link #findByCapatazActivasVisibles} (solo mapa), {@link #findConCoordenadasPendientes}.
 * </p>
 */
public interface OpOrdenTrabajoRepository extends JpaRepository<OpOrdenTrabajo, Long> {

    Optional<OpOrdenTrabajo> findBySgio(String sgio);

    // OTs activas del capataz (incluye las que aún esperan corrección de coordenadas)
    @Query("""
            SELECT ot FROM OpOrdenTrabajo ot
            WHERE ot.capataz = :capataz AND ot.activo = true
            AND ot.estadoOt.codigo NOT IN ('COMPLETADA', 'ANULADA')
            ORDER BY ot.fechaProgramada ASC NULLS LAST
            """)
    List<OpOrdenTrabajo> findByCapatazActivas(@Param("capataz") RrhhCapataz capataz);

    // Solo OTs visibles en mapa (operativas con ubicación lista)
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

    @Query("SELECT ot FROM OpOrdenTrabajo ot WHERE ot.activo = true AND ot.lote.supervisor.username = :username ORDER BY ot.createdAt DESC")
    List<OpOrdenTrabajo> findByLoteSupervisorUsername(@Param("username") String username);

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
                OR (ot.filaImportacion IS NOT NULL AND ot.filaImportacion.requiereCoordenadaManual = true)
            )
            ORDER BY ot.createdAt DESC
            """)
    List<OpOrdenTrabajo> findConCoordenadasPendientes();

    @Query("""
            SELECT ot FROM OpOrdenTrabajo ot
            WHERE ot.activo = true
            AND ot.capataz = :capataz
            AND ot.estadoOt.codigo NOT IN ('COMPLETADA', 'ANULADA')
            AND (
                ot.latitud IS NULL OR ot.longitud IS NULL
                OR (ot.filaImportacion IS NOT NULL AND ot.filaImportacion.requiereCoordenadaManual = true)
            )
            ORDER BY ot.createdAt DESC
            """)
    List<OpOrdenTrabajo> findConCoordenadasPendientesByCapataz(@Param("capataz") RrhhCapataz capataz);
}
