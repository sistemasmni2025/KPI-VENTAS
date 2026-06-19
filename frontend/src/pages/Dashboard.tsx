import React, { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { SalesChart } from '../components/SalesChart';
import { useEmpresa } from '../context/EmpresaContext';
import { SmartFilterBar } from '../components/SmartFilterBar';
import type { FilterState } from '../components/SmartFilterBar';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function Dashboard() {
  const { selectedEmpresa } = useEmpresa();
  const { isFilterOpen, setIsFilterOpen } = useOutletContext<{isFilterOpen: boolean, setIsFilterOpen: (val: boolean) => void}>() || { isFilterOpen: true, setIsFilterOpen: () => {} };
  
  const [activeTab, setActiveTab] = useState('general');
  const [filters, setFilters] = useState<FilterState | null>(null);
  
  const [sucursales, setSucursales] = useState<{id: string, nombre: string}[]>([]);
  const [asesores, setAsesores] = useState<{id: string, nombre: string}[]>([]);

  const [kpis, setKpis] = useState({
    ventas_totales: 0,
    ticket_promedio: 0,
    nuevos_clientes: 0,
    tendencia_ventas: "+0%",
    tendencia_ventas_val: 0,
    tendencia_ticket: "+0%",
    tendencia_clientes: "+0%",
    sales_trend: [] as { name: string; Ventas: number; Meta: number }[],
    brand_distribution: [] as { name: string; value: number }[],
    category_distribution: [] as { name: string; value: number }[],
    advisor_sales: [] as { name: string; Ventas: number; Meta: number }[],
    group_sales: [] as { name: string; Ventas: number; Meta: number; categoria: string }[]
  });

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

  useEffect(() => {
    let url = 'http://127.0.0.1:8001/api/dashboard/kpis';
    const params = new URLSearchParams();
    if (selectedEmpresa) {
      params.append('empresa_id', String(selectedEmpresa.id));
    }
    if (filters) {
      if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
      if (filters.sucursales && filters.sucursales.length > 0) {
        params.append('sucursales', filters.sucursales.join(','));
      }
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
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setKpis({
            ventas_totales: data.ventas_totales || 0,
            ticket_promedio: data.ticket_promedio || 0,
            nuevos_clientes: data.nuevos_clientes || 0,
            tendencia_ventas: data.tendencia_ventas || "+0%",
            tendencia_ventas_val: data.tendencia_ventas_val || 0,
            tendencia_ticket: data.tendencia_ticket || "+0%",
            tendencia_clientes: data.tendencia_clientes || "+0%",
            sales_trend: data.sales_trend || [],
            brand_distribution: data.brand_distribution || [],
            category_distribution: data.category_distribution || [],
            advisor_sales: data.advisor_sales || [],
            group_sales: data.group_sales || []
          });
        }
      })
      .catch(err => console.error("Error cargando KPIs:", err));
  }, [selectedEmpresa, filters]); // Se ejecuta al cambiar filtros

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const TABS = [
    { id: 'general', label: 'Resumen General' },
    { id: 'auto', label: 'Auto / Camioneta' },
    { id: 'camion', label: 'Camión & Muevetierra' },
    { id: 'servicios', label: 'Servicios & Otros' },
  ];

  const COLORS = ['#62D9F3', '#F2AA27', '#E11D48', '#9333EA', '#10B981', '#64748B'];

  // Contenido por Pestaña
  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-transparent">
      {/* 1. Smart Filter Bar Flotante (Colapsable) */}
      <div className={`transition-all duration-500 origin-top relative z-50 ${isFilterOpen ? 'max-h-[800px] opacity-100 scale-y-100 mb-4 overflow-visible' : 'max-h-0 opacity-0 scale-y-95 mb-0 overflow-hidden pointer-events-none'}`}>
        <SmartFilterBar 
          onFilterChange={setFilters} 
          availableSucursales={sucursales} 
          availableAsesores={asesores} 
          onClose={() => setIsFilterOpen(false)}
        />
      </div>

      <div className={`p-4 md:px-8 space-y-8 max-w-[1400px] mx-auto w-full animate-fade-in transition-all duration-500 ${!isFilterOpen ? 'mt-4' : ''}`}>
        {/* Pestañas (Tabs) de Navegación */}
        <div className="flex border-b border-slate-200/60 pb-4">
          <div className="flex bg-[var(--color-surface-card)] shadow-sm border border-[var(--color-border-light)] p-1.5 rounded-2xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] shadow-sm' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-bg)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjetas de Resumen (KPIs Top) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Ventas Totales" value={formatCurrency(kpis.ventas_totales)} trend={kpis.tendencia_ventas} />
          <StatCard title="Utilidad Bruta" value="$0.00" trend="+0%" />
          <StatCard title="Nuevos Clientes" value={kpis.nuevos_clientes.toString()} trend={kpis.tendencia_clientes} negative={kpis.tendencia_clientes.startsWith('-')} />
        </div>

        {/* Contenido por Pestaña */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Tendencia de Ventas (Acumulado)" type="bar">
              <SalesChart data={kpis.sales_trend} />
            </ChartCard>
            <ChartCard title="Distribución de Ventas vs Objetivo" type="pie">
              {kpis.brand_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kpis.brand_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {kpis.brand_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
                  Sin datos de ventas para el periodo seleccionado
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Auto/Camnta por Grupo" type="bar">
              {kpis.group_sales.filter(g => g.categoria === 'AUTO').length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpis.group_sales.filter(g => g.categoria === 'AUTO')}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Auto/Camnta" type="pie">
              {kpis.category_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kpis.category_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {kpis.category_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Auto/Camnta" type="bar" className="lg:col-span-2">
              {kpis.advisor_sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={kpis.advisor_sales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
          </div>
        )}

        {activeTab === 'camion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Camion por Grupo" type="bar">
              {kpis.group_sales.filter(g => g.categoria === 'CAMION').length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpis.group_sales.filter(g => g.categoria === 'CAMION')}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Camion" type="pie">
              {kpis.category_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kpis.category_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {kpis.category_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Muevetierra por Grupo" type="bar">
              {kpis.group_sales.filter(g => g.categoria === 'MUEVETIERRA').length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpis.group_sales.filter(g => g.categoria === 'MUEVETIERRA')}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Camion / Muevetierra" type="bar" className="lg:col-span-2">
              {kpis.advisor_sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={kpis.advisor_sales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
          </div>
        )}
        
        {activeTab === 'servicios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Patio de Servicio" type="bar">
              {kpis.group_sales.filter(g => g.categoria === 'OTROS').length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpis.group_sales.filter(g => g.categoria === 'OTROS')}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#62D9F3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta" fill="#F2AA27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de ventas</div>
              )}
            </ChartCard>
            <ChartCard title="Ventas de Talleres Externos" type="pie">
              <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de talleres externos</div>
            </ChartCard>
            <ChartCard title="Ventas de Camioneta de servicio" type="bar">
              <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de camioneta de servicio</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Motocicleta" type="pie">
              {kpis.group_sales.filter(g => g.categoria === 'MOTOCICLETA').length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kpis.group_sales.filter(g => g.categoria === 'MOTOCICLETA').map(g => ({ name: g.name, value: g.Ventas }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {kpis.group_sales.filter(g => g.categoria === 'MOTOCICLETA').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de motocicletas</div>
              )}
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, negative = false }: { title: string, value: string, trend: string, negative?: boolean }) {
  return (
    <div className="bg-[var(--color-surface-card)] p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-border-light)] flex flex-col relative overflow-hidden group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
        <TrendingUp size={100} className="text-[var(--color-brand-500)]" />
      </div>
      <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">{title}</span>
      <span className="text-4xl font-black text-[var(--color-text-main)] tracking-tight leading-none my-1">{value}</span>
      <div className="mt-5 flex items-center">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
          negative 
            ? 'bg-rose-50 text-rose-600' 
            : 'bg-emerald-50 text-emerald-600'
        }`}>
          {trend}
        </span>
        <span className="text-xs text-slate-400 ml-3 font-medium">vs periodo anterior</span>
      </div>
    </div>
  );
}

function ChartCard({ title, children, type, className = '' }: { title: string, children: React.ReactNode, type: 'bar' | 'pie', className?: string }) {
  return (
    <div className={`bg-[var(--color-surface-card)] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-border-light)] flex flex-col overflow-hidden relative min-h-[380px] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500 ${className}`}>
      <div className="px-6 py-5 border-b border-[var(--color-border-light)]/50 flex items-center justify-between bg-[var(--color-surface-bg)]/50">
        <h3 className="font-bold text-[var(--color-text-main)] text-base tracking-wide">{title}</h3>
        <div className="p-2 bg-[var(--color-brand-50)] rounded-xl text-[var(--color-brand-600)] shadow-sm">
          {type === 'pie' ? <PieChartIcon size={18} /> : <BarChart2 size={18} />}
        </div>
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
