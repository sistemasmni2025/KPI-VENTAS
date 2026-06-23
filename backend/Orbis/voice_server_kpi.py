from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
import os
import uuid
import subprocess
from faster_whisper import WhisperModel

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permitir conexiones desde cualquier origen (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Whisper (Usando tu GPU en Debian)
# device="cuda" aprovechará tu gráfica en el i9
model_size = "tiny"
model = WhisperModel(model_size, device="cuda", compute_type="float16")

# Directorio temporal para audios (Ruta Linux)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp_audio")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": model_size, "device": "cuda"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())[:8]
    print(f"[{session_id}] 🎤 Nueva solicitud de transcripción: {file.filename}")
    
    file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.m4a")
    try:
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        print(f"[{session_id}] 📁 Audio guardado temporalmente en: {file_path}")

        # Transcribir con Whisper (GPU activa)
        print(f"[{session_id}] 🧠 Iniciando WhisperModel.transcribe...")
        segments, info = model.transcribe(file_path, beam_size=5, language="es")
        
        print(f"[{session_id}] 📝 Consumiendo segmentos de audio...")
        text_segments = []
        for segment in segments:
            print(f"[{session_id}]   > Segmento: {segment.text}")
            text_segments.append(segment.text)
            
        text = " ".join(text_segments)
        print(f"[{session_id}] ✅ Transcripción completada: '{text.strip()}'")
        
        return {"text": text.strip()}
    
    except Exception as e:
        print(f"[{session_id}] ❌ Error durante la transcripción: {str(e)}")
        return {"text": "", "error": str(e)}
        
    finally:
        if os.path.exists(file_path):
            try: 
                os.remove(file_path)
                print(f"[{session_id}] 🗑️ Temporal eliminado.")
            except: 
                pass

@app.get("/speak")
async def text_to_speech(text: str):
    output_filename = f"{uuid.uuid4()}.wav"
    output_path = os.path.join(TEMP_DIR, output_filename)
    
    # Intentar detectar la ruta de piper automáticamente
    piper_path = "./piper/piper" 
    if not os.path.exists(piper_path):
        piper_path = "piper" # Intentar si está en el PATH global
    
    model_path = "es_ES-sharvard-medium.onnx"
    
    print(f"🔊 Generando audio para: '{text[:30]}...'")
    try:
        command = f'echo "{text}" | {piper_path} --model {model_path} --output_file {output_path}'
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Error en Piper: {result.stderr}")
            return {"error": "No se pudo generar el audio"}

        if not os.path.exists(output_path):
            print(f"❌ Archivo no generado en: {output_path}")
            return {"error": "Archivo de audio no encontrado"}

        return FileResponse(output_path, media_type="audio/wav")
    except Exception as e:
        print(f"❌ Error crítico en TTS: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
