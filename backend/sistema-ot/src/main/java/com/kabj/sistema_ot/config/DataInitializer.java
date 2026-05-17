package com.kabj.sistema_ot.config;

import com.kabj.sistema_ot.entity.*;
import com.kabj.sistema_ot.entity.enums.EstadoOrden;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Inserta roles, usuarios de prueba y datos iniciales de OT al primer arranque.
 * Credenciales de prueba: supervisor@ot.com / password123
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrdenTrabajoRepository ordenRepo;
    private final PuntoTrabajoRepository puntoRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedUsuarios();
        seedOrdenesYPuntos();
    }

    private void seedRoles() {
        if (rolRepository.count() > 0) return;
        List.of(
                buildRol("SUPERVISOR",    "Supervisor",    "Gestiona y valida órdenes de trabajo"),
                buildRol("CAPATAZ",       "Capataz",       "Ejecuta órdenes de trabajo en campo"),
                buildRol("ADMINISTRADOR", "Administrador", "Administración del sistema")
        ).forEach(rolRepository::save);
        log.info("Roles creados.");
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) return;
        String hash = passwordEncoder.encode("password123");

        Rol supervisor    = rolRepository.findByCodigo("SUPERVISOR").orElseThrow();
        Rol capataz       = rolRepository.findByCodigo("CAPATAZ").orElseThrow();
        Rol administrador = rolRepository.findByCodigo("ADMINISTRADOR").orElseThrow();

        List.of(
                buildUsuario("supervisor",  "supervisor@ot.com",  hash, "Carlos",   "Mendoza",  supervisor),
                buildUsuario("capataz1",    "capataz1@ot.com",    hash, "Juan",     "Quispe",   capataz),
                buildUsuario("capataz2",    "capataz2@ot.com",    hash, "Pedro",    "Flores",   capataz),
                buildUsuario("admin",       "admin@ot.com",       hash, "Admin",    "Sistema",  administrador)
        ).forEach(usuarioRepository::save);
        log.warn("Usuarios de prueba creados. Password para todos: password123 — cámbialo en producción.");
    }

    private void seedOrdenesYPuntos() {
        if (ordenRepo.count() > 0) return;
        Usuario supervisor = usuarioRepository.findByEmail("supervisor@ot.com").orElseThrow();
        Usuario cap1       = usuarioRepository.findByEmail("capataz1@ot.com").orElseThrow();
        Usuario cap2       = usuarioRepository.findByEmail("capataz2@ot.com").orElseThrow();

        OrdenTrabajo ot1 = new OrdenTrabajo();
        ot1.setCodigoOt("OT-2026-001");
        ot1.setDescripcion("Mantenimiento red agua potable - Zona Norte Lima");
        ot1.setFechaCarga(LocalDate.of(2026, 5, 15));
        ot1.setSupervisor(supervisor);
        ot1.setEstado(EstadoOrden.ACTIVA);
        ordenRepo.save(ot1);

        OrdenTrabajo ot2 = new OrdenTrabajo();
        ot2.setCodigoOt("OT-2026-002");
        ot2.setDescripcion("Reparación alcantarillado - San Juan de Lurigancho");
        ot2.setFechaCarga(LocalDate.of(2026, 5, 15));
        ot2.setSupervisor(supervisor);
        ot2.setEstado(EstadoOrden.ACTIVA);
        ordenRepo.save(ot2);

        List.of(
                buildPunto(ot1, -12.0464, -77.0428, "Revisión válvula principal",    "Jr. Huallaga 450, Lima",       EstadoPunto.PENDIENTE,   cap1),
                buildPunto(ot1, -12.0531, -77.0282, "Cambio de tubería tramo A",     "Av. Abancay 320, Lima",        EstadoPunto.EN_PROGRESO, cap1),
                buildPunto(ot1, -12.0612, -77.0369, "Inspección medidor sector 3",   "Jr. Camaná 890, Lima",         EstadoPunto.PENDIENTE,   cap2),
                buildPunto(ot2, -11.9875, -77.0025, "Limpieza buzón BZ-12",          "Av. Próceres 1200, SJL",       EstadoPunto.PENDIENTE,   cap1),
                buildPunto(ot2, -11.9932, -77.0148, "Reparación colector principal", "Jr. Las Flores 560, SJL",      EstadoPunto.COMPLETADO,  cap2)
        ).forEach(puntoRepo::save);
        log.info("Datos de prueba de OT creados.");
    }

    private Rol buildRol(String codigo, String nombre, String descripcion) {
        Rol rol = new Rol();
        rol.setCodigo(codigo);
        rol.setNombre(nombre);
        rol.setDescripcion(descripcion);
        rol.setActivo(true);
        return rol;
    }

    private Usuario buildUsuario(String username, String email, String hash,
                                  String nombres, String apellidos, Rol rol) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(hash);
        u.setNombres(nombres);
        u.setApellidos(apellidos);
        u.setRol(rol);
        u.setActivo(true);
        return u;
    }

    private PuntoTrabajo buildPunto(OrdenTrabajo orden, double lat, double lon,
                                     String descripcion, String direccion,
                                     EstadoPunto estado, Usuario capataz) {
        PuntoTrabajo p = new PuntoTrabajo();
        p.setOrden(orden);
        p.setLatitud(BigDecimal.valueOf(lat));
        p.setLongitud(BigDecimal.valueOf(lon));
        p.setDescripcion(descripcion);
        p.setDireccion(direccion);
        p.setEstado(estado);
        p.setCapataz(capataz);
        return p;
    }
}
