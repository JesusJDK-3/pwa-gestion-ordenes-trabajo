package com.kabj.sistema_ot.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

/**
 * DataSource único para despliegue cloud (Railway + Supabase).
 * <p>
 * Prioridad: {@code DATABASE_URL} (Supabase URI) → {@code PG_URL} (JDBC) →
 * {@code PGHOST}/{@code PGPORT}/{@code PGDATABASE}.
 * </p>
 */
@Configuration
@Profile("cloud")
public class CloudDataSourceConfig {

    @Bean
    @Primary
    public DataSource cloudDataSource(Environment env) {
        String jdbcUrl = resolveJdbcUrl(env);

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        ds.setUsername(env.getProperty("PGUSER", env.getProperty("PG_USER", "postgres")));
        ds.setPassword(env.getProperty("PGPASSWORD", env.getProperty("PG_PASSWORD", "")));
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setMaximumPoolSize(5);
        return ds;
    }

    private static String resolveJdbcUrl(Environment env) {
        String databaseUrl = env.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            return toJdbcUrl(databaseUrl);
        }

        String pgUrl = env.getProperty("PG_URL");
        if (pgUrl != null && !pgUrl.isBlank()) {
            return ensureSsl(pgUrl.trim());
        }

        String host = env.getProperty("PGHOST");
        if (host == null || host.isBlank()) {
            throw new IllegalStateException(
                    "Configure DATABASE_URL (Supabase) o PG_URL/PGHOST en Railway");
        }
        String port = env.getProperty("PGPORT", "5432");
        String database = env.getProperty("PGDATABASE", "postgres");
        return "jdbc:postgresql://" + host + ":" + port + "/" + database + "?sslmode=require";
    }

    static String toJdbcUrl(String raw) {
        String url = raw.trim();
        if (url.startsWith("jdbc:")) {
            return ensureSsl(url);
        }
        if (url.startsWith("postgres://")) {
            url = "postgresql://" + url.substring("postgres://".length());
        }
        if (!url.startsWith("postgresql://")) {
            throw new IllegalArgumentException(
                    "DATABASE_URL debe comenzar con postgresql:// o jdbc:postgresql://");
        }
        return ensureSsl("jdbc:" + url);
    }

    private static String ensureSsl(String jdbcUrl) {
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl += jdbcUrl.contains("?") ? "&sslmode=require" : "?sslmode=require";
        }
        return jdbcUrl;
    }
}
