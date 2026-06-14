package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "sync_operacion_movil")
public class SyncOperacionMovil {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sync_operacion")
    private Long idSyncOperacion;

    @Column(name = "client_op_uuid", nullable = false, unique = true)
    private UUID clientOpUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot")
    private OpOrdenTrabajo orden;

    @Column(name = "tipo_operacion", nullable = false, length = 50)
    private String tipoOperacion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payloadJson;

    @Column(name = "estado_sync", nullable = false, length = 20)
    private String estadoSync = "PROCESADO";

    @Column(name = "created_at_cliente", nullable = false)
    private LocalDateTime createdAtCliente;

    @Column(name = "received_at_servidor")
    private LocalDateTime receivedAtServidor = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
