package com.kabj.sistema_ot.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Agrega cabeceras de seguridad HTTP en todas las respuestas.
 * Defensa contra: clickjacking, XSS reflejado, sniffing de contenido.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // Previene que la app sea embebida en un iframe (clickjacking)
        response.setHeader("X-Frame-Options", "DENY");

        // Evita que el browser adivine el tipo de contenido
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Habilita filtro XSS del navegador
        response.setHeader("X-XSS-Protection", "1; mode=block");

        // Política de referrer mínima
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // No cachear respuestas privadas de la API
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        response.setHeader("Pragma", "no-cache");

        // Content-Security-Policy: permitir solo el mismo origen + Leaflet tiles
        response.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "img-src 'self' data: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com; " +
                "script-src 'self' 'unsafe-inline'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "connect-src 'self'");

        chain.doFilter(request, response);
    }
}
