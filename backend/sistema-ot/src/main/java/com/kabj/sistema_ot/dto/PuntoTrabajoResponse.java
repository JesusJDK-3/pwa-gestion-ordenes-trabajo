package com.kabj.sistema_ot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PuntoTrabajoResponse(
        Long id,
        Long ordenId,
        String codigoOt,
        double latitud,
        double longitud,
        String descripcion,
        String direccion,
        String estado,
        Long capatazId,
        String capatazNombre
) {
}
