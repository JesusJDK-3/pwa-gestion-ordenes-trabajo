package com.kabj.sistema_ot.entity;

import com.kabj.sistema_ot.entity.enums.EstadoValidacion;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "evidencias")
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "punto_id")
    private PuntoTrabajo punto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registro_id")
    private RegistroActividad registro;

    @Column(name = "url_foto", length = 500)
    private String urlFoto;

    @Column(name = "sistema_externo_id", length = 100)
    private String sistemaExternoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_validacion", length = 20)
    private EstadoValidacion estadoValidacion = EstadoValidacion.PENDIENTE;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
