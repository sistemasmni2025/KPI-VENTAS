from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, db_connection_errors
import models

app = FastAPI(title="VentasPro CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API de VentasPro en línea y conectada."}

@app.get("/api/debug/db-errors")
def get_db_errors():
    return {"errors": db_connection_errors}

@app.get("/api/empresas")
def get_empresas():
    # Las empresas están fijas porque no existe tabla Empresa en la BD
    return [
        {"id": 1, "nombre": "Multillantas Nieto"},
        {"id": 2, "nombre": "Rodamientos"},
        {"id": 4, "nombre": "SLR"}
    ]

SUCURSALES_DATA = [
    # Empresa 1: Multillantas Nieto
    {"id": 1, "nombre": "Celaya", "empresa_id": 1},
    {"id": 2, "nombre": "Querétaro", "empresa_id": 1},
    {"id": 3, "nombre": "San Luis Potosi", "empresa_id": 1},
    {"id": 4, "nombre": "Aguascalientes", "empresa_id": 1},
    {"id": 5, "nombre": "León", "empresa_id": 1},
    {"id": 6, "nombre": "Irapuato", "empresa_id": 1},
    {"id": 37, "nombre": "Guadalajara", "empresa_id": 1},
    {"id": 49, "nombre": "Silao", "empresa_id": 1},
    {"id": 52, "nombre": "Irapuato Centro", "empresa_id": 1},
    {"id": 55, "nombre": "Tlalnepantla", "empresa_id": 1},
    {"id": 56, "nombre": "Altamira", "empresa_id": 1},
    {"id": 61, "nombre": "La Viga", "empresa_id": 1},
    {"id": 63, "nombre": "San Juan del Rio", "empresa_id": 1},
    
    # Empresa 2: Rodamientos
    {"id": 34, "nombre": "Rodor Leon", "empresa_id": 2},
    {"id": 53, "nombre": "Rodor San Miguel de Allende", "empresa_id": 2},
    {"id": 54, "nombre": "Rodor Licitaciones", "empresa_id": 2},
    {"id": 102, "nombre": "Rodor Celaya", "empresa_id": 2},
    {"id": 110, "nombre": "Rodor Aguascalientes", "empresa_id": 2},
    {"id": 111, "nombre": "Rodor Leon 2", "empresa_id": 2},

    # Empresa 4: SLR
    {"id": 131, "nombre": "SLR Bodega Celaya", "empresa_id": 4},
    {"id": 132, "nombre": "SLR Queretaro", "empresa_id": 4},
    {"id": 133, "nombre": "SLR Guadalajara", "empresa_id": 4},
    {"id": 147, "nombre": "SLR Altamira", "empresa_id": 4},
    {"id": 149, "nombre": "SLR Celaya", "empresa_id": 4},
    {"id": 150, "nombre": "SLR Bodega QRO", "empresa_id": 4},
    {"id": 151, "nombre": "SLR San Luis Potosi", "empresa_id": 4},
    {"id": 152, "nombre": "SLR Leon", "empresa_id": 4},
    {"id": 153, "nombre": "SLR Aguascalientes", "empresa_id": 4},
    {"id": 154, "nombre": "SLR Irapuato", "empresa_id": 4},
    {"id": 155, "nombre": "SLR Irap Centro", "empresa_id": 4},
    {"id": 156, "nombre": "SLR Silao", "empresa_id": 4},
    {"id": 157, "nombre": "SLR San Juan del Rio", "empresa_id": 4},
    {"id": 158, "nombre": "SLR Tlalnepantla", "empresa_id": 4},
    {"id": 159, "nombre": "SLR La Viga", "empresa_id": 4}
]

@app.get("/api/sucursales")
def get_sucursales():
    return SUCURSALES_DATA

