/**
 * Seguridad basada en JWT (Spring Security).
 * <p>
 * Flujo: {@code AuthController} emite token → {@code JwtFilter} valida en cada request →
 * {@code SecurityConfig} define rutas públicas y roles.
 * </p>
 * <ul>
 *   <li>{@link com.kabj.sistema_ot.security.JwtUtil} — firma y parseo HS256</li>
 *   <li>{@link com.kabj.sistema_ot.security.JwtFilter} — filtro Bearer en cadena HTTP</li>
 *   <li>{@link com.kabj.sistema_ot.security.LoginRateLimitFilter} — limitación de intentos login</li>
 * </ul>
 */
package com.kabj.sistema_ot.security;
