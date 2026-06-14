package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.dto.ApiResponse;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.OpOtEvento;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.OpOtEventoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.AlertaService;
import com.kabj.sistema_ot.service.EventoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final OpOtEventoRepository     eventoRepo;
    private final UsuarioRepository        usuarioRepository;
    private final RrhhCapatazRepository    capatazRepository;
    private final AlertaService            alertaService;
    private final EventoService            eventoService;

    @GetMapping("/auditoria")
    @PreAuthorize("hasRole('ADMIN')")
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

    /** Reporte diario: OTs con actividad en la fecha indicada (HU18) — solo supervisor */
    @GetMapping("/diario")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> diario(
            @RequestParam(required = false) String fecha) {

        LocalDate dia    = (fecha != null && !fecha.isBlank()) ? LocalDate.parse(fecha) : LocalDate.now();
        LocalDateTime t0 = dia.atStartOfDay();
        LocalDateTime t1 = dia.plusDays(1).atStartOfDay();

        var todas = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        Set<Long> idsConActividad = new HashSet<>();
        eventoService.buscar(null, null, null, t0, t1).forEach(e -> {
            if (e.getOrden() != null) idsConActividad.add(e.getOrden().getIdOt());
        });

        var delDia = todas.stream()
                .filter(o -> idsConActividad.contains(o.getIdOt())
                        || (o.getCreatedAt() != null
                            && !o.getCreatedAt().isBefore(t0)
                            && o.getCreatedAt().isBefore(t1))
                        || (o.getUpdatedAt() != null
                            && !o.getUpdatedAt().isBefore(t0)
                            && o.getUpdatedAt().isBefore(t1))
                        || (o.getFechaInicio() != null
                            && !o.getFechaInicio().isBefore(t0)
                            && o.getFechaInicio().isBefore(t1))
                        || (o.getFechaFin() != null
                            && !o.getFechaFin().isBefore(t0)
                            && o.getFechaFin().isBefore(t1)))
                .toList();

        var detalle = delDia.stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("idOt",        o.getIdOt());
            m.put("sgio",        o.getSgio());
            m.put("estado",      codigo(o));
            m.put("direccion",   o.getDireccion() != null ? o.getDireccion() : "");
            m.put("capataz",     cap(o));
            m.put("subactividad", o.getSubactividad() != null ? o.getSubactividad().getNombre() : "");
            m.put("observacion", o.getObservacion() != null ? o.getObservacion() : "");
            m.put("fechaInicio", o.getFechaInicio() != null ? o.getFechaInicio().toString() : "");
            m.put("fechaFin",    o.getFechaFin() != null ? o.getFechaFin().toString() : "");
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

    /** OTs marcadas observadas en una fecha (registro histórico por eventos) — supervisor */
    @GetMapping("/observadas-dia")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> observadasDia(
            @RequestParam String fecha) {

        LocalDate dia = LocalDate.parse(fecha);
        LocalDateTime t0 = dia.atStartOfDay();
        LocalDateTime t1 = dia.plusDays(1).atStartOfDay();

        Map<Long, OpOtEvento> ultimoPorOt = new LinkedHashMap<>();
        eventoService.buscar(null, null, null, t0, t1).stream()
                .filter(e -> e.getOrden() != null && "OBSERVADA".equals(e.getEstadoNuevo()))
                .sorted(Comparator.comparing(OpOtEvento::getFechaEvento))
                .forEach(e -> ultimoPorOt.put(e.getOrden().getIdOt(), e));

        var detalle = ultimoPorOt.values().stream()
                .map(e -> {
                    OpOrdenTrabajo o = e.getOrden();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("idOt", o.getIdOt());
                    m.put("sgio", o.getSgio());
                    m.put("direccion", o.getDireccion() != null ? o.getDireccion() : "");
                    m.put("capataz", cap(o));
                    m.put("observacion", o.getObservacion() != null ? o.getObservacion() : "");
                    m.put("estadoActual", codigo(o));
                    m.put("horaObservada", e.getFechaEvento() != null ? e.getFechaEvento().toString() : "");
                    return m;
                })
                .sorted(Comparator.comparing(m -> String.valueOf(m.get("sgio"))))
                .collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("fecha", dia.toString());
        res.put("total", detalle.size());
        res.put("detalle", detalle);
        return ResponseEntity.ok(new ApiResponse<>(true, null, res));
    }

    /** Reporte mensual (HU19) — solo supervisor */
    @GetMapping("/mensual")
    @PreAuthorize("hasRole('SUPERVISOR')")
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

        Map<String, Long> porSemana = new LinkedHashMap<>();
        for (int w = 1; w <= 5; w++) porSemana.put(String.valueOf(w), 0L);
        for (OpOrdenTrabajo o : compMes) {
            if (o.getFechaFin() == null) continue;
            int semana = ((o.getFechaFin().getDayOfMonth() - 1) / 7) + 1;
            String key = String.valueOf(Math.min(semana, 5));
            porSemana.put(key, porSemana.get(key) + 1);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("mes",         m);
        res.put("anio",        a);
        res.put("periodo",     m + "/" + a);
        res.put("completadas", (long) compMes.size());
        res.put("creadas",     (long) creadMes.size());
        res.put("pendientes",  count(creadMes, "PENDIENTE"));
        res.put("porCapataz",  porCapataz);
        res.put("porSemana",   porSemana);
        return ResponseEntity.ok(new ApiResponse<>(true, null, res));
    }

    /** Alertas activas (HU16) — delega a AlertaService */
    @GetMapping("/alertas")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','CAPATAZ')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> alertas(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                alertaService.listarActivas(auth.getName())));
    }

    /** HU21: timeline de auditoría */
    @GetMapping("/auditoria/eventos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> eventosAuditoria(
            @RequestParam(required = false) Long idOt,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Long idUsuario,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {
        LocalDateTime t0 = (desde != null && !desde.isBlank()) ? LocalDate.parse(desde).atStartOfDay() : null;
        LocalDateTime t1 = (hasta != null && !hasta.isBlank()) ? LocalDate.parse(hasta).plusDays(1).atStartOfDay() : null;
        return ResponseEntity.ok(new ApiResponse<>(true, null,
                eventoService.listar(idOt, tipo, idUsuario, t0, t1)));
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

}
