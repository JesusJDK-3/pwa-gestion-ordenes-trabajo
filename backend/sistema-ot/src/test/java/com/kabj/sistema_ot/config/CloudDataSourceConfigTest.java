package com.kabj.sistema_ot.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloudDataSourceConfigTest {

    @Test
    void conviertePostgresqlUriAJdbcConSslSinCredencialesEnHost() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "postgresql://postgres.abc:secret@db.abc.supabase.co:5432/postgres");
        assertEquals(
                "jdbc:postgresql://db.abc.supabase.co:5432/postgres?sslmode=require",
                jdbc);
    }

    @Test
    void separaCredencialesDeDatabaseUrl() {
        CloudDataSourceConfig.ParsedDatabaseUrl parsed = CloudDataSourceConfig.parseDatabaseUrl(
                "postgresql://postgres.abc:secret@db.abc.supabase.co:5432/postgres");

        assertEquals("jdbc:postgresql://db.abc.supabase.co:5432/postgres?sslmode=require", parsed.jdbcUrl());
        assertEquals("postgres.abc", parsed.username());
        assertEquals("secret", parsed.password());
    }

    @Test
    void respetaJdbcExistenteYAgregaSsl() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "jdbc:postgresql://localhost:5432/sistema_ot");
        assertTrue(jdbc.contains("sslmode=require"));
    }
}
