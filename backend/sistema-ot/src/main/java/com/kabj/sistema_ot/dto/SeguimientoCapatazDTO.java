package com.kabj.sistema_ot.dto;

public record SeguimientoCapatazDTO(
        Long capatazId,
        String nombre,
        int total,
        int completados,
        int pendientes,
        int enProgreso
) {
}
