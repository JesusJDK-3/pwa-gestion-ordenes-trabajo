package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.ImpOtFilaRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.OpOtEventoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.util.CoordenadaValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final ImpOtFilaRepository filaRepo;
    private final OpOtEventoRepository eventoRepo;
    private final UsuarioRepository usuarioRepository;
    private final RrhhCapatazRepository capatazRepository;
    private final CatEstadoOtRepository estadoRepo;
    private final ValidacionFotoService validacionFotoService;
    private final EventoService eventoService;

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> listarTodas() {
        return ordenRepo.findByActivoTrueOrderByCreatedAtDesc()
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> misPuntos(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
        // Todas las OT activas del capataz (también las sin ubicación, para que vea qué falta corregir)
        return ordenRepo.findByCapatazActivas(capataz)
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> misCompletadas(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
        return ordenRepo.findCompletadasByCapataz(capataz)
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrdenTrabajoResponse detalle(Long id) {
        OpOrdenTrabajo ot = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OT no encontrada"));
        return OrdenTrabajoResponse.from(ot);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> seguimiento() {
        return ordenRepo.findByActivoTrueOrderByCreatedAtDesc().stream()
                .filter(ot -> ot.getCapataz() != null)
                .map(ot -> {
                    String nombre = "Sin nombre";
                    if (ot.getCapataz().getTrabajador() != null) {
                        nombre = ot.getCapataz().getTrabajador().getNombres()
                                + " " + ot.getCapataz().getTrabajador().getApellidos();
                    }
                    return Map.<String, Object>of(
                            "idOt",      ot.getIdOt(),
                            "sgio",      ot.getSgio(),
                            "capataz",   nombre,
                            "estado",    ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE",
                            "direccion", ot.getDireccion() != null ? ot.getDireccion() : "",
                            "latitud",   ot.getLatitud(),
                            "longitud",  ot.getLongitud()
                    );
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> seguimientoResumenCapataces() {
        LocalDate hoy = LocalDate.now();
        Map<String, Map<String, Object>> mapa = new LinkedHashMap<>();

        for (OpOrdenTrabajo ot : ordenRepo.findByActivoTrueOrderByCreatedAtDesc()) {
            if (ot.getCapataz() == null) continue;
            String estado = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
            if ("ANULADA".equals(estado)) continue;

            String nombre = "Sin nombre";
            if (ot.getCapataz().getTrabajador() != null) {
                nombre = ot.getCapataz().getTrabajador().getNombres() + " "
                        + ot.getCapataz().getTrabajador().getApellidos();
            }

            Map<String, Object> cap = mapa.computeIfAbsent(nombre, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("capataz", k);
                m.put("asignadas", 0);
                m.put("completadasHoy", 0);
                m.put("pendientes", 0);
                m.put("completadas", 0);
                return m;
            });

            cap.put("asignadas", (int) cap.get("asignadas") + 1);
            if ("COMPLETADA".equals(estado)) {
                cap.put("completadas", (int) cap.get("completadas") + 1);
                if (ot.getFechaFin() != null && ot.getFechaFin().toLocalDate().equals(hoy)) {
                    cap.put("completadasHoy", (int) cap.get("completadasHoy") + 1);
                }
            } else if ("PENDIENTE".equals(estado) || "EN_PROGRESO".equals(estado) || "OBSERVADA".equals(estado)) {
                cap.put("pendientes", (int) cap.get("pendientes") + 1);
            }
        }

        List<Map<String, Object>> lista = new ArrayList<>();
        for (Map<String, Object> cap : mapa.values()) {
            int asignadas = (int) cap.get("asignadas");
            int completadas = (int) cap.get("completadas");
            int pct = asignadas > 0 ? Math.round((completadas * 100f) / asignadas) : 0;
            cap.put("pctAvance", pct);
            lista.add(cap);
        }
        return lista;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> estadoValidacionFoto(Long idOt) {
        return validacionFotoService.estadoPorOt(idOt);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> listarCoordenadasPendientes(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        if (esCapataz(usuario)) {
            RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                    .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
            return ordenRepo.findConCoordenadasPendientesByCapataz(capataz)
                    .stream().map(OrdenTrabajoResponse::from).toList();
        }
        return ordenRepo.findConCoordenadasPendientes()
                .stream().map(OrdenTrabajoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> listarMapaMonitoreo() {
        return ordenRepo.findByActivoTrueOrderByCreatedAtDesc().stream()
                .filter(ot -> ot.getLatitud() != null && ot.getLongitud() != null)
                .filter(ot -> {
                    String estado = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
                    return !"ANULADA".equals(estado);
                })
                .map(OrdenTrabajoResponse::from)
                .toList();
    }

    @Transactional
    public OrdenTrabajoResponse corregirCoordenadas(Long id, BigDecimal latitud, BigDecimal longitud, String username) {
        BigDecimal[] norm = CoordenadaValidator.normalizarPeru(latitud, longitud);
        latitud = norm[0];
        longitud = norm[1];
        CoordenadaValidator.Resultado res = CoordenadaValidator.validar(latitud, longitud);
        if (!res.valida()) {
            throw new RuntimeException(res.mensaje());
        }
        OpOrdenTrabajo ot = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OT no encontrada"));
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        if (esCapataz(usuario)) {
            RrhhCapataz capataz = capatazRepository.findByUsuario(usuario)
                    .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
            if (ot.getCapataz() == null || !ot.getCapataz().getIdCapataz().equals(capataz.getIdCapataz())) {
                throw new RuntimeException("No tiene permiso para corregir coordenadas de esta OT");
            }
        }
        ot.setLatitud(latitud);
        ot.setLongitud(longitud);
        ot.setVisibleEnMapa(true);
        ot.setUpdatedAt(LocalDateTime.now());
        if (ot.getFilaImportacion() != null) {
            var fila = ot.getFilaImportacion();
            fila.setLatitudManual(latitud);
            fila.setLongitudManual(longitud);
            fila.setRequiereCoordenadaManual(false);
            fila.setEstadoValidacion(res.requiereCorreccion() ? "PENDIENTE" : "APROBADO");
            fila.setMensajeValidacion("Ubicación corregida por supervisor");
            fila.setRequiereRevision(res.requiereCorreccion());
            fila.setUpdatedAt(LocalDateTime.now());
            filaRepo.save(fila);
        }
        ordenRepo.save(ot);
        return OrdenTrabajoResponse.from(ot);
    }

    public void validarPropiedadCapataz(OpOrdenTrabajo ot, RrhhCapataz capataz) {
        if (ot.getCapataz() == null || !ot.getCapataz().getIdCapataz().equals(capataz.getIdCapataz())) {
            throw new RuntimeException("Esta OT no está asignada a usted");
        }
    }

    @Transactional
    public Map<String, Object> cambiarEstadoSupervisor(Long id, String nuevoEstado, String username) {
        OpOrdenTrabajo ot = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OT no encontrada"));
        var est = estadoRepo.findByCodigo(nuevoEstado)
                .orElseThrow(() -> new RuntimeException("Estado no encontrado: " + nuevoEstado));

        String estadoActual = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
        if ("COMPLETADA".equals(estadoActual) || "ANULADA".equals(estadoActual)) {
            throw new RuntimeException("Una OT " + estadoActual + " no puede cambiar de estado");
        }
        if (!"ANULADA".equals(nuevoEstado)) {
            throw new RuntimeException("Solo se permite anular OTs desde este panel");
        }

        ot.setEstadoOt(est);
        ot.setUpdatedAt(LocalDateTime.now());
        if (est.getEsFinal() != null && est.getEsFinal()) {
            ot.setFechaFin(LocalDateTime.now());
            ot.setVisibleEnMapa(false);
        }
        ordenRepo.save(ot);

        usuarioRepository.findByUsername(username).ifPresent(u ->
                eventoService.registrar(ot, "CAMBIO_ESTADO", estadoActual, nuevoEstado,
                        "Anulación por supervisor", u, "WEB"));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("estadoAnterior", estadoActual);
        res.put("estadoActual", nuevoEstado);
        return res;
    }

    private boolean esCapataz(Usuario usuario) {
        return usuario.getRol() != null && "capataz".equalsIgnoreCase(usuario.getRol().getCodigo());
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> asignacionesDiaCapataz(String username, String sgio, String estado) {
        RrhhCapataz capataz = resolverCapataz(username);
        LocalDateTime t0 = LocalDate.now().atStartOfDay();
        LocalDateTime t1 = t0.plusDays(1);

        Map<Long, OpOrdenTrabajo> merged = new LinkedHashMap<>();
        ordenRepo.findByCapatazActivas(capataz).forEach(ot -> merged.put(ot.getIdOt(), ot));
        ordenRepo.findCompletadasByCapataz(capataz).stream()
                .filter(ot -> ot.getFechaFin() != null
                        && !ot.getFechaFin().isBefore(t0)
                        && ot.getFechaFin().isBefore(t1))
                .forEach(ot -> merged.put(ot.getIdOt(), ot));

        return filtrarYOrdenarHistorial(new ArrayList<>(merged.values()), null, sgio, estado, false);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> historialCapataz(String username, String fecha, String sgio, String estado) {
        RrhhCapataz capataz = resolverCapataz(username);
        List<OpOrdenTrabajo> base = ordenRepo.findByCapatazAndActivoTrueOrderByFechaProgramadaAsc(capataz);
        return filtrarYOrdenarHistorial(base, fecha, sgio, estado, false);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> historialSupervisor(String fecha, String sgio, String estado) {
        List<OpOrdenTrabajo> base = ordenRepo.findByActivoTrueOrderByCreatedAtDesc();
        return filtrarYOrdenarHistorial(base, fecha, sgio, estado, false);
    }

    private RrhhCapataz resolverCapataz(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));
        return capatazRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));
    }

    private List<OrdenTrabajoResponse> filtrarYOrdenarHistorial(List<OpOrdenTrabajo> base,
                                                                String fechaStr, String sgio, String estado,
                                                                boolean requiereFecha) {
        LocalDate fecha = null;
        if (fechaStr != null && !fechaStr.isBlank()) {
            try {
                fecha = LocalDate.parse(fechaStr);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Fecha inválida: " + fechaStr);
            }
        }
        LocalDateTime t0 = fecha != null ? fecha.atStartOfDay() : null;
        LocalDateTime t1 = fecha != null ? fecha.plusDays(1).atStartOfDay() : null;

        Set<Long> idsEvento = new HashSet<>();
        Set<Long> idsObservadasDia = new HashSet<>();
        if (t0 != null) {
            eventoService.buscar(null, null, null, t0, t1).forEach(e -> {
                if (e.getOrden() == null) return;
                idsEvento.add(e.getOrden().getIdOt());
                if ("OBSERVADA".equals(e.getEstadoNuevo())) {
                    idsObservadasDia.add(e.getOrden().getIdOt());
                }
            });
        }

        String sgioFiltro = sgio != null ? sgio.trim().toUpperCase() : "";
        String estadoFiltro = estado != null ? estado.trim() : "";
        boolean observadasHistoricasDia = t0 != null && "OBSERVADA".equals(estadoFiltro);

        return base.stream()
                .filter(ot -> {
                    if (!sgioFiltro.isEmpty()) {
                        String cod = ot.getSgio() != null ? ot.getSgio().toUpperCase() : "";
                        if (!cod.contains(sgioFiltro)) return false;
                    }
                    if (!estadoFiltro.isEmpty()) {
                        if (observadasHistoricasDia) {
                            if (!idsObservadasDia.contains(ot.getIdOt())) return false;
                        } else {
                            String cod = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";
                            if (!estadoFiltro.equals(cod)) return false;
                        }
                    }
                    if (t0 != null && !observadasHistoricasDia) {
                        boolean actividad = idsEvento.contains(ot.getIdOt())
                                || (ot.getUpdatedAt() != null
                                && !ot.getUpdatedAt().isBefore(t0) && ot.getUpdatedAt().isBefore(t1))
                                || (ot.getFechaInicio() != null
                                && !ot.getFechaInicio().isBefore(t0) && ot.getFechaInicio().isBefore(t1))
                                || (ot.getFechaFin() != null
                                && !ot.getFechaFin().isBefore(t0) && ot.getFechaFin().isBefore(t1));
                        if (!actividad) return false;
                    } else if (requiereFecha) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(
                        (OpOrdenTrabajo o) -> o.getUpdatedAt() != null ? o.getUpdatedAt() : o.getCreatedAt())
                        .reversed())
                .map(OrdenTrabajoResponse::from)
                .toList();
    }
}
