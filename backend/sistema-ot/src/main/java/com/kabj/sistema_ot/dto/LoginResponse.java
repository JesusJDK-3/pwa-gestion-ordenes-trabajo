package com.kabj.sistema_ot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String rol;
    private String nombre;
    private Long userId;
    private String email;
}
