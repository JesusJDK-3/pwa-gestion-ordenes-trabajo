package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_ot_purgado_hidrante")
public class OpOtPurgadoHidrante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_purgado")
    private Long idPurgado;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot_formulario", nullable = false)
    private OpOtFormulario formulario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot", nullable = false)
    private OpOrdenTrabajo ordenTrabajo;

    @Column(name = "marca_hidrante", length = 100)
    private String marcaHidrante;

    @Column(name = "numero_bocamazas")
    private Integer numeroBocamazas;

    @Column(name = "presion_psi_hidrante", precision = 10, scale = 2)
    private BigDecimal presionPsiHidrante;

    @Column(name = "tiempo_inicio_purgado")
    private LocalDateTime tiempoInicioPurgado;

    @Column(name = "tiempo_fin_purgado")
    private LocalDateTime tiempoFinPurgado;

    @Column(name = "medicion_cloro_ppm", precision = 10, scale = 2)
    private BigDecimal medicionCloroPpm;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
