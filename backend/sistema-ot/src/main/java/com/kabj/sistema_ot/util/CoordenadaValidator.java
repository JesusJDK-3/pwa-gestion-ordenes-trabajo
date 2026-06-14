package com.kabj.sistema_ot.util;

import java.math.BigDecimal;

/**
 * Valida coordenadas geográficas para operaciones en Lima/Perú.
 */
public final class CoordenadaValidator {

    public record Resultado(boolean valida, boolean requiereCorreccion, String mensaje) {}

    private CoordenadaValidator() {}

    /** Acepta coordenadas con o sin signo (típico en Excel Perú) y columnas invertidas. */
    public static BigDecimal[] normalizarPeru(BigDecimal latitud, BigDecimal longitud) {
        if (latitud == null || longitud == null) {
            return new BigDecimal[]{latitud, longitud};
        }
        double lat = latitud.doubleValue();
        double lng = longitud.doubleValue();

        if (Math.abs(lat) >= 68 && Math.abs(lat) <= 82 && Math.abs(lng) <= 20) {
            double tmp = lat;
            lat = lng;
            lng = tmp;
        }

        double absLat = Math.abs(lat);
        double absLng = Math.abs(lng);

        if (lat > 0 && absLat <= 18.5) lat = -absLat;
        if (lng > 0 && absLng >= 68 && absLng <= 82) lng = -absLng;

        return new BigDecimal[]{BigDecimal.valueOf(lat), BigDecimal.valueOf(lng)};
    }

    public static Resultado validar(BigDecimal latitud, BigDecimal longitud) {
        BigDecimal[] norm = normalizarPeru(latitud, longitud);
        latitud = norm[0];
        longitud = norm[1];

        if (latitud == null || longitud == null) {
            return new Resultado(false, true, "Sin coordenadas — debe corregirse en el sistema");
        }
        double lat = latitud.doubleValue();
        double lng = longitud.doubleValue();

        if (lat == 0.0 && lng == 0.0) {
            return new Resultado(false, true, "Coordenadas 0,0 inválidas");
        }
        if (lat > 0 || lng > 0) {
            return new Resultado(false, true,
                    "Coordenadas no válidas para Perú. Use latitud ~12 y longitud ~77 (ej. 12.04 y 77.04)");
        }
        if (lat < -18.5 || lat > 0 || lng < -82.0 || lng > -68.0) {
            return new Resultado(false, true, "Coordenadas fuera del territorio peruano");
        }
        // Área metropolitana Lima (referencia operativa KABJ/SEDAPAL)
        boolean enLima = lat <= -11.5 && lat >= -12.8 && lng <= -76.4 && lng >= -77.5;
        if (!enLima) {
            return new Resultado(true, true,
                    "Coordenadas fuera del área Lima — revise en mapa antes de asignar");
        }
        return new Resultado(true, false, "Coordenadas válidas");
    }
}
