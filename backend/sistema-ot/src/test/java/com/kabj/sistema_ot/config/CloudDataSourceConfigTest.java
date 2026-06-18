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
                "jdbc:postgresql://db.abc.supabase.co:5432/postgres?sslmode=require&prepareThreshold=0",
                jdbc);
    }

    @Test
    void separaCredencialesDeDatabaseUrl() {
        CloudDataSourceConfig.ParsedDatabaseUrl parsed = CloudDataSourceConfig.parseDatabaseUrl(
                "postgresql://postgres.abc:secret@db.abc.supabase.co:5432/postgres");

        assertEquals("jdbc:postgresql://db.abc.supabase.co:5432/postgres?sslmode=require&prepareThreshold=0", parsed.jdbcUrl());
        assertEquals("postgres.abc", parsed.username());
        assertEquals("secret", parsed.password());
    }

    @Test
    void respetaJdbcExistenteYAgregaSsl() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "jdbc:postgresql://localhost:5432/sistema_ot");
        assertTrue(jdbc.contains("sslmode=require"));
        assertTrue(jdbc.contains("prepareThreshold=0"));
    }

    @Test
    void noDuplicaPrepareThresholdSiYaExiste() {
        String jdbc = CloudDataSourceConfig.toJdbcUrl(
                "jdbc:postgresql://localhost:5432/sistema_ot?sslmode=require&prepareThreshold=0");

        assertEquals(
                "jdbc:postgresql://localhost:5432/sistema_ot?sslmode=require&prepareThreshold=0",
                jdbc);
    }
}
