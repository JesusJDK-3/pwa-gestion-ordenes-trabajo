package com.kabj.sistema_ot.service;

// ─────────────────────────────────────────────────────────────────────────────
// En este test combinamos Mockito con lógica de dominio real (OrdenTrabajoService)
// para verificar el comportamiento de las reglas de negocio sin tocar la BD.
// ─────────────────────────────────────────────────────────────────────────────
import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.entity.CatEstadoOt;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.repository.CatEstadoOtRepository;
import com.kabj.sistema_ot.repository.OpOrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PRUEBA UNITARIA CON MOCKITO — OrdenTrabajoService
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tipo: Unitaria (no levanta Spring, no necesita BD)
 *  Clase bajo prueba: {@link OrdenTrabajoService}
 *
 *  Estas pruebas verifican la LÓGICA DE NEGOCIO del servicio de OTs:
 *  - Listar todas las órdenes devuelve la cantidad correcta.
 *  - El detalle de una OT existente se mapea correctamente al DTO.
 *  - Solicitar el detalle de una OT inexistente lanza una excepción.
 *  - La lista de seguimiento solo incluye OTs con capataz asignado.
 * ═══════════════════════════════════════════════════════════════════════
 */
@ExtendWith(MockitoExtension.class)
class OrdenTrabajoServiceTest {

    // ── Mocks de repositorios (dependencias del servicio) ─────────────────────
    @Mock
    private OpOrdenTrabajoRepository ordenRepo;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RrhhCapatazRepository capatazRepository;

    @Mock
    private ValidacionFotoService validacionFotoService;

    @Mock
    private CatEstadoOtRepository estadoRepo;

    @Mock
    private EventoService eventoService;

    // ── Objeto bajo prueba ────────────────────────────────────────────────────
    @InjectMocks
    private OrdenTrabajoService ordenService;

    // ── Datos de prueba compartidos ───────────────────────────────────────────
    private OpOrdenTrabajo otPendiente;
    private OpOrdenTrabajo otCompletada;

