package com.kabj.sistema_ot.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloudDataSourceConfigTest {

    @Test
    void conviertePostgresqlUriAJdbcConSsl() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "postgresql://postgres:secret@db.abc.supabase.co:5432/postgres");
        assertEquals(
                "jdbc:postgresql://postgres:secret@db.abc.supabase.co:5432/postgres?sslmode=require",
                jdbc);
    }

    @Test
    void respetaJdbcExistenteYAgregaSsl() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "jdbc:postgresql://localhost:5432/sistema_ot");
        assertTrue(jdbc.contains("sslmode=require"));
    }
}
