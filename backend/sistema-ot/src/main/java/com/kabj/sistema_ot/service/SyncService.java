package com.kabj.sistema_ot.service;



import com.kabj.sistema_ot.entity.*;

import com.kabj.sistema_ot.repository.*;

import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.time.LocalDateTime;

import java.util.*;



@Slf4j

@Service

@RequiredArgsConstructor

public class SyncService {



    private final SyncOperacionMovilRepository syncRepo;

    private final OpOrdenTrabajoRepository ordenRepo;

    private final CatEstadoOtRepository estadoRepo;

    private final UsuarioRepository usuarioRepo;

    private final RrhhCapatazRepository capatazRepo;

    private final OpOtValidacionFotoRepository validacionRepo;

    private final EventoService eventoService;

    private final OrdenTrabajoService ordenTrabajoService;

    private final CuadrillaService cuadrillaService;

    private final OpOtAcompananteService acompananteService;



    @Transactional

    public Map<String, Object> procesarOperaciones(List<Map<String, Object>> operaciones, String username) {

        Usuario usuario = usuarioRepo.findByUsername(username)

                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        RrhhCapataz capataz = capatazRepo.findByUsuario(usuario)

                .orElseThrow(() -> new RuntimeException("No existe registro de capataz para este usuario"));



        int procesados = 0;

        int duplicados = 0;

        List<String> errores = new ArrayList<>();

        List<String> procesadosUuids = new ArrayList<>();



        for (Map<String, Object> op : operaciones) {

            UUID uuid;

            try {

                uuid = UUID.fromString(Objects.toString(op.get("clientOpUuid"), ""));

            } catch (Exception e) {

                errores.add("UUID de operación inválido");

                continue;

            }



            if (syncRepo.findByClientOpUuid(uuid).isPresent()) {

                duplicados++;

                procesadosUuids.add(uuid.toString());

                continue;

            }



            try {

                Long idOt = parseLong(op.get("puntoId"));

                if (idOt == null) idOt = parseLong(op.get("idOt"));

                var otOpt = idOt != null ? ordenRepo.findById(idOt) : Optional.<OpOrdenTrabajo>empty();

                if (otOpt.isEmpty()) {

                    errores.add("OT no encontrada para uuid " + uuid);

                    continue;

                }

                OpOrdenTrabajo ot = otOpt.get();

                ordenTrabajoService.validarPropiedadCapataz(ot, capataz);



                String obs = str(op.get("observaciones"));

                String nuevoEstado = str(op.get("estado"));

                String estadoAnterior = ot.getEstadoOt() != null ? ot.getEstadoOt().getCodigo() : "PENDIENTE";

                boolean creadoOffline = Boolean.TRUE.equals(op.get("creadoOffline"));

                if (creadoOffline
                        && "PENDIENTE".equals(estadoAnterior)
                        && (nuevoEstado == null || nuevoEstado.isBlank() || "SIN_CAMBIO".equals(nuevoEstado))) {
                    boolean hayRegistro = (obs != null && !obs.isBlank()) || str(op.get("tipoActividad")) != null;
                    if (hayRegistro) {
                        nuevoEstado = "EN_PROGRESO";
                    }
                }



                if (obs != null && !obs.isBlank()) {

                    String pref = ot.getObservacion() != null ? ot.getObservacion() + "\n" : "";

                    String tipo = str(op.get("tipoActividad"));

                    String prefijo = tipo != null ? "[" + tipo + "] " : "";

                    ot.setObservacion(pref + prefijo + obs);

                }



                List<Long> asistenteIds = parseLongList(op.get("asistenteIds"));

                if (asistenteIds != null && !asistenteIds.isEmpty()) {

                    RrhhTrabajador primerAsistente = null;

                    for (Long asistenteId : asistenteIds) {

                        var trabajadorOpt = cuadrillaService.buscarTrabajadorPorId(asistenteId);

                        if (trabajadorOpt.isEmpty()) {
                            throw new RuntimeException("Trabajador no encontrado: " + asistenteId);
                        }

                        RrhhTrabajador trabajador = trabajadorOpt.get();

                        if (primerAsistente == null) primerAsistente = trabajador;

                        OpOtAcompanante acompanante = new OpOtAcompanante();

                        acompanante.setTrabajador(trabajador);

                        acompanante.setDni(trabajador.getDni());

                        acompanante.setNombres(trabajador.getNombres());

                        acompanante.setApellidos(trabajador.getApellidos());

                        acompanante.setCargo(trabajador.getCargo());

                        acompanante.setRol("AYUDANTE");

                        acompananteService.crearAcompanante(ot.getIdOt(), acompanante);

                    }

                    if (primerAsistente != null) {

                        ot.setAsistente(primerAsistente);

                    }

                }



                if (nuevoEstado != null && !nuevoEstado.isBlank() && !"SIN_CAMBIO".equals(nuevoEstado)

                        && !nuevoEstado.equals(estadoAnterior)) {



                    if ("ANULADA".equals(nuevoEstado)) {

                        throw new RuntimeException("El capataz no puede anular una OT");

                    }

                    if ("OBSERVADA".equals(nuevoEstado) && (obs == null || obs.isBlank())) {

                        throw new RuntimeException("Las observaciones son obligatorias para estado OBSERVADA");

                    }

                    if ("COMPLETADA".equals(nuevoEstado)) {

                        validarNoBloqueada(ot.getIdOt());

                        boolean tieneObservaciones = (obs != null && !obs.isBlank())

                                || (ot.getObservacion() != null && !ot.getObservacion().isBlank());

                        if (!tieneObservaciones) {

                            throw new RuntimeException(

                                    "Debe registrar observaciones antes de completar la OT");

                        }

                        if (!"EN_PROGRESO".equals(estadoAnterior) && !"OBSERVADA".equals(estadoAnterior)) {

                            throw new RuntimeException(

                                    "La OT debe estar EN PROGRESO u OBSERVADA antes de completarse");

                        }

                    }



                    var estOpt = estadoRepo.findByCodigo(nuevoEstado);

                    if (estOpt.isPresent()) {

                        var est = estOpt.get();

                        ot.setEstadoOt(est);

                        if ("EN_PROGRESO".equals(nuevoEstado) && ot.getFechaInicio() == null) {

                            ot.setFechaInicio(LocalDateTime.now());

                        }

                        if (est.getEsFinal() != null && est.getEsFinal()) {

                            ot.setFechaFin(LocalDateTime.now());

                            ot.setVisibleEnMapa(false);

                        }

                        eventoService.registrar(ot, "SINCRONIZACION", estadoAnterior, nuevoEstado,

                                "Sync offline", usuario, "MOVIL");

                    }

                }



                ot.setUpdatedAt(LocalDateTime.now());

                ordenRepo.save(ot);



                SyncOperacionMovil sync = new SyncOperacionMovil();

                sync.setClientOpUuid(uuid);

                sync.setUsuario(usuario);

                sync.setOrden(ot);

                sync.setTipoOperacion(str(op.get("tipoOperacion")) != null ? str(op.get("tipoOperacion")) : "GUARDAR_ACTIVIDAD");

                sync.setPayloadJson(op);

                sync.setEstadoSync("PROCESADO");

                sync.setCreatedAtCliente(LocalDateTime.now());

                sync.setProcessedAt(LocalDateTime.now());

                syncRepo.save(sync);

                procesados++;

                procesadosUuids.add(uuid.toString());

            } catch (Exception e) {

                errores.add(uuid + ": " + e.getMessage());

                log.warn("Error sync operación {}: {}", uuid, e.getMessage());

            }

        }



        Map<String, Object> res = new LinkedHashMap<>();

        res.put("procesados", procesados);

        res.put("duplicados", duplicados);

        res.put("total", operaciones.size());

        res.put("errores", errores);

        res.put("procesadosUuids", procesadosUuids);

        return res;

    }



    public void validarNoBloqueada(Long idOt) {

        validacionRepo.findByOrden_IdOt(idOt).ifPresent(v -> {

            if (Boolean.TRUE.equals(v.getBloqueada())) {

                throw new RuntimeException("No puedes cerrar este punto, faltan evidencias requeridas");

            }

        });

    }



    private Long parseLong(Object o) {

        if (o == null) return null;

        try { return Long.valueOf(o.toString()); } catch (Exception e) { return null; }

    }



    private List<Long> parseLongList(Object o) {

        if (!(o instanceof List<?> rawList)) return null;

        List<Long> list = new ArrayList<>();

        for (Object item : rawList) {

            Long parsed = parseLong(item);

            if (parsed != null) list.add(parsed);

        }

        return list;

    }



    private String str(Object o) {

        return o != null ? o.toString().trim() : null;

    }

}


