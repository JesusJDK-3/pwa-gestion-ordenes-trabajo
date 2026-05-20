package com.kabj.sistema_ot;

// ─────────────────────────────────────────────────────────────────────────────
// @SpringBootTest: levanta el contexto completo de la aplicación para pruebas.
// Es la prueba de integración más completa pero también la más lenta,
// porque carga todos los beans, la BD, la seguridad, etc.
//
// Para evitar conectarse a PostgreSQL en CI o en clase, usamos:
//   spring.datasource.url  con H2 en application-test.properties (profile "test")
// ─────────────────────────────────────────────────────────────────────────────
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PRUEBA DE CARGA DEL CONTEXTO — SistemaOtApplication
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  @SpringBootTest: indica que se debe levantar el ApplicationContext completo.
 *  Si algún bean está mal configurado (clase no encontrada, dependencia circular,
 *  propiedad faltante, etc.), este test fallará inmediatamente.
 *
 *  @TestPropertySource(properties = {...}): inyecta propiedades directamente
 *  con la mayor prioridad. Reemplaza el datasource PostgreSQL por H2 (en memoria)
 *  para que el test funcione sin servidor de base de datos.
 *
 *  H2 en modo PostgreSQL imita la sintaxis SQL de PostgreSQL,
 *  lo que permite que las mismas entidades JPA funcionen en pruebas.
 *
 *  Este test es el "smoke test" mínimo del proyecto:
 *  si pasa, la aplicación puede al menos iniciar correctamente.
 * ═══════════════════════════════════════════════════════════════════════
 */
@SpringBootTest
@TestPropertySource(properties = {
        /* Reemplaza PostgreSQL por H2 en memoria para no necesitar servidor */
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        /* create-drop: crea tablas al arrancar el contexto y las borra al cerrarlo */
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        /* Evita advertencias de dialecto explícito */
        "spring.jpa.properties.hibernate.hbm2ddl.auto=create-drop"
})
class SistemaOtApplicationTests {

    /**
     * contextLoads
     * ────────────────────────────────────────────────────────────────────────
     * JUnit 5 ejecuta este test y si NO lanza excepción = VERDE.
     * Spring Boot levanta el ApplicationContext al ejecutar @SpringBootTest;
     * si algo falla en la configuración (beans, propiedades, SQL), se detecta aquí.
     */
    @Test
    @DisplayName("contextLoads: el contexto de Spring debe cargarse sin errores")
    void contextLoads() {
        // Si llegamos hasta aquí sin excepción, el contexto cargó correctamente.
        // assertTrue(true) es explícito para que el resultado sea visible en el reporte.
        assertTrue(true, "El contexto de Spring Boot se cargó exitosamente");
    }
}

