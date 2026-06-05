import sys
import json
import traceback

def scan():
    try:
        try:
            import pymysql
        except ImportError:
            import subprocess
            print("Instalando pymysql...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql"])
            import pymysql

        db_config = {
            'host': '172.16.71.199',
            'port': 3606,
            'user': 'root',
            'password': 'root',
            'database': 'multiventas'
        }
        
        print("Conectando a la base de datos...")
        connection = pymysql.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database']
        )

        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        
        schema = {}
        for table in tables:
            cursor.execute(f"DESCRIBE `{table}`")
            columns = cursor.fetchall()
            schema[table] = [
                {
                    "field": col[0],
                    "type": str(col[1]),
                    "null": col[2],
                    "key": col[3],
                    "default": str(col[4]) if col[4] is not None else None,
                    "extra": col[5]
                }
                for col in columns
            ]
            
        with open("db_schema.json", "w", encoding="utf-8") as f:
            json.dump({"status": "success", "tables": schema}, f, indent=2, ensure_ascii=False)
            
        print("¡Escaneo exitoso! Se ha guardado la estructura en db_schema.json")
        connection.close()

    except Exception as e:
        print(f"Error: {e}")
        with open("db_schema.json", "w", encoding="utf-8") as f:
            json.dump({"status": "error", "error": str(e), "traceback": traceback.format_exc()}, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    scan()
