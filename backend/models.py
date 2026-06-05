from sqlalchemy import Column, Integer, SmallInteger, String, Date, DateTime, Numeric, Boolean, BigInteger
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Asesor(Base):
    __tablename__ = 'asesor'
    AsesorClave = Column(String(10), primary_key=True)
    EmpresaID = Column(SmallInteger, primary_key=True)
    SucursalID = Column(Integer, primary_key=True)
    AsesorNombre = Column(String(80))
    AsesorStatus = Column(Boolean)
    AsesorLicitaciones = Column(Boolean)

class AsesorObjetivo(Base):
    __tablename__ = 'asesorobjetivo'
    AsesorClave = Column(String(10), primary_key=True)
    EmpresaID = Column(SmallInteger, primary_key=True)
    SucursalID = Column(Integer, primary_key=True)
    AsesorObjetivoAnio = Column(SmallInteger, primary_key=True)
    AsesorObjetivoMes = Column(SmallInteger, primary_key=True)
    GrupoClave = Column(String(10), primary_key=True)
    AsesorObjetivoCantidad = Column(Numeric(11, 3))

class Categoria(Base):
    __tablename__ = 'categoria'
    CategoriaID = Column(Integer, primary_key=True)
    EmpresaID = Column(SmallInteger, primary_key=True)
    CategoriaNombre = Column(String(80))
    CategoriaStatus = Column(Boolean)

class Clasificacion(Base):
    __tablename__ = 'clasificacion'
    ClasificacionID = Column(Integer, primary_key=True)
    EmpresaID = Column(SmallInteger)
    ClasificacionNombre = Column(String(80))
    ClasificacionArea = Column(String(1))
    ClasificacionComision = Column(Numeric(5, 2))

class Docto(Base):
    __tablename__ = 'docto'
    EmpresaID = Column(SmallInteger, primary_key=True)
    SucursalID = Column(Integer, primary_key=True)
    DoctoFolio = Column(String(12), primary_key=True)
    DoctoFecha = Column(Date, primary_key=True)
    DoctoTipo = Column(String(3))
    ClienteId = Column(BigInteger)
    ClienteNombre = Column(String(80))
    DoctoGrupoVenta = Column(String(5))
    DoctoZona = Column(String(20))
    CategoriaID = Column(Integer)
    DoctoFacturaNumero = Column(BigInteger)
    DoctoFacturaSerie = Column(String(5))
    DoctoPatio = Column(Integer)
    DoctoOSFolio = Column(BigInteger)
    DoctoOSSerie = Column(String(5))
    DoctoRefacturacion = Column(SmallInteger)
    AsesorID = Column(Integer)
    ClienteEstado = Column(String(50))
    ClienteCiudad = Column(String(100))
    ClienteRFC = Column(String(20))
    ClienteTelefono = Column(String(50))
    ClienteEmail = Column(String(200))
    DoctoOrg = Column(String(12))
    DoctoDiasCredito = Column(Integer)
    DoctoCancelado = Column(SmallInteger)
    DoctoPlacas = Column(String(10))
    DoctoContrato = Column(String(50))
    DoctoLigado = Column(BigInteger)
    DoctoOrdContrato = Column(String(50))
    DoctoLigada = Column(SmallInteger)
    DoctoFacturaFecha = Column(Date)
    DoctoFactura = Column(String(12))
    DoctoValeConvenio = Column(String(15))
    DoctoTelEncuesta = Column(String(15))
    DoctoMailEncuesta = Column(String(60))
    VTSFecha = Column(DateTime)

class DoctoDetalle(Base):
    __tablename__ = 'doctodetalle'
    EmpresaID = Column(SmallInteger, primary_key=True)
    SucursalID = Column(Integer, primary_key=True)
    DoctoFolio = Column(String(12), primary_key=True)
    DoctoFecha = Column(Date, primary_key=True)
    DoctoDetalleLinea = Column(Integer, primary_key=True)
    DoctoDetalleFecha = Column(Date)
    DoctoDetalleOrigen = Column(String(1))
    DoctoDetalleClave = Column(String(10))
    DoctoDetalleDescripcion = Column(String(70))
    DoctoDetalleCantidad = Column(Numeric(11, 3))
    DoctoDetalleCosto = Column(Numeric(11, 3))
    DoctoDetallePVenta = Column(Numeric(11, 3))
    DoctoDetalleImporte = Column(Numeric(11, 3))
    DoctoDetalleMSPN = Column(String(10))
    DoctoDetalleCostoComercial = Column(Numeric(11, 3))
    DoctoDetalleGrupo = Column(String(2))
    DoctoDetalleSerClas = Column(String(2))
    DoctoDetalleRin = Column(Integer)
    DoctoDetalleMinutos = Column(BigInteger)
    MecanicoClave = Column(SmallInteger)
    DoctoDetallePLista = Column(Numeric(11, 3))
    DoctoDetalleSerie = Column(String(10))
    DoctoDetalleAncho = Column(Numeric(9, 2))
    DoctoDetalleDescuento = Column(Numeric(11, 3))
    DoctoDetalleRefUds = Column(Numeric(11, 3))
    DoctoDetalleRefClasif = Column(String(50))
    GrupoClave = Column(String(10))

class Empresa(Base):
    __tablename__ = 'empresa'
    EmpresaID = Column(SmallInteger, primary_key=True)
    EmpresaNombre = Column(String(80))

class Grupo(Base):
    __tablename__ = 'grupo'
    GrupoClave = Column(String(10), primary_key=True)
    EmpresaID = Column(SmallInteger, primary_key=True)
    GrupoNombre = Column(String(80))
    GrupoTipo = Column(String(2))
    GrupoMarca = Column(String(2))
    GrupoClasificacion = Column(String(1))

class Mecanico(Base):
    __tablename__ = 'mecanico'
    MecanicoClave = Column(SmallInteger, primary_key=True)
    SucursalID = Column(Integer, primary_key=True)
    MecanicoNombre = Column(String(80))
    MecanicoStatus = Column(Boolean)
    MecanicoTipo = Column(String(2))

class Sucursal(Base):
    __tablename__ = 'sucursal'
    SucursalID = Column(SmallInteger, primary_key=True)
    EmpresaID = Column(SmallInteger)
    TipoSucursalClave = Column(String(10))
    SucursalNombre = Column(String(80))
    SucursalStatus = Column(Boolean)
    SucursalVentas = Column(Boolean)
