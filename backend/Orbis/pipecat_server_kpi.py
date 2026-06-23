import asyncio
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pipecat.frames.frames import Frame, TextFrame, EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.services.whisper.stt import WhisperSTTService
from pipecat.services.piper.tts import PiperTTSService
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport, TransportParams
from pipecat.transports.smallwebrtc.request_handler import SmallWebRTCRequestHandler, SmallWebRTCRequest
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection

# Importar lógica de Orbis
from agent import generar_sql

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OrbisPipecat")

app = FastAPI()

# Permitir CORS para pruebas web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PROCESADOR DE ORBIS ---
class OrbisAgentProcessor(FrameProcessor):
    def __init__(self):
        super().__init__()

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TextFrame):
            user_text = frame.text
            logger.info(f"🎙️ Orbis escuchó: {user_text}")
            
            # Llamar a la lógica ejecutiva de Orbis (SQL/Excel)
            # Simulamos el historial vacío o básico para la voz
            respuesta_ejecutiva = generar_sql(user_text, [], "Razonamiento")
            bot_text = respuesta_ejecutiva.get("mensaje", "No pude procesar esa solicitud.")
            
            # Limpiar Markdown para que Piper no lea asteriscos o tablas raras
            bot_text_clean = bot_text.replace("*", "").replace("|", " ").replace("-", " ")
            
            # Enviar respuesta al TTS
            await self.push_frame(TextFrame(bot_text_clean))
        
        if isinstance(frame, EndFrame):
            await self.push_frame(frame)

# --- HANDLER DE WEBRTC ---
# Usamos el puerto 8006 para la señalización WebRTC
webrtc_handler = SmallWebRTCRequestHandler()

@app.post("/offer")
async def handle_webrtc_offer(request: Request):
    logger.info("Recibida oferta WebRTC")
    params = await request.json()
    
    # Validar formato mínimo
    if "sdp" not in params or "type" not in params:
        raise HTTPException(status_code=400, detail="SDP u oferta faltante")

    webrtc_request = SmallWebRTCRequest(
        sdp=params["sdp"],
        type=params["type"],
        pc_id=params.get("pc_id")
    )

    async def on_webrtc_connection(connection):
        # Configurar el transporte Pipecat con la conexión WebRTC establecida
        transport = SmallWebRTCTransport(
            connection=connection,
            params=TransportParams(
                audio_out_enabled=True,
                audio_in_enabled=True
            )
        )

        # Servicios locales
        stt = WhisperSTTService()
        
        # TTS usando Piper (Voz en español de Harvard)
        tts = PiperTTSService(
            model_path="es_ES-sharvard-medium.onnx",
            config_path="es_ES-sharvard-medium.onnx.json"
        )

        # Orquestador Orbis
        agent = OrbisAgentProcessor()

        # Pipeline de Voz a Voz
        # Transport IN -> STT -> Agent -> TTS -> Transport OUT
        pipeline = Pipeline([
            transport.input(),
            stt,
            agent,
            tts,
            transport.output()
        ])

        # Tarea del Pipeline
        task = PipelineTask(pipeline)
        
        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            await task.cancel()

        runner = PipelineRunner()
        await runner.run(task)

    # El handler gestiona la negociación SDP y devuelve la respuesta (Answer)
    answer = await webrtc_handler.handle_web_request(webrtc_request, on_webrtc_connection)
    return answer

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Orbis Realtime Voice (WebRTC)"}

if __name__ == "__main__":
    import uvicorn
    # Iniciamos en el puerto 8006
    uvicorn.run(app, host="0.0.0.0", port=8006)
