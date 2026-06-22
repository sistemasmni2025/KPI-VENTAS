import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Building2, TrendingUp, AlertCircle, RefreshCw, Car, Truck } from 'lucide-react';
import { useEmpresa } from '../context/EmpresaContext';
import { SmartFilterBar } from '../components/SmartFilterBar';
import type { FilterState } from '../components/SmartFilterBar';

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

const BRANCH_NAMES: { [key: number]: string } = {
  1: "Celaya",
  2: "Querétaro",
  3: "San Luis Potosí",
  4: "Aguascalientes",
  5: "León",
  6: "Irapuato",
  7: "Guadalajara",
  8: "Silao",
  9: "Irapuato Centro",
  10: "Tlalnepantla",
  11: "Altamira",
  12: "La Viga",
  13: "San Juan del Río"
};

const formatPeriodText = (inicio: string, fin: string) => {
  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return `${day} ${months[monthIdx]} ${year}`;
    }
    return dStr;
  };
  return `${parseDate(inicio)} al ${parseDate(fin)}`;
};

export function VentasSucursal() {
  const { id } = useParams<{ id: string }>();
  const { selectedEmpresa } = useEmpresa();
  const { isFilterOpen, setIsFilterOpen } = useOutletContext<{isFilterOpen: boolean, setIsFilterOpen: (val: boolean) => void}>() || { isFilterOpen: true, setIsFilterOpen: () => {} };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SucursalSalesData | null>(null);
  const [activeTab, setActiveTab] = useState("AUTO-CAMIONETA");
  const [activePeriod, setActivePeriod] = useState<{ inicio: string; fin: string } | null>(null);

  const [filters, setFilters] = useState<FilterState | null>(null);
  const [sucursales, setSucursales] = useState<{id: string, nombre: string}[]>([]);
  const [asesores, setAsesores] = useState<{id: string, nombre: string}[]>([]);

  // Cargar sucursales y asesores
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/sucursales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = selectedEmpresa ? data.filter(d => d.empresa_id === selectedEmpresa.id || d.empresa_id == null) : data;
          setSucursales(filtered.map(s => ({ id: String(s.id), nombre: s.nombre })));
        }
      })
      .catch(err => console.error("Error cargando sucursales:", err));
      
    let asesoresUrl = 'http://127.0.0.1:8001/api/asesores';
    if (selectedEmpresa) {
      asesoresUrl += `?empresa_id=${selectedEmpresa.id}`;
    }
    fetch(asesoresUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAsesores(data.map(a => ({ id: String(a.id), nombre: a.nombre })));
        }
      })
      .catch(err => console.error("Error cargando asesores:", err));
  }, [selectedEmpresa]);

  const fetchSalesData = () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    let url = `http://127.0.0.1:8001/api/ventas/sucursal/${id}`;
    const params = new URLSearchParams();
    
    if (selectedEmpresa) {
      params.append('empresa_id', String(selectedEmpresa.id));
    }
    
    if (filters) {
      if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
      if (filters.asesores && filters.asesores.length > 0) {
        params.append('asesores', filters.asesores.join(','));
      }
      if (filters.categoriasCliente && filters.categoriasCliente.length > 0) {
        params.append('categorias_cliente', filters.categoriasCliente.join(','));
      }
      if (filters.manoDeObra && filters.manoDeObra.length > 0) {
        params.append('mano_de_obra', filters.manoDeObra.join(','));
      }
      if (filters.talleresExternos && filters.talleresExternos.length > 0) {
        params.append('talleres_externos', filters.talleresExternos.join(','));
      }
      if (filters.gruposProducto && filters.gruposProducto.length > 0) {
        params.append('grupos_producto', filters.gruposProducto.join(','));
      }
      
      // Si hay una fecha fin, extraemos el año para los objetivos
      if (filters.fechaFin) {
        const year = new Date(filters.fechaFin).getFullYear();
        if (!isNaN(year)) {
          params.append('anio', String(year));
        }
      }
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
          if (resData.fecha_inicio && resData.fecha_fin) {
            setActivePeriod({ inicio: resData.fecha_inicio, fin: resData.fecha_fin });
          }
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
  }, [id, selectedEmpresa, filters]);

  const getAlcanceColor = (alcance: number) => {
    if (alcance >= 85) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", fill: "text-emerald-500" };
    if (alcance >= 69) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", fill: "text-amber-500" };
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", fill: "text-rose-500" };
  };

  const sucursalNombre = BRANCH_NAMES[Number(id)] || data?.sucursal_nombre || `Sucursal ${id}`;

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#F8FAFC]">
        <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-slate-500 text-sm font-medium">Cargando reporte de sucursal...</p>
      </div>
    );
  }

  // Marcas correspondientes a la categoría seleccionada
  const activeBrands = data?.categorias?.[activeTab] || [];

  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-transparent text-slate-800">
      {/* 1. Smart Filter Bar Flotante (Colapsable) */}
      <div className={`transition-all duration-500 origin-top relative z-50 ${isFilterOpen ? 'max-h-[800px] opacity-100 scale-y-100 mb-4 overflow-visible' : 'max-h-0 opacity-0 scale-y-95 mb-0 overflow-hidden pointer-events-none'}`}>
        <SmartFilterBar 
          onFilterChange={setFilters} 
          availableSucursales={sucursales} 
          availableAsesores={asesores} 
          onClose={() => setIsFilterOpen(false)}
        />
      </div>

      <div className={`p-8 max-w-7xl mx-auto space-y-8 w-full animate-fade-in transition-all duration-500 bg-[#F8FAFC] min-h-screen ${!isFilterOpen ? 'mt-4' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <Building2 size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {sucursalNombre}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Cumplimiento de objetivos por marca y categoría
              </p>
            </div>
          </div>
        </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="text-rose-600 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Error de Carga</h4>
            <p className="text-xs mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Tabs Selector de Categoría y Periodo Activo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 gap-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("AUTO-CAMIONETA")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${activeTab === "AUTO-CAMIONETA"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <Car size={16} />
            <span>Auto - Camioneta</span>
          </button>
          <button
            onClick={() => setActiveTab("CAMIÓN")}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${activeTab === "CAMIÓN"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <Truck size={16} />
            <span>Camión</span>
          </button>
        </div>

        {/* Banner de Periodo Activo (Alineado a la derecha, en azul/indigo) */}
        {activePeriod && (
          <div className="inline-flex items-center gap-2 bg-indigo-50/70 border border-indigo-100/50 rounded-2xl px-4 py-2 text-indigo-700 shadow-sm animate-fade-in self-start sm:self-auto mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Periodo: {formatPeriodText(activePeriod.inicio, activePeriod.fin)}
            </span>
          </div>
        )}
      </div>

      {/* Vista de la Categoría Activa */}
      {activeBrands.length > 0 ? (
        <div className="space-y-6">
          {/* Fila de Tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeBrands.map(brand => {
              const color = getAlcanceColor(brand.alcance_anual);
              return (
                <div
                  key={brand.marca}
                  className="bg-white p-6 rounded-2xl border border-slate-100/80 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 transition-all duration-300"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{brand.marca}</span>
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-slate-900">{brand.ventas_anual.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Objetivo: {brand.objetivo_anual.toLocaleString()}</div>
                    </div>
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
                      <TrendingUp size={12} className="mr-1" />
                      {brand.alcance_anual}% alcance
                    </span>
                  </div>

                  <ProgressRing value={brand.alcance_anual} size={76} strokeWidth={7} colorClass={color.fill} remainingColorClass="text-slate-100" />
                </div>
              );
            })}
          </div>

          {/* Tabla Comparativa Mensual Consolidada */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>Desglose Mensual</span>
                {activePeriod && (
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-lg font-bold">
                    {formatPeriodText(activePeriod.inicio, activePeriod.fin)}
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 tracking-wider">
                    <th rowSpan={2} className="p-4 align-middle text-slate-700 font-extrabold border-r border-slate-100 w-32 bg-slate-50/75 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">Mes</th>
                    {activeBrands.map(brand => (
                      <th key={brand.marca} colSpan={3} className="p-3 text-center border-r border-slate-100 font-extrabold uppercase text-slate-800">
                        {brand.marca}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {activeBrands.map((brand, bIdx) => (
                      <React.Fragment key={`${brand.marca}-col`}>
                        <th className="p-2 text-right">Objetivo</th>
                        <th className="p-2 text-right">Ventas</th>
                        <th className="p-2 text-center border-r border-slate-100">Alcance</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {MONTH_NAMES.map((monthName, mIdx) => {
                    const monthNum = mIdx + 1;
                    return (
                      <tr key={monthName} className="hover:bg-indigo-50/10 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 border-r border-slate-100 bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">
                          {monthName}
                        </td>
                        {activeBrands.map(brand => {
                          const monthData = brand.mensual.find(m => m.mes === monthNum) || { objetivo: 0, ventas: 0, alcance: 0 };
                          const color = getAlcanceColor(monthData.alcance);
                          return (
                            <React.Fragment key={`${brand.marca}-${monthName}`}>
                              <td className="p-2 text-right font-medium text-slate-700">
                                {monthData.objetivo > 0 ? monthData.objetivo.toLocaleString() : "-"}
                              </td>
                              <td className="p-2 text-right font-semibold text-slate-900">
                                {monthData.ventas > 0 ? monthData.ventas.toLocaleString() : "-"}
                              </td>
                              <td className={`p-2 text-center border-r border-slate-100`}>
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
        <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl text-slate-400">
          No hay datos de marcas disponibles para esta categoría.
        </div>
      )}
      </div>
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
  colorClass = "text-indigo-600",
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
      <span className="absolute text-xs font-bold text-slate-800">
        {Math.round(value)}%
      </span>
    </div>
  );
}