@app.get("/api/debug/info")
def get_debug_info(db: Session = Depends(get_db)):
    try:
        # Sucursales
        sucursales = db.query(models.Sucursal).all()
        suc_list = [{"id": s.SucursalID, "nombre": s.SucursalNombre, "status": s.SucursalStatus, "ventas": s.SucursalVentas} for s in sucursales]

        # Grupos
        grupos = db.query(models.Grupo).limit(100).all()
        grupos_list = [{"clave": g.GrupoClave, "nombre": g.GrupoNombre, "tipo": g.GrupoTipo, "marca": g.GrupoMarca, "clasificacion": g.GrupoClasificacion} for g in grupos]

        # Distinct GrupoTipo/Clasificacion
        distinct_types = db.query(models.Grupo.GrupoTipo, func.count(models.Grupo.GrupoClave)).group_by(models.Grupo.GrupoTipo).all()
        distinct_types_list = [{"tipo": dt[0], "count": dt[1]} for dt in distinct_types]

        distinct_clasif = db.query(models.Grupo.GrupoClasificacion, func.count(models.Grupo.GrupoClave)).group_by(models.Grupo.GrupoClasificacion).all()
        distinct_clasif_list = [{"clasificacion": dc[0], "count": dc[1]} for dc in distinct_clasif]

        # Date range in Docto
        min_date = db.query(func.min(models.Docto.DoctoFecha)).scalar()
        max_date = db.query(func.max(models.Docto.DoctoFecha)).scalar()

        # Counts
        counts = {
            "sucursales": len(sucursales),
            "docto": db.query(func.count(models.Docto.DoctoFolio)).scalar(),
            "doctodetalle": db.query(func.count(models.DoctoDetalle.DoctoFolio)).scalar(),
            "asesorobjetivo": db.query(func.count(models.AsesorObjetivo.AsesorClave)).scalar(),
            "grupo": db.query(func.count(models.Grupo.GrupoClave)).scalar(),
        }

        return {
            "sucursales": suc_list,
            "grupos_sample": grupos_list,
            "distinct_grupo_tipo": distinct_types_list,
            "distinct_grupo_clasif": distinct_clasif_list,
            "date_range": {"min": str(min_date), "max": str(max_date)},
            "counts": counts
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ventas/sucursal/{sucursal_id}")
def get_ventas_sucursal(sucursal_id: int, empresa_id: int = None, anio: int = None, fecha_inicio: str = None, fecha_fin: str = None, db: Session = Depends(get_db)):
    try:
        from datetime import datetime
        
        sucursal_nombre = f"Sucursal {sucursal_id}"
        for s in SUCURSALES_DATA:
            if s["id"] == sucursal_id:
                sucursal_nombre = s["nombre"]
                break

        # Parse dates
        fecha_inicio_dt = None
        if fecha_inicio:
            try:
                fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            except ValueError:
                pass

        fecha_fin_dt = None
        if fecha_fin:
            try:
                fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            except ValueError:
                pass

        # 2. Si no se especifica el año, obtener el último disponible en Docto o por defecto 2026
        if not anio:
            if fecha_fin_dt:
                anio = fecha_fin_dt.year
            elif fecha_inicio_dt:
                anio = fecha_inicio_dt.year
            else:
                max_date = db.query(func.max(models.Docto.DoctoFecha)).scalar()
                if max_date:
                    anio = max_date.year
                else:
                    max_obj_year = db.query(func.max(models.AsesorObjetivo.AsesorObjetivoAnio)).scalar()
                    anio = max_obj_year if max_obj_year else 2026

        # 3. Consultar los objetivos mensuales de la tabla asesorobjetivo
        obj_filters = [
            models.AsesorObjetivo.SucursalID == sucursal_id,
            models.AsesorObjetivo.AsesorObjetivoAnio == anio
        ]
        if empresa_id is not None:
            obj_filters.append(models.AsesorObjetivo.EmpresaID == empresa_id)

        objectives_raw = db.query(
            models.AsesorObjetivo.AsesorObjetivoMes.label('mes'),
            models.Grupo.GrupoNombre.label('grupo_nombre'),
            models.Grupo.GrupoTipo.label('grupo_tipo'),
            func.sum(models.AsesorObjetivo.AsesorObjetivoCantidad).label('objetivo')
        ).join(
            models.Grupo,
            models.AsesorObjetivo.GrupoClave == models.Grupo.GrupoClave
        ).filter(
            *obj_filters
        ).group_by(
            models.AsesorObjetivo.AsesorObjetivoMes,
            models.Grupo.GrupoNombre,
            models.Grupo.GrupoTipo
        ).all()

        # 4. Consultar ventas
        sales_filters = [
            models.Docto.SucursalID == sucursal_id,
            models.Docto.DoctoCancelado == 0
        ]
        if empresa_id is not None:
            sales_filters.append(models.Docto.EmpresaID == empresa_id)
        
        if fecha_inicio_dt:
            sales_filters.append(models.Docto.DoctoFecha >= fecha_inicio_dt)
        if fecha_fin_dt:
            sales_filters.append(models.Docto.DoctoFecha <= fecha_fin_dt)
        
        # Si no hay fechas exactas, filtramos por año
        if not fecha_inicio_dt and not fecha_fin_dt:
            sales_filters.append(func.extract('year', models.Docto.DoctoFecha) == anio)

        sales_raw = db.query(
            func.extract('month', models.DoctoDetalle.DoctoFecha).label('mes'),
            models.Grupo.GrupoNombre.label('grupo_nombre'),
            models.Grupo.GrupoTipo.label('grupo_tipo'),
            func.sum(models.DoctoDetalle.DoctoDetalleCantidad).label('cantidad'),
            func.sum(models.DoctoDetalle.DoctoDetalleImporte).label('importe')
        ).join(
            models.Docto,
            (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
            (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
            (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
            (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
        ).join(
            models.Grupo,
            models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave
        ).filter(
            *sales_filters
        ).group_by(
            func.extract('month', models.DoctoDetalle.DoctoFecha),
            models.Grupo.GrupoNombre,
            models.Grupo.GrupoTipo
        ).all()

        # Helper para clasificar marcas
        def get_brand_key(name: str):
            if not name:
                return "Otras Marcas"
            name_lower = name.lower()
            if "michelin" in name_lower:
                return "Michelin"
            elif "bfgoodrich" in name_lower or "bfg" in name_lower:
                return "BFGoodrich"
            elif "uniroyal" in name_lower:
                return "Uniroyal"
            elif "valian" in name_lower:
                return "Valian"
            elif "nipon" in name_lower or "nippon" in name_lower:
                return "Nipon"
            else:
                return "Otras Marcas"

        # Helper para clasificar categorías
        def get_category_key(tipo: str, name: str):
            brand = get_brand_key(name)
            if brand in ["Valian", "Nipon"]:
                return "CAMIÓN"
            if tipo:
                t_lower = str(tipo).lower()
                if "camion" in t_lower or "tbr" in t_lower or t_lower == 'c' or t_lower == '2':
                    return "CAMIÓN"
                if "auto" in t_lower or "camioneta" in t_lower or t_lower == 'a' or t_lower == '1':
                    return "AUTO-CAMIONETA"
            return "AUTO-CAMIONETA"

        # Estructura inicial para el desglose mensual (meses 1 a 12)
        brands_by_category = {
            "AUTO-CAMIONETA": ["Michelin", "BFGoodrich", "Uniroyal", "Otras Marcas"],
            "CAMIÓN": ["Michelin", "BFGoodrich", "Uniroyal", "Valian", "Nipon"]
        }

        # Inicializamos estructura de datos:
        data_struct = {}
        for cat, brands in brands_by_category.items():
            data_struct[cat] = {}
            for brand in brands:
                data_struct[cat][brand] = {
                    m: {"objetivo": 0.0, "ventas": 0.0} for m in range(1, 13)
                }

        # Llenar objetivos
        for row in objectives_raw:
            cat = get_category_key(row.grupo_tipo, row.grupo_nombre)
            brand = get_brand_key(row.grupo_nombre)
            mes = int(row.mes) if row.mes else 1
            if 1 <= mes <= 12 and cat in data_struct and brand in data_struct[cat]:
                data_struct[cat][brand][mes]["objetivo"] += float(row.objetivo or 0)

        # Llenar ventas
        for row in sales_raw:
            cat = get_category_key(row.grupo_tipo, row.grupo_nombre)
            brand = get_brand_key(row.grupo_nombre)
            mes = int(row.mes) if row.mes else 1
            if 1 <= mes <= 12 and cat in data_struct and brand in data_struct[cat]:
                data_struct[cat][brand][mes]["ventas"] += float(row.cantidad or 0)

        # Dar formato final para el JSON de retorno
        result = {}
        for cat, brands in brands_by_category.items():
            result[cat] = []
            for brand in brands:
                monthly_list = []
                total_obj = 0.0
                total_ventas = 0.0
                
                for m in range(1, 13):
                    obj_m = data_struct[cat][brand][m]["objetivo"]
                    vts_m = data_struct[cat][brand][m]["ventas"]
                    total_obj += obj_m
                    total_ventas += vts_m
                    
                    # Alcance del mes
                    alcance_m = (vts_m / obj_m * 100.0) if obj_m > 0 else (100.0 if vts_m > 0 else 0.0)
                    
                    monthly_list.append({
                        "mes": m,
                        "objetivo": round(obj_m, 2),
                        "ventas": round(vts_m, 2),
                        "alcance": round(alcance_m, 2)
                    })
                
                # Alcance anual
                alcance_anual = (total_ventas / total_obj * 100.0) if total_obj > 0 else (100.0 if total_ventas > 0 else 0.0)
                
                result[cat].append({
                    "marca": brand,
                    "objetivo_anual": round(total_obj, 2),
                    "ventas_anual": round(total_ventas, 2),
                    "alcance_anual": round(alcance_anual, 2),
                    "mensual": monthly_list
                })

        return {
            "sucursal_id": sucursal_id,
            "sucursal_nombre": sucursal_nombre,
            "anio": anio,
            "categorias": result
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/dashboard/kpis")
def get_kpis(empresa_id: int = None, db: Session = Depends(get_db)):
    try:
        if empresa_id is not None:
            total_ventas = db.query(func.sum(models.DoctoDetalle.DoctoDetalleImporte)).join(
                models.Docto,
                (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio)
            ).filter(
                models.Docto.EmpresaID == empresa_id,
                models.Docto.DoctoCancelado == 0
            ).scalar() or 0
            
            total_tickets = db.query(func.count(models.Docto.DoctoFolio)).filter(
                models.Docto.EmpresaID == empresa_id,
                models.Docto.DoctoCancelado == 0
            ).scalar() or 1
            
            # Contar clientes distintos para la empresa
            nuevos_clientes = db.query(func.count(func.distinct(models.Docto.ClienteId))).filter(
                models.Docto.EmpresaID == empresa_id,
                models.Docto.DoctoCancelado == 0
            ).scalar() or 0
        else:
            total_ventas = db.query(func.sum(models.DoctoDetalle.DoctoDetalleImporte)).join(
                models.Docto,
                (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio)
            ).filter(models.Docto.DoctoCancelado == 0).scalar() or 0
            
            total_tickets = db.query(func.count(models.Docto.DoctoFolio)).filter(models.Docto.DoctoCancelado == 0).scalar() or 1
            
            # Contar clientes distintos globales
            nuevos_clientes = db.query(func.count(func.distinct(models.Docto.ClienteId))).filter(
                models.Docto.DoctoCancelado == 0
            ).scalar() or 0
            
        ticket_promedio = float(total_ventas) / total_tickets if total_tickets > 0 else 0
        
        return {
            "ventas_totales": float(total_ventas),
            "ticket_promedio": ticket_promedio,
            "nuevos_clientes": nuevos_clientes,
            "tendencia_ventas": "+0%",
            "tendencia_ticket": "+0%",
            "tendencia_clientes": "+0%"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

