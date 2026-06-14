package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpAlerta;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.OpAlertaRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private static final Set<String> TIPOS_CAPATAZ = Set.of("OBSERVADA", "RETRASADA", "SIN_UBICACION");
    private static final DateTimeFormatter FMT_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final OpAlertaRepository alertaRepo;
    private final OpOrdenTrabajoRepository ordenRepo;
    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;

    @Transactional
    public void sincronizarDesdeOrdenes() {
        alertaRepo.deleteByTipo("SIN_FOTOS");

        for (OpOrdenTrabajo ot : ordenRepo.findByActivoTrueOrderByCreatedAtDesc()) {
            String estado = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";

            sincronizarTipo(ot, "OBSERVADA", "OBSERVADA".equals(estado),
                    "OT observada — requiere atención",
                    detalleObservada(ot),
                    "alta");

            sincronizarTipo(ot, "SIN_ASIGNAR",
                    "PENDIENTE".equals(estado) && ot.getCapataz() == null,
                    "OT sin capataz asignado",
                    ot.getSgio() + " — asigna un responsable de campo",
                    "media");

            boolean retrasada = "EN_PROGRESO".equals(estado) && ot.getFechaInicio() != null
                    && ChronoUnit.DAYS.between(ot.getFechaInicio(), LocalDateTime.now()) > 3;
            String diasRetraso = retrasada
                    ? String.valueOf(ChronoUnit.DAYS.between(ot.getFechaInicio(), LocalDateTime.now()))
                    : "0";
            sincronizarTipo(ot, "RETRASADA", retrasada,
                    "OT retrasada (" + diasRetraso + " días en campo)",
                    ot.getSgio() + " · " + capatazNombre(ot),
                    "alta");

            sincronizarTipo(ot, "SIN_GEOREFERENCIA", requiereGeoreferencia(ot),
                    tituloGeoreferencia(ot),
                    detalleGeoreferencia(ot),
                    prioridadGeoreferencia(ot));

            sincronizarTipo(ot, "SIN_UBICACION", requiereUbicacionCapataz(ot),
                    "OT sin ubicación en mapa",
                    ot.getSgio() + (ot.getDireccion() != null ? " · " + ot.getDireccion() : "")
                            + " — el supervisor debe corregir la georreferencia",
                    "media");
        }
    }

    private boolean requiereUbicacionCapataz(OpOrdenTrabajo ot) {
        if (ot.getCapataz() == null) return false;
        return requiereGeoreferencia(ot);
    }

    private String detalleObservada(OpOrdenTrabajo ot) {
        String base = ot.getSgio();
        if (ot.getDireccion() != null && !ot.getDireccion().isBlank()) {
            base += " · " + ot.getDireccion();
        }
        return base;
    }

    private String observacionCapataz(OpOrdenTrabajo ot) {
        String obs = ot.getObservacion();
        return obs != null ? obs.trim() : "";
    }

    private void sincronizarTipo(OpOrdenTrabajo ot, String tipo, boolean condicionActiva,
                                 String titulo, String detalle, String prioridad) {
        if (!condicionActiva) {
            alertaRepo.deleteByOrden_IdOtAndTipo(ot.getIdOt(), tipo);
            return;
        }
        var existente = alertaRepo.findByOrden_IdOtAndTipoAndResueltaFalse(ot.getIdOt(), tipo);
        if (existente.isPresent()) {
            OpAlerta a = existente.get();
            boolean cambio = !titulo.equals(a.getTitulo())
                    || !detalle.equals(a.getDetalle())
                    || !prioridad.equals(a.getPrioridad());
            if (cambio) {
                a.setTitulo(titulo);
                a.setDetalle(detalle);
                a.setPrioridad(prioridad);
                alertaRepo.save(a);
            }
            return;
        }
        var resuelta = alertaRepo.findFirstByOrden_IdOtAndTipoAndResueltaTrue(ot.getIdOt(), tipo);
        if (resuelta.isPresent()) {
            OpAlerta a = resuelta.get();
            if ("OBSERVADA".equals(tipo)) {
                String obsActual = observacionCapataz(ot);
                String obsAlResolver = a.getObservacionAlResolver() != null ? a.getObservacionAlResolver() : "";
                if (!obsActual.equals(obsAlResolver)) {
                    a.setResuelta(false);
                    a.setTitulo(titulo);
                    a.setDetalle(detalle);
                    a.setPrioridad(prioridad);
                    a.setCreatedAt(LocalDateTime.now());
                    a.setResueltaAt(null);
                    a.setObservacionAlResolver(null);
                    alertaRepo.save(a);
                }
                return;
            }
            // Otros tipos: el supervisor ya marcó resuelta — no reabrir automáticamente
            return;
        }

        OpAlerta a = new OpAlerta();
        a.setOrden(ot);
        a.setTipo(tipo);
        a.setTitulo(titulo);
        a.setDetalle(detalle);
        a.setPrioridad(prioridad);
        a.setResuelta(false);
        a.setCreatedAt(LocalDateTime.now());
        alertaRepo.save(a);
    }

    private boolean requiereGeoreferencia(OpOrdenTrabajo ot) {
        if (!Boolean.TRUE.equals(ot.getActivo())) return false;
        String estado = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
        if ("COMPLETADA".equals(estado) || "ANULADA".equals(estado)) return false;
        if (ot.getLatitud() == null || ot.getLongitud() == null) return true;
        if (Boolean.FALSE.equals(ot.getVisibleEnMapa())) return true;
        return ot.getFilaImportacion() != null
                && Boolean.TRUE.equals(ot.getFilaImportacion().getRequiereCoordenadaManual());
    }

    private String tituloGeoreferencia(OpOrdenTrabajo ot) {
        if (ot.getLatitud() == null || ot.getLongitud() == null) {
            return "OT sin georreferencia";
        }
        return "Georreferencia requiere corrección";
    }

    private String detalleGeoreferencia(OpOrdenTrabajo ot) {
        String base = ot.getSgio();
        if (ot.getDireccion() != null && !ot.getDireccion().isBlank()) {
            base += " · " + ot.getDireccion();
        }
        String mensaje = ot.getFilaImportacion() != null ? ot.getFilaImportacion().getMensajeValidacion() : null;
        if (mensaje != null && !mensaje.isBlank()) {
            return base + " — " + mensaje;
        }
        if (ot.getLatitud() == null || ot.getLongitud() == null) {
            return base + " — sin coordenadas en el sistema";
        }
        return base + " — revise ubicación en mapa";
    }

    private String prioridadGeoreferencia(OpOrdenTrabajo ot) {
        if (ot.getLatitud() == null || ot.getLongitud() == null) return "alta";
        return "media";
    }

    @Transactional
    public List<Map<String, Object>> listarActivas(String username) {
        sincronizarDesdeOrdenes();
        ContextoRol ctx = resolverContexto(username);
        List<Map<String, Object>> lista = new ArrayList<>();
        for (OpAlerta a : alertaRepo.findByResueltaFalseOrderByCreatedAtDesc()) {
            if (!visibleParaRol(a, ctx)) continue;
            lista.add(toMap(a));
        }
        return lista;
    }

    @Transactional
    public void marcarResuelta(Long id, String username) {
        OpAlerta a = alertaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));
        ContextoRol ctx = resolverContexto(username);
        if (!visibleParaRol(a, ctx)) {
            throw new RuntimeException("No tiene permiso para resolver esta alerta");
        }
        a.setResuelta(true);
        a.setResueltaAt(LocalDateTime.now());
        if ("OBSERVADA".equals(a.getTipo()) && a.getOrden() != null) {
            a.setObservacionAlResolver(observacionCapataz(a.getOrden()));
        }
        alertaRepo.save(a);
    }

    @Transactional
    public long contarActivas(String username) {
        sincronizarDesdeOrdenes();
        ContextoRol ctx = resolverContexto(username);
        return alertaRepo.findByResueltaFalseOrderByCreatedAtDesc().stream()
                .filter(a -> visibleParaRol(a, ctx))
                .count();
    }

    private boolean visibleParaRol(OpAlerta a, ContextoRol ctx) {
        if (ctx.admin || ctx.supervisor) return true;
        if (!ctx.capataz) return false;
        if (!TIPOS_CAPATAZ.contains(a.getTipo())) return false;
        if (a.getOrden() == null || a.getOrden().getCapataz() == null || ctx.capatazId == null) return false;
        return a.getOrden().getCapataz().getIdCapataz().equals(ctx.capatazId);
    }

    private Map<String, Object> toMap(OpAlerta a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getIdAlerta());
        m.put("tipo", a.getTipo());
        m.put("tipoLabel", etiquetaTipo(a.getTipo()));
        m.put("titulo", a.getTitulo());
        m.put("detalle", a.getDetalle());
        m.put("prioridad", a.getPrioridad());
        m.put("prioridadLabel", etiquetaPrioridad(a.getPrioridad()));
        m.put("sgio", a.getOrden() != null ? a.getOrden().getSgio() : "");
        m.put("idOt", a.getOrden() != null ? a.getOrden().getIdOt() : null);
        m.put("direccion", a.getOrden() != null ? a.getOrden().getDireccion() : "");
        m.put("capatazNombre", a.getOrden() != null ? capatazNombre(a.getOrden()) : "");
        m.put("estadoOt", a.getOrden() != null && a.getOrden().getEstadoOt() != null
                ? a.getOrden().getEstadoOt().getNombre() : "");
        m.put("accionLabel", etiquetaAccion(a.getTipo()));
        m.put("timestamp", a.getCreatedAt() != null ? a.getCreatedAt().format(FMT_FECHA) : "");
        if ("OBSERVADA".equals(a.getTipo()) && a.getOrden() != null) {
            m.put("observacionCapataz", observacionCapataz(a.getOrden()));
        }
        return m;
    }

    private String etiquetaTipo(String tipo) {
        return switch (tipo != null ? tipo : "") {
            case "OBSERVADA" -> "OT observada";
            case "SIN_ASIGNAR" -> "Sin capataz asignado";
            case "RETRASADA" -> "OT retrasada";
            case "SIN_GEOREFERENCIA" -> "Georreferencia pendiente";
            case "SIN_UBICACION" -> "Ubicación pendiente";
            default -> "Alerta del sistema";
        };
    }

    private String etiquetaPrioridad(String prioridad) {
        return switch (prioridad != null ? prioridad : "") {
            case "alta" -> "Alta";
            case "media" -> "Media";
            case "baja" -> "Baja";
            default -> "Normal";
        };
    }

    private String etiquetaAccion(String tipo) {
        return switch (tipo != null ? tipo : "") {
            case "SIN_ASIGNAR" -> "Ir a asignar capataz";
            case "OBSERVADA" -> "Ver observaciones del capataz";
            case "RETRASADA" -> "Ver en mapa de monitoreo";
            case "SIN_GEOREFERENCIA" -> "Ir a georreferencia";
            case "SIN_UBICACION" -> "Ver en mapa";
            default -> "Ver detalle";
        };
    }

    private ContextoRol resolverContexto(String username) {
        ContextoRol ctx = new ContextoRol();
        Usuario u = usuarioRepository.findByUsername(username).orElse(null);
        if (u == null || u.getRol() == null) return ctx;
        String rol = u.getRol().getCodigo().toLowerCase();
        ctx.admin = "admin".equals(rol);
        ctx.supervisor = "supervisor".equals(rol);
        ctx.capataz = "capataz".equals(rol);
        if (ctx.capataz) {
            capatazRepository.findByUsuario(u).ifPresent(c -> ctx.capatazId = c.getIdCapataz());
        }
        return ctx;
    }

    private String capatazNombre(OpOrdenTrabajo ot) {
        if (ot.getCapataz() == null || ot.getCapataz().getTrabajador() == null) return "Sin asignar";
        return ot.getCapataz().getTrabajador().getNombres() + " " + ot.getCapataz().getTrabajador().getApellidos();
    }

    private static class ContextoRol {
        boolean admin;
        boolean supervisor;
        boolean capataz;
        Long capatazId;
    }
}
