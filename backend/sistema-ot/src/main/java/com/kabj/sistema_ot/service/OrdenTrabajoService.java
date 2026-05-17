package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.dto.OrdenTrabajoResponse;
import com.kabj.sistema_ot.dto.PuntoTrabajoResponse;
import com.kabj.sistema_ot.entity.OrdenTrabajo;
import com.kabj.sistema_ot.entity.PuntoTrabajo;
import com.kabj.sistema_ot.entity.Usuario;
import com.kabj.sistema_ot.entity.enums.EstadoOrden;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.exception.AuthException;
import com.kabj.sistema_ot.repository.OrdenTrabajoRepository;
import com.kabj.sistema_ot.repository.PuntoTrabajoRepository;
import com.kabj.sistema_ot.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private final OrdenTrabajoRepository ordenRepo;
    private final PuntoTrabajoRepository puntoRepo;
    private final UsuarioRepository usuarioRepo;

    @Transactional
    public int cargarDesdeExcel(MultipartFile file, Long supervisorId) {
        Usuario supervisor = usuarioRepo.findById(supervisorId)
                .orElseThrow(() -> new AuthException("Supervisor no encontrado"));

        int puntoCount = 0;
        Map<String, OrdenTrabajo> ordenMap = new HashMap<>();

        try (InputStream is = file.getInputStream();
             var workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String codigoOt  = getCellString(row.getCell(0));
                String descripcion = getCellString(row.getCell(1));
                double latitud   = getNumericCell(row.getCell(2));
                double longitud  = getNumericCell(row.getCell(3));
                String direccion = getCellString(row.getCell(4));

                if (codigoOt == null || codigoOt.isBlank()) continue;

                OrdenTrabajo orden = ordenMap.computeIfAbsent(codigoOt, codigo -> {
                    OrdenTrabajo o = new OrdenTrabajo();
                    o.setCodigoOt(codigo);
                    o.setDescripcion(descripcion);
                    o.setFechaCarga(LocalDate.now());
                    o.setSupervisor(supervisor);
                    o.setEstado(EstadoOrden.ACTIVA);
                    return ordenRepo.save(o);
                });

                PuntoTrabajo punto = new PuntoTrabajo();
                punto.setOrden(orden);
                punto.setLatitud(BigDecimal.valueOf(latitud));
                punto.setLongitud(BigDecimal.valueOf(longitud));
                punto.setDescripcion(descripcion);
                punto.setDireccion(direccion);
                punto.setEstado(EstadoPunto.PENDIENTE);
                puntoRepo.save(punto);
                puntoCount++;
            }

        } catch (Exception e) {
            throw new RuntimeException("Error procesando Excel: " + e.getMessage(), e);
        }

        return puntoCount;
    }

    public List<OrdenTrabajoResponse> listar(Long supervisorId) {
        List<OrdenTrabajo> ordenes = supervisorId != null
                ? ordenRepo.findBySupervisor_IdUsuario(supervisorId)
                : ordenRepo.findAll();
        return ordenes.stream().map(o -> toResponse(o, false)).toList();
    }

    public OrdenTrabajoResponse obtenerDetalle(Long id) {
        OrdenTrabajo orden = ordenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        return toResponse(orden, true);
    }

    public OrdenTrabajoResponse toResponse(OrdenTrabajo o, boolean includePuntos) {
        List<PuntoTrabajoResponse> puntos = includePuntos
                ? o.getPuntos().stream().map(this::toPuntoResponse).toList()
                : null;
        return new OrdenTrabajoResponse(
                o.getId(), o.getCodigoOt(), o.getDescripcion(), o.getFechaCarga(),
                o.getEstado().name(),
                o.getSupervisor() != null ? o.getSupervisor().getIdUsuario() : null,
                o.getSupervisor() != null ? o.getSupervisor().getNombres() + " " + o.getSupervisor().getApellidos() : null,
                puntos
        );
    }

    public PuntoTrabajoResponse toPuntoResponse(PuntoTrabajo p) {
        return new PuntoTrabajoResponse(
                p.getId(),
                p.getOrden() != null ? p.getOrden().getId() : null,
                p.getOrden() != null ? p.getOrden().getCodigoOt() : null,
                p.getLatitud().doubleValue(),
                p.getLongitud().doubleValue(),
                p.getDescripcion(),
                p.getDireccion(),
                p.getEstado().name(),
                p.getCapataz() != null ? p.getCapataz().getIdUsuario() : null,
                p.getCapataz() != null ? p.getCapataz().getNombres() + " " + p.getCapataz().getApellidos() : null
        );
    }

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private double getNumericCell(Cell cell) {
        if (cell == null) return 0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> Double.parseDouble(cell.getStringCellValue().trim());
            default -> 0;
        };
    }
}
