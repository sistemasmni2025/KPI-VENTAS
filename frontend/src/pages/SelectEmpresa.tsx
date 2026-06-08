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

  const getCompanyImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('multi') || lower.includes('llanta')) return '/Multi.jpg';
    if (lower.includes('rodamiento')) return '/rodamientos.png';
    if (lower.includes('slr')) return '/slr.jpeg';
    return null; // fallback
  };

  const getCompanyStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('llanta') || lower.includes('multi')) return 'hover:border-indigo-400 hover:shadow-indigo-500/20';
    if (lower.includes('slr')) return 'hover:border-emerald-400 hover:shadow-emerald-500/20';
    return 'hover:border-rose-400 hover:shadow-rose-500/20'; // Rodamientos
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans">
      {/* Elementos decorativos de fondo tipo "Aurora/Mesh Gradient" */}
      {/* Orbe rojo/coral suave arriba a la derecha */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-400/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      {/* Orbe azul cielo suave abajo a la izquierda */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-400/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      {/* Orbe blanco central sutil para suavizar las transiciones */}
      <div className="absolute top-[30%] left-[30%] w-[800px] h-[800px] bg-white/60 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header transparente para no cortar el gradiente */}
      <header className="bg-transparent z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1 border border-white/60">
                <img src="/icon.png" alt="Logo Nieto" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-xl sm:text-2xl tracking-tighter text-slate-800 drop-shadow-sm">
                KPI´S <span className="text-[#c1121f]">VENTAS</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Flex-1 and overflow-hidden to prevent scroll */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in shrink-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4">
            Selecciona tu Empresa
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium px-4">
            Elige la empresa de la cual deseas consultar reportes y analíticas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full max-w-6xl px-2 sm:px-4">
          {empresas.map((empresa, idx) => {
            const bgImage = getCompanyImage(empresa.nombre);
            return (
              <button
                key={empresa.id}
                onClick={() => handleSelect(empresa)}
                className={`group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 transition-all duration-500 text-left cursor-pointer overflow-hidden hover:-translate-y-2 hover:shadow-2xl flex flex-col h-[220px] sm:h-[260px] lg:h-[300px] ${getCompanyStyle(empresa.nombre)} animate-fade-in`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Contenido Superior: Logo de la Empresa (si existe) */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full relative z-10 h-[140px] sm:h-[180px]">
                  {bgImage ? (
                    <img 
                      src={bgImage} 
                      alt={empresa.nombre} 
                      className={`max-w-[85%] max-h-[100px] sm:max-h-[120px] object-contain mix-blend-multiply contrast-125 brightness-105 transition-transform duration-500 ${
                        empresa.nombre.toLowerCase().includes('slr') 
                          ? 'group-hover:scale-110' 
                          : 'scale-[1.3] sm:scale-[1.4] group-hover:scale-[1.4] sm:group-hover:scale-[1.5]'
                      }`} 
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                      <span className="text-3xl font-black text-slate-300">{empresa.nombre.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Contenido Inferior: Textos y Botón */}
                <div className="relative z-10 flex flex-col w-full p-5 sm:p-8 bg-white/50 backdrop-blur-sm border-t border-slate-50 shrink-0 mt-auto">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 mb-3 tracking-tight leading-tight group-hover:text-indigo-700 transition-colors">
                    {empresa.nombre}
                  </h3>
                  
                  <div className="flex items-center text-slate-500 font-bold group-hover:text-indigo-600 transition-colors">
                    <span className="bg-white px-4 py-2 rounded-full text-xs sm:text-sm border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all flex items-center">
                      Acceder al panel <span className="ml-1 opacity-70">&rarr;</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {empresas.length === 0 && !loading && (
          <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm w-full max-w-md shrink-0 mt-8">
            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">No hay empresas disponibles en este momento.</p>
          </div>
        )}
      </main>
    </div>
  );
}
