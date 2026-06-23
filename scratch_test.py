import urllib.request
import urllib.error

with open('c:\\Users\\SISTEMAS\\Documents\\Antigravity Projects\\Ventas_Reporteo\\http_debug.txt', 'w', encoding='utf-8') as f:
    f.write("=== HTTP DEBUG ===\n")
    for url in ["http://localhost:5175/", "http://127.0.0.1:5175/", "http://localhost:5173/"]:
        f.write(f"\nTesting: {url}\n")
        try:
            req = urllib.request.urlopen(url, timeout=2.0)
            f.write(f"Status: {req.status}\n")
            f.write(f"Headers:\n{req.headers}\n")
            f.write(f"Body:\n{req.read().decode('utf-8')[:500]}\n")
        except Exception as e:
            f.write(f"Error: {type(e).__name__} - {e}\n")
    }
]

output_path = r"c:\Users\SISTEMAS\Documents\Antigravity Projects\Ventas_Reporteo\db_diag_tables.txt"

with open(output_path, "w", encoding="utf-8") as f:
    f.write("=== DIAGNÓSTICO DE BASES DE DATOS ===\n")
    for cfg in db_configs:
        f.write(f"\nProbando conexión a {cfg['name']} ({cfg['host']}:{cfg['port']})...\n")
        try:
            conn = pymysql.connect(
                host=cfg["host"],
                port=cfg["port"],
                user=cfg["user"],
                password=cfg["password"],
                database=cfg["database"],
                connect_timeout=3.0
            )
            f.write("  ¡Conexión exitosa!\n")
            
            # Verificar si la tabla sucursal existe
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT COUNT(*) FROM sucursal")
                count = cursor.fetchone()[0]
                f.write(f"  Tabla 'sucursal' existe. Registros: {count}\n")
            except Exception as e_table:
                f.write(f"  Error al consultar 'sucursal': {e_table}\n")
                
            # Listar algunas tablas
            try:
                cursor.execute("SHOW TABLES")
                tables = [row[0] for row in cursor.fetchall()]
                f.write(f"  Tablas encontradas ({len(tables)}): {', '.join(tables[:15])}...\n")
            except Exception as e_show:
                f.write(f"  Error mostrando tablas: {e_show}\n")
                
            cursor.close()
            conn.close()
        except Exception as e:
            f.write(f"  Error de conexión: {e}\n")

print("Diagnostics completed. Written to db_diag_tables.txt")
