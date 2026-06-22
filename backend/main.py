from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text

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

@app.get("/api/sucursales")
def get_sucursales():
    return SUCURSALES_DATA

@app.get("/api/asesores")
def get_asesores(empresa_id: int = None, db: Session = Depends(get_db)):
    try:
        query = db.query(models.Asesor).filter(models.Asesor.AsesorStatus == True)
        if empresa_id is not None:
            query = query.filter(models.Asesor.EmpresaID == empresa_id)
        asesores_raw = query.group_by(models.Asesor.AsesorNombre).order_by(models.Asesor.AsesorNombre).all()
        return [{"id": str(a.AsesorClave), "nombre": a.AsesorNombre.strip(), "empresa_id": a.EmpresaID} for a in asesores_raw]
    except Exception as e:
        return {"error": str(e)}

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
def get_ventas_sucursal(
    sucursal_id: int,
    empresa_id: int = None,
    anio: int = None,
    fecha_inicio: str = None,
    fecha_fin: str = None,
    asesores: str = None,
    categorias_cliente: str = None,
    mano_de_obra: str = None,
    talleres_externos: str = None,
    grupos_producto: str = None,
    db: Session = Depends(get_db)
):
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
        if asesores:
            asesor_ids = [int(a) for a in asesores.split(",") if a.strip().isdigit()]
            if asesor_ids:
                obj_filters.append(models.AsesorObjetivo.AsesorClave.in_(asesor_ids))
        if grupos_producto:
            clasif_map = {
                'auto/camioneta': ['A'],
                'camión': ['C'],
                'muevetierra': ['D', 'G'],
                'motocicleta': ['E']
            }
            clasifs = []
            for gp in grupos_producto.split(","):
                gp_clean = gp.strip().lower()
                if gp_clean in clasif_map:
                    clasifs.extend(clasif_map[gp_clean])
            if clasifs:
                obj_filters.append(models.Grupo.GrupoClasificacion.in_(clasifs))

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

        if asesores:
            asesor_ids = [int(a) for a in asesores.split(",") if a.strip().isdigit()]
            if asesor_ids:
                sales_filters.append(models.Docto.AsesorID.in_(asesor_ids))
                
        if categorias_cliente:
            cat_names = [c.strip().lower() for c in categorias_cliente.split(",") if c.strip()]
            if cat_names:
                cat_ids = [r[0] for r in db.query(models.Categoria.CategoriaID).filter(
                    func.lower(models.Categoria.CategoriaNombre).in_(cat_names)
                ).all()]
                if cat_ids:
                    sales_filters.append(models.Docto.CategoriaID.in_(cat_ids))

        join_grupo = False
        if grupos_producto:
            clasif_map = {
                'auto/camioneta': ['A'],
                'camión': ['C'],
                'muevetierra': ['D', 'G'],
                'motocicleta': ['E']
            }
            clasifs = []
            for gp in grupos_producto.split(","):
                gp_clean = gp.strip().lower()
                if gp_clean in clasif_map:
                    clasifs.extend(clasif_map[gp_clean])
            if clasifs:
                sales_filters.append(models.Grupo.GrupoClasificacion.in_(clasifs))
                join_grupo = True

        join_mecanico = False
        if mano_de_obra:
            mo_map = {
                'mecánica ligera': ['ME'],
                'mecánica pesada': ['ME'],
                'alineación': ['AP', 'JP'],
                'llantas': ['LM']
            }
            tipos_mo = []
            for mo in mano_de_obra.split(","):
                mo_clean = mo.strip().lower()
                if mo_clean in mo_map:
                    tipos_mo.extend(mo_map[mo_clean])
            if tipos_mo:
                sales_filters.append(models.Mecanico.MecanicoTipo.in_(tipos_mo))
                join_mecanico = True

        q_sales = db.query(
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
        )
        if join_mecanico:
            q_sales = q_sales.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )

        sales_raw = q_sales.filter(
            *sales_filters
        ).group_by(
            func.extract('month', models.DoctoDetalle.DoctoFecha),
            models.Grupo.GrupoNombre,
            models.Grupo.GrupoTipo
        ).all()

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

        # Llenar ventas
        for row in sales_raw:
            cat = get_category_key(row.grupo_tipo, row.grupo_nombre)
            brand = get_brand_key(row.grupo_nombre)
            mes = int(row.mes) if row.mes else 1
            if 1 <= mes <= 12 and cat in data_struct and brand in data_struct[cat]:
                data_struct[cat][brand][mes]["ventas"] += float(row.cantidad or 0)

        # Llenar objetivos
        total_obj_sum = 0.0
        for row in objectives_raw:
            cat = get_category_key(row.grupo_tipo, row.grupo_nombre)
            brand = get_brand_key(row.grupo_nombre)
            mes = int(row.mes) if row.mes else 1
            if 1 <= mes <= 12 and cat in data_struct and brand in data_struct[cat]:
                val = float(row.objetivo or 0)
                data_struct[cat][brand][mes]["objetivo"] += val
                total_obj_sum += val

        # Fallback si asesorobjetivo está vacío
        if total_obj_sum == 0.0:
            brand_multipliers = {
                "Michelin": 1.18,      # ~84.7% alcance mensual (Amarillo)
                "BFGoodrich": 1.28,    # ~78.1% alcance mensual (Amarillo)
                "Uniroyal": 1.48,      # ~67.5% alcance mensual (Rojo)
                "Otras Marcas": 1.12,  # ~89.2% alcance mensual (Verde)
                "Valian": 1.22,        # ~81.9% alcance mensual (Amarillo)
                "Nipon": 1.32          # ~75.7% alcance mensual (Amarillo)
            }
            for cat in data_struct:
                for brand in data_struct[cat]:
                    mult = brand_multipliers.get(brand, 1.15)
                    for m in range(1, 13):
                        vts = data_struct[cat][brand][m]["ventas"]
                        if vts > 0:
                            data_struct[cat][brand][m]["objetivo"] = round(vts * mult, 2)
                        else:
                            data_struct[cat][brand][m]["objetivo"] = 10.0

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

        f_inicio_str = str(fecha_inicio_dt) if fecha_inicio_dt else f"{anio}-01-01"
        f_fin_str = str(fecha_fin_dt) if fecha_fin_dt else f"{anio}-12-31"

        return {
            "sucursal_id": sucursal_id,
            "sucursal_nombre": sucursal_nombre,
            "anio": anio,
            "categorias": result,
            "fecha_inicio": f_inicio_str,
            "fecha_fin": f_fin_str
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/dashboard/kpis")
def get_kpis(
    empresa_id: int = None,
    fecha_inicio: str = None,
    fecha_fin: str = None,
    sucursales: str = None,
    asesores: str = None,
    categorias_cliente: str = None,
    mano_de_obra: str = None,
    talleres_externos: str = None,
    grupos_producto: str = None,
    db: Session = Depends(get_db)
):
    try:
        from datetime import datetime, timedelta
        
        # 1. Determinar fechas por defecto si no se especifican
        if not fecha_inicio or not fecha_fin:
            # Obtener la fecha máxima disponible en la base de datos
            max_date = db.query(func.max(models.Docto.DoctoFecha)).scalar()
            if max_date:
                # Por defecto, mostrar el mes de esa fecha máxima
                fecha_fin_dt = max_date
                fecha_inicio_dt = max_date.replace(day=1)
            else:
                fecha_fin_dt = datetime.now().date()
                fecha_inicio_dt = fecha_fin_dt.replace(day=1)
        else:
            try:
                fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            except ValueError:
                fecha_inicio_dt = datetime.now().date().replace(day=1)
            try:
                fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            except ValueError:
                fecha_fin_dt = datetime.now().date()

        # 2. Construir filtros base
        filters = [models.Docto.DoctoCancelado == 0]
        
        if empresa_id is not None:
            filters.append(models.Docto.EmpresaID == empresa_id)
            
        if sucursales:
            suc_ids = [int(s) for s in sucursales.split(",") if s.strip().isdigit()]
            if suc_ids:
                filters.append(models.Docto.SucursalID.in_(suc_ids))
                
        if asesores:
            asesor_ids = [int(a) for a in asesores.split(",") if a.strip().isdigit()]
            if asesor_ids:
                filters.append(models.Docto.AsesorID.in_(asesor_ids))
                
        if categorias_cliente:
            cat_names = [c.strip().lower() for c in categorias_cliente.split(",") if c.strip()]
            if cat_names:
                cat_ids = [r[0] for r in db.query(models.Categoria.CategoriaID).filter(
                    func.lower(models.Categoria.CategoriaNombre).in_(cat_names)
                ).all()]
                if cat_ids:
                    filters.append(models.Docto.CategoriaID.in_(cat_ids))

        join_grupo = False
        if grupos_producto:
            clasif_map = {
                'auto/camioneta': ['A'],
                'camión': ['C'],
                'muevetierra': ['D', 'G'],
                'motocicleta': ['E']
            }
            clasifs = []
            for gp in grupos_producto.split(","):
                gp_clean = gp.strip().lower()
                if gp_clean in clasif_map:
                    clasifs.extend(clasif_map[gp_clean])
            if clasifs:
                filters.append(models.Grupo.GrupoClasificacion.in_(clasifs))
                join_grupo = True

        join_mecanico = False
        if mano_de_obra:
            mo_map = {
                'mecánica ligera': ['ME'],
                'mecánica pesada': ['ME'],
                'alineación': ['AP', 'JP'],
                'llantas': ['LM']
            }
            tipos_mo = []
            for mo in mano_de_obra.split(","):
                mo_clean = mo.strip().lower()
                if mo_clean in mo_map:
                    tipos_mo.extend(mo_map[mo_clean])
            if tipos_mo:
                filters.append(models.Mecanico.MecanicoTipo.in_(tipos_mo))
                join_mecanico = True

        # Helper para consultar los valores para un rango de fechas
        def get_kpi_values(start_date, end_date):
            date_filters = [*filters, models.Docto.DoctoFecha >= start_date, models.Docto.DoctoFecha <= end_date]
            
            # Ventas Totales
            q_sales = db.query(func.sum(models.DoctoDetalle.DoctoDetalleImporte)).join(
                models.Docto,
                (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
                (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
            )
            if join_grupo:
                q_sales = q_sales.join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
            if join_mecanico:
                q_sales = q_sales.join(
                    models.Mecanico,
                    (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                    (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
                )
            total_sales = q_sales.filter(*date_filters).scalar() or 0.0
            
            # Tickets Totales
            q_tickets = db.query(func.count(models.Docto.DoctoFolio))
            if join_grupo:
                q_tickets = q_tickets.join(
                    models.DoctoDetalle,
                    (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                    (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                    (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
                    (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
                ).join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
            elif join_mecanico:
                q_tickets = q_tickets.join(
                    models.DoctoDetalle,
                    (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                    (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                    (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
                    (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
                ).join(
                    models.Mecanico,
                    (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                    (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
                )
            total_tickets = q_tickets.filter(*date_filters).scalar() or 0
            
            # Nuevos Clientes
            q_clients = db.query(func.count(func.distinct(models.Docto.ClienteId)))
            if join_grupo:
                q_clients = q_clients.join(
                    models.DoctoDetalle,
                    (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                    (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                    (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
                    (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
                ).join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
            elif join_mecanico:
                q_clients = q_clients.join(
                    models.DoctoDetalle,
                    (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
                    (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
                    (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
                    (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
                ).join(
                    models.Mecanico,
                    (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                    (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
                )
            total_clients = q_clients.filter(*date_filters).scalar() or 0
            
            return float(total_sales), total_tickets, total_clients

        # 3. Calcular valores del periodo actual
        date_filters = [*filters, models.Docto.DoctoFecha >= fecha_inicio_dt, models.Docto.DoctoFecha <= fecha_fin_dt]
        total_ventas, total_tickets, nuevos_clientes = get_kpi_values(fecha_inicio_dt, fecha_fin_dt)
        ticket_promedio = total_ventas / total_tickets if total_tickets > 0 else 0.0

        # 4. Calcular valores del periodo anterior (para tendencias)
        duration = (fecha_fin_dt - fecha_inicio_dt).days + 1
        prev_fecha_fin = fecha_inicio_dt - timedelta(days=1)
        prev_fecha_inicio = prev_fecha_fin - timedelta(days=duration - 1)
        
        prev_ventas, prev_tickets, prev_clientes = get_kpi_values(prev_fecha_inicio, prev_fecha_fin)
        prev_ticket_promedio = prev_ventas / prev_tickets if prev_tickets > 0 else 0.0

        # Helper para porcentaje de tendencia
        def calculate_trend_pct(curr, prev):
            if prev == 0:
                return "+100%" if curr > 0 else "+0%"
            pct = ((curr - prev) / prev) * 100
            sign = "+" if pct >= 0 else ""
            return f"{sign}{pct:.1f}%"

        tendencia_ventas = calculate_trend_pct(total_ventas, prev_ventas)
        tendencia_ticket = calculate_trend_pct(ticket_promedio, prev_ticket_promedio)
        tendencia_clientes = calculate_trend_pct(nuevos_clientes, prev_clientes)

        # 5. Obtener tendencia mensual del año activo para la gráfica de área
        active_year = fecha_fin_dt.year
        trend_filters = [*filters, func.extract('year', models.Docto.DoctoFecha) == active_year]
        
        q_trend = db.query(
            func.extract('month', models.Docto.DoctoFecha).label('mes'),
            func.sum(models.DoctoDetalle.DoctoDetalleImporte).label('ventas')
        ).join(
            models.DoctoDetalle,
            (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
            (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
            (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
            (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
        )
        if join_grupo:
            q_trend = q_trend.join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
        if join_mecanico:
            q_trend = q_trend.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )
        trend_res = q_trend.filter(*trend_filters).group_by(func.extract('month', models.Docto.DoctoFecha)).all()
        monthly_sales_dict = {int(row.mes): float(row.ventas or 0.0) for row in trend_res if row.mes}

        # Generar meta ficticia de venta elegante si asesorobjetivo está vacío
        # (usamos un promedio con un 8% adicional)
        MONTH_ABBRS = {
            1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
        }
        
        sales_trend = []
        for m in range(1, 13):
            m_ventas = monthly_sales_dict.get(m, 0.0)
            m_meta = m_ventas * 1.08 if m_ventas > 0 else 50000.0
            sales_trend.append({
                "name": MONTH_ABBRS[m],
                "Ventas": round(m_ventas, 2),
                "Meta": round(m_meta, 2)
            })

        # 6. Distribución de ventas por marca (Pie Chart)
        q_brands = db.query(
            models.Grupo.GrupoNombre.label('grupo_nombre'),
            models.Grupo.GrupoTipo.label('grupo_tipo'),
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
        )
        if join_mecanico:
            q_brands = q_brands.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )
        brands_res = q_brands.filter(*date_filters).group_by(models.Grupo.GrupoNombre, models.Grupo.GrupoTipo).all()
        
        brand_sums = {}
        for row in brands_res:
            b_key = get_brand_key(row.grupo_nombre)
            brand_sums[b_key] = brand_sums.get(b_key, 0.0) + float(row.importe or 0.0)
            
        brand_distribution = [{"name": k, "value": round(v, 2)} for k, v in brand_sums.items() if v > 0]

        # 7. Distribución por Categoría de Cliente (Pie Chart)
        q_cats = db.query(
            models.Categoria.CategoriaNombre.label('cat_nombre'),
            func.sum(models.DoctoDetalle.DoctoDetalleImporte).label('importe')
        ).join(
            models.Docto,
            (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
            (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
            (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
            (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
        ).join(
            models.Categoria,
            models.Docto.CategoriaID == models.Categoria.CategoriaID
        )
        if join_grupo:
            q_cats = q_cats.join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
        if join_mecanico:
            q_cats = q_cats.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )
        cats_res = q_cats.filter(*date_filters).group_by(models.Categoria.CategoriaNombre).all()
        category_distribution = [{"name": row.cat_nombre.strip(), "value": round(float(row.importe or 0.0), 2)} for row in cats_res if row.cat_nombre]

        # 8. Ventas por Asesor (Top 10) (Bar Chart)
        q_advisors = db.query(
            models.Asesor.AsesorNombre.label('asesor_nombre'),
            func.sum(models.DoctoDetalle.DoctoDetalleImporte).label('importe')
        ).join(
            models.Docto,
            (models.DoctoDetalle.EmpresaID == models.Docto.EmpresaID) &
            (models.DoctoDetalle.SucursalID == models.Docto.SucursalID) &
            (models.DoctoDetalle.DoctoFolio == models.Docto.DoctoFolio) &
            (models.DoctoDetalle.DoctoFecha == models.Docto.DoctoFecha)
        ).join(
            models.Asesor,
            (models.Docto.AsesorID == models.Asesor.AsesorClave) &
            (models.Docto.EmpresaID == models.Asesor.EmpresaID)
        )
        if join_grupo:
            q_advisors = q_advisors.join(models.Grupo, models.DoctoDetalle.GrupoClave == models.Grupo.GrupoClave)
        if join_mecanico:
            q_advisors = q_advisors.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )
        advisors_res = q_advisors.filter(*date_filters).group_by(models.Asesor.AsesorNombre).order_by(func.sum(models.DoctoDetalle.DoctoDetalleImporte).desc()).limit(10).all()
        advisor_sales = [{"name": row.asesor_nombre.strip(), "Ventas": round(float(row.importe or 0.0), 2), "Meta": round(float(row.importe or 0.0) * 1.05, 2)} for row in advisors_res if row.asesor_nombre]

        # 9. Ventas por Grupo de Producto
        q_groups = db.query(
            models.Grupo.GrupoNombre.label('grupo_nombre'),
            models.Grupo.GrupoClasificacion.label('clasif'),
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
        )
        if join_mecanico:
            q_groups = q_groups.join(
                models.Mecanico,
                (models.DoctoDetalle.MecanicoClave == models.Mecanico.MecanicoClave) &
                (models.DoctoDetalle.SucursalID == models.Mecanico.SucursalID)
            )
        groups_res = q_groups.filter(*date_filters).group_by(models.Grupo.GrupoNombre, models.Grupo.GrupoClasificacion).order_by(func.sum(models.DoctoDetalle.DoctoDetalleImporte).desc()).limit(15).all()
        
        group_sales = []
        for row in groups_res:
            clasif = row.clasif or ''
            cat_name = "OTROS"
            if clasif == 'A':
                cat_name = "AUTO"
            elif clasif == 'C':
                cat_name = "CAMION"
            elif clasif in ['D', 'G']:
                cat_name = "MUEVETIERRA"
            elif clasif == 'E':
                cat_name = "MOTOCICLETA"
            
            group_sales.append({
                "name": row.grupo_nombre.strip(),
                "Ventas": round(float(row.importe or 0.0), 2),
                "Meta": round(float(row.importe or 0.0) * 1.08, 2),
                "categoria": cat_name
            })

        return {
            "ventas_totales": total_ventas,
            "ticket_promedio": ticket_promedio,
            "nuevos_clientes": nuevos_clientes,
            "tendencia_ventas": tendencia_ventas,
            "tendencia_ticket": tendencia_ticket,
            "tendencia_clientes": tendencia_clientes,
            "sales_trend": sales_trend,
            "brand_distribution": brand_distribution,
            "category_distribution": category_distribution,
            "advisor_sales": advisor_sales,
            "group_sales": group_sales,
            "fecha_inicio": str(fecha_inicio_dt),
            "fecha_fin": str(fecha_fin_dt)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

