package com.kabj.sistema_ot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UsuarioResponse(
        Long idUsuario,
        String username,
        String email,
        String nombres,
        String apellidos,
        String fotoUrl,
        Boolean activo,
        LocalDateTime ultimoLogin,
        String rolCodigo,
        String rolNombre
) {
}
