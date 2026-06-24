package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.Rol;
import com.kabj.sistema_ot.entity.RrhhCapataz;
import com.kabj.sistema_ot.entity.RrhhTrabajador;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.RolRepository;
import com.kabj.sistema_ot.repository.RrhhCapatazRepository;
import com.kabj.sistema_ot.repository.RrhhTrabajadorRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Alta y consulta de capataces en RRHH + tabla de usuarios.
 * <p>
 * {@link #registrarCapataz} crea en una transacción: {@link RrhhTrabajador},
 * {@link RrhhCapataz} y {@link Usuario} con rol capataz.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class CapatazService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final RrhhTrabajadorRepository trabajadorRepository;
    private final RrhhCapatazRepository capatazRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarActivos() {
        List<Map<String, Object>> lista = new ArrayList<>();
        for (RrhhCapataz cap : capatazRepository.findAll()) {
            if (!Boolean.TRUE.equals(cap.getActivo())) continue;
            Usuario u = cap.getUsuario();
            RrhhTrabajador t = cap.getTrabajador();
            if (u == null || !Boolean.TRUE.equals(u.getActivo())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", cap.getIdCapataz());
            m.put("usuarioId", u.getIdUsuario());
            m.put("nombre", u.getNombres() + " " + u.getApellidos());
            m.put("email", u.getEmail());
            m.put("username", u.getUsername());
            m.put("dni", t != null ? t.getDni() : "");
            m.put("codigoCapataz", cap.getCodigoCapataz());
            m.put("rol", "capataz");
            lista.add(m);
        }
        lista.sort((a, b) -> String.valueOf(a.get("nombre")).compareToIgnoreCase(String.valueOf(b.get("nombre"))));
        return lista;
    }

    @Transactional
    public Map<String, Object> registrar(String email, String username, String nombres, String apellidos,
                                         String dni, String password) {
        String emailNorm = normalizar(email);
        String userNorm = normalizar(username);
        String dniNorm = normalizar(dni);
        String nomNorm = normalizar(nombres);
        String apeNorm = normalizar(apellidos);

        validarUsuarioBasico(emailNorm, userNorm, nomNorm, apeNorm, password);

        Rol rolCapataz = rolRepository.findByCodigo("capataz")
                .orElseThrow(() -> new IllegalArgumentException("El rol capataz no está configurado en el sistema."));

        RrhhTrabajador trabajador = trabajadorRepository.findByDni(dniNorm).orElseGet(() -> {
            RrhhTrabajador t = new RrhhTrabajador();
            t.setDni(dniNorm);
            t.setNombres(nomNorm);
            t.setApellidos(apeNorm);
            t.setCargo("Capataz de Campo");
            t.setActivo(true);
            return trabajadorRepository.save(t);
        });

        if (capatazRepository.findByTrabajador_IdTrabajador(trabajador.getIdTrabajador()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un capataz registrado con ese DNI.");
        }

        if (!nomNorm.equalsIgnoreCase(trabajador.getNombres()) || !apeNorm.equalsIgnoreCase(trabajador.getApellidos())) {
            trabajador.setNombres(nomNorm);
            trabajador.setApellidos(apeNorm);
            trabajador.setUpdatedAt(LocalDateTime.now());
            trabajadorRepository.save(trabajador);
        }

        Usuario usuario = crearUsuario(emailNorm, userNorm, nomNorm, apeNorm, password, rolCapataz);

        String codigo = "CAP-" + String.format("%03d", capatazRepository.count() + 1);
        while (capatazRepository.findByCodigoCapataz(codigo).isPresent()) {
            codigo = "CAP-" + System.currentTimeMillis() % 100000;
        }

        RrhhCapataz capataz = new RrhhCapataz();
        capataz.setUsuario(usuario);
        capataz.setTrabajador(trabajador);
        capataz.setCodigoCapataz(codigo);
        capataz.setActivo(true);
        capataz = capatazRepository.save(capataz);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", capataz.getIdCapataz());
        res.put("usuarioId", usuario.getIdUsuario());
        res.put("nombre", usuario.getNombres() + " " + usuario.getApellidos());
        res.put("email", usuario.getEmail());
        res.put("username", usuario.getUsername());
        res.put("dni", trabajador.getDni());
        res.put("codigoCapataz", capataz.getCodigoCapataz());
        return res;
    }

    @Transactional
    public void inactivarCapataz(Long idCapataz) {
        RrhhCapataz capataz = capatazRepository.findById(idCapataz)
                .orElseThrow(() -> new IllegalArgumentException("Capataz no encontrado."));
        capataz.setActivo(false);
        if (capataz.getUsuario() != null) {
            Usuario usuario = capataz.getUsuario();
            usuario.setActivo(false);
            usuarioRepository.save(usuario);
        }
        capatazRepository.save(capataz);
    }

    @Transactional
    public Map<String, Object> registrarSupervisor(String email, String username, String nombres,
                                                    String apellidos, String password) {
        String emailNorm = normalizar(email);
        String userNorm = normalizar(username);
        String nomNorm = normalizar(nombres);
        String apeNorm = normalizar(apellidos);

        validarUsuarioBasico(emailNorm, userNorm, nomNorm, apeNorm, password);

        Rol rolSupervisor = rolRepository.findByCodigo("supervisor")
                .orElseThrow(() -> new IllegalArgumentException("El rol supervisor no está configurado en el sistema."));

        Usuario usuario = crearUsuario(emailNorm, userNorm, nomNorm, apeNorm, password, rolSupervisor);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", usuario.getIdUsuario());
        res.put("usuarioId", usuario.getIdUsuario());
        res.put("nombre", usuario.getNombres() + " " + usuario.getApellidos());
        res.put("email", usuario.getEmail());
        res.put("username", usuario.getUsername());
        res.put("rol", "supervisor");
        return res;
    }

    private void validarUsuarioBasico(String emailNorm, String userNorm, String nomNorm,
                                      String apeNorm, String password) {
        if (emailNorm.isEmpty() || userNorm.isEmpty() || nomNorm.isEmpty() || apeNorm.isEmpty()) {
            throw new IllegalArgumentException("Email, usuario, nombres y apellidos son obligatorios.");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("La contraseña inicial debe tener al menos 8 caracteres.");
        }
        if (usuarioRepository.findByEmail(emailNorm).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email.");
        }
        if (usuarioRepository.findByUsername(userNorm).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con ese nombre de usuario.");
        }
    }

    private Usuario crearUsuario(String emailNorm, String userNorm, String nomNorm,
                                 String apeNorm, String password, Rol rol) {
        Usuario usuario = new Usuario();
        usuario.setEmail(emailNorm);
        usuario.setUsername(userNorm);
        usuario.setNombres(nomNorm);
        usuario.setApellidos(apeNorm);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRol(rol);
        usuario.setActivo(true);
        return usuarioRepository.save(usuario);
    }

    private static String normalizar(String val) {
        return val != null ? val.trim() : "";
    }
}
