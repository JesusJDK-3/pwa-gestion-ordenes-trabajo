package com.kabj.sistema_ot.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String rol;
    private String nombres;
    private String apellidos;
}