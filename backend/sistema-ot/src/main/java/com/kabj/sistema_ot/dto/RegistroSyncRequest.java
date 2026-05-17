package com.kabj.sistema_ot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistroSyncRequest(
        @NotNull(message = "puntoId es obligatorio") Long puntoId,
        @NotBlank(message = "tipoActividad es obligatorio") String tipoActividad,
        String observaciones,
        String fechaRegistro,
        String datosAdicionales,
        boolean creadoOffline
) {
}
