package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "registros_actividad")
public class RegistroActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "punto_id")
    private PuntoTrabajo punto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capataz_id")
    private Usuario capataz;

    @Column(name = "tipo_actividad", length = 100)
    private String tipoActividad;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(name = "datos_adicionales", columnDefinition = "TEXT")
    private String datosAdicionales;

    @Column(nullable = false)
    private boolean validado = false;

    @Column(nullable = false)
    private boolean sincronizado = true;

    @Column(name = "creado_offline", nullable = false)
    private boolean creadoOffline = false;
}
