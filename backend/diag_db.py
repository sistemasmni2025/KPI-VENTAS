import sys
import os
from sqlalchemy import func

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def run_diagnostics():
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diag_output.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("Iniciando diagnóstico de base de datos...\n")
        try:
            db = SessionLocal()
            
            # 1. Sucursales
            f.write("\n=== SUCURSALES ACTIVAS ===\n")
            sucursales = db.query(models.Sucursal).filter(models.Sucursal.SucursalStatus == True).all()
            for s in sucursales:
                f.write(f"ID: {s.SucursalID} | Nombre: {s.SucursalNombre} | Ventas: {s.SucursalVentas} | Tipo: {s.TipoSucursalClave}\n")

            # 2. Grupos (Marcas / Categorías)
            f.write("\n=== GRUPOS (MUESTRA DE 30) ===\n")
            grupos = db.query(models.Grupo).limit(30).all()
            for g in grupos:
                f.write(f"Clave: {g.GrupoClave} | Nombre: {g.GrupoNombre} | Tipo: {g.GrupoTipo} | Marca: {g.GrupoMarca} | Clasif: {g.GrupoClasificacion}\n")

            # Obtener valores distintos de GrupoTipo
            f.write("\n=== TIPOS DE GRUPO DISTINTOS ===\n")
            tipos = db.query(models.Grupo.GrupoTipo, func.count(models.Grupo.GrupoClave)).group_by(models.Grupo.GrupoTipo).all()
            for t in tipos:
                f.write(f"GrupoTipo: '{t[0]}' | Cantidad: {t[1]}\n")

            # Obtener clasificaciones distintas
            f.write("\n=== CLASIFICACIONES DE GRUPO DISTINTAS ===\n")
            clasifs = db.query(models.Grupo.GrupoClasificacion, func.count(models.Grupo.GrupoClave)).group_by(models.Grupo.GrupoClasificacion).all()
            for c in clasifs:
                f.write(f"GrupoClasificacion: '{c[0]}' | Cantidad: {c[1]}\n")

            # 3. AsesorObjetivo
            f.write("\n=== ASESOR OBJETIVO (MUESTRA DE 5) ===\n")
            objs = db.query(models.AsesorObjetivo).limit(5).all()
            for o in objs:
                f.write(f"Asesor: {o.AsesorClave} | Año: {o.AsesorObjetivoAnio} | Mes: {o.AsesorObjetivoMes} | Grupo: {o.GrupoClave} | Cantidad: {o.AsesorObjetivoCantidad}\n")

            # Años disponibles
            anios = db.query(models.AsesorObjetivo.AsesorObjetivoAnio).distinct().all()
            f.write(f"\nAños en Objetivos: {[a[0] for a in anios]}\n")

            # 4. DoctoDetalle y Docto
            f.write("\n=== DETALLES DE DOCUMENTOS (MUESTRA DE 5) ===\n")
            detalles = db.query(models.DoctoDetalle).limit(5).all()
            for d in detalles:
                f.write(f"Folio: {d.DoctoFolio} | Fecha: {d.DoctoFecha} | GrupoClave: {d.GrupoClave} | Cantidad: {d.DoctoDetalleCantidad} | Importe: {d.DoctoDetalleImporte}\n")

            # Rango de fechas de Docto
            fechas = db.query(func.min(models.Docto.DoctoFecha), func.max(models.Docto.DoctoFecha)).first()
            f.write(f"\nRango de Fechas: Mínima: {fechas[0]} | Máxima: {fechas[1]}\n")

            # Counts
            f.write("\n=== CONTEO DE TABLAS ===\n")
            f.write(f"Docto: {db.query(func.count(models.Docto.DoctoFolio)).scalar()}\n")
            f.write(f"DoctoDetalle: {db.query(func.count(models.DoctoDetalle.DoctoFolio)).scalar()}\n")
            f.write(f"AsesorObjetivo: {db.query(func.count(models.AsesorObjetivo.AsesorClave)).scalar()}\n")
            
            f.write("\nDiagnóstico finalizado con éxito.\n")
            db.close()
        except Exception as e:
            f.write(f"\nERROR: {str(e)}\n")

if __name__ == "__main__":
    run_diagnostics()
