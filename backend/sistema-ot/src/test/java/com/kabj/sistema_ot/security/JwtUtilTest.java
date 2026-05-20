package com.kabj.sistema_ot.security;

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTACIONES JUnit 5
// JUnit 5 usa el paquete "org.junit.jupiter" (no "org.junit" que era JUnit 4).
// ─────────────────────────────────────────────────────────────────────────────
import org.junit.jupiter.api.BeforeEach;   // Se ejecuta ANTES de cada @Test
import org.junit.jupiter.api.DisplayName;  // Nombre legible para reportes HTML
import org.junit.jupiter.api.Test;          // Marca un método como caso de prueba
import org.springframework.test.util.ReflectionTestUtils; // Inyecta campos @Value sin levantar Spring

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTACIONES ASSERTIONS de JUnit 5
// "Assertions" contiene todos los métodos estáticos para verificar resultados.
// ─────────────────────────────────────────────────────────────────────────────
import static org.junit.jupiter.api.Assertions.*;

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PRUEBA UNITARIA PURA — JwtUtil
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tipo: Unitaria (no levanta Spring, no necesita BD)
 *  Clase bajo prueba: {@link JwtUtil}
 *
 *  ¿Qué valida?
 *  - Generación de tokens JWT con usuario y rol.
 *  - Extracción correcta del nombre de usuario desde el token.
 *  - Extracción correcta del rol desde el token.
 *  - Validación de token legítimo (debe devolver true).
 *  - Validación de token falsificado (debe devolver false).
 *  - Validación de token vacío (debe devolver false).
 *
 *  Velocidad: Rápida (~10 ms). No necesita conexión a red ni BD.
 * ═══════════════════════════════════════════════════════════════════════
 */
class JwtUtilTest {

    // ── Objeto bajo prueba (SUT: System Under Test) ───────────────────────────
    private JwtUtil jwtUtil;

    // Constantes reutilizadas en todos los tests de esta clase
    private static final String SECRET =
            "kabj-sistema-ot-secret-key-2026-muy-larga-para-seguridad-hs256";
    private static final long   EXPIRATION = 36_000_000L; // 10 horas en milisegundos

    /**
     * @BeforeEach
     * ──────────────────────────────────────────────────────────────────────────
     * Este método se ejecuta ANTES de cada método @Test.
     * Sirve para restablecer el estado del objeto entre pruebas,
     * garantizando que una prueba no contamine a la siguiente.
     *
     * Equivalente en JUnit 4: @Before
     */
    @BeforeEach
    void setUp() {
        // Instanciamos JwtUtil manualmente (sin levantar el contexto de Spring).
        jwtUtil = new JwtUtil();

        // JwtUtil tiene campos @Value (secret, expiration).
        // Como NO usamos Spring aquí, inyectamos los valores con ReflectionTestUtils,
        // que usa reflexión Java para escribir directamente en los campos privados.
        ReflectionTestUtils.setField(jwtUtil, "secret",     SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", EXPIRATION);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @Test
     * ────────────────────────────────────────────────────────────────────────
     * Marca el método como un caso de prueba ejecutable.
     * Si lanza una excepción o algún assert falla → el test queda en ROJO (FAIL).
     * Si termina sin errores → el test queda en VERDE (PASS).
     *
     * @DisplayName: texto descriptivo que aparece en los reportes del IDE.
     */
    @Test
    @DisplayName("generarToken: debe retornar un token JWT no vacío")
    void generarToken_retornaTokenNoVacio() {
        // ARRANGE (preparar) — definimos los datos de entrada
        String username = "supervisor";
        String rol      = "supervisor";

        // ACT (actuar) — ejecutamos el método que queremos probar
        String token = jwtUtil.generateToken(username, rol);

        // ASSERT (verificar) — comprobamos que el resultado sea el esperado
        // assertNotNull: verifica que el valor NO sea null
        assertNotNull(token, "El token no debe ser null");

        // assertFalse: verifica que la condición sea falsa
        assertFalse(token.isBlank(), "El token no debe estar vacío");

        // Un JWT siempre tiene exactamente 2 puntos (header.payload.signature)
        assertEquals(2, token.chars().filter(c -> c == '.').count(),
                "El token debe tener el formato JWT (header.payload.signature)");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("extractUsername: debe extraer el nombre de usuario del token")
    void extraerUsername_retornaUsernameCorrectamente() {
        // ARRANGE
        String usernameEsperado = "capataz1";
        String token = jwtUtil.generateToken(usernameEsperado, "capataz");

        // ACT
        String usernameExtraido = jwtUtil.extractUsername(token);

        // ASSERT
        // assertEquals(esperado, actual): el error mostrará ambos valores si falla
        assertEquals(usernameEsperado, usernameExtraido,
                "El username extraído debe coincidir con el que se usó para generar el token");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("extractRol: debe extraer el rol del claim personalizado del token")
    void extraerRol_retornaRolCorrectamente() {
        // ARRANGE
        String rolEsperado = "admin";
        String token = jwtUtil.generateToken("admin", rolEsperado);

        // ACT
        String rolExtraido = jwtUtil.extractRol(token);

        // ASSERT
        assertEquals(rolEsperado, rolExtraido,
                "El rol extraído debe coincidir con el que se incluyó al generar el token");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("validateToken: un token recién generado debe ser válido (true)")
    void validarToken_tokenValido_retornaTrue() {
        // ARRANGE
        String token = jwtUtil.generateToken("supervisor", "supervisor");

        // ACT
        boolean esValido = jwtUtil.validateToken(token);

        // ASSERT
        // assertTrue: verifica que la condición sea verdadera
        assertTrue(esValido, "Un token recién generado con la clave correcta debe ser válido");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("validateToken: un token con firma adulterada debe ser inválido (false)")
    void validarToken_tokenFalsificado_retornaFalse() {
        // ARRANGE — generamos un token legítimo y luego lo adulteramos
        String tokenLegitimo    = jwtUtil.generateToken("supervisor", "supervisor");
        String tokenFalsificado = tokenLegitimo + "adulterado_xyz";

        // ACT
        boolean esValido = jwtUtil.validateToken(tokenFalsificado);

        // ASSERT
        assertFalse(esValido,
                "Un token con firma adulterada debe ser rechazado como inválido");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("validateToken: una cadena vacía debe ser inválida (false)")
    void validarToken_tokenVacio_retornaFalse() {
        // ARRANGE
        String tokenVacio = "";

        // ACT
        boolean esValido = jwtUtil.validateToken(tokenVacio);

        // ASSERT
        assertFalse(esValido, "Una cadena vacía no es un JWT válido");
    }
}
