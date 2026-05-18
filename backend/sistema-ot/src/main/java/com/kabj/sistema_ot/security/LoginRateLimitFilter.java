package com.kabj.sistema_ot.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting en el endpoint de login:
 * Máximo MAX_ATTEMPTS intentos en WINDOW_MS milisegundos por IP.
 * Defensa contra ataques de fuerza bruta y credential stuffing.
 */
@Slf4j
@Component
@Order(1)
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int  MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS    = 60_000; // 1 minuto

    private record Counter(AtomicInteger count, long windowStart) {}
    private final ConcurrentHashMap<String, Counter> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().endsWith("/auth/login")) {

            String ip = getClientIp(request);
            long   now = Instant.now().toEpochMilli();

            Counter c = attempts.compute(ip, (k, existing) -> {
                if (existing == null || (now - existing.windowStart()) > WINDOW_MS) {
                    return new Counter(new AtomicInteger(1), now);
                }
                existing.count().incrementAndGet();
                return existing;
            });

            int count = c.count().get();
            response.setHeader("X-RateLimit-Limit",     String.valueOf(MAX_ATTEMPTS));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, MAX_ATTEMPTS - count)));

            if (count > MAX_ATTEMPTS) {
                log.warn("Rate limit alcanzado para IP: {}", ip);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Demasiados intentos de acceso. Espera 1 minuto.\",\"data\":null}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
