package com.kabj.sistema_ot.dto;

import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class OrdenTrabajoResponse {
    private Long idOt;
    private String sgio;
    private String estado;
    private String estadoCodigo;
    private String subactividad;
    private String tipoPunto;
    private String nis;
    private String direccion;
    private String distrito;
    private String sector;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private LocalDate fechaProgramada;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private String capatazNombre;
    private Long capatazId;
    private String cuadrillaNombre;
    private String asistenteNombre;
    private String estadoSincronizacion;
    private String observacion;
    private LocalDateTime createdAt;
    private Boolean visibleEnMapa;
    private Boolean requiereCorreccionCoordenadas;
    private String mensajeCoordenadas;

    public static OrdenTrabajoResponse from(OpOrdenTrabajo ot) {
        OrdenTrabajoResponse r = new OrdenTrabajoResponse();
        r.setIdOt(ot.getIdOt());
        r.setSgio(ot.getSgio());
        if (ot.getEstadoOt() != null) {
            r.setEstado(ot.getEstadoOt().getNombre());
            r.setEstadoCodigo(ot.getEstadoOt().getCodigo());
        }
        if (ot.getSubactividad() != null) r.setSubactividad(ot.getSubactividad().getNombre());
        if (ot.getTipoPunto() != null) r.setTipoPunto(ot.getTipoPunto().getCodigo());
        r.setNis(ot.getNis());
        r.setDireccion(ot.getDireccion());
        r.setDistrito(ot.getDistrito());
        r.setSector(ot.getSector());
        r.setLatitud(ot.getLatitud());
        r.setLongitud(ot.getLongitud());
        r.setFechaProgramada(ot.getFechaProgramada());
        r.setFechaInicio(ot.getFechaInicio());
        r.setFechaFin(ot.getFechaFin());
        if (ot.getCapataz() != null) {
            r.setCapatazId(ot.getCapataz().getIdCapataz());
            if (ot.getCapataz().getTrabajador() != null) {
                r.setCapatazNombre(ot.getCapataz().getTrabajador().getNombres()
                        + " " + ot.getCapataz().getTrabajador().getApellidos());
            }
        }
        if (ot.getCuadrilla() != null) {
            r.setCuadrillaNombre(ot.getCuadrilla().getNombre());
        }
        if (ot.getAsistente() != null) {
            r.setAsistenteNombre(ot.getAsistente().getNombres()
                    + " " + ot.getAsistente().getApellidos());
        }
        r.setEstadoSincronizacion(ot.getEstadoSincronizacion());
        r.setObservacion(ot.getObservacion());
        r.setCreatedAt(ot.getCreatedAt());
        r.setVisibleEnMapa(ot.getVisibleEnMapa());
        if (ot.getFilaImportacion() != null) {
            r.setRequiereCorreccionCoordenadas(ot.getFilaImportacion().getRequiereCoordenadaManual());
            r.setMensajeCoordenadas(ot.getFilaImportacion().getMensajeValidacion());
        } else if (ot.getLatitud() == null || ot.getLongitud() == null) {
            r.setRequiereCorreccionCoordenadas(true);
            r.setMensajeCoordenadas("Sin coordenadas — debe corregirse en el sistema");
        }
        return r;
    }
}
