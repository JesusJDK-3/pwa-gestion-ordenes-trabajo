package com.kabj.sistema_ot.service;

// ─────────────────────────────────────────────────────────────────────────────
// MOCKITO — librería de "dobles de prueba" (test doubles)
// Permite reemplazar dependencias reales por objetos simulados (mocks),
// controlando qué devuelven sin necesitar una base de datos real.
// ─────────────────────────────────────────────────────────────────────────────
import com.kabj.sistema_ot.dto.LoginRequest;
import com.kabj.sistema_ot.dto.LoginResponse;
import com.kabj.sistema_ot.entity.Rol;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import com.kabj.sistema_ot.security.JwtUtil;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;   // Integra extensiones con JUnit 5

import org.mockito.InjectMocks;  // Inyecta los @Mock en el objeto bajo prueba
import org.mockito.Mock;         // Declara un objeto simulado (mock)
import org.mockito.junit.jupiter.MockitoExtension; // Extensión que activa Mockito para JUnit 5

import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString; // Matcher para cualquier String
import static org.mockito.Mockito.*;                  // when(), verify(), never(), etc.

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PRUEBA UNITARIA CON MOCKITO — AuthService
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tipo: Unitaria (no levanta Spring, no necesita BD)
 *  Clase bajo prueba: {@link AuthService}
 *
 *  Patrón de prueba usado: AAA (Arrange / Act / Assert)
 *    ✦ Arrange  → preparar los datos y configurar los mocks
 *    ✦ Act      → llamar al método que queremos probar
 *    ✦ Assert   → verificar que el resultado sea el correcto
 *
 *  ¿Qué valida?
 *  - Login exitoso con credenciales correctas.
 *  - Error cuando el email no existe en la BD.
 *  - Error cuando la contraseña es incorrecta.
 *  - Error cuando el usuario está inactivo.
 * ═══════════════════════════════════════════════════════════════════════
 */
@ExtendWith(MockitoExtension.class)
/*
 * @ExtendWith(MockitoExtension.class)
 * ────────────────────────────────────────────────────────────────────────────
 * Activa la integración de Mockito con JUnit 5.
 * Es el reemplazo moderno de @RunWith(MockitoJUnitRunner.class) de JUnit 4.
 * Se encarga de:
 *  1. Inicializar los @Mock y @InjectMocks antes de cada test.
 *  2. Verificar que no queden interacciones no verificadas con los mocks.
 */
class AuthServiceTest {

    // ── Mocks de las dependencias de AuthService ──────────────────────────────

    /**
     * @Mock
     * ────────────────────────────────────────────────────────────────────────
     * Crea un objeto simulado (mock) de la interfaz UsuarioRepository.
     * Por defecto, sus métodos devuelven valores vacíos (null, Optional.empty(), etc.)
     * hasta que los configuramos con when(...).thenReturn(...).
     */
    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    /**
     * @InjectMocks
     * ────────────────────────────────────────────────────────────────────────
     * Crea una instancia real de AuthService e inyecta automáticamente
     * todos los campos marcados con @Mock en esta clase de prueba.
     * Simula lo que haría Spring con @Autowired / @RequiredArgsConstructor.
     */
    @InjectMocks
    private AuthService authService;

    // ── Objetos de datos reutilizados entre tests ─────────────────────────────
    private Usuario usuarioActivo;
    private LoginRequest loginValido;

