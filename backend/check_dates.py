from database import SessionLocal
import models
from sqlalchemy import func

db = SessionLocal()
try:
    # 1. Rango de fechas en Docto
    min_date = db.query(func.min(models.Docto.DoctoFecha)).scalar()
    max_date = db.query(func.max(models.Docto.DoctoFecha)).scalar()
    print(f"RANGO DE FECHAS EN DOCTO: {min_date} a {max_date}")

    # 2. Total de documentos
    count = db.query(func.count(models.Docto.DoctoFolio)).scalar()
    print(f"TOTAL DOCUMENTOS EN DOCTO: {count}")

    # 3. Documentos por fecha (últimas 20 fechas)
    grouped = db.query(models.Docto.DoctoFecha, func.count(models.Docto.DoctoFolio))\
        .group_by(models.Docto.DoctoFecha)\
        .order_by(models.Docto.DoctoFecha.desc())\
        .limit(20).all()
    print("ULTIMAS 20 FECHAS CON DOCUMENTOS:")
    for date, cnt in grouped:
        print(f"  - {date}: {cnt} documentos")

    # 4. Total de registros detalle
    det_count = db.query(func.count(models.DoctoDetalle.DoctoFolio)).scalar()
    print(f"TOTAL DETALLES EN DOCTODETALLE: {det_count}")

    # 5. Documentos cancelados vs activos
    canceled = db.query(models.Docto.DoctoCancelado, func.count(models.Docto.DoctoFolio))\
        .group_by(models.Docto.DoctoCancelado).all()
    print("ESTADO DE CANCELADO EN DOCTO:")
    for status, cnt in canceled:
        print(f"  - Cancelado={status}: {cnt} documentos")

    # 6. Documentos por empresa
    empresas = db.query(models.Docto.EmpresaID, func.count(models.Docto.DoctoFolio))\
        .group_by(models.Docto.EmpresaID).all()
    print("DOCUMENTOS POR EMPRESA:")
    for emp, cnt in empresas:
        print(f"  - Empresa={emp}: {cnt} documentos")

finally:
    db.close()
