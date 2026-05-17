package com.kabj.sistema_ot.dto;

import java.time.LocalDateTime;

public record AlertaResponse(
        Long id,
        String mensaje,
        Long puntoId,
        String descripcionPunto,
        boolean leida,
        LocalDateTime createdAt
) {
}
