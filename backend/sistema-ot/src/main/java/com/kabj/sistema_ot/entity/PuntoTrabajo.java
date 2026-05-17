package com.kabj.sistema_ot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "puntos_trabajo")
public class PuntoTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_id")
    @JsonIgnore
    private OrdenTrabajo orden;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitud;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitud;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 300)
    private String direccion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPunto estado = EstadoPunto.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capataz_id")
    private Usuario capataz;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
