import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ShoppingCart, Bell, ChevronDown, Building2, Repeat, Sparkles, Bot, X, Send, Database, Code, Table, Trash2, Mic, MicOff, Volume2, VolumeX, Loader2, ArrowUp, BarChart2, Download } from 'lucide-react';
import { Outlet, NavLink, useLocation, Navigate, Link } from 'react-router-dom';
import { useEmpresa } from '../context/EmpresaContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface MessageDataViewerProps {
  registros: any[];
  tiempos?: { ia_segundos: number; bd_segundos: number };
  sql_query?: string;
  total_registros?: number;
}

function MessageDataViewer({ registros, tiempos, sql_query, total_registros }: MessageDataViewerProps) {
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [sqlOpen, setSqlOpen] = useState(false);

  if (!registros || registros.length === 0) return null;

  let stringKey = "";
  let numberKey = "";
  const sample = registros[0];
  if (sample) {
    for (const key of Object.keys(sample)) {
      if (typeof sample[key] === 'string' && !stringKey) stringKey = key;
      if (typeof sample[key] === 'number' && !numberKey) numberKey = key;
    }
  }

  const canChart = stringKey && numberKey && registros.length > 1;

  const downloadCSV = () => {
    const keys = Object.keys(registros[0]);
    const csvContent = [
      keys.join(','),
      ...registros.map(row => keys.map(k => {
        const val = row[k] === null ? '' : String(row[k]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orbis_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 shadow-sm w-full">
      <div className="px-3 py-2 bg-slate-100/60 border-b border-slate-200/50 flex justify-between items-center flex-wrap gap-2">
        <div className="flex bg-slate-200/50 p-0.5 rounded-lg text-[10px]">
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold transition-all ${activeView === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Table size={12} className="w-3 h-3" /> Tabla
          </button>
          {canChart && (
            <button
              onClick={() => setActiveView('chart')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold transition-all ${activeView === 'chart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BarChart2 size={12} className="w-3 h-3" /> Gráfica
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {sql_query && (
            <button
              onClick={() => setSqlOpen(!sqlOpen)}
              className={`p-1 rounded-lg border transition-colors cursor-pointer ${sqlOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
              title="Ver Consulta SQL"
            >
              <Code size={12} className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1 text-[9px] font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm cursor-pointer"
          >
            <Download size={12} className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {sqlOpen && sql_query && (
        <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[9px] border-b border-slate-800 text-left overflow-x-auto whitespace-pre select-all max-h-[120px] scrollbar-thin">
          {sql_query}
        </div>
      )}

      <div className="bg-white">
        {activeView === 'table' ? (
          <div className="overflow-x-auto max-h-[220px] scrollbar-thin">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 sticky top-0 font-bold border-b border-slate-100">
                <tr>
                  {Object.keys(registros[0]).map((k) => (
                    <th key={k} className="px-3 py-2 border-r border-slate-100 last:border-0">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registros.map((fila, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                    {Object.values(fila).map((val, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 border-r border-slate-100 last:border-0 truncate max-w-[120px]" title={val !== null ? String(val) : ""}>
                        {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full h-[180px] p-3" style={{ minWidth: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registros.slice(0, 15)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={stringKey} tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ fontSize: '9px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey={numberKey} fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {tiempos && (
        <div className="px-3 py-1 bg-slate-50 text-[8px] text-slate-400 font-semibold border-t border-slate-100 text-right">
          IA: {tiempos.ia_segundos}s | DB: {tiempos.bd_segundos}s | Filas: {total_registros || registros.length}
        </div>
      )}
    </div>
  );
}

function OrbisFace({ emotion }: { emotion: 'idle' | 'listening' | 'thinking' | 'sad' | 'error' | 'happy' }) {
  const getGlowColor = () => {
    switch (emotion) {
      case 'listening': return 'bg-orange-500/30 animate-pulse';
      case 'thinking': return 'bg-violet-600/30 animate-pulse';
      case 'happy': return 'bg-emerald-400/30';
      case 'sad':
      case 'error': return 'bg-rose-500/30';
      default: return 'bg-indigo-500/20';
    }
  };

  const getOrbFill = () => {
    switch (emotion) {
      case 'listening': return '#f97316';
      case 'thinking': return '#8b5cf6';
      case 'happy': return '#10b981';
      case 'sad':
      case 'error': return '#ef4444';
      default: return '#6366f1';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24 mb-4 select-none">
      <div className={`absolute inset-0 rounded-full blur-[20px] transition-all duration-700 ${getGlowColor()}`} />
      <svg viewBox="0 0 200 200" className="w-full h-full z-10 transition-all duration-500">
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={getOrbFill()}
          strokeWidth="1.5"
          strokeDasharray="4 16"
          opacity="0.4"
          className="animate-spin origin-center"
          style={{ animationDuration: '24s', transformOrigin: 'center' }}
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke={getOrbFill()}
          strokeWidth="1"
          strokeDasharray="2 10"
          opacity="0.3"
          className="animate-spin origin-center animate-spin-reverse"
          style={{ animationDuration: '15s', transformOrigin: 'center' }}
        />
        <circle
          cx="100"
          cy="100"
          r={emotion === 'listening' ? 44 : (emotion === 'thinking' ? 36 : 40)}
          fill={getOrbFill()}
          opacity="0.85"
          className="transition-all duration-500 origin-center"
          style={{ transformOrigin: 'center' }}
        />
        <circle
          cx="96"
          cy="96"
          r="16"
          fill="#ffffff"
          opacity="0.3"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export function Layout() {
  const [sucursales, setSucursales] = useState<{id: number, nombre: string, empresa_id?: number}[]>([]);
  const [ventasOpen, setVentasOpen] = useState(false);
  const [orbisOpen, setOrbisOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedEmpresa, setSelectedEmpresa } = useEmpresa();

  const [messages, setMessages] = useState<{
    id: string;
    sender: 'user' | 'orbis';
    text: string;
    registros?: any[];
    tiempos?: { ia_segundos: number; bd_segundos: number };
    sql_query?: string;
    total_registros?: number;
    sugerencias?: string[];
  }[]>([
    {
      id: 'welcome',
      sender: 'orbis',
      text: '¡Hola! Soy Orbis, tu asistente inteligente de Multillantas Nieto. Estoy listo para ayudarte a consultar información sobre ventas, asesores, marcas y sucursales en lenguaje natural.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [emotion, setEmotion] = useState<'idle' | 'listening' | 'thinking' | 'sad' | 'error' | 'happy'>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition initialization
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'es-MX';

      rec.onstart = () => {
        setIsRecording(true);
        setEmotion('listening');
      };

      rec.onend = () => {
        setIsRecording(false);
        setEmotion(prev => prev === 'listening' ? 'idle' : prev);
      };

      rec.onerror = (event: any) => {
        console.error("Error en Speech Recognition:", event.error);
        setIsRecording(false);
        setEmotion('error');
        setTimeout(() => setEmotion('idle'), 3000);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setChatInput(transcript);
          // Auto-submit speech input
          sendChatMessage(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no está soportado en este navegador.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (audioRef.current) {
        audioRef.current.pause(); // stop TTS speech if playing
      }
      recognitionRef.current?.start();
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const cleanText = text.replace(/[*_#`\-]/g, ' ').trim();
      const url = `http://172.16.71.208:8000/api/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(e => console.warn("No se pudo reproducir el audio de salida:", e));
    } catch (err) {
      console.warn("Falla en sintetizador de voz (TTS)", err);
    }
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsgId = Date.now().toString();
    const newUserMessage = {
      id: userMsgId,
      sender: 'user' as const,
      text: text.trim()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setChatLoading(true);
    setEmotion('thinking');

    // Build the history from existing messages
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    try {
      const response = await fetch('http://172.16.71.208:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: text,
          historial: history,
          modelo: 'Razonamiento'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        const orbisMsgId = (Date.now() + 1).toString();
        const newOrbisMessage = {
          id: orbisMsgId,
          sender: 'orbis' as const,
          text: data.mensaje || '',
          registros: data.datos,
          tiempos: data.tiempos,
          sql_query: data.sql_generado,
          total_registros: data.total_registros,
          sugerencias: data.sugerencias
        };

        setMessages(prev => [...prev, newOrbisMessage]);
        setEmotion('happy');
        setTimeout(() => setEmotion('idle'), 3000);
        
        // Speak the message out loud
        speakText(data.mensaje || '');
      } else {
        throw new Error(data.detail || 'Error desconocido del backend');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: errorMsgId,
        sender: 'orbis',
        text: `Lo siento, ocurrió un error al procesar tu solicitud: ${err.message || 'Error de conexión'}`
      }]);
      setEmotion('error');
      setTimeout(() => setEmotion('idle'), 4000);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSuggestionClick = (sug: string) => {
    sendChatMessage(sug);
  };

  const clearHistory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setMessages([
      {
        id: 'welcome',
        sender: 'orbis',
        text: '¡Hola! Soy Orbis, tu asistente inteligente de Multillantas Nieto. Estoy listo para ayudarte a consultar información sobre ventas, asesores, marcas y sucursales en lenguaje natural.'
      }
    ]);
    setEmotion('idle');
  };

  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/sucursales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSucursales(data);
        }
      })
      .catch(err => {
        console.warn("No se pudo conectar al backend de sucursales.", err);
      });
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setVentasOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedEmpresa) {
    return <Navigate to="/" replace />;
  }

  // Filtrar sucursales por la empresa seleccionada
  const sucursalesEmpresa = sucursales.filter(s => s.empresa_id === selectedEmpresa.id || s.empresa_id === undefined);

  // Determinar logo según la empresa
  const getCompanyLogo = (nombre: string) => {
    const nom = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nom.includes('multi')) return '/Multi.jpg';
    if (nom.includes('slr')) return '/slr.jpeg';
    if (nom.includes('rodamiento')) return '/rodamientos.png';
    return '/icon.png';
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-surface-bg)] font-sans text-[var(--color-text-main)] selection:bg-[var(--color-brand-500)] selection:text-white overflow-hidden relative">
      
      {/* Elementos decorativos de fondo tipo "Aurora/Mesh Gradient" compartidos con el SelectEmpresa */}
      {/* Orbe rojo/coral suave arriba a la derecha */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-400/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      {/* Orbe azul cielo suave abajo a la izquierda */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-400/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      {/* Orbe blanco central sutil para suavizar las transiciones */}
      <div className="absolute top-[30%] left-[30%] w-[800px] h-[800px] bg-white/60 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header Navigation */}
      <header className="h-16 bg-[var(--color-surface-card)]/60 backdrop-blur-md border-b border-[var(--color-border-light)]/50 flex items-center justify-between px-4 md:px-8 shrink-0 z-50 shadow-sm relative">
        
        {/* Left Section: Logo & Nav */}
        <div className="flex items-center space-x-8 h-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-card)]/80 border border-[var(--color-border-light)] flex items-center justify-center overflow-hidden shadow-sm p-1">
              <img src={getCompanyLogo(selectedEmpresa.nombre)} alt={`Logo ${selectedEmpresa.nombre}`} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="ml-3 hidden sm:flex flex-col justify-center">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
                KPI´S <span className="text-[#c1121f]">VENTAS</span>
              </span>
              <span className="text-xs font-semibold text-indigo-600 truncate max-w-[150px]">
                {selectedEmpresa.nombre}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center h-full space-x-1">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `flex items-center space-x-2 px-4 h-full border-b-2 transition-colors ${isActive ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>

            {/* Filtros Toggle Button */}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center space-x-2 px-4 h-full border-b-2 transition-colors cursor-pointer ${
                isFilterOpen ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              <span className="hidden sm:inline">Filtros</span>
            </button>

            {/* Ventas Dropdown */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button 
                onClick={() => setVentasOpen(!ventasOpen)}
                className={`flex items-center space-x-2 px-4 h-full border-b-2 transition-colors cursor-pointer ${
                  location.pathname.startsWith('/ventas/sucursal/') || ventasOpen
                    ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">Ventas</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${ventasOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Panel */}
              {/* Dropdown Menu */}
              {ventasOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-surface-card)]/95 backdrop-blur-2xl border border-[var(--color-border-light)] rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-3 z-[60] origin-top-left animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 space-y-1">
                    {sucursalesEmpresa.map((sucursal) => (
                      <NavLink
                        key={sucursal.id}
                        to={`/ventas/sucursal/${sucursal.id}`}
                        onClick={() => setVentasOpen(false)}
                        className={({ isActive }) => `flex items-center px-4 py-3 text-sm rounded-xl transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-50 text-indigo-800 font-bold' 
                            : 'text-slate-800 font-semibold hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <Building2 size={16} className="mr-3 opacity-70" />
                        {sucursal.nombre}
                      </NavLink>
                    ))}
                    {sucursalesEmpresa.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500 italic text-center">
                        No hay sucursales disponibles
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: User & Orbis */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link 
            to="/"
            onClick={() => setSelectedEmpresa(null)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium"
          >
            <Repeat size={14} />
            <span className="hidden md:inline">Cambiar Empresa</span>
          </Link>
          
          <button 
            onClick={() => setOrbisOpen(true)}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 cursor-pointer relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles size={16} className="animate-pulse" />
            <span className="font-bold text-sm tracking-wide">Orbis AI</span>
          </button>

          <button className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform">
            JR
          </div>
        </div>
      </header>

      {/* Orbis Offcanvas Panel */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${orbisOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setOrbisOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[400px] bg-[var(--color-surface-card)] shadow-2xl transition-transform duration-300 transform ${orbisOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-[var(--color-border-light)]`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles size={20} />
              <h2 className="font-bold text-lg">Orbis Assistant</h2>
            </div>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={clearHistory}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="Limpiar Historial"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOrbisOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 custom-scrollbar bg-slate-50/20">
            {messages.length === 1 && messages[0].id === 'welcome' ? (
              // Welcome Screen
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                <OrbisFace emotion={emotion} />
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight mb-2">
                  ¡Hola! Soy <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Orbis</span>
                </h3>
                <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed mb-6">
                  Tu asistente con IA de Multillantas Nieto. Consúltame datos de ventas, asesores, inventario y más.
                </p>

                {/* Starter Suggestions */}
                <div className="w-full max-w-[300px] space-y-2 text-left">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2 px-1">Consultas sugeridas</span>
                  {[
                    "¿Cuáles son las marcas más vendidas?",
                    "Muestra las ventas totales de este mes",
                    "¿Quién es el asesor con mayores ventas?"
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 px-3 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer block"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat conversation
              <div className="flex flex-col space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'orbis' && (
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center border border-violet-200 shadow-sm shrink-0 self-end mb-1">
                        <Bot size={12} />
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-none px-3.5 py-2 text-sm shadow-md select-text break-words'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2 text-sm shadow-sm select-text break-words'
                      }>
                        {msg.text}
                      </div>

                      {/* Visor de datos si hay registros */}
                      {msg.sender === 'orbis' && msg.registros && msg.registros.length > 0 && (
                        <MessageDataViewer
                          registros={msg.registros}
                          tiempos={msg.tiempos}
                          sql_query={msg.sql_query}
                          total_registros={msg.total_registros}
                        />
                      )}

                      {/* Sugerencias contextuales de Orbis */}
                      {msg.sender === 'orbis' && msg.sugerencias && msg.sugerencias.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 justify-start">
                          {msg.sugerencias.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSuggestionClick(sug)}
                              className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading state bubble */}
                {chatLoading && (
                  <div className="flex gap-2 w-full justify-start animate-fade-in">
                    <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center border border-violet-200 shadow-sm shrink-0 self-end mb-1">
                      <Bot size={12} />
                    </div>
                    <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none px-3.5 py-2 text-sm shadow-sm flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                      <span>Orbis está analizando...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Footer (Input Form) */}
          <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex items-center gap-2">
              {/* Altavoz Toggle */}
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${voiceEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                title={voiceEnabled ? "Desactivar salida de voz" : "Activar salida de voz"}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Input de Texto */}
              <div className="flex-1 relative flex items-center bg-slate-100/85 hover:bg-slate-100 rounded-xl px-3 py-1.5 border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all duration-200 shadow-inner">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a Orbis..."
                  disabled={chatLoading}
                  className="w-full text-sm bg-transparent outline-none pr-7 text-slate-800"
                />
                {chatInput.trim() && (
                  <button
                    type="submit"
                    className="absolute right-2 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <ArrowUp size={16} className="bg-indigo-600 text-white rounded-full p-0.5" />
                  </button>
                )}
              </div>

              {/* Botón de Micrófono */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2.5 rounded-full transition-all duration-200 shadow-md cursor-pointer border flex items-center justify-center ${
                  isRecording
                    ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={isRecording ? "Detener grabación de voz" : "Grabar consulta de voz"}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-transparent relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-transparent pointer-events-none" />
          <Outlet context={{ isFilterOpen, setIsFilterOpen, sucursales }} />
      </main>
    </div>
  );
}
