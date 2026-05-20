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
    private final UsuarioRepository usuarioRepo;
    private final GisVpaRepository vpaRepo;
    private final GisHidranteRepository hidranteRepo;

    /**
     * Carga Excel de VPA (Puntos de Agua)
     * Columnas esperadas:
     * A: VCA (código único)
     * B: NIS (relaciona con suministro de hidrantes)
     * C: LONGITUD
     * D: LATITUD
     */
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
                    log.warn("Error procesando fila VPA {}: {}", rowIdx + 1, e.getMessage());
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

    /**
     * Carga Excel de Hidrantes
     * Columnas esperadas:
     * A: HIA (código único)
     * B: SUMINISTRO (identificador único, se relaciona con OT)
     * C: DIRECCIÓN
     * D: LOCALIDAD
     * E: DISTRITO
     * F: SECTOR
     * G: LONGITUD
     * H: LATITUD
     */
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
                    log.warn("Error procesando fila Hidrante {}: {}", rowIdx + 1, e.getMessage());
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

    /**
     * Columnas esperadas en el Excel de OT (a partir de la fila 2):
     * A: ITEM
     * B: OT (SGIO - código único)
     * C: HIA (Hidrante - PRIORIDAD 1)
     * D: VCA (Punto de Agua - PRIORIDAD 2)
     * E: NIS (fallback - PRIORIDAD 3, solo si no está vacío o "FALTA")
     * F: DIRECCIÓN (opcional, fallback si no existe HIA/VCA)
     * G: LOCALIDAD (opcional, fallback)
     * H: DISTRITO (opcional, fallback)
     * I: SECTOR (opcional, fallback)
     * J: FECHA programada (YYYY-MM-DD)
     */
    public Map<String, Object> cargarExcel(MultipartFile file, String usernameCreador) throws IOException {
        // Buscar estado PENDIENTE, si no existe usar el primer estado activo
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
                String sgio = cellStr(row, 1);  // Columna B: OT (SGIO)
                if (sgio == null || sgio.isBlank()) continue;

                if (ordenRepo.findBySgio(sgio).isPresent()) {
                    duplicadas++;
                    continue;
                }
                
                try {
                    guardarOtFila(sgio, row, estadoPendiente, subDefault, tipoDefault, capatazDefault, lote);
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
    private void guardarOtFila(String sgio, Row row, CatEstadoOt estadoPendiente, 
                               CatSubactividad subDefault, CatTipoPuntoOperativo tipoDefault, 
                               RrhhCapataz capatazDefault, ImpOtLote lote) {
        OpOrdenTrabajo ot = new OpOrdenTrabajo();
        ot.setSgio(sgio);
        ot.setSubactividad(subDefault);
        ot.setTipoPunto(tipoDefault);
        ot.setCapataz(capatazDefault);
        ot.setEstadoOt(estadoPendiente);
        ot.setLote(lote);

        // Leer campos identificadores
        String hia = cellStr(row, 2);    // Columna C
        String vca = cellStr(row, 3);    // Columna D
        String nis = cellStr(row, 4);    // Columna E
        
        // Guardar en la OT
        ot.setHia(hia);
        ot.setVca(vca);
        ot.setNis(nis);

        // LÓGICA DE RELACIÓN - Prioridad: HIA > VCA > NIS
        boolean coordendasEncontradas = false;

        // PRIORIDAD 1: Buscar por HIA (Hidrante)
        if (hia != null && !hia.isBlank()) {
            Optional<GisHidrante> hidrante = hidranteRepo.findByHia(hia);
            if (hidrante.isPresent()) {
                GisHidrante h = hidrante.get();
                ot.setLatitud(h.getLatitud());
                ot.setLongitud(h.getLongitud());
                ot.setDireccion(h.getDireccion());
                ot.setLocalidad(h.getLocalidad());
                ot.setDistrito(h.getDistrito());
                ot.setSector(h.getSector());
                coordendasEncontradas = true;
                log.debug("OT {} relacionada con HIA {}", sgio, hia);
            }
        }

        // PRIORIDAD 2: Si HIA no funcionó, buscar por VCA (Punto de Agua)
        if (!coordendasEncontradas && vca != null && !vca.isBlank()) {
            Optional<GisVpa> vpaOpt = vpaRepo.findByVca(vca);
            if (vpaOpt.isPresent()) {
                GisVpa v = vpaOpt.get();
                ot.setLatitud(v.getLatitud());
                ot.setLongitud(v.getLongitud());
                coordendasEncontradas = true;
                log.debug("OT {} relacionada con VCA {}", sgio, vca);
            }
        }

        // PRIORIDAD 3: Si HIA y VCA no funcionaron, buscar por NIS
        // (Solo si NIS no está vacío y no es "FALTA")
        if (!coordendasEncontradas && nis != null && !nis.isBlank() && !"FALTA".equalsIgnoreCase(nis)) {
            Optional<GisVpa> vpaByNis = vpaRepo.findByNis(nis);
            if (vpaByNis.isPresent()) {
                GisVpa v = vpaByNis.get();
                ot.setLatitud(v.getLatitud());
                ot.setLongitud(v.getLongitud());
                coordendasEncontradas = true;
                log.debug("OT {} relacionada con NIS {} -> VCA {}", sgio, nis, v.getVca());
            }
        }

        // Si no se encontraron coordenadas, usar datos del Excel como fallback
        if (!coordendasEncontradas) {
            ot.setDireccion(cellStr(row, 5));     // Columna F
            ot.setLocalidad(cellStr(row, 6));     // Columna G
            ot.setDistrito(cellStr(row, 7));      // Columna H
            ot.setSector(cellStr(row, 8));        // Columna I
            log.debug("OT {} sin relación encontrada, usando datos del Excel", sgio);
        }

        String fechaStr = cellStr(row, 9);  // Columna J: FECHA
        if (fechaStr != null && !fechaStr.isBlank()) {
            try { ot.setFechaProgramada(LocalDate.parse(fechaStr.trim())); }
            catch (Exception ignored) {}
        }
        ot.setActivo(true);
        ot.setCreatedAt(LocalDateTime.now());
        ot.setUpdatedAt(LocalDateTime.now());
        ordenRepo.save(ot);
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
