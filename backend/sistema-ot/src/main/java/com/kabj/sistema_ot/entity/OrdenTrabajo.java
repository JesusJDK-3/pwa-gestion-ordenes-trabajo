package com.kabj.sistema_ot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kabj.sistema_ot.entity.enums.EstadoOrden;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "ordenes_trabajo")
public class OrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_ot", nullable = false, length = 50)
    private String codigoOt;

    @Column(length = 255)
    private String descripcion;

    @Column(name = "fecha_carga")
    private LocalDate fechaCarga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    @JsonIgnore
    private Usuario supervisor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoOrden estado = EstadoOrden.ACTIVA;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PuntoTrabajo> puntos = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
