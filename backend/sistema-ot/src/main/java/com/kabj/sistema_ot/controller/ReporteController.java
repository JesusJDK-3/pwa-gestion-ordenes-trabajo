package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class ReporteController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final UsuarioRepository        usuarioRepository;
    private final RrhhCapatazRepository    capatazRepository;

    @GetMapping("/auditoria")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditoria() {
        var todas  = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        long total = todas.size();
        long comp  = count(todas, "COMPLETADA");
        long pend  = count(todas, "PENDIENTE");
        long obs   = count(todas, "OBSERVADA");
        long prog  = count(todas, "EN_PROGRESO");
        long anul  = count(todas, "ANULADA");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalOrdenes",   total);
        data.put("totalCapataces", capatazRepository.count());
        data.put("totalUsuarios",  usuarioRepository.count());
        data.put("completadas",    comp);
        data.put("pendientes",     pend);
        data.put("enProgreso",     prog);
        data.put("observadas",     obs);
        data.put("anuladas",       anul);
        data.put("tasaCompletado", total > 0 ? Math.round((comp * 100.0) / total) : 0);
        return ResponseEntity.ok(new ApiResponse<>(true, null, data));
    }

    /** Reporte diario: OTs con actividad en la fecha indicada (HU18) */
    @GetMapping("/diario")
    public ResponseEntity<ApiResponse<Map<String, Object>>> diario(
            @RequestParam(required = false) String fecha) {

        LocalDate dia    = (fecha != null && !fecha.isBlank()) ? LocalDate.parse(fecha) : LocalDate.now();
        LocalDateTime t0 = dia.atStartOfDay();
        LocalDateTime t1 = dia.plusDays(1).atStartOfDay();

        var todas  = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        var delDia = todas.stream()
                .filter(o -> o.getUpdatedAt() != null
                        && !o.getUpdatedAt().isBefore(t0)
                        && o.getUpdatedAt().isBefore(t1))
                .toList();

        var detalle = delDia.stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sgio",        o.getSgio());
            m.put("estado",      codigo(o));
            m.put("direccion",   o.getDireccion() != null ? o.getDireccion() : "");
            m.put("capataz",     cap(o));
            m.put("subactividad", o.getSubactividad() != null ? o.getSubactividad().getNombre() : "");
            m.put("observacion", o.getObservacion() != null ? o.getObservacion() : "");
            m.put("updatedAt",   o.getUpdatedAt() != null ? o.getUpdatedAt().toString() : "");
            return (Map<String, Object>) m;
        }).collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("fecha",       dia.toString());
        res.put("totalActivos", delDia.size());
        res.put("completadas", count(delDia, "COMPLETADA"));
        res.put("observadas",  count(delDia, "OBSERVADA"));
        res.put("enProgreso",  count(delDia, "EN_PROGRESO"));
        res.put("detalle",     detalle);
        return ResponseEntity.ok(new ApiResponse<>(true, null, res));
    }

    /** Reporte mensual (HU19) */
    @GetMapping("/mensual")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mensual(
            @RequestParam(required = false, defaultValue = "0") int mes,
            @RequestParam(required = false, defaultValue = "0") int anio) {

        int m = mes  > 0 ? mes  : LocalDate.now().getMonthValue();
        int a = anio > 0 ? anio : LocalDate.now().getYear();

        LocalDate inicio = LocalDate.of(a, m, 1);
        LocalDate fin    = inicio.plusMonths(1);

        var todas = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();

        // Filtro en Java para compatibilidad PostgreSQL (EXTRACT en JPQL no es portable)
        var compMes = todas.stream()
                .filter(o -> o.getFechaFin() != null
                        && o.getFechaFin().getMonthValue() == m
                        && o.getFechaFin().getYear() == a
                        && "COMPLETADA".equals(codigo(o)))
                .toList();
        var creadMes = todas.stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().toLocalDate().isBefore(inicio)
                        && o.getCreatedAt().toLocalDate().isBefore(fin))
                .toList();

        Map<String, Long> porCapataz = compMes.stream()
                .collect(Collectors.groupingBy(o -> cap(o), Collectors.counting()));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("mes",         m);
        res.put("anio",        a);
        res.put("periodo",     m + "/" + a);
        res.put("completadas", (long) compMes.size());
        res.put("creadas",     (long) creadMes.size());
        res.put("pendientes",  count(creadMes, "PENDIENTE"));
        res.put("porCapataz",  porCapataz);
        return ResponseEntity.ok(new ApiResponse<>(true, null, res));
    }

    /** Alertas activas en tiempo real (HU16) */
    @GetMapping("/alertas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> alertas() {
        var todas   = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        var lista   = new ArrayList<Map<String, Object>>();

        for (OpOrdenTrabajo ot : todas) {
            String estado = codigo(ot);

            if ("OBSERVADA".equals(estado)) {
                lista.add(alerta("OBSERVADA", "OT observada — requiere atención",
                        ot.getSgio() + (ot.getDireccion() != null ? " · " + ot.getDireccion() : ""),
                        "alta", ot.getSgio()));
            }

            if ("PENDIENTE".equals(estado) && ot.getCapataz() == null) {
                lista.add(alerta("SIN_ASIGNAR", "OT sin capataz asignado",
                        ot.getSgio() + " — asigna un responsable de campo",
                        "media", ot.getSgio()));
            }

            if ("EN_PROGRESO".equals(estado) && ot.getFechaInicio() != null) {
                long dias = ChronoUnit.DAYS.between(ot.getFechaInicio(), LocalDateTime.now());
                if (dias > 3) {
                    lista.add(alerta("RETRASADA",
                            "OT retrasada (" + dias + " días en campo)",
                            ot.getSgio() + " · " + cap(ot),
                            "alta", ot.getSgio()));
                }
            }
        }

        log.debug("Alertas generadas: {}", lista.size());
        return ResponseEntity.ok(new ApiResponse<>(true, null, lista));
    }

    // ── helpers ──────────────────────────────────────────────────────
    private String codigo(OpOrdenTrabajo ot) {
        return ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
    }

    private String cap(OpOrdenTrabajo ot) {
        if (ot.getCapataz() == null) return "Sin asignar";
        if (ot.getCapataz().getTrabajador() == null) return "Capataz #" + ot.getCapataz().getIdCapataz();
        return ot.getCapataz().getTrabajador().getNombres()
                + " " + ot.getCapataz().getTrabajador().getApellidos();
    }

    private long count(List<OpOrdenTrabajo> list, String estado) {
        return list.stream().filter(o -> estado.equals(codigo(o))).count();
    }

    private Map<String, Object> alerta(String tipo, String titulo, String detalle,
                                       String prioridad, String sgio) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("tipo",      tipo);
        a.put("titulo",    titulo);
        a.put("detalle",   detalle);
        a.put("prioridad", prioridad);
        a.put("sgio",      sgio);
        a.put("timestamp", LocalDateTime.now().toString());
        return a;
    }
}