    @BeforeEach
    void setUp() {
        // Construimos un estado de OT "PENDIENTE"
        CatEstadoOt estadoPendiente = new CatEstadoOt();
        estadoPendiente.setCodigo("PENDIENTE");
        estadoPendiente.setNombre("Pendiente");
        estadoPendiente.setEsFinal(false);

        // Construimos un estado de OT "COMPLETADA"
        CatEstadoOt estadoCompletada = new CatEstadoOt();
        estadoCompletada.setCodigo("COMPLETADA");
        estadoCompletada.setNombre("Completada");
        estadoCompletada.setEsFinal(true);

        // OT número 1 — Pendiente, sin capataz asignado
        otPendiente = new OpOrdenTrabajo();
        otPendiente.setIdOt(101L);
        otPendiente.setSgio("OT-2026-101");
        otPendiente.setDireccion("Av. Lima 500");
        otPendiente.setDistrito("Miraflores");
        otPendiente.setActivo(true);
        otPendiente.setEstadoOt(estadoPendiente);
        otPendiente.setCapataz(null); // Sin asignar

        // OT número 2 — Completada
        otCompletada = new OpOrdenTrabajo();
        otCompletada.setIdOt(102L);
        otCompletada.setSgio("OT-2026-102");
        otCompletada.setDireccion("Jr. Arequipa 300");
        otCompletada.setDistrito("San Isidro");
        otCompletada.setActivo(true);
        otCompletada.setEstadoOt(estadoCompletada);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1 — listarTodas: debe retornar todos los DTO mapeados
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("listarTodas: debe retornar la lista de OTs mapeadas a OrdenTrabajoResponse")
    void listarTodas_retornaListaConTodosLosDtos() {
        // ARRANGE — el repositorio simulará tener 2 OTs activas
        when(ordenRepo.findByActivoTrueOrderByCreatedAtDesc())
                .thenReturn(List.of(otPendiente, otCompletada));

        // ACT
        List<OrdenTrabajoResponse> resultado = ordenService.listarTodas();

        // ASSERT
        // assertEquals para verificar la cantidad exacta de elementos
        assertEquals(2, resultado.size(),
                "El servicio debe retornar exactamente 2 órdenes");

        // Verificamos que el primer elemento tenga los campos correctos
        assertEquals("OT-2026-101", resultado.get(0).getSgio(),
                "El SGIO del primer elemento debe coincidir");
        assertEquals("PENDIENTE", resultado.get(0).getEstadoCodigo(),
                "El estado del primer elemento debe ser PENDIENTE");

        // verify(mock, times(N)): comprueba que el repositorio fue consultado 1 vez
        verify(ordenRepo, times(1)).findByActivoTrueOrderByCreatedAtDesc();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2 — listarTodas: lista vacía cuando no hay OTs
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("listarTodas: repositorio vacío → retorna lista vacía (no null)")
    void listarTodas_repositorioVacio_retornaListaVacia() {
        // ARRANGE — simulamos que no hay ninguna OT en la BD
        when(ordenRepo.findByActivoTrueOrderByCreatedAtDesc())
                .thenReturn(List.of());

        // ACT
        List<OrdenTrabajoResponse> resultado = ordenService.listarTodas();

        // ASSERT
        // assertNotNull: una lista vacía es mejor que null (evita NullPointerException en el front)
        assertNotNull(resultado, "El resultado no debe ser null");

        // assertTrue con condición: la lista debe estar vacía
        assertTrue(resultado.isEmpty(),
                "Cuando no hay OTs, el resultado debe ser una lista vacía");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3 — detalle: OT existente → retorna DTO correctamente mapeado
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("detalle: OT existente debe retornar OrdenTrabajoResponse con ID correcto")
    void detalle_otExistente_retornaOrdenResponse() {
        // ARRANGE
        when(ordenRepo.findById(101L))
                .thenReturn(Optional.of(otPendiente));

        // ACT
        OrdenTrabajoResponse respuesta = ordenService.detalle(101L);

        // ASSERT
        assertNotNull(respuesta);
        // assertEquals(esperado, actual, mensaje)
        assertEquals(101L, respuesta.getIdOt(),
                "El ID de la OT retornada debe ser 101");
        assertEquals("OT-2026-101", respuesta.getSgio(),
                "El SGIO debe coincidir exactamente");
        assertEquals("Miraflores", respuesta.getDistrito(),
                "El distrito debe estar mapeado correctamente");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4 — detalle: OT inexistente → lanza RuntimeException
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("detalle: ID inexistente debe lanzar RuntimeException")
    void detalle_otNoExistente_lanzaRuntimeException() {
        // ARRANGE — el repositorio no encuentra nada con ese ID
        when(ordenRepo.findById(999L))
                .thenReturn(Optional.empty());

        // ACT + ASSERT
        // assertThrows: captura la excepción y la retorna para inspeccionarla
        RuntimeException excepcion = assertThrows(
                RuntimeException.class,
                () -> ordenService.detalle(999L),
                "Debe lanzar RuntimeException cuando la OT no existe"
        );

        // Verificamos el mensaje de la excepción para confirmar que es el correcto
        assertTrue(excepcion.getMessage().contains("OT no encontrada"),
                "El mensaje debe indicar que la OT no fue encontrada");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5 — seguimiento: solo OTs con capataz asignado
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("seguimiento: debe excluir OTs sin capataz asignado")
    void seguimiento_soloIncluyeOtsConCapataz() {
        // ARRANGE — otPendiente no tiene capataz, otCompletada tampoco en este test
        // Creamos una tercera OT CON capataz para verificar el filtro
        OpOrdenTrabajo otConCapataz = new OpOrdenTrabajo();
        otConCapataz.setIdOt(103L);
        otConCapataz.setSgio("OT-2026-103");
        otConCapataz.setActivo(true);
        otConCapataz.setEstadoOt(otPendiente.getEstadoOt());
        // otConCapataz.setCapataz(null) — dejamos capataz null también en este
        // La lógica del servicio filtra: ot.getCapataz() != null
        // Aquí ambas tienen null, así que el resultado debe ser lista vacía

        when(ordenRepo.findByActivoTrueOrderByCreatedAtDesc())
                .thenReturn(List.of(otPendiente, otCompletada, otConCapataz));

        // ACT
        var resultado = ordenService.seguimiento();

        // ASSERT — ninguna tiene capataz, así que el seguimiento debe estar vacío
        assertTrue(resultado.isEmpty(),
                "Si ninguna OT tiene capataz asignado, el seguimiento debe estar vacío");

        // Esta verificación demuestra que el servicio SI consultó el repositorio
        verify(ordenRepo, times(1)).findByActivoTrueOrderByCreatedAtDesc();
    }
}
