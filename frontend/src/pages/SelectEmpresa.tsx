console.log("EVALUATING SelectEmpresa.tsx");
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useEmpresa } from '../context/EmpresaContext';
import type { Empresa } from '../context/EmpresaContext';

export function SelectEmpresa() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedEmpresa } = useEmpresa();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/empresas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmpresas(data);
        } else {
          console.error("API did not return an array:", data);
        }
      })
      .catch(err => console.error("Error fetching empresas:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    navigate('/dashboard');
  };

  const getCompanyColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('llanta')) return 'hover:border-blue-400 hover:shadow-blue-100 group-hover:bg-blue-50';
    if (lower.includes('slr')) return 'hover:border-emerald-400 hover:shadow-emerald-100 group-hover:bg-emerald-50';
    return 'hover:border-amber-400 hover:shadow-amber-100 group-hover:bg-amber-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shadow-inner overflow-hidden p-1">
                <img src="/icon.png" alt="Logo Nieto" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-800">
                Reportes <span className="text-[#c1121f]">Nieto</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 mt-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Selecciona tu Empresa
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Elige la empresa de la cual deseas consultar reportes, métricas y analíticas de ventas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => handleSelect(empresa)}
              className={`group relative bg-white rounded-2xl p-8 border-2 border-slate-100 shadow-sm transition-all duration-300 text-left cursor-pointer overflow-hidden ${getCompanyColor(empresa.nombre)}`}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Building2 size={32} className="text-slate-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-slate-900">
                  {empresa.nombre}
                </h3>
                
                <div className="mt-8 flex items-center text-slate-500 font-medium group-hover:text-sky-600 transition-colors">
                  <span>Acceder al panel &rarr;</span>
                </div>
              </div>
            </button>
          ))}

          {empresas.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 text-lg">No se encontraron empresas en la base de datos.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
