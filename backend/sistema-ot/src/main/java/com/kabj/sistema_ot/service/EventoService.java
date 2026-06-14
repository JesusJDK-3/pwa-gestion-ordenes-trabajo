package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import com.kabj.sistema_ot.entity.OpOtEvento;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.repository.OpOtEventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventoService {

    private static final long ID_TODOS = -1L;
    private static final String TIPO_TODOS = "";
    private static final LocalDateTime DESDE_MIN = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime HASTA_MAX = LocalDateTime.of(2100, 1, 1, 0, 0);

    private final OpOtEventoRepository eventoRepo;

    @Transactional
    public void registrar(OpOrdenTrabajo ot, String tipo, String estadoAnterior, String estadoNuevo,
                          String descripcion, Usuario usuario, String origen) {
        OpOtEvento e = new OpOtEvento();
        e.setOrden(ot);
        e.setTipoEvento(tipo);
        e.setEstadoAnterior(estadoAnterior);
        e.setEstadoNuevo(estadoNuevo);
        e.setDescripcion(descripcion);
        e.setUsuario(usuario);
        e.setOrigen(origen != null ? origen : "WEB");
        e.setFechaEvento(LocalDateTime.now());
        eventoRepo.save(e);
    }

    @Transactional(readOnly = true)
    public List<OpOtEvento> buscar(Long idOt, String tipo, Long idUsuario,
                                   LocalDateTime desde, LocalDateTime hasta) {
        return eventoRepo.buscarFiltrados(
                idOt != null ? idOt : ID_TODOS,
                tipo != null && !tipo.isBlank() ? tipo : TIPO_TODOS,
                idUsuario != null ? idUsuario : ID_TODOS,
                desde != null ? desde : DESDE_MIN,
                hasta != null ? hasta : HASTA_MAX);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listar(Long idOt, String tipo, Long idUsuario,
                                            LocalDateTime desde, LocalDateTime hasta) {
        return buscar(idOt, tipo, idUsuario, desde, hasta).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toMap(OpOtEvento e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idEvento", e.getIdEvento());
        m.put("fecha", e.getFechaEvento() != null ? e.getFechaEvento().toString() : "");
        m.put("sgio", e.getOrden() != null ? e.getOrden().getSgio() : "");
        m.put("idOt", e.getOrden() != null ? e.getOrden().getIdOt() : null);
        m.put("evento", e.getTipoEvento());
        m.put("estadoAnterior", e.getEstadoAnterior());
        m.put("estadoNuevo", e.getEstadoNuevo());
        m.put("descripcion", e.getDescripcion());
        m.put("usuario", e.getUsuario() != null ? e.getUsuario().getNombres() : "Sistema");
        m.put("origen", e.getOrigen());
        return m;
    }
}