    @BeforeEach
    void setUp() {
        // Construimos un usuario de ejemplo que simula estar en la base de datos
        Rol rolSupervisor = new Rol();
        rolSupervisor.setCodigo("supervisor");
        rolSupervisor.setNombre("Supervisor");

        usuarioActivo = new Usuario();
        usuarioActivo.setIdUsuario(1L);
        usuarioActivo.setUsername("supervisor");
        usuarioActivo.setEmail("supervisor@ot.com");
        usuarioActivo.setNombres("Carlos");
        usuarioActivo.setApellidos("Mendoza");
        usuarioActivo.setPasswordHash("$2a$10$hashBCrypt...");  // hash simulado
        usuarioActivo.setActivo(true);
        usuarioActivo.setRol(rolSupervisor);

        // LoginRequest con datos correctos
        loginValido = new LoginRequest();
        loginValido.setEmail("supervisor@ot.com");
        loginValido.setPassword("password123");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1 — Camino feliz: login exitoso
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: credenciales correctas deben retornar LoginResponse con token y rol")
    void login_credencialesCorrectas_retornaLoginResponse() {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // when(mock.metodo(args)).thenReturn(valor)
        // Configura el comportamiento del mock: "cuando se llame a findByEmail
        // con ese email, devuelve el usuario de prueba".
        when(usuarioRepository.findByEmail("supervisor@ot.com"))
                .thenReturn(Optional.of(usuarioActivo));

        // Simula que BCrypt confirma que la contraseña es correcta
        when(passwordEncoder.matches("password123", usuarioActivo.getPasswordHash()))
                .thenReturn(true);

        // Simula la generación del token JWT
        when(jwtUtil.generateToken("supervisor", "supervisor"))
                .thenReturn("token.jwt.simulado");

        // Simula que save() devuelve el mismo usuario (no interesa el retorno)
        when(usuarioRepository.save(any(Usuario.class)))
                .thenReturn(usuarioActivo);

        // ── ACT ───────────────────────────────────────────────────────────────
        LoginResponse respuesta = authService.login(loginValido);

        // ── ASSERT ────────────────────────────────────────────────────────────
        assertNotNull(respuesta, "La respuesta no debe ser null");
        assertEquals("token.jwt.simulado", respuesta.getToken(),
                "El token debe coincidir con el generado por JwtUtil");
        assertEquals("supervisor", respuesta.getRol(),
                "El rol debe ser 'supervisor'");
        assertEquals("Carlos Mendoza", respuesta.getNombre(),
                "El nombre debe ser nombres + apellidos");
        assertEquals("supervisor@ot.com", respuesta.getEmail(),
                "El email debe coincidir");

        // verify() comprueba que el mock fue llamado exactamente N veces
        verify(usuarioRepository, times(1)).findByEmail("supervisor@ot.com");
        verify(jwtUtil, times(1)).generateToken("supervisor", "supervisor");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2 — Email no registrado
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: email inexistente debe lanzar AuthException con mensaje genérico")
    void login_emailNoExistente_lanzaAuthException() {
        // ARRANGE — el repositorio simula no encontrar ningún usuario
        when(usuarioRepository.findByEmail(anyString()))
                .thenReturn(Optional.empty());

        // ACT + ASSERT combinados con assertThrows
        // assertThrows(excepcionEsperada, lambda): pasa si la lambda lanza ESA excepción.
        // Si NO lanza excepción (o lanza otra), el test falla.
        AuthException excepcion = assertThrows(
                AuthException.class,
                () -> authService.login(loginValido),
                "Debe lanzar AuthException cuando el email no existe"
        );

        // Verificamos también el mensaje de la excepción
        assertEquals("Credenciales incorrectas", excepcion.getMessage(),
                "El mensaje debe ser genérico por seguridad (no revelar si el email existe)");

        // verify(mock, never()): confirma que passwordEncoder NUNCA fue invocado
        // (correcto: si el usuario no existe, no debemos verificar la contraseña)
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3 — Contraseña incorrecta
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: contraseña incorrecta debe lanzar AuthException")
    void login_passwordIncorrecta_lanzaAuthException() {
        // ARRANGE
        when(usuarioRepository.findByEmail("supervisor@ot.com"))
                .thenReturn(Optional.of(usuarioActivo));

        // BCrypt dice que la contraseña NO coincide
        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(false);

        // ACT + ASSERT
        AuthException excepcion = assertThrows(
                AuthException.class,
                () -> authService.login(loginValido)
        );

        assertEquals("Credenciales incorrectas", excepcion.getMessage());

        // Si la contraseña falla, NO se debe generar token
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4 — Usuario inactivo
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: usuario inactivo debe lanzar AuthException con mensaje específico")
    void login_usuarioInactivo_lanzaAuthException() {
        // ARRANGE — misma entidad pero marcada como inactiva
        usuarioActivo.setActivo(false);
        when(usuarioRepository.findByEmail("supervisor@ot.com"))
                .thenReturn(Optional.of(usuarioActivo));

        // ACT + ASSERT
        AuthException excepcion = assertThrows(
                AuthException.class,
                () -> authService.login(loginValido),
                "Un usuario inactivo no debe poder autenticarse"
        );

        assertTrue(excepcion.getMessage().contains("inactivo"),
                "El mensaje debe indicar que el usuario está inactivo");

        // Si el usuario está inactivo, la contraseña no debe verificarse
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
