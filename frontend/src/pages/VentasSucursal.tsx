import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Calendar, TrendingUp, AlertCircle, RefreshCw, Layers, Car, Truck } from 'lucide-react';
import { useEmpresa } from '../context/EmpresaContext';

interface MonthlyBreakdown {
  mes: number;
  objetivo: number;
  ventas: number;
  alcance: number;
}

interface BrandData {
  marca: string;
  objetivo_anual: number;
  ventas_anual: number;
  alcance_anual: number;
  mensual: MonthlyBreakdown[];
}

interface SucursalSalesData {
  sucursal_id: number;
  sucursal_nombre: string;
  anio: number;
  categorias: {
    [category: string]: BrandData[];
  };
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];



export function VentasSucursal() {
  const { id } = useParams<{ id: string }>();
  const { selectedEmpresa } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type PeriodType = 'dia' | 'semana' | 'mes' | 'anio' | 'rango';
  const [periodo, setPeriodo] = useState<PeriodType>('anio');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(todayStr);
  const [fechaFin, setFechaFin] = useState(todayStr);
  
  const [mesAnio, setMesAnio] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [anioFilter, setAnioFilter] = useState(new Date().getFullYear());

  const [data, setData] = useState<SucursalSalesData | null>(null);

  const [activeTab, setActiveTab] = useState("AUTO-CAMIONETA");

  const fetchSalesData = () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const url = new URL(`http://127.0.0.1:8001/api/ventas/sucursal/${id}`);
    
    let finalFechaInicio = "";
    let finalFechaFin = "";
    let finalAnio = anioFilter;

    if (periodo === 'dia') {
      finalFechaInicio = fechaInicio;
      finalFechaFin = fechaInicio;
      if (fechaInicio) finalAnio = Number(fechaInicio.split('-')[0]);
    } else if (periodo === 'semana') {
      if (fechaInicio) {
        const [y, m, dayOfMonth] = fechaInicio.split('-').map(Number);
        const d = new Date(y, m - 1, dayOfMonth);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
        const monday = new Date(y, m - 1, diff);
        const sunday = new Date(y, m - 1, diff + 6);
        
        const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        finalFechaInicio = format(monday);
        finalFechaFin = format(sunday);
        finalAnio = monday.getFullYear();
      }
    } else if (periodo === 'mes') {
      if (mesAnio) {
        const [y, m] = mesAnio.split('-');
        finalAnio = Number(y);
        finalFechaInicio = `${y}-${m}-01`;
        const lastDay = new Date(Number(y), Number(m), 0).getDate();
        finalFechaFin = `${y}-${m}-${lastDay}`;
      }
    } else if (periodo === 'anio') {
      finalAnio = anioFilter;
      finalFechaInicio = `${finalAnio}-01-01`;
      finalFechaFin = `${finalAnio}-12-31`;
    } else if (periodo === 'rango') {
      finalFechaInicio = fechaInicio;
      finalFechaFin = fechaFin;
      if (fechaFin) {
        finalAnio = Number(fechaFin.split('-')[0]);
      }
    }

    url.searchParams.append('anio', finalAnio.toString());
    if (finalFechaInicio) url.searchParams.append('fecha_inicio', finalFechaInicio);
    if (finalFechaFin) url.searchParams.append('fecha_fin', finalFechaFin);
    if (selectedEmpresa) url.searchParams.append('empresa_id', selectedEmpresa.id.toString());

    fetch(url.toString())
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
          const cats = Object.keys(resData.categorias || {});
          if (cats.length > 0 && !cats.includes(activeTab)) {
            setActiveTab(cats[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sucursal sales:", err);
        setError("No se pudo conectar con el backend. Por favor verifica que el servidor esté en línea en el puerto 8001.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, periodo, anioFilter, mesAnio, selectedEmpresa?.id]); // Fetch automatically on period or dropdown changes

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalesData();
  };

  const getAlcanceColor = (alcance: number) => {
    if (alcance >= 100) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/50", fill: "text-emerald-500" };
    if (alcance >= 80) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/50", fill: "text-amber-500" };
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/50", fill: "text-rose-500" };
  };

  const sucursalNombre = data?.sucursal_nombre || `Sucursal ${id}`;

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4 relative z-10">
        <RefreshCw className="animate-spin text-[var(--color-sky-accent)] w-10 h-10" />
        <p className="text-[var(--color-sky-muted)] text-sm font-medium">Cargando reporte de sucursal...</p>
      </div>
    );
  }

  const activeBrands = data?.categorias?.[activeTab] || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-[var(--color-sky-text)] min-h-screen relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--color-sky-border)] pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-sky-text)] tracking-tight">
              {sucursalNombre}
            </h1>
            <p className="text-[var(--color-sky-muted)] text-sm mt-1">
              Desglose detallado de ventas y cumplimiento de objetivos anuales
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[var(--color-sky-surface)] p-6 rounded-2xl border border-[var(--color-sky-border)] shadow-lg shadow-sky-900/5">
        <form onSubmit={handleGenerate} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Periodo:</span>
            {['dia', 'semana', 'mes', 'anio', 'rango'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p as PeriodType)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  periodo === p 
                    ? 'bg-[var(--color-sky-accent)] text-white shadow-md shadow-sky-500/20' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {p === 'anio' ? 'Año' : p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-6">
            {(periodo === 'dia' || periodo === 'semana') && (
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {periodo === 'dia' ? 'Seleccionar Día' : 'Seleccionar Semana (elige un día)'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sky-muted)]" size={16} />
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="w-full bg-white border border-[var(--color-sky-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--color-sky-text)] outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[var(--color-sky-accent)] transition-all"
                  />
                </div>
              </div>
            )}

            {periodo === 'mes' && (
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionar Mes</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sky-muted)]" size={16} />
                  <input
                    type="month"
                    value={mesAnio}
                    onChange={e => setMesAnio(e.target.value)}
                    className="w-full bg-white border border-[var(--color-sky-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--color-sky-text)] outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[var(--color-sky-accent)] transition-all"
                  />
                </div>
              </div>
            )}

            {periodo === 'anio' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Año de Reporte</label>
                <select
                  value={anioFilter}
                  onChange={e => setAnioFilter(Number(e.target.value))}
                  className="bg-white border border-[var(--color-sky-border)] text-[var(--color-sky-text)] font-bold rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[var(--color-sky-accent)] transition-all cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
              </div>
            )}

            {periodo === 'rango' && (
              <>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sky-muted)]" size={16} />
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={e => setFechaInicio(e.target.value)}
                      className="w-full bg-white border border-[var(--color-sky-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--color-sky-text)] outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[var(--color-sky-accent)] transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sky-muted)]" size={16} />
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={e => setFechaFin(e.target.value)}
                      className="w-full bg-white border border-[var(--color-sky-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--color-sky-text)] outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[var(--color-sky-accent)] transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer h-[42px]"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : null}
              <span>GENERAR REPORTES</span>
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Error de Carga</h4>
            <p className="text-xs mt-1 leading-relaxed text-red-600/80">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Tabs Selector */}
      <div className="flex border-b border-[var(--color-sky-border)] overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("AUTO-CAMIONETA")}
          className={`flex flex-shrink-0 items-center space-x-2 px-6 py-3 border-b-2 font-extrabold text-sm transition-all cursor-pointer ${activeTab === "AUTO-CAMIONETA"
              ? "border-[var(--color-sky-accent)] text-[var(--color-sky-accent)]"
              : "border-transparent text-[var(--color-sky-muted)] hover:text-[var(--color-sky-text)]"
            }`}
        >
          <Car size={16} />
          <span>Auto - Camioneta</span>
        </button>
        <button
          onClick={() => setActiveTab("CAMIÓN")}
          className={`flex flex-shrink-0 items-center space-x-2 px-6 py-3 border-b-2 font-extrabold text-sm transition-all cursor-pointer ${activeTab === "CAMIÓN"
              ? "border-[var(--color-sky-accent)] text-[var(--color-sky-accent)]"
              : "border-transparent text-[var(--color-sky-muted)] hover:text-[var(--color-sky-text)]"
            }`}
        >
          <Truck size={16} />
          <span>Camión</span>
        </button>
      </div>

      {/* Vista Activa */}
      {activeBrands.length > 0 ? (
        <div className="space-y-6">
          {/* Tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeBrands.map((brand, idx) => {
              const color = getAlcanceColor(brand.alcance_anual);
              // Asignar colores lila/fucsia alternados a las marcas
              const brandColorFill = idx % 2 === 0 ? "text-indigo-500" : "text-fuchsia-500";

              const getBrandLogo = (marca: string) => {
                switch (marca.toUpperCase()) {
                  case 'MICHELIN':
                    return <span className="font-black italic text-[#27509b] text-xl tracking-tighter">MICHELIN</span>;
                  case 'BFGOODRICH':
                    return (
                      <span className="font-extrabold text-xl tracking-tight">
                        <span className="text-[#e21b22]">BF</span>
                        <span className="text-[#003b7e]">Goodrich</span>
                      </span>
                    );
                  case 'UNIROYAL':
                    return <span className="font-black text-[#d52b1e] text-lg tracking-wider">UNIROYAL</span>;
                  default:
                    return <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{marca}</span>;
                }
              };

              return (
                <div
                  key={brand.marca}
                  className="bg-[var(--color-sky-surface)] p-6 rounded-2xl border border-[var(--color-sky-border)] flex items-center justify-between shadow-lg shadow-sky-900/5 hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="space-y-2">
                    <div className="h-6 flex items-center">
                      {getBrandLogo(brand.marca)}
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-[var(--color-sky-text)] leading-tight">{brand.ventas_anual.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 font-medium">Obj. Anual: {brand.objetivo_anual.toLocaleString()}</div>
                    </div>
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
                      <TrendingUp size={12} className="mr-1" />
                      {brand.alcance_anual}% alcance
                    </span>
                  </div>

                  <ProgressRing value={brand.alcance_anual} size={76} strokeWidth={7} colorClass={brandColorFill} remainingColorClass="text-slate-100" />
                </div>
              );
            })}
          </div>

          {/* Tabla Comparativa */}
          <div className="bg-[var(--color-sky-surface)] border border-[var(--color-sky-border)] rounded-2xl overflow-hidden shadow-lg shadow-sky-900/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50 border-b border-[var(--color-sky-border)] text-xs font-bold text-[var(--color-sky-muted)] tracking-wider">
                    <th rowSpan={2} className="p-4 align-middle text-[var(--color-sky-text)] font-extrabold border-r border-[var(--color-sky-border)] w-32 bg-sky-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Mes</th>
                    {activeBrands.map(brand => (
                      <th key={brand.marca} colSpan={3} className="p-3 text-center border-r border-[var(--color-sky-border)] font-extrabold uppercase text-[var(--color-sky-text)]">
                        {brand.marca}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-sky-50 border-b border-[var(--color-sky-border)] text-[10px] font-bold text-[var(--color-sky-muted)] tracking-wider uppercase">
                    {activeBrands.map((brand, bIdx) => (
                      <React.Fragment key={`${brand.marca}-col`}>
                        <th className="p-2 text-right">Objetivo</th>
                        <th className="p-2 text-right">Ventas</th>
                        <th className="p-2 text-center border-r border-[var(--color-sky-border)]">Alcance</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-xs font-medium text-[var(--color-sky-muted)]">
                  {MONTH_NAMES.map((monthName, mIdx) => {
                    const monthNum = mIdx + 1;
                    return (
                      <tr key={monthName} className="hover:bg-sky-50 transition-colors">
                        <td className="p-3 font-bold text-[var(--color-sky-text)] border-r border-[var(--color-sky-border)] bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {monthName}
                        </td>
                        {activeBrands.map(brand => {
                          const monthData = brand.mensual.find(m => m.mes === monthNum) || { objetivo: 0, ventas: 0, alcance: 0 };
                          const color = getAlcanceColor(monthData.alcance);
                          return (
                            <React.Fragment key={`${brand.marca}-${monthName}`}>
                              <td className="p-2 text-right font-semibold text-slate-600">
                                {monthData.objetivo > 0 ? monthData.objetivo.toLocaleString() : "-"}
                              </td>
                              <td className="p-2 text-right font-black text-[var(--color-sky-text)]">
                                {monthData.ventas > 0 ? monthData.ventas.toLocaleString() : "-"}
                              </td>
                              <td className={`p-2 text-center border-r border-[var(--color-sky-border)]`}>
                                {monthData.objetivo > 0 || monthData.ventas > 0 ? (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${color.bg} ${color.text} border ${color.border}`}>
                                    {monthData.alcance}%
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[var(--color-sky-surface)] border border-[var(--color-sky-border)] rounded-2xl text-[var(--color-sky-muted)]">
          No hay datos de marcas disponibles para esta categoría.
        </div>
      )}
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  remainingColorClass?: string;
}

function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  colorClass = "text-[var(--color-sky-accent)]",
  remainingColorClass = "text-slate-100"
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const visualValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (visualValue / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={remainingColorClass}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-xs font-bold text-[var(--color-sky-text)]">
        {Math.round(value)}%
      </span>
    </div>
  );
}
