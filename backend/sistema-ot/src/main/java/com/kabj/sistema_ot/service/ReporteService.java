package com.kabj.sistema_ot.service;

import com.kabj.sistema_ot.entity.RegistroActividad;
import com.kabj.sistema_ot.entity.enums.EstadoPunto;
import com.kabj.sistema_ot.repository.PuntoTrabajoRepository;
import com.kabj.sistema_ot.repository.RegistroActividadRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final RegistroActividadRepository registroRepo;
    private final PuntoTrabajoRepository puntoRepo;

    public Map<String, Object> getResumenDiario(LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.plusDays(1).atStartOfDay();
        List<RegistroActividad> registros = registroRepo.findByFecha(inicio, fin);

        long completados = puntoRepo.findAll().stream()
                .filter(p -> p.getEstado() == EstadoPunto.COMPLETADO).count();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("fecha", fecha.toString());
        resultado.put("totalRegistros", registros.size());
        resultado.put("puntosCompletados", completados);
        resultado.put("porCapataz", agruparPorCapataz(registros));
        return resultado;
    }

    public Map<String, Object> getResumenMensual(int mes, int anio) {
        LocalDate inicio = LocalDate.of(anio, mes, 1);
        LocalDate fin = inicio.plusMonths(1);
        List<RegistroActividad> registros = registroRepo.findByFecha(
                inicio.atStartOfDay(), fin.atStartOfDay());

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("mes", mes);
        resultado.put("anio", anio);
        resultado.put("totalRegistros", registros.size());
        resultado.put("porCapataz", agruparPorCapataz(registros));
        return resultado;
    }

    public byte[] exportarExcel(LocalDate fecha) throws IOException {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.plusDays(1).atStartOfDay();
        List<RegistroActividad> registros = registroRepo.findByFecha(inicio, fin);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Registros");
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"Código OT", "Punto", "Capataz", "Tipo Actividad",
                    "Observaciones", "Fecha", "Estado", "Validado"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (RegistroActividad r : registros) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getPunto() != null && r.getPunto().getOrden() != null
                        ? r.getPunto().getOrden().getCodigoOt() : "");
                row.createCell(1).setCellValue(r.getPunto() != null ? r.getPunto().getDescripcion() : "");
                row.createCell(2).setCellValue(r.getCapataz() != null
                        ? r.getCapataz().getNombres() + " " + r.getCapataz().getApellidos() : "");
                row.createCell(3).setCellValue(r.getTipoActividad() != null ? r.getTipoActividad() : "");
                row.createCell(4).setCellValue(r.getObservaciones() != null ? r.getObservaciones() : "");
                row.createCell(5).setCellValue(r.getFechaRegistro() != null ? r.getFechaRegistro().format(fmt) : "");
                row.createCell(6).setCellValue(r.getPunto() != null ? r.getPunto().getEstado().name() : "");
                row.createCell(7).setCellValue(r.isValidado() ? "Sí" : "No");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public List<RegistroActividad> getAuditoria() {
        return registroRepo.findAll();
    }

    private Map<String, Long> agruparPorCapataz(List<RegistroActividad> registros) {
        Map<String, Long> map = new LinkedHashMap<>();
        registros.forEach(r -> {
            String nombre = r.getCapataz() != null
                    ? r.getCapataz().getNombres() + " " + r.getCapataz().getApellidos()
                    : "Sin capataz";
            map.merge(nombre, 1L, Long::sum);
        });
        return map;
    }
}
