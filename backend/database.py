from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configuración de URLs de conexión (intentaremos en orden de prioridad)
CONNECTION_URLS = [
    # 1. Base de datos QA / Ventas20 (nuevas credenciales)
    "mysql+pymysql://usrmulti:mni921016@172.16.71.199:3306/multiventas",
    "mysql+pymysql://usrmulti:mni921016@172.16.71.199:3306/Ventas20",
    "mysql+pymysql://root:root@172.16.71.199:3306/multiventas",
    # 2. Localhost con root/root en puerto 3306 (con hostname localhost y con IP 127.0.0.1)
    "mysql+pymysql://root:root@localhost:3306/multiventas",
    "mysql+pymysql://root:root@127.0.0.1:3306/multiventas",
    # 3. Localhost con root/root en otros puertos comunes
    "mysql+pymysql://root:root@localhost:3307/multiventas",
    "mysql+pymysql://root:root@127.0.0.1:3307/multiventas",
    "mysql+pymysql://root:root@localhost:3308/multiventas",
    "mysql+pymysql://root:root@127.0.0.1:3308/multiventas",
    # 4. Localhost sin contraseña
    "mysql+pymysql://root:@localhost:3306/multiventas",
    "mysql+pymysql://root:@127.0.0.1:3306/multiventas",
]

engine = None
db_connection_errors = []

for url in CONNECTION_URLS:
    try:
        # Intentamos crear el motor con un timeout bajo para no bloquear
        temp_engine = create_engine(url, connect_args={"connect_timeout": 3})
        # Intentamos realizar una conexión rápida de prueba
        with temp_engine.connect() as conn:
            print(f"Conexión exitosa a la base de datos usando: {url}")
            engine = temp_engine
            break
    except Exception as e:
        db_connection_errors.append({"url": url, "error": str(e)})

# Si ninguno funciona, dejamos el primero por defecto para evitar errores de inicialización
if engine is None:
    print("ADVERTENCIA: No se pudo conectar a ninguna base de datos local/QA. Usando URL por defecto.")
    engine = create_engine(CONNECTION_URLS[0])

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

