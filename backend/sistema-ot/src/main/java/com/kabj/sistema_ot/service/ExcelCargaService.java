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
import java.util.Optional;

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
    private final ImpOtFilaRepository filaRepo;
    private final UsuarioRepository usuarioRepo;
    private final GisVpaRepository vpaRepo;
    private final GisHidranteRepository hidranteRepo;

    // ─────────────────────────────────────────────────────────────────────────
    // CARGA VPA
    // ─────────────────────────────────────────────────────────────────────────
    public Map<String, Object> cargarVpaExcel(MultipartFile file) throws IOException {
        int creadas = 0, duplicadas = 0, errores = 0;
        List<String> erroresList = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;
                String vca = cellStr(row, 0);
                if (vca == null || vca.isBlank()) continue;

                if (vpaRepo.findByVca(vca).isPresent()) {
                    duplicadas++;
                    continue;
                }
                try {
                    guardarVpaFila(vca, row);
                    creadas++;
                } catch (Exception e) {
                    errores++;
                    erroresList.add("Fila " + (rowIdx + 1) + ": " + e.getMessage());
                }
            }
        }

        return Map.of(
                "message", "VPA cargados: " + creadas + " registros",
                "creadas", creadas,
                "duplicadas", duplicadas,
                "errores", errores,
                "detalle", erroresList
        );
    }

    @Transactional
    private void guardarVpaFila(String vca, Row row) {
        GisVpa vpa = new GisVpa();
        vpa.setVca(vca);
        vpa.setNis(cellStr(row, 1));
        Double lng = cellNum(row, 2);
        Double lat = cellNum(row, 3);
        if (lng != null) vpa.setLongitud(BigDecimal.valueOf(lng));
        if (lat != null) vpa.setLatitud(BigDecimal.valueOf(lat));
        vpa.setCreatedAt(LocalDateTime.now());
        vpa.setUpdatedAt(LocalDateTime.now());
        vpaRepo.save(vpa);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CARGA HIDRANTES
    // ─────────────────────────────────────────────────────────────────────────
    public Map<String, Object> cargarHidranteExcel(MultipartFile file) throws IOException {
        int creadas = 0, duplicadas = 0, errores = 0;
        List<String> erroresList = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;
                String suministro = cellStr(row, 1);
                if (suministro == null || suministro.isBlank()) continue;

                if (hidranteRepo.findBySuministro(suministro).isPresent()) {
                    duplicadas++;
                    continue;
                }
                try {
                    guardarHidranteFila(suministro, row);
                    creadas++;
                } catch (Exception e) {
                    errores++;
                    erroresList.add("Fila " + (rowIdx + 1) + ": " + e.getMessage());
                }
            }
        }

        return Map.of(
                "message", "Hidrantes cargados: " + creadas + " registros",
                "creadas", creadas,
                "duplicadas", duplicadas,
                "errores", errores,
                "detalle", erroresList
        );
    }

    @Transactional
    private void guardarHidranteFila(String suministro, Row row) {
        GisHidrante hidrante = new GisHidrante();
        hidrante.setHia(cellStr(row, 0));
        hidrante.setSuministro(suministro);
        hidrante.setDireccion(cellStr(row, 2));
        hidrante.setLocalidad(cellStr(row, 3));
        hidrante.setDistrito(cellStr(row, 4));
        hidrante.setSector(cellStr(row, 5));
        Double lng = cellNum(row, 6);
        Double lat = cellNum(row, 7);
        if (lng != null) hidrante.setLongitud(BigDecimal.valueOf(lng));
        if (lat != null) hidrante.setLatitud(BigDecimal.valueOf(lat));
        hidrante.setCreatedAt(LocalDateTime.now());
        hidrante.setUpdatedAt(LocalDateTime.now());
        hidranteRepo.save(hidrante);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CARGA OT — Excel real SEDAPAL
    // Columnas leídas (A–I):
    //   A(0): (GIS)       → código HIA o "FALTA"
    //   B(1): SUMINISTRO  → número suministro
    //   C(2): SGIO        → código único OT
    //   D(3): DIRECCION
    //   E(4): LOCALIDAD
    //   F(5): DISTRITO
    //   G(6): SECTOR
    //   H(7): EJECUTADO   → ignorado
    //   I(8): FECHA
    // Todo lo que viene después de la columna I es ignorado.
    // El capataz se deja en null — el supervisor lo asigna después.
    // ─────────────────────────────────────────────────────────────────────────
    public Map<String, Object> cargarExcel(MultipartFile file, String usernameCreador) throws IOException {

        CatEstadoOt estadoPendiente = estadoRepo.findByCodigo("PENDIENTE")
                .orElseGet(() -> estadoRepo.findAll().stream()
                        .filter(CatEstadoOt::getActivo).findFirst()
                        .orElseThrow(() -> new RuntimeException("No hay estados OT disponibles")));

        CatSubactividad subDefault = subactividadRepo.findAll().stream()
                .filter(CatSubactividad::getActivo).findFirst()
                .orElseThrow(() -> new RuntimeException("No hay subactividades disponibles"));

        CatTipoPuntoOperativo tipoDefault = tipoPuntoRepo.findAll().stream()
                .filter(CatTipoPuntoOperativo::getActivo).findFirst()
                .orElseThrow(() -> new RuntimeException("No hay tipos de punto disponibles"));

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

                String sgio = cellStr(row, 2); // columna C = SGIO
                if (sgio == null || sgio.isBlank()) continue;

                if (ordenRepo.findBySgio(sgio).isPresent()) {
                    duplicadas++;
                    continue;
                }
                try {
                    guardarOtFila(sgio, row, rowIdx, estadoPendiente, subDefault, tipoDefault, lote);
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

    @Transactional
    private void guardarOtFila(String sgio, Row row, int rowIdx,
                               CatEstadoOt estadoPendiente,
                               CatSubactividad subDefault,
                               CatTipoPuntoOperativo tipoDefault,
                               ImpOtLote lote) {

        // Leer solo columnas A–I (índices 0–8). El resto se ignora.
        String gisCol     = cellStr(row, 0); // A: (GIS) = HIA o "FALTA"
        String suministro = cellStr(row, 1); // B: SUMINISTRO
        // sgio = col C (índice 2) — viene como parámetro
        String direccion  = cellStr(row, 3); // D
        String localidad  = cellStr(row, 4); // E
        String distrito   = cellStr(row, 5); // F
        String sector     = cellStr(row, 6); // G
        // col H (índice 7) = EJECUTADO — ignorado
        String fechaStr   = cellStr(row, 8); // I: FECHA

        // Normalizar HIA: si es "FALTA" (o variante) se trata como ausente
        String hia = isFalta(gisCol) ? null : gisCol;

        boolean coordenadasEncontradas = false;
        StringBuilder validacionMsg = new StringBuilder();

        OpOrdenTrabajo ot = new OpOrdenTrabajo();
        ot.setSgio(sgio);
        ot.setSubactividad(subDefault);
        ot.setTipoPunto(tipoDefault);
        ot.setCapataz(null);          // Sin asignar — el supervisor lo asigna después
        ot.setEstadoOt(estadoPendiente);
        ot.setLote(lote);
        ot.setHia(gisCol);
        ot.setSuministro(suministro);

        // PRIORIDAD 1: buscar por HIA en gis_hidrante
        if (hia != null && !hia.isBlank()) {
            Optional<GisHidrante> hidranteOpt = hidranteRepo.findByHia(hia);
            if (hidranteOpt.isPresent()) {
                GisHidrante h = hidranteOpt.get();
                ot.setLatitud(h.getLatitud());
                ot.setLongitud(h.getLongitud());
                ot.setDireccion(h.getDireccion());
                ot.setLocalidad(h.getLocalidad());
                ot.setDistrito(h.getDistrito());
                ot.setSector(h.getSector());
                ot.setSuministro(h.getSuministro());
                coordenadasEncontradas = true;
                log.debug("OT {} → coords por HIA {}", sgio, hia);
            }
        }

        // PRIORIDAD 2: buscar por SUMINISTRO en gis_hidrante
        if (!coordenadasEncontradas && suministro != null && !suministro.isBlank()) {
            Optional<GisHidrante> hidranteOpt = hidranteRepo.findBySuministro(suministro);
            if (hidranteOpt.isPresent()) {
                GisHidrante h = hidranteOpt.get();
                ot.setLatitud(h.getLatitud());
                ot.setLongitud(h.getLongitud());
                ot.setDireccion(h.getDireccion());
                ot.setLocalidad(h.getLocalidad());
                ot.setDistrito(h.getDistrito());
                ot.setSector(h.getSector());
                coordenadasEncontradas = true;
                log.debug("OT {} → coords por SUMINISTRO {} en hidrante", sgio, suministro);
            }
        }

        // PRIORIDAD 3: buscar SUMINISTRO como NIS en gis_vpa
        if (!coordenadasEncontradas && suministro != null && !suministro.isBlank()) {
            Optional<GisVpa> vpaOpt = vpaRepo.findByNis(suministro);
            if (vpaOpt.isPresent()) {
                GisVpa v = vpaOpt.get();
                ot.setLatitud(v.getLatitud());
                ot.setLongitud(v.getLongitud());
                coordenadasEncontradas = true;
                log.debug("OT {} → coords por NIS {} en VPA", sgio, suministro);
            }
        }

        // Fallback: usar datos del Excel
        if (!coordenadasEncontradas) {
            ot.setDireccion(direccion);
            ot.setLocalidad(localidad);
            ot.setDistrito(distrito);
            ot.setSector(sector != null ? sector : "");
            validacionMsg.append("Coordenadas no resueltas automáticamente");
            log.debug("OT {} sin coordenadas — fallback Excel", sgio);
        }

        if (isFalta(gisCol)) {
            if (validacionMsg.length() > 0) validacionMsg.append(" - ");
            validacionMsg.append("GIS marcado como FALTA");
        }

        // Parsear fecha (columna I)
        if (fechaStr != null && !fechaStr.isBlank()) {
            try {
                ot.setFechaProgramada(LocalDate.parse(fechaStr.trim()));
            } catch (Exception e) {
                log.warn("No se pudo parsear fecha para OT {}: {}", sgio, fechaStr);
            }
        }

        ot.setActivo(true);
        ot.setCreatedAt(LocalDateTime.now());
        ot.setUpdatedAt(LocalDateTime.now());
        ot = ordenRepo.save(ot);

        // Guardar fila de importación
        ImpOtFila fila = new ImpOtFila();
        fila.setLote(lote);
        fila.setNumeroFilaExcel(rowIdx);
        fila.setSgio(sgio);
        fila.setNis(suministro);
        fila.setHiaCodigo(gisCol);
        fila.setDireccionExcel(direccion);
        fila.setLocalidadExcel(localidad);
        fila.setDistritoExcel(distrito);
        fila.setSectorExcel(sector != null ? sector : "");

        if (fechaStr != null && !fechaStr.isBlank()) {
            try {
                fila.setFechaProgramada(LocalDate.parse(fechaStr.trim()));
            } catch (Exception ignored) {}
        }

        if (validacionMsg.length() > 0) {
            fila.setEstadoValidacion("PENDIENTE");
            fila.setRequiereRevision(true);
            fila.setMensajeValidacion(validacionMsg.toString());
        } else {
            fila.setEstadoValidacion("APROBADO");
            fila.setRequiereRevision(false);
        }

        fila.setCreatedAt(LocalDateTime.now());
        fila.setUpdatedAt(LocalDateTime.now());
        fila = filaRepo.save(fila);

        ot.setFilaImportacion(fila);
        ordenRepo.save(ot);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────────────────────────────────────
    private boolean isFalta(String valor) {
        return valor != null && "FALTA".equalsIgnoreCase(valor.trim());
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