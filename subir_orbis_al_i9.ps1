# Script de despliegue de Orbis KPI Chatbot al servidor i9 (172.16.71.208)
# Ejecuta este script desde la raíz del proyecto Ventas_Reporteo en PowerShell

$remotePath = "/home/mbo/Chat_Nieto/" # Ajusta la ruta remota en el i9 si es diferente
$server = "mbo@172.16.71.208"

# Mapeo de archivos locales a subir (se subirán con su nombre base al destino)
$files = @(
    "backend/Orbis/main_kpi.py",
    "backend/Orbis/agent_kpi.py",
    "backend/Orbis/database_kpi.py",
    "backend/Orbis/skills.py",
    "backend/Orbis/voice_server_kpi.py",
    "backend/Orbis/pipecat_server_kpi.py"
)

Write-Host "Iniciando despliegue de Orbis MySQL a servidor i9 ($server)..." -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Write-Host "Subiendo $file a $($remotePath)$($fileName)..." -ForegroundColor Yellow
        scp $file "$($server):$($remotePath)$($fileName)"
    } else {
        Write-Host "Error: No se encuentra el archivo local $file" -ForegroundColor Red
    }
}

Write-Host "Despliegue completado con éxito!" -ForegroundColor Green
Write-Host "Recuerda reiniciar el servicio (ej. pm2 restart o uvicorn) en la terminal de Linux del i9." -ForegroundColor Green
