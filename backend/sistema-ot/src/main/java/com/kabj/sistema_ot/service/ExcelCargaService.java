package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.*;
import com.kabj.sistema_ot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelCargaService {

    private final OpOrdenTrabajoRepository ordenRepo;
    private final CatEstadoOtRepository estadoRepo;
    private final CatSubactividadRepository subactividadRepo;
    private final CatTipoPuntoOperativoRepository tipoPuntoRepo;
    private final RrhhCapatazRepository capatazRepo;
    private final ImpOtLoteRepository loteRepo;
    private final UsuarioRepository usuarioRepo;

    /**
     * Columnas esperadas en el Excel (a partir de la fila 2):
     * A: SGIO (código OT)
     * B: Dirección
     * C: Distrito
     * D: Sector
     * E: NIS
     * F: Latitud
     * G: Longitud
     * H: Fecha programada (YYYY-MM-DD)
     */
    @Transactional
    public Map<String, Object> cargarExcel(MultipartFile file, String usernameCreador) throws IOException {
        CatEstadoOt estadoPendiente = estadoRepo.findByCodigo("PENDIENTE")
                .orElseThrow(() -> new RuntimeException("Estado PENDIENTE no encontrado"));
        CatSubactividad subDefault = subactividadRepo.findAll().stream()
                .filter(CatSubactividad::getActivo).findFirst()
                .orElseThrow(() -> new RuntimeException("No hay subactividades disponibles"));
        CatTipoPuntoOperativo tipoDefault = tipoPuntoRepo.findAll().stream()
                .filter(CatTipoPuntoOperativo::getActivo).findFirst()
                .orElseThrow(() -> new RuntimeException("No hay tipos de punto disponibles"));
        RrhhCapataz capatazDefault = capatazRepo.findAll().stream()
                .filter(RrhhCapataz::getActivo).findFirst()
                .orElseThrow(() -> new RuntimeException("No hay capataces activos disponibles"));
        Usuario supervisor = usuarioRepo.findByUsername(usernameCreador)
                .orElse(usuarioRepo.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No hay usuarios en el sistema")));

        ImpOtLote lote = new ImpOtLote();
        lote.setNombreArchivo(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.xlsx");
        lote.setSupervisor(supervisor);
        lote.setEstadoLote("PROCESANDO");
        lote.setCreatedAt(LocalDateTime.now());
        lote.setUpdatedAt(LocalDateTime.now());
        lote = loteRepo.save(lote);

        int creadas = 0, duplicadas = 0, errores = 0;
        List<String> erroresList = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;
                String sgio = cellStr(row, 0);
                if (sgio == null || sgio.isBlank()) continue;

                if (ordenRepo.findBySgio(sgio).isPresent()) {
                    duplicadas++;
                    continue;
                }
                try {
                    OpOrdenTrabajo ot = new OpOrdenTrabajo();
                    ot.setSgio(sgio);
                    ot.setSubactividad(subDefault);
                    ot.setTipoPunto(tipoDefault);
                    ot.setCapataz(capatazDefault);
                    ot.setEstadoOt(estadoPendiente);
                    ot.setLote(lote);
                    ot.setDireccion(cellStr(row, 1));
                    ot.setDistrito(cellStr(row, 2));
                    ot.setSector(cellStr(row, 3));
                    ot.setNis(cellStr(row, 4));
                    Double lat = cellNum(row, 5);
                    Double lng = cellNum(row, 6);
                    if (lat != null) ot.setLatitud(BigDecimal.valueOf(lat));
                    if (lng != null) ot.setLongitud(BigDecimal.valueOf(lng));
                    String fechaStr = cellStr(row, 7);
                    if (fechaStr != null && !fechaStr.isBlank()) {
                        try { ot.setFechaProgramada(LocalDate.parse(fechaStr.trim())); }
                        catch (Exception ignored) {}
                    }
                    ot.setActivo(true);
                    ot.setCreatedAt(LocalDateTime.now());
                    ot.setUpdatedAt(LocalDateTime.now());
                    ordenRepo.save(ot);
                    creadas++;
                } catch (Exception e) {
                    errores++;
                    erroresList.add("Fila " + (rowIdx + 1) + ": " + e.getMessage());
                    log.warn("Error procesando fila {}: {}", rowIdx + 1, e.getMessage());
                }
            }
        }

        lote.setEstadoLote("COMPLETADO");
        lote.setFilasCorrectas(creadas);
        lote.setFilasDuplicadas(duplicadas);
        lote.setFilasError(errores);
        lote.setTotalFilas(creadas + duplicadas + errores);
        lote.setUpdatedAt(LocalDateTime.now());
        loteRepo.save(lote);

        return Map.of(
                "message", "Carga completada: " + creadas + " OTs creadas",
                "creadas", creadas,
                "duplicadas", duplicadas,
                "errores", errores,
                "detalle", erroresList
        );
    }

    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> null;
        };
    }

    private Double cellNum(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING  -> {
                try { yield Double.parseDouble(cell.getStringCellValue().trim()); }
                catch (Exception e) { yield null; }
            }
            default -> null;
        };
    }
}
