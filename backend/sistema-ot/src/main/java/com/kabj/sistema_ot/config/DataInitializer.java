package com.kabj.sistema_ot.config;

import com.kabj.sistema_ot.entity.*;
import com.kabj.sistema_ot.repository.CatSubactividadRepository;
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
    private final CatSubactividadRepository subactividadRepository;
    private final CatTipoPuntoOperativoRepository tipoPuntoRepository;
    private final CatEstadoOtRepository estadoOtRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedUsuarios();
        seedSubactividades();
        seedTiposPunto();
        seedEstadosOt();
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

        if (trabajadorRepository.count() == 0) {
            RrhhTrabajador t1 = buildTrabajador("12345678", "Juan",  "Quispe",  "Capataz de Campo");
            RrhhTrabajador t2 = buildTrabajador("87654321", "Pedro", "Flores",  "Capataz de Campo");
            trabajadorRepository.saveAll(List.of(t1, t2));

            Usuario cap1 = usuarioRepository.findByEmail("capataz1@ot.com").orElseThrow();
            Usuario cap2 = usuarioRepository.findByEmail("capataz2@ot.com").orElseThrow();

            capatazRepository.save(buildCapataz(cap1, t1, "CAP-001"));
            capatazRepository.save(buildCapataz(cap2, t2, "CAP-002"));
            log.info("Trabajadores y capataces creados.");
        }
    }

    private void seedSubactividades() {
        if (subactividadRepository.count() > 0) return;
        java.util.List<String[]> subacts = java.util.List.of(
            new String[]{"A1.37",   "A1.37 - PURGA DE REDES SECUNDARIAS - GCI"},
            new String[]{"C.3",   "C.3 - MANTENIMIENTO PREVENTIVO DE VALVULAS DE PURGA DE AIRE HASTA 315 MM"},
            new String[]{"C.14",   "C.14 - COLOCACION DE VALVULA DE PURGA DE AIRE HASTA 315 MM"},
            new String[]{"C.15",  "C.15 - CAMBIO DE VALVULA PURGA DE AIRE HASTA 315 MM"},
            new String[]{"C.20",  "C.20 - CAMBIO DE HIDRANTE"},
            new String[]{"C.25",  "C.25 - COLOCACION  O CAMBIO DE MARCO Y TAPA PARA VALVULAS"},
            new String[]{"A1.31",   "A1.31 - INSTALACION O CAMBIO DE MARCO Y TAPA DE HIERRO FUNDIDO P CAMARAS, CISTERNAS YO RESERVORIOS"},
            new String[]{"ACT C",   "ACT C  - MANTENIMIENTO CORRECTIVO DE VALVULAS (HASTA  315MM) E HIDRANTES"},
            new String[]{"ACT A1", "ACT A1 - MANTENIMIENTO CORRECTIVO DE REDES DE AGUA POTABLE (HASTA   315MM)"},
            new String[]{"OTRO",       "Otro trabajo"}
        );
        for (String[] s : subacts) {
            CatSubactividad sub = new CatSubactividad();
            sub.setCodigo(s[0]);
            sub.setNombre(s[1]);
            sub.setActivo(true);
            subactividadRepository.save(sub);
        }
        log.info("Subactividades sembradas.");
    }

    private void seedTiposPunto() {
        if (tipoPuntoRepository.count() > 0) return;
        java.util.List<String[]> tipos = java.util.List.of(
            new String[]{"VCA",   "Válvula / Cámara de Agua"},
            new String[]{"HIA",   "Hidrante"},
            new String[]{"CIVIL", "Obra Civil General"}
        );
        for (String[] t : tipos) {
            CatTipoPuntoOperativo tipo = new CatTipoPuntoOperativo();
            tipo.setCodigo(t[0]);
            tipo.setNombre(t[1]);
            tipo.setActivo(true);
            tipoPuntoRepository.save(tipo);
        }
        log.info("Tipos de punto sembrados.");
    }

    private void seedEstadosOt() {
        if (estadoOtRepository.count() > 0) return;
        java.util.List<Object[]> estados = java.util.List.of(
            new Object[]{"PENDIENTE",   "Pendiente",   "OT pendiente de ejecución",  false, 1},
            new Object[]{"EN_PROGRESO", "En Progreso", "OT en ejecución",            false, 2},
            new Object[]{"COMPLETADA",  "Completada",  "OT ejecutada correctamente", true,  3},
            new Object[]{"OBSERVADA",   "Observada",   "OT con observaciones",       false, 4},
            new Object[]{"ANULADA",     "Anulada",     "OT anulada",                 true,  5}
        );
        for (Object[] e : estados) {
            CatEstadoOt estado = new CatEstadoOt();
            estado.setCodigo((String)  e[0]);
            estado.setNombre((String)  e[1]);
            estado.setDescripcion((String) e[2]);
            estado.setEsFinal((Boolean) e[3]);
            estado.setOrden((Integer)  e[4]);
            estado.setActivo(true);
            estadoOtRepository.save(estado);
        }
        log.info("Estados de OT sembrados.");
    }

    // ── builders ──────────────────────────────────────────────────────────────

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