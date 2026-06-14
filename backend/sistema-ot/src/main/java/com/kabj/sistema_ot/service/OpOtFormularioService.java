package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpOtFormulario;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.CatFormularioRepository;
import com.kabj.sistema_ot.repository.OpOtFormularioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OpOtFormularioService {

    public static final String CODIGO_PURGADO_RED = "PURGADO_RED";

    private final OpOtFormularioRepository formularioRepository;
    private final CatFormularioRepository catFormularioRepository;

    @Transactional(readOnly = true)
    public Long idFormularioPurgadoRedes() {
        return catFormularioRepository.findByCodigo(CODIGO_PURGADO_RED)
                .map(f -> f.getIdFormulario())
                .orElseThrow(() -> new RuntimeException(
                        "Formulario de purgado no configurado en el catálogo (PURGADO_RED)"));
    }

    @Transactional
    public OpOtFormulario asegurar(OpOrdenTrabajo ot, Long idFormulario, Usuario usuario) {
        return formularioRepository.findByOrdenTrabajo(ot).stream()
                .filter(f -> idFormulario.equals(f.getIdFormulario()))
                .findFirst()
                .orElseGet(() -> {
                    OpOtFormulario formulario = new OpOtFormulario();
                    formulario.setOrdenTrabajo(ot);
                    formulario.setIdFormulario(idFormulario);
                    formulario.setUsuarioRegistro(usuario);
                    formulario.setFechaInicio(LocalDateTime.now());
                    formulario.setEstadoFormulario("EN_PROGRESO");
                    formulario.setCompletado(false);
                    return formularioRepository.save(formulario);
                });
    }
}
