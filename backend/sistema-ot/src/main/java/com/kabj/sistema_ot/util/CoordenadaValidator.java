package com.kabj.sistema_ot.util;

import java.math.BigDecimal;

/**
 * Valida coordenadas geográficas para operaciones en Lima/Perú.
 */
public final class CoordenadaValidator {

    public record Resultado(boolean valida, boolean requiereCorreccion, String mensaje) {}

    private CoordenadaValidator() {}

    public static Resultado validar(BigDecimal latitud, BigDecimal longitud) {
        if (latitud == null || longitud == null) {
            return new Resultado(false, true, "Sin coordenadas — debe corregirse en el sistema");
        }
        double lat = latitud.doubleValue();
        double lng = longitud.doubleValue();

        if (lat == 0.0 && lng == 0.0) {
            return new Resultado(false, true, "Coordenadas 0,0 inválidas");
        }
        if (lat > 0) {
            return new Resultado(false, true, "Latitud inválida: debe ser negativa (hemisferio sur)");
        }
        if (lng > 0) {
            return new Resultado(false, true, "Longitud inválida: debe ser negativa (Perú)");
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
