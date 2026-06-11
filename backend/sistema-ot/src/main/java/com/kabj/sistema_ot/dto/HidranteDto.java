package com.kabj.sistema_ot.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class HidranteDto {
    private String hia;
    private String suministro;
    private String direccion;
    private String localidad;
    private String distrito;
    private String sector;
    private BigDecimal longitud;
    private BigDecimal latitud;
}
