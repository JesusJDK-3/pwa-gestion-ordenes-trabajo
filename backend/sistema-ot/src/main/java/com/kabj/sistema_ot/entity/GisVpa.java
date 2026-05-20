package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gis_vpa")
public class GisVpa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vpa")
    private Long idVpa;

    @Column(nullable = false, unique = true, length = 50)
    private String vca;

    @Column(nullable = false, unique = true, length = 50)
    private String nis;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
