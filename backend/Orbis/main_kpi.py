from fastapi import FastAPI, HTTPException, UploadFile, File
import feedparser
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.responses import StreamingResponse
import io
import time
import os
import shutil

from agent_kpi import generar_sql
from database_kpi import ejecutar_query_sql
import whisper
import tempfile
import edge_tts
import asyncio

# --- Autodetectar FFmpeg en Windows (Self-Healing) ---
if os.name == 'nt':
    import shutil
    if not shutil.which("ffmpeg"):
        # Intentar buscar en rutas comunes de WinGet
        posibles_rutas = [
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"),
        ]
        for base in posibles_rutas:
            if os.path.exists(base):
                # Buscar carpetas que contengan ffmpeg
                for folder in os.listdir(base):
                    if "ffmpeg" in folder.lower():
                        bin_path = os.path.join(base, folder, "ffmpeg-8.1-full_build", "bin")
                        if not os.path.exists(bin_path): # Caso alternativo de estructura
                             bin_path = os.path.join(base, folder, "bin")
                        
                        # Si encontramos el binario, lo agregamos al PATH de la sesión
                        if os.path.exists(os.path.join(bin_path, "ffmpeg.exe")):
                            os.environ["PATH"] += os.pathsep + bin_path
                            print(f"🚀 FFmpeg detectado y activado automáticamente en: {bin_path}")
                            break

# Cargar modelo Whisper (esto puede tardar unos segundos al iniciar el server)
print("Cargando modelo Whisper 'base' en CPU para ahorrar VRAM...")
model_whisper = whisper.load_model("base", device="cpu")
print("Modelo Whisper cargado en CPU.")

app = FastAPI(title="Backend IA Nieto")

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    saved_files = []
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(file_path)
    return {"status": "success", "archivos_guardados": saved_files}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    mensaje: str
    historial: List[Dict[str, Any]] = []
    modelo: str = "Razonamiento"
    empresa_id: Optional[int] = None

def procesar_texto_y_sugerencias(texto: str):
    """Extrae las 'SUGERENCIA:' del texto devuelto por Ollama."""
    if not texto:
        return "", []
        
    limpio = []
    sugerencias_encontradas = []
    for linea in texto.split('\n'):
        if linea.strip().startswith("SUGERENCIA:"):
            # Quitar la palabra clave para dárselas limpias al Front
            sug = linea.replace("SUGERENCIA:", "").strip()
            # Quitar posibles comillas o guiones extra
            sug = sug.lstrip('-').lstrip('"').rstrip('"').strip()
            if sug:
                sugerencias_encontradas.append(sug)
        else:
            limpio.append(linea)
            
    return '\n'.join(limpio).strip(), sugerencias_encontradas

@app.post("/api/chat")
def procesar_chat(request: ChatRequest):
    try:
        start_time = time.time()
        
        ia_respuesta = generar_sql(
            texto_usuario=request.mensaje,
            historial=request.historial,
            modelo_elegido=request.modelo,
            empresa_id=request.empresa_id
        )
        gen_time = time.time()
        
        if ia_respuesta["tipo"].lower() == "chat":
            msg_limpio, sugs = procesar_texto_y_sugerencias(ia_respuesta["mensaje"])
            return {
                "status": "success",
                "mensaje": msg_limpio,
                "sugerencias": sugs,
                "sql_generado": None,
                "total_registros": 0,
                "datos": [],
                "tiempos": {
                    "ia_segundos": round(gen_time - start_time, 2),
                    "bd_segundos": 0
                }
            }
            
        query = ia_respuesta["query"]
        datos = []
        df_len = 0
        mensaje_amigable = ia_respuesta.get("mensaje", "Respuesta analítica procesada.")
        
        try:
            df = ejecutar_query_sql(query)
            df_len = df.shape[0]
            if df_len > 0:
                if df_len > 2000:
                    datos = df.head(2000).to_dicts()
                else:
                    datos = df.to_dicts()
        except Exception as e_sql:
            error_msg = str(e_sql)
            
            rescate_respuesta = generar_sql(
                texto_usuario=request.mensaje,
                historial=request.historial,
                modelo_elegido=request.modelo,
                error_previo=error_msg,
                empresa_id=request.empresa_id
            )
            gen_time = time.time()
            
            if rescate_respuesta["tipo"].lower() == "sql":
                query = rescate_respuesta["query"]
                mensaje_amigable = rescate_respuesta.get("mensaje", "He auto-corregido mi consulta.")
                try:
                    df = ejecutar_query_sql(query)
                    df_len = df.shape[0]
                    if df_len > 0:
                        if df_len > 2000:
                            datos = df.head(2000).to_dicts()
                        else:
                            datos = df.to_dicts()
                except Exception as e_rescate:
                    import traceback
                    print(f"⚠️ Error de consulta en base de datos: {str(e_rescate)}")
                    traceback.print_exc()
                    
                    msg_limpio, sugs = procesar_texto_y_sugerencias(
                        "Disculpa, he tenido un inconveniente al consultar la información. "
                        "¿Podrías intentar replantear tu pregunta de otra forma?\n\n"
                        "SUGERENCIA: ¿Cuáles son las marcas más vendidas?\n"
                        "SUGERENCIA: Muestra las ventas totales de este mes\n"
                        "SUGERENCIA: ¿Quién es el asesor con mayores ventas?"
                    )
                    return {
                        "status": "success",
                        "mensaje": msg_limpio,
                        "sugerencias": sugs,
                        "sql_generado": None,
                        "total_registros": 0,
                        "datos": [],
                        "tiempos": {
                            "ia_segundos": round(gen_time - start_time, 2),
                            "bd_segundos": 0
                        }
                    }
            else:
                msg_limpio, sugs = procesar_texto_y_sugerencias(rescate_respuesta["mensaje"])
                return {
                    "status": "success",
                    "mensaje": msg_limpio,
                    "sugerencias": sugs,
                    "sql_generado": None,
                    "total_registros": 0,
                    "datos": [],
                    "tiempos": {
                        "ia_segundos": round(gen_time - start_time, 2),
                        "bd_segundos": 0
                    }
                }
        
        db_time = time.time()
        
        msg_limpio, sugs = procesar_texto_y_sugerencias(mensaje_amigable)
            
        return {
            "status": "success",
            "mensaje": msg_limpio,
            "sugerencias": sugs,
            "sql_generado": query,
            "total_registros": df_len,
            "datos": datos,
            "tiempos": {
                "ia_segundos": round(gen_time - start_time, 2),
                "bd_segundos": round(db_time - gen_time, 2)
            }
        }
        
    except Exception as e:
        import traceback
        print("-" * 50)
        print(f"ERROR CRÍTICO EN /api/chat: {str(e)}")
        traceback.print_exc()
        print("-" * 50)
        raise HTTPException(status_code=500, detail=f"Falla Interna: {str(e)}")

