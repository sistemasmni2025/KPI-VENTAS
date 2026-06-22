import React, { useState, useRef, useEffect } from 'react';
import { Filter, Calendar, Users, Briefcase, MapPin, Package, Wrench, PenTool, Check, ChevronDown, Search, X } from 'lucide-react';

export interface FilterState {
  fechaInicio: string;
  fechaFin: string;
  sucursales: string[];
  asesores: string[];
  categoriasCliente: string[];
  manoDeObra: string[];
  talleresExternos: string[];
  gruposProducto: string[];
}

interface SmartFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  availableSucursales: { id: string, nombre: string }[];
  availableAsesores: { id: string, nombre: string }[];
  onClose?: () => void;
}

const getFirstDayOfMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const defaultFilters: FilterState = {
  fechaInicio: getFirstDayOfMonth(),
  fechaFin: getTodayDate(),
  sucursales: [],
  asesores: [],
  categoriasCliente: [],
  manoDeObra: [],
  talleresExternos: [],
  gruposProducto: []
};

type FilterCategory = 'sucursales' | 'asesores' | 'categoriasCliente' | 'manoDeObra' | 'talleresExternos' | 'gruposProducto' | 'fechas';

interface SmartFilterBarProps {
  filters?: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableSucursales: { id: string, nombre: string }[];
  availableAsesores: { id: string, nombre: string }[];
  onClose?: () => void;
}

