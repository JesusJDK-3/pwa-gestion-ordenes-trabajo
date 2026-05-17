package com.kabj.sistema_ot.config;

import com.kabj.sistema_ot.entity.*;
import com.kabj.sistema_ot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Inserta datos iniciales del sistema al primer arranque.
 * Roles: supervisor | capataz | admin
 * Credenciales de prueba: supervisor@ot.com / password123
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RrhhTrabajadorRepository trabajadorRepository;
    private final RrhhCapatazRepository capatazRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedUsuarios();
    }

    private void seedRoles() {
        if (rolRepository.count() > 0) return;
        List.of(
                buildRol("supervisor", "Supervisor",    "Carga OT desde Excel y supervisa el avance del equipo de campo"),
                buildRol("capataz",    "Capataz",       "Registra actividades en campo y llena formularios por punto"),
                buildRol("admin",      "Administrador", "Acceso total: reportes, auditoría y gestión del sistema")
        ).forEach(rolRepository::save);
        log.info("Roles creados.");
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) return;
        String hash = passwordEncoder.encode("password123");

        Rol supervisor = rolRepository.findByCodigo("supervisor").orElseThrow();
        Rol capataz    = rolRepository.findByCodigo("capataz").orElseThrow();
        Rol admin      = rolRepository.findByCodigo("admin").orElseThrow();

        Usuario uSupervisor = buildUsuario("supervisor", "supervisor@ot.com", hash, "Carlos",  "Mendoza", supervisor);
        Usuario uCapataz1   = buildUsuario("capataz1",   "capataz1@ot.com",   hash, "Juan",    "Quispe",  capataz);
        Usuario uCapataz2   = buildUsuario("capataz2",   "capataz2@ot.com",   hash, "Pedro",   "Flores",  capataz);
        Usuario uAdmin      = buildUsuario("admin",      "admin@ot.com",      hash, "Admin",   "Sistema", admin);

        usuarioRepository.saveAll(List.of(uSupervisor, uCapataz1, uCapataz2, uAdmin));
        log.warn("Usuarios de prueba creados. Password para todos: password123 — cámbialo en producción.");

        // Create trabajadores and capataces for field users
        if (trabajadorRepository.count() == 0) {
            RrhhTrabajador t1 = buildTrabajador("12345678", "Juan",  "Quispe",  "Capataz de Campo");
            RrhhTrabajador t2 = buildTrabajador("87654321", "Pedro", "Flores",  "Capataz de Campo");
            trabajadorRepository.saveAll(List.of(t1, t2));

            // Re-fetch saved users
            Usuario cap1 = usuarioRepository.findByEmail("capataz1@ot.com").orElseThrow();
            Usuario cap2 = usuarioRepository.findByEmail("capataz2@ot.com").orElseThrow();

            capatazRepository.save(buildCapataz(cap1, t1, "CAP-001"));
            capatazRepository.save(buildCapataz(cap2, t2, "CAP-002"));
            log.info("Trabajadores y capataces creados.");
        }
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

    private RrhhTrabajador buildTrabajador(String dni, String nombres, String apellidos, String cargo) {
        RrhhTrabajador t = new RrhhTrabajador();
        t.setDni(dni);
        t.setNombres(nombres);
        t.setApellidos(apellidos);
        t.setCargo(cargo);
        t.setActivo(true);
        return t;
    }

    private RrhhCapataz buildCapataz(Usuario usuario, RrhhTrabajador trabajador, String codigo) {
        RrhhCapataz c = new RrhhCapataz();
        c.setUsuario(usuario);
        c.setTrabajador(trabajador);
        c.setCodigoCapataz(codigo);
        c.setActivo(true);
        return c;
    }
}
