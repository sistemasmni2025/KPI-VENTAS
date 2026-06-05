import React, { useState, useRef, useEffect } from 'react';
import { Filter, Calendar, Users, Briefcase, MapPin, Package, Wrench, PenTool, Check, ChevronDown, Search, X } from 'lucide-react';

export interface FilterState {
  periodo: string;
  sucursales: string[];
  asesores: string[];
  categoriasCliente: string[];
  manoDeObra: string[];
  talleresExternos: string[];
  gruposProducto: string[];
}

interface SmartFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  availableSucursales: {id: string, nombre: string}[];
  availableAsesores: {id: string, nombre: string}[];
}

const defaultFilters: FilterState = {
  periodo: 'Año',
  sucursales: [],
  asesores: [],
  categoriasCliente: [],
  manoDeObra: [],
  talleresExternos: [],
  gruposProducto: []
};

type FilterCategory = 'periodo' | 'sucursales' | 'asesores' | 'categoriasCliente' | 'manoDeObra' | 'talleresExternos' | 'gruposProducto';

export function SmartFilterBar({ onFilterChange, availableSucursales, availableAsesores }: SmartFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeDropdown, setActiveDropdown] = useState<FilterCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Opciones disponibles para cada filtro
  const OPTIONS = {
    periodo: ['Año', 'Mes', 'Quincena', 'Semanal', 'Personalizado'],
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

  // Effect para notificar cambios al padre (con debounce manual si hiciera falta)
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleOption = (category: keyof FilterState, option: string) => {
    if (category === 'periodo') {
      setFilters(prev => ({ ...prev, periodo: option }));
      setActiveDropdown(null);
      return;
    }

    setFilters(prev => {
      const current = prev[category] as string[];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(item => item !== option) };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const getLabel = (category: FilterCategory, values: string[] | string) => {
    if (category === 'periodo') return values as string;
    if (Array.isArray(values)) {
      if (values.length === 0) return 'Todos';
      if (values.length === 1) return values[0];
      return `${values.length} Seleccionados`;
    }
    return 'Todos';
  };

  const clearFilter = (category: FilterCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters(prev => ({ ...prev, [category]: category === 'periodo' ? 'Año' : [] }));
  };

  const Pill = ({ category, icon: Icon, title, options, isSearchable = false }: { category: FilterCategory, icon: any, title: string, options: {id: string, nombre: string}[] | string[], isSearchable?: boolean }) => {
    const isActive = activeDropdown === category;
    const value = filters[category];
    const hasSelection = Array.isArray(value) ? value.length > 0 : value !== defaultFilters.periodo;
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
          className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-sm transition-all duration-300 backdrop-blur-md cursor-pointer ${
            hasSelection || isActive
              ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-md shadow-sky-500/10'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <Icon size={14} className={hasSelection || isActive ? 'text-sky-500' : 'text-slate-400'} />
          {title && <span className="font-semibold">{title}:</span>}
          <span className="font-medium truncate max-w-[120px]">{getLabel(category, value)}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown flotante con Glassmorphism */}
        {isActive && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-sky-100 rounded-2xl shadow-2xl shadow-sky-900/10 p-2 z-[60] origin-top-left animate-in fade-in slide-in-from-top-2 duration-200">
            {isSearchable && (
              <div className="px-2 py-2 border-b border-slate-100 mb-2 sticky top-0 bg-white/95 z-10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-500">Sin resultados</div>
              ) : (
                filteredOptions.map((opt: any) => {
                  const optId = typeof opt === 'string' ? opt : opt.id;
                  const optName = typeof opt === 'string' ? opt : opt.nombre;
                  const isSelected = category === 'periodo' ? value === optId : (value as string[]).includes(optId);
                  
                  return (
                    <button
                      key={optId}
                      onClick={() => toggleOption(category, optId)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50 text-sky-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{optName}</span>
                      {isSelected && <Check size={14} className="text-sky-500" />}
                    </button>
                  );
                })
              )}
            </div>
            
            {Array.isArray(value) && value.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={(e) => clearFilter(category, e)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 cursor-pointer"
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
    <div className="bg-gradient-to-r from-sky-50/50 via-white to-sky-50/50 p-4 border-b border-sky-100/50 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center space-x-3 flex-wrap gap-y-3" ref={dropdownRef}>
          {/* Píldoras de Filtros */}
          <Pill category="periodo" icon={Calendar} title="Periodo" options={OPTIONS.periodo} />
          <Pill category="sucursales" icon={MapPin} title="Sucursal" options={availableSucursales} isSearchable />
          <Pill category="asesores" icon={Users} title="Asesor" options={availableAsesores} isSearchable />
          <Pill category="categoriasCliente" icon={Briefcase} title="Cliente" options={OPTIONS.categoriasCliente} />
          <Pill category="gruposProducto" icon={Package} title="Producto" options={OPTIONS.gruposProducto} />
          <Pill category="manoDeObra" icon={Wrench} title="Mano de Obra" options={OPTIONS.manoDeObra} />
          <Pill category="talleresExternos" icon={PenTool} title="Talleres" options={OPTIONS.talleresExternos} />
          
          {/* Botón General para Borrar Filtros */}
          <button 
            onClick={() => setFilters(defaultFilters)}
            className="ml-auto text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-full cursor-pointer flex items-center"
          >
            <X size={14} className="mr-1" /> Limpiar Todo
          </button>
        </div>

      </div>
    </div>
  );
}