export function SmartFilterBar({ onFilterChange, availableSucursales, availableAsesores, onClose, filters: propFilters }: SmartFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>(propFilters || defaultFilters);
  const [activeDropdown, setActiveDropdown] = useState<FilterCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propFilters) {
      if (JSON.stringify(propFilters) !== JSON.stringify(filters)) {
        setFilters(propFilters);
      }
    }
  }, [propFilters, filters]);

  // Opciones disponibles para cada filtro
  const OPTIONS = {
    categoriasCliente: ['Comercial', 'Patio', 'Refacciones'],
    manoDeObra: ['Mecánica Ligera', 'Mecánica Pesada', 'Alineación', 'Llantas'],
    talleresExternos: ['Taller A', 'Taller B', 'Agencia C'],
    gruposProducto: ['Auto/Camioneta', 'Camión', 'Muevetierra', 'Motocicleta']
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect para notificar cambios al padre
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleOption = (category: keyof FilterState, option: string) => {
    setFilters(prev => {
      const current = prev[category] as string[];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(item => item !== option) };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const getLabel = (category: FilterCategory, values: string[]) => {
    if (values.length === 0) return 'Todos';
    if (values.length === 1) return values[0];
    return `${values.length} Seleccionados`;
  };

  const clearFilter = (category: FilterCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (category === 'fechas') {
      setFilters(prev => ({ ...prev, fechaInicio: getFirstDayOfMonth(), fechaFin: getTodayDate() }));
    } else {
      setFilters(prev => ({ ...prev, [category]: [] }));
    }
  };

  const CustomDatePicker = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T12:00:00') : new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const handleDateClick = (day: number) => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onChange(dateStr);
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none hover:border-indigo-400 transition-colors text-slate-700 font-medium cursor-pointer"
        >
          <span>{value.split('-').reverse().join('/')}</span>
          <Calendar size={16} className="text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-[70] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="font-bold text-sm text-slate-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === dateStr;
                const isToday = getTodayDate() === dateStr;

                return (
                  <button
                    key={day}
                    onClick={(e) => { e.preventDefault(); handleDateClick(day); }}
                    className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors mx-auto cursor-pointer ${isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md'
                        : isToday
                          ? 'bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const DateFilterPill = () => {
    const isActive = activeDropdown === 'fechas';
    const isToday = filters.fechaInicio === getTodayDate() && filters.fechaFin === getTodayDate();
    const formatLabel = (dateStr: string) => dateStr.split('-').reverse().join('/');
    const label = isToday ? 'Hoy' : `${formatLabel(filters.fechaInicio)} al ${formatLabel(filters.fechaFin)}`;

    return (
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(isActive ? null : 'fechas')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 backdrop-blur-md cursor-pointer ${!isToday || isActive
              ? 'bg-indigo-50/90 border-indigo-200 text-indigo-700 shadow-sm'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
        >
          <Calendar size={16} className={!isToday || isActive ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="font-bold text-slate-800">Fecha:</span>
          <span className="truncate max-w-[200px]">{label}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ml-1 opacity-60 ${isActive ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <div className="absolute top-full left-0 mt-3 w-[340px] bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-5 z-[60] origin-top-left animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <CustomDatePicker
                label="Desde"
                value={filters.fechaInicio}
                onChange={(v) => setFilters(prev => ({ ...prev, fechaInicio: v }))}
              />
              <CustomDatePicker
                label="Hasta"
                value={filters.fechaFin}
                onChange={(v) => setFilters(prev => ({ ...prev, fechaFin: v }))}
              />
            </div>

            {!isToday && (
              <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={(e) => clearFilter('fechas', e)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer w-full text-center border border-indigo-100 bg-indigo-50/50"
                >
                  Restablecer a Hoy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const Pill = ({ category, icon: Icon, title, options, isSearchable = false }: { category: FilterCategory, icon: any, title: string, options: { id: string, nombre: string }[] | string[], isSearchable?: boolean }) => {
    const isActive = activeDropdown === category;
    const value = filters[category] as string[];
    const hasSelection = value.length > 0;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = isSearchable
      ? (options as any[]).filter(o => {
        const text = typeof o === 'string' ? o : o.nombre;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      })
      : options;

    return (
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(isActive ? null : category)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 backdrop-blur-md cursor-pointer ${hasSelection || isActive
              ? 'bg-indigo-50/90 border-indigo-200 text-indigo-700 shadow-sm'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
        >
          <Icon size={16} className={hasSelection || isActive ? 'text-indigo-600' : 'text-slate-400'} />
          {title && <span className="font-bold text-slate-800">{title}:</span>}
          <span className="truncate max-w-[140px]">{getLabel(category, value)}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ml-1 opacity-60 ${isActive ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <div className="absolute top-full left-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-3 z-[60] origin-top-left animate-in fade-in slide-in-from-top-2 duration-300">
            {isSearchable && (
              <div className="px-2 py-2 border-b border-slate-100/50 mb-2 sticky top-0 bg-transparent z-10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400 font-medium">Sin resultados</div>
              ) : (
                filteredOptions.map((opt: any) => {
                  const optId = typeof opt === 'string' ? opt : opt.id;
                  const optName = typeof opt === 'string' ? opt : opt.nombre;
                  const isSelected = value.includes(optId);

                  return (
                    <button
                      key={optId}
                      onClick={() => toggleOption(category as keyof FilterState, optId)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer ${isSelected ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-rose-50 hover:text-rose-700 text-slate-800 font-semibold'
                        }`}
                    >
                      <span>{optName}</span>
                      {isSelected && <Check size={16} className="text-indigo-600" />}
                    </button>
                  );
                })
              )}
            </div>

            {hasSelection && (
              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={(e) => clearFilter(category, e)}
                  className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Limpiar Filtro
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/70 border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-xl shadow-sm">
      <div className="max-w-[1400px] mx-auto p-4 md:px-8 flex items-center justify-between">

        <div className="flex items-center space-x-3 flex-wrap gap-y-3" ref={dropdownRef}>
          {/* Calendario de Fechas */}
          <DateFilterPill />

          {/* Píldoras de Filtros */}
          <Pill category="sucursales" icon={MapPin} title="Sucursal" options={availableSucursales} isSearchable />
          <Pill category="asesores" icon={Users} title="Asesor" options={availableAsesores} isSearchable />
          <Pill category="categoriasCliente" icon={Briefcase} title="Cliente" options={OPTIONS.categoriasCliente} />
          <Pill category="gruposProducto" icon={Package} title="Producto" options={OPTIONS.gruposProducto} />
          <Pill category="manoDeObra" icon={Wrench} title="Mano de Obra" options={OPTIONS.manoDeObra} />
          <Pill category="talleresExternos" icon={PenTool} title="Talleres" options={OPTIONS.talleresExternos} />

          {/* Botón General para Borrar Filtros */}
          <button
            onClick={() => setFilters(defaultFilters)}
            className="ml-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition-all px-4 py-2 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-full cursor-pointer flex items-center"
          >
            <X size={14} className="mr-1.5" /> Limpiar Todo
          </button>
        </div>

        {/* Botón Cerrar Filtros */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
            title="Ocultar Filtros"
          >
            <X size={18} />
          </button>
        )}

      </div>
    </div>
  );
}
