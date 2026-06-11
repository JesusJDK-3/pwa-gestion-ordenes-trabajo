#!/usr/bin/env python3
"""
Script para aplicar migraciones de base de datos PostgreSQL.
Conecta a la BD y ejecuta el script de acompañantes y purgado.
"""

import psycopg2
import sys
from pathlib import Path

# Configuración de conexión (del application.properties)
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'sistema_ot',
    'user': 'postgres',
    'password': 'melcita123'
}

def read_sql_file(filepath):
    """Lee el archivo SQL."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"ERROR: Archivo no encontrado: {filepath}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR al leer archivo: {e}")
        sys.exit(1)

def apply_migrations():
    """Conecta a PostgreSQL y aplica el script SQL."""
    try:
        print("=" * 70)
        print("APLICANDO MIGRACIONES DE BASE DE DATOS")
        print("=" * 70)
        print()
        
        # Conexión a PostgreSQL
        print(f"[*] Conectando a PostgreSQL...")
        print(f"    Host: {DB_CONFIG['host']}")
        print(f"    Base de datos: {DB_CONFIG['database']}")
        print(f"    Usuario: {DB_CONFIG['user']}")
        print()
        
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("[✓] Conexión establecida")
        print()
        
        # Leer el script SQL
        script_path = Path(__file__).parent / 'add_acompanantes_purgado.sql'
        print(f"[*] Leyendo script SQL: {script_path}")
        sql_content = read_sql_file(script_path)
        print(f"[✓] Script cargado ({len(sql_content)} bytes)")
        print()
        
        # Ejecutar el script
        print("[*] Ejecutando script SQL...")
        try:
            cur.execute(sql_content)
            conn.commit()
            print("[✓] Script ejecutado exitosamente")
        except psycopg2.Error as e:
            print(f"[✗] ERROR SQL: {e}")
            conn.rollback()
            return False
        
        print()
        
        # Verificar que las tablas fueron creadas
        print("[*] Verificando tablas creadas...")
        print()
        
        # Tabla 1: op_ot_acompanante
        cur.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'op_ot_acompanante'
            ORDER BY ordinal_position
        """)
        
        acompanante_cols = cur.fetchall()
        if acompanante_cols:
            print("[✓] Tabla: op_ot_acompanante")
            for col in acompanante_cols:
                print(f"    - {col[1]}: {col[2]}")
            print()
        else:
            print("[✗] Tabla op_ot_acompanante NO fue creada")
            return False
        
        # Tabla 2: op_ot_purgado_hidrante
        cur.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'op_ot_purgado_hidrante'
            ORDER BY ordinal_position
        """)
        
        purgado_cols = cur.fetchall()
        if purgado_cols:
            print("[✓] Tabla: op_ot_purgado_hidrante")
            for col in purgado_cols:
                print(f"    - {col[1]}: {col[2]}")
            print()
        else:
            print("[✗] Tabla op_ot_purgado_hidrante NO fue creada")
            return False
        
        # Verificar funciones trigger
        print("[*] Verificando funciones trigger...")
        print()
        
        cur.execute("""
            SELECT proname FROM pg_proc 
            WHERE proname IN ('fn_validar_limite_acompanantes', 'fn_validar_purgado_obligatorios')
            ORDER BY proname
        """)
        
        functions = cur.fetchall()
        if len(functions) == 2:
            print("[✓] Funciones trigger creadas:")
            for func in functions:
                print(f"    - {func[0]}")
            print()
        else:
            print(f"[✗] Solo se encontraron {len(functions)} de 2 funciones esperadas")
            return False
        
        # Verificar índices
        print("[*] Verificando índices...")
        print()
        
        cur.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename IN ('op_ot_acompanante', 'op_ot_purgado_hidrante')
            ORDER BY indexname
        """)
        
        indexes = cur.fetchall()
        if indexes:
            print("[✓] Índices creados:")
            for idx in indexes:
                print(f"    - {idx[0]}")
            print()
        
        # Resumen final
        print("=" * 70)
        print("✓ MIGRACIONES APLICADAS EXITOSAMENTE")
        print("=" * 70)
        print()
        print("Las nuevas tablas están listas para ser usadas por el backend:")
        print("  • op_ot_acompanante (Acompañantes de OT)")
        print("  • op_ot_purgado_hidrante (Formulario técnico de purgado)")
        print()
        
        cur.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"[✗] ERROR DE CONEXIÓN: {e}")
        print()
        print("Verifica que PostgreSQL esté corriendo y que los datos de conexión sean correctos:")
        print(f"  Host: {DB_CONFIG['host']}")
        print(f"  Puerto: {DB_CONFIG['port']}")
        print(f"  Usuario: {DB_CONFIG['user']}")
        return False
    except Exception as e:
        print(f"[✗] ERROR INESPERADO: {e}")
        return False

if __name__ == '__main__':
    success = apply_migrations()
    sys.exit(0 if success else 1)
