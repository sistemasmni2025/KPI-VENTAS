import pymysql
import polars as pl
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    
def init_db():
    # No-op en MySQL
    pass

def obtener_esquema_bd() -> str:
    """Extrae dinámicamente el esquema de la base de datos MySQL activa."""
    query = """
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position;
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        data = cursor.fetchall()
        
        schema_dict = {}
        for row in data:
            tbl, col, dtype = row
            if tbl not in schema_dict:
                schema_dict[tbl] = []
            schema_dict[tbl].append(f"{col} ({dtype})")
            
        cursor.close()
        conn.close()
        
        esquema_str = "Mapa Estructural Dinámico de la BD ('MySQL'):\n"
        for tbl, cols in schema_dict.items():
            esquema_str += f"- Tabla '{tbl}': {', '.join(cols)}\n"
            
        return esquema_str
    except Exception as e:
        print(f"Error obteniendo esquema: {e}")
        return "Error al extraer esquema desde MySQL."

def ejecutar_query_sql(query: str) -> pl.DataFrame:
    """Ejecuta una consulta SQL en MySQL y la vuelca rápidamente a un DataFrame Polars."""
    q_low = query.lower()
    unsafe_keywords = ['delete ', 'drop ', 'update ', 'insert ', 'truncate ', 'alter ', 'grant ', 'revoke ']
    if any(keyword in q_low for keyword in unsafe_keywords):
        raise ValueError("Bloqueo de Seguridad: Solo se permiten consultas SELECT (Lectura).")
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        
        # Validar que sea un select antes de intentar extraer datos
        if cursor.description is None:
            return pl.DataFrame()
            
        columns = [desc[0] for desc in cursor.description]
        data = cursor.fetchall()
        
        # Volcar a Polars
        df = pl.DataFrame(data, schema=columns, orient="row")

        # Corrección Crítica: Convertir tipos Decimal a Float64 para serialización JSON
        for col in df.columns:
            if "Decimal" in str(df[col].dtype) or df[col].dtype == pl.Object:
                try:
                    df = df.with_columns(pl.col(col).cast(pl.Float64))
                except:
                    # Si no es un número convertible, ignoramos
                    pass
        
        cursor.close()
        conn.close()
        return df
    except Exception as e:
        raise Exception(f"Falla MySQL: {str(e)}")
