package com.kabj.sistema_ot.controller;

// ─────────────────────────────────────────────────────────────────────────────
// MockMvc — simula peticiones HTTP sin levantar un servidor real (Tomcat/Jetty).
// Permite probar controladores Spring MVC a nivel de HTTP (URLs, status codes,
// cuerpo JSON) de forma rápida y sin necesidad de una BD ni red.
// ─────────────────────────────────────────────────────────────────────────────
import com.fasterxml.jackson.databind.ObjectMapper; // Convierte objetos Java ↔ JSON
import com.kabj.sistema_ot.dto.LoginRequest;
import com.kabj.sistema_ot.dto.LoginResponse;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.service.AuthService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;              // "application/json"
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;   // El cliente HTTP simulado
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

// Importaciones estáticas de MockMvc para escribir pruebas fluidas (estilo BDD)
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print; // Imprime la petición/respuesta

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PRUEBA DE CAPA WEB (Controller) — AuthController
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tipo: Test de integración parcial (levanta solo la capa web de Spring)
 *  Clase bajo prueba: {@link AuthController}
 *
 *  ¿Qué valida?
 *  - POST /api/auth/login con credenciales válidas → HTTP 200 + token en JSON.
 *  - POST /api/auth/login con email mal formado   → HTTP 400 (Bean Validation).
 *  - POST /api/auth/login con contraseña corta    → HTTP 400 (Bean Validation).
 *  - POST /api/auth/login con credenciales malas  → HTTP 401 (AuthException).
 *  - GET  /api/auth/me sin autenticación          → HTTP 401.
 * ═══════════════════════════════════════════════════════════════════════
 */
@WebMvcTest(
        /*
         * @WebMvcTest(controllers = ...)
         * ────────────────────────────────────────────────────────────────────
         * Levanta SOLO la capa web de Spring (DispatcherServlet, validaciones,
         * manejo de excepciones, etc.). NO carga JPA, BD ni servicios reales.
         * Es mucho más rápido que @SpringBootTest completo.
         */
        controllers = AuthController.class,

        /*
         * excludeAutoConfiguration: desactiva la auto-configuración de Spring Security.
         * Esto simplifica los tests: no necesitamos configurar tokens JWT para
         * probar el endpoint /login (que de todas formas es público).
         * En un proyecto real con mayor cobertura se probaría también la seguridad.
         */
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class
        }
)
class AuthControllerTest {

    @MockBean
    private PasswordEncoder passwordEncoder;


    @MockBean
    private AuthService authService;
    /**
     * @Autowired MockMvc
     * ────────────────────────────────────────────────────────────────────────
     * Spring inyecta automáticamente el cliente HTTP simulado.
     * Con él podemos hacer perform(post("/url").content(...)) y luego
     * .andExpect(status().isOk()) para verificar la respuesta.
     */
    @Autowired
    private MockMvc mockMvc;

    /**
     * @Autowired ObjectMapper
     * ────────────────────────────────────────────────────────────────────────
     * Jackson ObjectMapper: convierte objetos Java → String JSON (serialización).
     * Lo usamos para crear el cuerpo de las peticiones HTTP en los tests.
     */
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * @MockitoBean (Spring Boot 3.4+) / @MockBean (versiones anteriores)
     * ────────────────────────────────────────────────────────────────────────
     * Registra un mock de Mockito en el contexto de Spring.
     * Reemplaza el bean real por un simulado durante los tests.
     * AuthController depende de AuthService y UsuarioRepository.
     *
     * NOTA: JwtFilter (filtro de seguridad) es un @Component detectado por
     * @WebMvcTest. Necesita JwtUtil y UsuarioRepository para instanciarse,
     * por eso ambos deben declararse como @MockitoBean aunque no los usemos
     * directamente en estos tests.
     */
    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    /** Requerido por JwtFilter que @WebMvcTest detecta como @Component/Filter */
    @MockitoBean
    private com.kabj.sistema_ot.security.JwtUtil jwtUtil;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1 — Login exitoso → HTTP 200 + token en el JSON
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login: credenciales válidas → 200 OK con token")
    void login_credencialesValidas_retorna200ConToken() throws Exception {
        // ARRANGE
        LoginRequest request = new LoginRequest();
        request.setEmail("supervisor@ot.com");
        request.setPassword("password123");

        // Configuramos qué devuelve AuthService cuando lo llamen los mocks
        LoginResponse respuesta = new LoginResponse(
                "token.jwt.ejemplo", "supervisor", "Carlos Mendoza", 1L, "supervisor@ot.com"
        );
        when(authService.login(any(LoginRequest.class))).thenReturn(respuesta);

        // ACT + ASSERT — forma fluida de MockMvc
        mockMvc.perform(
                        // post(): simula una petición HTTP POST
                        post("/api/auth/login")
                                // contentType: indica que enviamos JSON
                                .contentType(MediaType.APPLICATION_JSON)
                                // content: cuerpo de la petición (serializado a JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                // andDo(print()): imprime petición y respuesta en consola (útil para depurar)
                .andDo(print())
                // andExpect(): encadenamos verificaciones sobre la respuesta
                // status().isOk()    → verifica que el código HTTP sea 200
                .andExpect(status().isOk())
                // jsonPath("$.campo"): accede a un campo del JSON de respuesta
                // .value("valor")    → verifica que ese campo tenga ese valor
                .andExpect(jsonPath("$.token").value("token.jwt.ejemplo"))
                .andExpect(jsonPath("$.rol").value("supervisor"))
                .andExpect(jsonPath("$.nombre").value("Carlos Mendoza"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2 — Email con formato inválido → HTTP 400
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login: email malformado → 400 Bad Request (Bean Validation)")
    void login_emailMalFormato_retorna400() throws Exception {
        // ARRANGE — email sin "@"
        LoginRequest request = new LoginRequest();
        request.setEmail("esto-no-es-un-email");
        request.setPassword("password123");

        // ACT + ASSERT
        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andDo(print())
                // La anotación @Email en LoginRequest debe rechazar esto con 400
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3 — Contraseña muy corta → HTTP 400
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login: contraseña menor a 4 caracteres → 400 Bad Request")
    void login_passwordDemasiado_corta_retorna400() throws Exception {
        // ARRANGE — contraseña de solo 2 caracteres (@Size mínimo es 4)
        LoginRequest request = new LoginRequest();
        request.setEmail("supervisor@ot.com");
        request.setPassword("ab");  // Viola @Size(min=4)

        // ACT + ASSERT
        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4 — Credenciales incorrectas → HTTP 401
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login: credenciales incorrectas → 401 Unauthorized")
    void login_credencialesIncorrectas_retorna401() throws Exception {
        // ARRANGE — el servicio lanza AuthException para credenciales malas
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new AuthException("Credenciales incorrectas"));

        LoginRequest request = new LoginRequest();
        request.setEmail("usuario@ot.com");
        request.setPassword("claveEquivocada");

        // ACT + ASSERT
        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isUnauthorized()); // 401
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5 — GET /me sin token → HTTP 401
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/auth/me: sin autenticación → 401 Unauthorized")
    void me_sinAutenticacion_retorna401() throws Exception {
        // ACT + ASSERT — petición GET sin ninguna cabecera Authorization
        // El controlador lanza AuthException cuando auth == null
        mockMvc.perform(
                        get("/api/auth/me")
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isUnauthorized()); // 401
    }
}