@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Recibe un archivo de audio, lo transcribe usando Whisper y devuelve el texto.
    El archivo se maneja de forma efímera para privacidad.
    """
    tmp_path = None
    print(f"🎤 Recibiendo audio: {audio.filename} ({audio.content_type})")
    try:
        # Crear un archivo temporal con sufijo apropiado
        suffix = ".webm"
        if audio.filename:
            _, ext = os.path.splitext(audio.filename)
            if ext: suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name
        
        print(f"📁 Audio guardado temporalmente en: {tmp_path}")

        # Transcribir usando el modelo cargado
        start_t = time.time()
        result = model_whisper.transcribe(tmp_path, language="es")
        end_t = time.time()
        
        transcripcion = result["text"].strip()
        print(f"✅ Transcripción exitosa en {round(end_t - start_t, 2)}s: '{transcripcion}'")
        
        return {"text": transcripcion}
    
    except Exception as e:
        print(f"❌ Error en /api/transcribe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpieza absoluta del archivo temporal
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                print(f"🗑️ Archivo temporal eliminado: {tmp_path}")
            except Exception as e_rem:
                print(f"⚠️ No se pudo eliminar el temporal: {e_rem}")

class ExportRequest(BaseModel):
    query: str

@app.post("/api/export")
def exportar_csv(request: ExportRequest):
    try:
        df = ejecutar_query_sql(request.query)
        if df.shape[0] == 0:
            raise HTTPException(status_code=404, detail="No hay datos para exportar")
            
        csv_str = df.write_csv()
        csv_bytes = csv_str.encode('utf-8-sig')
        
        return StreamingResponse(
            io.BytesIO(csv_bytes),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_nieto_full.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tts")
async def text_to_speech(text: str):
    """
    Convierte texto a audio MP3 usando la voz de Jorge (México).
    """
    try:
        VOICE = "es-MX-JorgeNeural"
        # Usar tempfile para el audio generado
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp_path = tmp.name
        
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(tmp_path)
        
        def iterfile():
            with open(tmp_path, "rb") as f:
                yield from f
            # Intentar eliminar el archivo después de enviarlo
            try: os.remove(tmp_path)
            except: pass

        return StreamingResponse(iterfile(), media_type="audio/mpeg")
    
    except Exception as e:
        print(f"❌ Error en TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news")
def get_automotive_news():
    """Obtiene noticias reales del sector automotriz vía RSS."""
    feeds = [
        "https://www.motorpasion.com.mx/feed",
        "https://www.eluniversal.com.mx/rss/autopistas.xml"
    ]
    all_news = []
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:8]: # Tomamos las 8 más recientes de cada uno
                # Limpiar un poco el título si es necesario
                titulo = entry.title.strip()
                if titulo and titulo not in all_news:
                    all_news.append(titulo)
        except Exception as e:
            print(f"Error leyendo feed {url}: {e}")
            continue
    
    # Fallback si no hay internet o fallan los feeds
    if not all_news:
        return [
            "Tendencia: El sector automotriz en México crece un 15% en exportaciones.",
            "Tecnología: Nuevos sensores de presión para llantas inteligentes llegan al mercado.",
            "Dato: Multillantas Nieto refuerza su inventario con tecnología Star Schema."
        ]
        
    return all_news

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_kpi:app", host="0.0.0.0", port=8000, reload=True)
