package com.kabj.sistema_ot.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * DataSource para despliegue cloud (Railway + Supabase).
 * <p>
 * Ruta recomendada: definir {@code PG_URL}, {@code PGUSER} y {@code PGPASSWORD}.
 * Si Railway define {@code DATABASE_URL}, se convierte a JDBC separando
 * usuario/password para no dejar credenciales dentro del host JDBC.
 * </p>
 */
@Configuration
@Profile("cloud")
@ConditionalOnProperty(name = "DATABASE_URL")
public class CloudDataSourceConfig {

    @Bean
    @Primary
    public DataSource cloudDataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        ParsedDatabaseUrl parsed = parseDatabaseUrl(databaseUrl);
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(parsed.jdbcUrl());
        if (hasText(parsed.username())) {
            ds.setUsername(parsed.username());
        }
        if (hasText(parsed.password())) {
            ds.setPassword(parsed.password());
        }
        ds.setDriverClassName("org.postgresql.Driver");
        return ds;
    }

    static String toJdbcUrl(String raw) {
        return parseDatabaseUrl(raw).jdbcUrl();
    }

    static ParsedDatabaseUrl parseDatabaseUrl(String raw) {
        String url = raw.trim();
        if (url.startsWith("jdbc:")) {
            return new ParsedDatabaseUrl(ensureSsl(url), null, null);
        }
        if (url.startsWith("postgres://")) {
            url = "postgresql://" + url.substring("postgres://".length());
        }
        if (!url.startsWith("postgresql://")) {
            throw new IllegalArgumentException(
                    "DATABASE_URL debe comenzar con postgresql:// o jdbc:postgresql://");
        }
        try {
            URI uri = new URI(url);
            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null) {
                int separator = userInfo.indexOf(':');
                username = separator >= 0 ? userInfo.substring(0, separator) : userInfo;
                password = separator >= 0 ? userInfo.substring(separator + 1) : null;
            }

            StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                    .append(uri.getHost());
            if (uri.getPort() > -1) {
                jdbc.append(':').append(uri.getPort());
            }
            jdbc.append(hasText(uri.getRawPath()) ? uri.getRawPath() : "/postgres");
            if (hasText(uri.getRawQuery())) {
                jdbc.append('?').append(uri.getRawQuery());
            }

            return new ParsedDatabaseUrl(ensureSsl(jdbc.toString()), username, password);
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("DATABASE_URL no es una URI PostgreSQL valida", ex);
        }
    }

    private static String ensureSsl(String jdbcUrl) {
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl += jdbcUrl.contains("?") ? "&sslmode=require" : "?sslmode=require";
        }
        return jdbcUrl;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    record ParsedDatabaseUrl(String jdbcUrl, String username, String password) {
    }
}
