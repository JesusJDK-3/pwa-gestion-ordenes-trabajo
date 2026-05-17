package com.kabj.sistema_ot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RegistroActividadResponse(
        Long id,
        Long puntoId,
        String descripcionPunto,
        Long capatazId,
        String capatazNombre,
        String tipoActividad,
        String observaciones,
        LocalDateTime fechaRegistro,
        boolean validado,
        boolean sincronizado,
        boolean creadoOffline
) {
}
