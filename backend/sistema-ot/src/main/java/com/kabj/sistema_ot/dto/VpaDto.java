package com.kabj.sistema_ot.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VpaDto {
    private String vca;
    private String nis;
    private BigDecimal longitud;
    private BigDecimal latitud;
}
