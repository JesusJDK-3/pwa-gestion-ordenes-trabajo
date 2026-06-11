# Base de datos — Sistema OT KABJ

## Archivos esenciales

| Archivo | Uso |
|---------|-----|
| `bootstrap.sql` | Esquema base + datos semilla (desarrollo) |
| `add_gis_vpa_hidrante.sql` | Tablas GIS para carga Excel (VPA + hidrantes) |
| `add_acompanantes_purgado.sql` | Tablas de acompañantes y purgado hidrante |
| `../sistema_OT_BD_clean.sql` | Dump completo de referencia (producción/restore) |

## Orden de ejecución (BD nueva)

```bash
psql -U postgres -d sistema_ot -f database/bootstrap.sql
psql -U postgres -d sistema_ot -f database/add_gis_vpa_hidrante.sql
psql -U postgres -d sistema_ot -f database/add_acompanantes_purgado.sql
```

## Carga Excel (orden en la app)

1. **Admin** → VPA (`excel/BD_VPA (1).xlsx`)
2. **Admin** → Hidrantes (`excel/BD_HIDRANTES (1).xlsx`)
3. **Supervisor** → OTs (`excel/MAYO - PURGADO...xlsx` o `carga mntto prev vpa.xls`)
