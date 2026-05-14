// Ubicación: java/com.kabj/security/JwtTokenProvider.java
package com.kabj.sistema_ot.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {


    private final String JWT_SECRET = "LLAVE_SECRETA_CURSO_INTEGRADOR_2_SECCION_26311_PARA_EL_PROYECTO_KABJ_2026_SISTEMAS_UTP_LIMA_NORTE_SISTEMAS";
    private final long JWT_EXPIRATION = 86400000L; //

    public String generarToken(String username) {
        Date ahora = new Date();
        Date fechaExpiracion = new Date(ahora.getTime() + JWT_EXPIRATION);
        Key key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(ahora)
                .setExpiration(fechaExpiracion)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean validarToken(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

}