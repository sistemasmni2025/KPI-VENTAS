import os
import requests
import json
import re
from dotenv import load_dotenv
from database_kpi import ejecutar_query_sql, obtener_esquema_bd
from skills import analizar_archivo_datos

load_dotenv()

def generar_sql(texto_usuario: str, historial: list = None, modelo_elegido: str = "Razonamiento", error_previo: str = None) -> dict:
    
    ollama_host = os.getenv("OLLAMA_HOST", "http://172.16.71.208:11434")
    modelo_real = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    
    # Forzamos temperatura 0.0 para máxima precisión en herramientas
    temperatura = 0.0
    
    system_prompt = f"""
# ROLE: ORBIS - Tu Asistente de Multillantas Nieto (MySQL Experto)

# DICCIONARIO DE TABLAS Y COLUMNAS:
- docto (Cabecera de factura/documento): EmpresaID, SucursalID, DoctoFolio, DoctoFecha, DoctoTipo, ClienteNombre, AsesorID, DoctoCancelado (0 = Activo, 1 = Cancelado).
- doctodetalle (Detalle de factura/documento): EmpresaID, SucursalID, DoctoFolio, DoctoFecha, DoctoDetalleCantidad, DoctoDetalleCosto, DoctoDetallePVenta, DoctoDetalleImporte, DoctoDetalleDescripcion, GrupoClave.
- asesor (Vendedores): AsesorClave, AsesorNombre, EmpresaID, SucursalID, AsesorStatus.
- sucursal: SucursalID, SucursalNombre, EmpresaID, SucursalStatus.
- grupo (Grupo de productos): GrupoClave, GrupoNombre, EmpresaID.
- empresa: EmpresaID, EmpresaNombre.

# REGLAS DE SQL (CRÍTICO):
1. Usa comillas simples o dobles de forma estándar para MySQL. No uses sintaxis específica de PostgreSQL.
2. JOINS PRINCIPALES (LLAVES COMPUESTAS):
   - Detalle con Cabecera: `doctodetalle.DoctoFolio = docto.DoctoFolio AND doctodetalle.EmpresaID = docto.EmpresaID AND doctodetalle.SucursalID = docto.SucursalID AND doctodetalle.DoctoFecha = docto.DoctoFecha`
   - Cabecera con Asesor: `docto.AsesorID = asesor.AsesorClave AND docto.EmpresaID = asesor.EmpresaID AND docto.SucursalID = asesor.SucursalID`
   - Cabecera con Sucursal: `docto.SucursalID = sucursal.SucursalID AND docto.EmpresaID = sucursal.EmpresaID`
   - Detalle con Grupo: `doctodetalle.GrupoClave = grupo.GrupoClave AND doctodetalle.EmpresaID = grupo.EmpresaID`
3. FILTRO OBLIGATORIO DE CANCELADOS:
   - Filtra SIEMPRE las ventas reales con `docto.DoctoCancelado = 0`.
4. El importe total vendido es la suma de `DoctoDetalleImporte`.
5. Si piden marcas (como Michelin, Bridgestone, Tornel, BFGoodrich), éstas suelen estar descritas en `doctodetalle.DoctoDetalleDescripcion`. Usa `LIKE '%michelin%'` o similar en la descripción, o agrupa por `grupo.GrupoNombre`.
6. COMPATIBILIDAD CON ONLY_FULL_GROUP_BY (CRÍTICO):
   El servidor MySQL tiene activa la regla `ONLY_FULL_GROUP_BY`. Esto significa que todas las columnas que selecciones en el SELECT y que no tengan una función de agregación (como SUM, COUNT, AVG) DEBEN estar incluidas explícitamente en la cláusula GROUP BY.
   - Ejemplo incorrecto: `SELECT asesor.AsesorClave, asesor.AsesorNombre, SUM(...) GROUP BY asesor.AsesorClave` (Dará error 1055).
   - Ejemplo correcto: `SELECT asesor.AsesorClave, asesor.AsesorNombre, SUM(...) GROUP BY asesor.AsesorClave, asesor.AsesorNombre` (Funcionará).
   Siempre asegúrate de que toda columna no agregada seleccionada esté en el GROUP BY.

# SKILLS Y ARCHIVOS:
- Si el mensaje incluye rutas de archivos (ej. [ARCHIVOS ADJUNTOS...]), DEBES usar `analizar_archivo`. 

# REGLAS DE RESPUESTA:
1. SIN TECNICISMOS NI TRASFONDO (CRÍTICO): No menciones términos técnicos de programación o base de datos. No hables de "consultar base de datos", "query SQL", "tablas", "columnas", "joins", "backend", ni muestres fragmentos de código SQL en tus explicaciones de texto. El usuario solo quiere ver el resultado final limpio, digerible y profesional.
2. Mantén un tono sumamente empático, cortés, educado y con mucho tacto en español.
3. SI EL RESULTADO ES UN SOLO VALOR, NO USES TABLAS MARKDOWN. Responde directamente en un texto elegante.
4. Si los resultados son de múltiples registros, haz una breve introducción cordial de los datos encontrados y deja que la aplicación renderice la tabla visualmente.
5. OBLIGATORIO: Al final de tu respuesta, propón exactamente 3 preguntas inteligentes para seguir explorando.
6. CADA sugerencia DEBE empezar con `SUGERENCIA:` seguida de la pregunta.
7. NO uses listas numeradas para las sugerencias.
8. FORMATO EXACTO AL FINAL:
SUGERENCIA: ¿Cuál es el asesor que ha realizado más ventas este mes?
SUGERENCIA: Muestra las ventas agrupadas por sucursal.
SUGERENCIA: ¿Cuál es el producto más vendido en la sucursal matriz?

# INSTRUCCIONES DE HERRAMIENTAS:
- Tu mensaje de llamada a herramienta debe ser ÚNICAMENTE el JSON.
"""

    if error_previo:
         texto_usuario += f"\n\nERROR PREVIO: {error_previo}. Corrige la consulta SQL para MySQL."

    mensajes_ollama = [{"role": "system", "content": system_prompt}]
    
    if historial:
        for msg in historial:
            content = msg.get("content", "")
            if len(content) > 2000:
                content = content[:2000] + " ... [Truncado]"
            mensajes_ollama.append({"role": msg.get("role", "user"), "content": content})
            
    archivos_adjuntos = re.findall(r'\[ARCHIVOS ADJUNTOS POR EL USUARIO: (.*?)\]', texto_usuario)
    
    if archivos_adjuntos:
        rutas = archivos_adjuntos[0].split(',')
        contenido_extraido = ""
        for ruta in rutas:
            ruta = ruta.strip()
            hoja_pedida = None
            match_hoja = re.search(r'(?:hoja|pestaña|pestana)\s+([a-zA-Z0-9_\-\s]+)', texto_usuario, re.I)
            if match_hoja:
                hoja_pedida = match_hoja.group(1).strip()
            
            contenido = analizar_archivo_datos(ruta, hoja=hoja_pedida)
            contenido_extraido += f"\n\n--- ARCHIVO: {ruta} ---\n{contenido}"
            
        texto_usuario_limpio = re.sub(r'\[ARCHIVOS ADJUNTOS POR EL USUARIO: (.*?)\]', '', texto_usuario).strip()
        texto_usuario = f"[DATOS DEL ARCHIVO ADJUNTO:\n{contenido_extraido}]\n\nPREGUNTA:\n\"{texto_usuario_limpio}\""
    
    mensajes_ollama.append({"role": "user", "content": texto_usuario})

    url = f"{ollama_host}/api/chat"
    
    payload = {
        "model": modelo_real,
        "messages": mensajes_ollama,
        "stream": False,
        "options": { "temperature": temperatura },
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "consultar_base_datos",
                    "description": "Filtra y extrae información sobre Multillantas Nieto usando MySQL",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "sql_query": { "type": "string", "description": "Query SQL puro para MySQL." }
                        },
                        "required": ["sql_query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "analizar_archivo",
                    "description": "Lee archivos Excel, CSV. Soporta selección de hojas.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "ruta_archivo": { "type": "string", "description": "Ruta." },
                            "hoja": { "type": "string", "description": "Nombre de hoja." }
                        },
                        "required": ["ruta_archivo"]
                    }
                }
            }
        ]
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=300)
        resp.raise_for_status()
        resultado = resp.json()
        message = resultado.get("message", {})
        
        max_intentos = 2
        intento = 0
        
        while (("tool_calls" in message and len(message["tool_calls"]) > 0) or 
               ('{' in message.get("content", "") and '"name":' in message.get("content", ""))) and intento < max_intentos:
            intento += 1
            
            tool = None
            if "tool_calls" in message and len(message["tool_calls"]) > 0:
                tool = message["tool_calls"][0]
            else:
                content = message.get("content", "")
                json_match = re.search(r'(\{.*?"name":.*?\})', content, re.DOTALL)
                if json_match:
                    try:
                        raw_json = json_match.group(1)
                        parsed = json.loads(raw_json)
                        tool = {
                            "function": {
                                "name": parsed.get("name"),
                                "arguments": parsed.get("parameters") or parsed.get("arguments")
                            }
                        }
                    except: pass
            
            if not tool: break

            # BORRAR contenido explicativo antes de llamar a la herramienta
            message["content"] = "" 
            
            args = tool.get("function", {}).get("arguments", {})
            if isinstance(args, str):
                try: args = json.loads(args)
                except: pass
            nombre_tool = tool.get("function", {}).get("name", "")
            
            res_str = ""
            query_sql = ""
            
            if nombre_tool == "consultar_base_datos":
                query_sql = args.get("sql_query", "").strip()
                if not query_sql:
                    res_str = "ERROR: No SQL."
                else:
                    try:
                        df = ejecutar_query_sql(query_sql)
                        datos_ia = df.head(15).to_dicts() if df.shape[0] > 0 else []
                        res_str = f"RESULTADO ({df.shape[0]} registros): {str(datos_ia)}"
                    except Exception as e_sql:
                        res_str = f"ERROR SQL: {str(e_sql)}"
            
            elif nombre_tool == "analizar_archivo":
                ruta = args.get("ruta_archivo", "").strip()
                hoja = args.get("hoja", "").strip() or None
                res_str = analizar_archivo_datos(ruta, hoja=hoja)
            
            sql_final_provisional = query_sql if nombre_tool == "consultar_base_datos" else None
            mensajes_ollama.append(message)
            mensajes_ollama.append({"role": "tool", "content": res_str, "name": nombre_tool})
            
            payload_siguiente = {
                "model": modelo_real,
                "messages": mensajes_ollama,
                "stream": False,
                "options": { "temperature": 0.0 }
            }
            resp2 = requests.post(url, json=payload_siguiente, timeout=300)
            message = resp2.json().get("message", {})
            
        texto_final = message.get("content", "Procesado.").strip()
        
        # LIMPIADOR: Solo eliminamos el bloque JSON del nombre de la herramienta, NO el resto del texto.
        texto_final = re.sub(r'\{.*?"name":.*?\}', '', texto_final, flags=re.DOTALL).strip()
        texto_final = re.sub(r'```json.*?```', '', texto_final, flags=re.DOTALL).strip()
        
        has_sql = intento > 0 and "sql_final_provisional" in locals() and bool(sql_final_provisional)
        return {
            "tipo": "sql" if has_sql else "chat",
            "mensaje": texto_final,
            "query": sql_final_provisional if has_sql else ""
        }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(f"Falla crítica: {str(e)}")
