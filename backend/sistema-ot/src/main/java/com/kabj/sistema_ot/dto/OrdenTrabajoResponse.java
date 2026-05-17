package com.kabj.sistema_ot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OrdenTrabajoResponse(
        Long id,
        String codigoOt,
        String descripcion,
        LocalDate fechaCarga,
        String estado,
        Long supervisorId,
        String supervisorNombre,
        List<PuntoTrabajoResponse> puntos
) {
}
