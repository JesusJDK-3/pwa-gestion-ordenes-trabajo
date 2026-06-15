package com.kabj.sistema_ot.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * DataSource para despliegue cloud (Railway + Supabase).
 * <p>
 * Si Railway define {@code DATABASE_URL} (cadena de Supabase), la convierte a JDBC
 * con {@code sslmode=require}. Si no existe, Spring usa {@code PG_URL} o
 * {@code PGHOST}/{@code PGPORT}/… de {@code application-cloud.properties}.
 * </p>
 */
@Configuration
@Profile("cloud")
@ConditionalOnProperty(name = "DATABASE_URL")
public class CloudDataSourceConfig {

    @Bean
    @Primary
    public DataSource cloudDataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(toJdbcUrl(databaseUrl));
        ds.setDriverClassName("org.postgresql.Driver");
        return ds;
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
