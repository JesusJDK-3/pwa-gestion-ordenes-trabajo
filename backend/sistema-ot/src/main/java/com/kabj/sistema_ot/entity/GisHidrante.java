package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gis_hidrante")
public class GisHidrante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_hidrante")
    private Long idHidrante;

    @Column(nullable = false, unique = true, length = 50)
    private String hia;

    @Column(nullable = false, unique = true, length = 50)
    private String suministro;

    @Column(length = 255)
    private String direccion;

    @Column(length = 100)
    private String localidad;

    @Column(length = 100)
    private String distrito;

    @Column(length = 100)
    private String sector;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
