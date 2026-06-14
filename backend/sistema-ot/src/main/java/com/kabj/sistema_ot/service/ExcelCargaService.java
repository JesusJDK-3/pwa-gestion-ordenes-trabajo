package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.*;
import com.kabj.sistema_ot.repository.*;
import com.kabj.sistema_ot.util.CoordenadaValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
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

/**
 * Importación masiva de OT desde Excel (formatos SEDAPAL y Preventivo VPA).
 * <p>
 * Flujo: {@link #previewExcel} valida filas sin persistir → {@link #cargarExcel} crea OT en PENDIENTE.
 * Resolución de coordenadas por prioridad: HIA/hidrante → NIS/VPA → columnas Excel.
 * OT creadas sin capataz; el supervisor asigna después en Asignar OT.
 * </p>
 */
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

    private static final class CoordenadaStats {
        int invalidas = 0;
        int validas = 0;
        int revisar = 0;
        final List<Map<String, String>> detalle = new ArrayList<>();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CARGA VPA
    // ─────────────────────────────────────────────────────────────────────────
    public Map<String, Object> cargarVpaExcel(MultipartFile file) throws IOException {
        int creadas = 0, duplicadas = 0, errores = 0;
        List<String> erroresList = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
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

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
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
    /** HU02: previsualiza filas sin guardar en BD */
    public Map<String, Object> previewExcel(MultipartFile file) throws IOException {
        List<Map<String, Object>> filas = new ArrayList<>();
        int validas = 0, errores = 0;

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() == 0) {
                throw new RuntimeException("El archivo Excel está vacío");
            }
            Row header = sheet.getRow(0);
            Map<String, Integer> headerIndex = buildHeaderIndex(header);
            boolean isMnttoPrevVpa = headerIndex.containsKey("NRO_OT")
                    && headerIndex.containsKey("NIS_RAD")
                    && headerIndex.containsKey("DESC_SUBACTIVIDAD");

            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                String sgio = isMnttoPrevVpa
                        ? trim(cellStr(row, headerIndex.getOrDefault("NRO_OT", -1)))
                        : cellStr(row, 2);
                if (sgio == null || sgio.isBlank()) continue;

                Map<String, Object> fila = new java.util.LinkedHashMap<>();
                fila.put("fila", rowIdx + 1);
                fila.put("sgio", sgio);
                fila.put("direccion", previewDireccion(row, headerIndex, isMnttoPrevVpa));

                if (ordenRepo.findBySgio(sgio).isPresent()) {
                    fila.put("valido", false);
                    fila.put("mensaje", "OT duplicada en el sistema");
                    errores++;
                } else {
                    fila.put("valido", true);
                    fila.put("mensaje", "Lista para importar");
                    validas++;
                }
                filas.add(fila);
            }
        }

        return Map.of(
                "filas", filas,
                "validas", validas,
                "errores", errores,
                "total", filas.size()
        );
    }

    private String previewDireccion(Row row, Map<String, Integer> headerIndex, boolean mntto) {
        if (mntto) {
            return trim(cellStr(row, headerIndex.getOrDefault("DIRECCION", -1)));
        }
        return cellStr(row, 3);
    }

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
        CoordenadaStats coordStats = new CoordenadaStats();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() == 0) {
                throw new RuntimeException("El archivo Excel está vacío");
            }

            Row header = sheet.getRow(0);
            Map<String, Integer> headerIndex = buildHeaderIndex(header);
            boolean isSedapal = headerIndex.containsKey("SGIO");
            boolean isMnttoPrevVpa = headerIndex.containsKey("NRO_OT") && headerIndex.containsKey("NIS_RAD") && headerIndex.containsKey("DESC_SUBACTIVIDAD");

            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                String sgio;
                if (isMnttoPrevVpa) {
                    sgio = cellStr(row, headerIndex.getOrDefault("NRO_OT", -1));
                } else {
                    sgio = cellStr(row, 2); // columna C = SGIO
                }
                if (sgio == null || sgio.isBlank()) continue;

                if (ordenRepo.findBySgio(sgio).isPresent()) {
                    duplicadas++;
                    continue;
                }
                try {
                    if (isMnttoPrevVpa) {
                        guardarOtFilaPreventivoVpa(row, rowIdx, estadoPendiente, tipoDefault, headerIndex, lote, coordStats);
                    } else {
                        guardarOtFila(sgio, row, rowIdx, estadoPendiente, subDefault, tipoDefault, lote, headerIndex, coordStats);
                    }
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

        String msg = "Carga completada: " + creadas + " OTs creadas";
        if (coordStats.invalidas > 0) {
            msg += ". " + coordStats.invalidas + " con coordenadas inválidas (corregir en el sistema)";
        }
        return Map.of(
                "message", msg,
                "creadas", creadas,
                "duplicadas", duplicadas,
                "errores", errores,
                "detalle", erroresList,
                "coordenadasValidas", coordStats.validas,
                "coordenadasInvalidas", coordStats.invalidas,
                "coordenadasRevisar", coordStats.revisar,
                "detalleCoordenadas", coordStats.detalle
        );
    }

    @Transactional
    private void guardarOtFila(String sgio, Row row, int rowIdx,
                               CatEstadoOt estadoPendiente,
                               CatSubactividad subDefault,
                               CatTipoPuntoOperativo tipoDefault,
                               ImpOtLote lote,
                               Map<String, Integer> headerIndex,
                               CoordenadaStats coordStats) {

        // Leer solo columnas A–I (índices 0–8). El resto se ignora.
        String gisCol     = cellStr(row, 0); // A: (GIS) = HIA o "FALTA"
        String suministro = cellStr(row, 1); // B: SUMINISTRO
        // sgio = col C (índice 2) — viene como parámetro
        String direccion  = cellStr(row, 3); // D
        String localidad  = cellStr(row, 4); // E
        String distrito   = cellStr(row, 5); // F
        String sector     = cellStr(row, 6); // G
        // col H (índice 7) = EJECUTADO — ignorado
        String fechaStr   = cellStr(row, 8); // I: FECHA (fallback texto)
        LocalDate fechaProg = parseDateCell(row, 8);
        if (fechaProg == null && fechaStr != null && !fechaStr.isBlank()) {
            try {
                fechaProg = LocalDate.parse(fechaStr.trim());
            } catch (Exception e) {
                log.warn("No se pudo parsear fecha para OT {}: {}", sgio, fechaStr);
            }
        }

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
        }

        BigDecimal[] excelCoords = readLatLngFromRow(row, headerIndex);
        if (excelCoords != null) {
            ot.setLatitud(excelCoords[0]);
            ot.setLongitud(excelCoords[1]);
            coordenadasEncontradas = true;
            log.debug("OT {} → coords desde Excel", sgio);
        } else if (!coordenadasEncontradas) {
            validacionMsg.append("Coordenadas no resueltas automáticamente");
            log.debug("OT {} sin coordenadas — requiere corrección", sgio);
        }

        if (isFalta(gisCol)) {
            if (validacionMsg.length() > 0) validacionMsg.append(" - ");
            validacionMsg.append("GIS marcado como FALTA");
        }

        if (fechaProg != null) {
            ot.setFechaProgramada(fechaProg);
        }

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
        if (fechaProg != null) {
            fila.setFechaProgramada(fechaProg);
        }

        aplicarValidacionCoordenadas(ot, fila, validacionMsg, coordStats, sgio);

        ot.setActivo(true);
        ot.setCreatedAt(LocalDateTime.now());
        ot.setUpdatedAt(LocalDateTime.now());
        ot = ordenRepo.save(ot);

        fila.setCreatedAt(LocalDateTime.now());
        fila.setUpdatedAt(LocalDateTime.now());
        fila = filaRepo.save(fila);

        ot.setFilaImportacion(fila);
        ordenRepo.save(ot);
    }

    @Transactional
    private void guardarOtFilaPreventivoVpa(Row row, int rowIdx,
                                           CatEstadoOt estadoPendiente,
                                           CatTipoPuntoOperativo tipoDefault,
                                           Map<String, Integer> headerIndex,
                                           ImpOtLote lote,
                                           CoordenadaStats coordStats) {

        String sgio            = trim(cellStr(row, headerIndex.getOrDefault("NRO_OT", -1)));
        String nis             = trim(cellStr(row, headerIndex.getOrDefault("NIS_RAD", -1)));
        String actividadCodigo = trim(cellStr(row, headerIndex.getOrDefault("ACTIVIDAD", -1)));
        String actividadNombre = trim(cellStr(row, headerIndex.getOrDefault("DESC_ACTIVIDAD", -1)));
        String subactCodigo    = trim(cellStr(row, headerIndex.getOrDefault("SUBACTIVIDAD", -1)));
        String subactNombre    = trim(cellStr(row, headerIndex.getOrDefault("DESC_SUBACTIVIDAD", -1)));
        String direccion       = trim(cellStr(row, headerIndex.getOrDefault("DIRECCION", -1)));
        String localidad       = trim(cellStr(row, headerIndex.getOrDefault("LOCALIDAD", -1)));
        String distrito        = trim(cellStr(row, headerIndex.getOrDefault("MUNICIPIO", -1)));
        String observacion     = trim(cellStr(row, headerIndex.getOrDefault("VOBSERVACION_CONTRATA", -1)));
        if (observacion == null || observacion.isBlank()) {
            observacion = trim(cellStr(row, headerIndex.getOrDefault("OBSERVACION", -1)));
        }

        CatSubactividad subactividad = resolveSubactividad(subactCodigo, subactNombre);
        CatTipoPuntoOperativo tipoPunto = resolveTipoPunto(actividadNombre, subactNombre, tipoDefault);

        OpOrdenTrabajo ot = new OpOrdenTrabajo();
        ot.setSgio(sgio);
        ot.setSubactividad(subactividad);
        ot.setTipoPunto(tipoPunto);
        ot.setCapataz(null);
        ot.setEstadoOt(estadoPendiente);
        ot.setLote(lote);
        ot.setNis(nis);
        ot.setDireccion(direccion);
        ot.setLocalidad(localidad);
        ot.setDistrito(distrito);
        ot.setSector("");

        boolean coordenadasEncontradas = false;
        StringBuilder validacionMsg = new StringBuilder();

        if (nis != null && !nis.isBlank()) {
            Optional<GisVpa> vpaOpt = vpaRepo.findByNis(nis);
            if (vpaOpt.isPresent()) {
                GisVpa vpa = vpaOpt.get();
                ot.setLatitud(vpa.getLatitud());
                ot.setLongitud(vpa.getLongitud());
                ot.setVca(vpa.getVca());
                coordenadasEncontradas = true;
                log.debug("OT {} → coords por NIS {} en VPA", sgio, nis);
            }
        }

        BigDecimal[] excelCoords = readLatLngFromRow(row, headerIndex);
        if (excelCoords != null) {
            ot.setLatitud(excelCoords[0]);
            ot.setLongitud(excelCoords[1]);
            coordenadasEncontradas = true;
            log.debug("OT {} → coords desde Excel (VPA)", sgio);
        } else if (!coordenadasEncontradas) {
            validacionMsg.append("Coordenadas no resueltas automáticamente");
            log.debug("OT {} sin coordenadas — requiere corrección", sgio);
        }

        LocalDate fechaProg = parseDateCell(row, headerIndex.getOrDefault("F_PROGRAMACION", -1));
        if (fechaProg == null) {
            fechaProg = parseDateCell(row, headerIndex.getOrDefault("F_ALTA", -1));
        }
        if (fechaProg != null) {
            ot.setFechaProgramada(fechaProg);
        }

        if (observacion != null && !observacion.isBlank()) {
            ot.setObservacion(observacion);
        }

        ImpOtFila fila = new ImpOtFila();
        fila.setLote(lote);
        fila.setNumeroFilaExcel(rowIdx);
        fila.setSgio(sgio);
        fila.setNis(nis);
        fila.setHiaCodigo(null);
        fila.setVcaCodigo(ot.getVca());
        fila.setDireccionExcel(direccion);
        fila.setLocalidadExcel(localidad);
        fila.setDistritoExcel(distrito);
        fila.setSectorExcel("");
        if (fechaProg != null) {
            fila.setFechaProgramada(fechaProg);
        }

        aplicarValidacionCoordenadas(ot, fila, validacionMsg, coordStats, sgio);

        ot.setActivo(true);
        ot.setCreatedAt(LocalDateTime.now());
        ot.setUpdatedAt(LocalDateTime.now());
        ot = ordenRepo.save(ot);

        fila.setCreatedAt(LocalDateTime.now());
        fila.setUpdatedAt(LocalDateTime.now());
        fila = filaRepo.save(fila);

        ot.setFilaImportacion(fila);
        ordenRepo.save(ot);
    }

    private void aplicarValidacionCoordenadas(OpOrdenTrabajo ot, ImpOtFila fila,
                                              StringBuilder validacionMsg,
                                              CoordenadaStats stats, String sgio) {
        BigDecimal[] norm = CoordenadaValidator.normalizarPeru(ot.getLatitud(), ot.getLongitud());
        ot.setLatitud(norm[0]);
        ot.setLongitud(norm[1]);
        CoordenadaValidator.Resultado res = CoordenadaValidator.validar(ot.getLatitud(), ot.getLongitud());
        if (!res.valida()) {
            ot.setLatitud(null);
            ot.setLongitud(null);
            ot.setVisibleEnMapa(false);
            fila.setRequiereCoordenadaManual(true);
            fila.setEstadoValidacion("COORD_INVALIDA");
            fila.setRequiereRevision(true);
            appendMensaje(validacionMsg, res.mensaje());
            fila.setMensajeValidacion(validacionMsg.toString());
            stats.invalidas++;
            stats.detalle.add(Map.of("sgio", sgio, "mensaje", res.mensaje()));
        } else if (res.requiereCorreccion()) {
            ot.setVisibleEnMapa(true);
            fila.setRequiereCoordenadaManual(true);
            fila.setEstadoValidacion("PENDIENTE");
            fila.setRequiereRevision(true);
            appendMensaje(validacionMsg, res.mensaje());
            fila.setMensajeValidacion(validacionMsg.toString());
            stats.revisar++;
            stats.detalle.add(Map.of("sgio", sgio, "mensaje", res.mensaje()));
        } else {
            ot.setVisibleEnMapa(true);
            fila.setRequiereCoordenadaManual(false);
            if (validacionMsg.length() > 0) {
                fila.setEstadoValidacion("PENDIENTE");
                fila.setRequiereRevision(true);
                fila.setMensajeValidacion(validacionMsg.toString());
            } else {
                fila.setEstadoValidacion("APROBADO");
                fila.setRequiereRevision(false);
            }
            stats.validas++;
        }
    }

    private void appendMensaje(StringBuilder sb, String msg) {
        if (sb.length() > 0) sb.append(" - ");
        sb.append(msg);
    }

    private BigDecimal[] readLatLngFromRow(Row row, Map<String, Integer> headerIndex) {
        Integer latCol = firstHeaderCol(headerIndex, "LATITUD", "LAT", "Y");
        Integer lngCol = firstHeaderCol(headerIndex, "LONGITUD", "LON", "LNG", "LONG", "X");
        Double lat = latCol != null ? cellNum(row, latCol) : null;
        Double lng = lngCol != null ? cellNum(row, lngCol) : null;
        if (lat == null) lat = cellNum(row, 9);
        if (lng == null) lng = cellNum(row, 10);
        if (lat == null || lng == null) return null;
        return new BigDecimal[]{BigDecimal.valueOf(lat), BigDecimal.valueOf(lng)};
    }

    private Integer firstHeaderCol(Map<String, Integer> headerIndex, String... keys) {
        for (String key : keys) {
            if (headerIndex.containsKey(key)) return headerIndex.get(key);
        }
        return null;
    }

    private Map<String, Integer> buildHeaderIndex(Row row) {
        Map<String, Integer> index = new java.util.HashMap<>();
        if (row == null) return index;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell == null) continue;
            String text = switch (cell.getCellType()) {
                case STRING  -> cell.getStringCellValue().trim();
                case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                default      -> null;
            };
            if (text != null && !text.isBlank()) {
                index.put(text.toUpperCase().trim(), i);
            }
        }
        return index;
    }

    private CatSubactividad resolveSubactividad(String codigo, String nombre) {
        if (codigo != null && !codigo.isBlank()) {
            Optional<CatSubactividad> byCodigo = subactividadRepo.findByCodigo(codigo.trim());
            if (byCodigo.isPresent()) return byCodigo.get();
        }
        if (nombre != null && !nombre.isBlank()) {
            Optional<CatSubactividad> byNombre = subactividadRepo.findByNombreIgnoreCase(nombre.trim());
            if (byNombre.isPresent()) return byNombre.get();
        }
        CatSubactividad nuevo = new CatSubactividad();
        nuevo.setCodigo(codigo != null && !codigo.isBlank() ? codigo.trim() : "OTRO");
        nuevo.setNombre(nombre != null && !nombre.isBlank() ? nombre.trim() : "Otro");
        nuevo.setActivo(true);
        return subactividadRepo.save(nuevo);
    }

    private CatTipoPuntoOperativo resolveTipoPunto(String actividadNombre, String subactNombre,
                                                  CatTipoPuntoOperativo tipoDefault) {
        String texto = (actividadNombre != null ? actividadNombre : "") + " " + (subactNombre != null ? subactNombre : "");
        String upper = texto.toUpperCase();
        if (upper.contains("HIDRANTE")) {
            return tipoPuntoRepo.findByCodigo("HIA").orElse(tipoDefault);
        }
        if (upper.contains("VALVULA") || upper.contains("PURGA") || upper.contains("VÁLVULA") || upper.contains("VAVULA")) {
            return tipoPuntoRepo.findByCodigo("VCA").orElse(tipoDefault);
        }
        return tipoDefault;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────────────────────────────────────
    private boolean isFalta(String valor) {
        return valor != null && "FALTA".equalsIgnoreCase(valor.trim());
    }

    private String trim(String value) {
        return value != null ? value.trim() : null;
    }

    /** Parsea fechas ISO o seriales numéricos de Excel (ej. 45902.39 → 2025-09-02). */
    private LocalDate parseDateCell(Row row, int col) {
        if (row == null || col < 0) return null;
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate();
                }
                double serial = cell.getNumericCellValue();
                if (DateUtil.isValidExcelDate(serial)) {
                    return DateUtil.getLocalDateTime(serial, false).toLocalDate();
                }
            }
            if (cell.getCellType() == CellType.STRING) {
                String s = cell.getStringCellValue().trim();
                if (!s.isBlank()) return LocalDate.parse(s);
            }
        } catch (Exception e) {
            log.debug("Fecha no parseada col {}: {}", col, e.getMessage());
        }
        return null;
    }

    private String cellStr(Row row, int col) {
        if (row == null || col < 0) return null;
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                    : formatNumericAsString(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> null;
        };
    }

    /** NIS / NRO_OT largos sin notación científica ni decimales .0 */
    private String formatNumericAsString(double value) {
        if (Math.floor(value) == value) {
            return String.valueOf((long) value);
        }
        return String.valueOf(value);
    }

    private Double cellNum(Row row, int col) {
        if (row == null || col < 0) return null;
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