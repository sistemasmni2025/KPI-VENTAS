import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ShoppingCart, Bell, ChevronDown, Building2, Repeat, Sparkles, Bot, X, Send, Database, Code, Table, Trash2, Mic, MicOff, Volume2, VolumeX, Loader2, ArrowUp, BarChart2, Download, Maximize2 } from 'lucide-react';
import { Outlet, NavLink, useLocation, Navigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useEmpresa } from '../context/EmpresaContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface MessageDataViewerProps {
  registros: any[];
  tiempos?: { ia_segundos: number; bd_segundos: number };
  total_registros?: number;
}

function MessageDataViewer({ registros, tiempos, total_registros }: MessageDataViewerProps) {
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMaximized) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoutRef.current && !popoutRef.current.contains(event.target as Node)) {
        const chatWidget = document.querySelector('.orbis-chat-widget');
        if (!chatWidget || !chatWidget.contains(event.target as Node)) {
          setIsMaximized(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMaximized]);

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

  const filteredRegistros = registros.filter((row) => 
    Object.values(row).some((val) => 
      val !== null && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <div 
        className="mt-3 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-md w-full cursor-pointer hover:border-blue-300 transition-all duration-200 group"
        onClick={() => setIsMaximized(true)}
        title="Haz clic para ampliar visualización"
      >
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/60 flex justify-between items-center flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px]">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${activeView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Table size={12} className="w-3 h-3" /> Tabla
            </button>
            {canChart && (
              <button
                onClick={() => setActiveView('chart')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${activeView === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <BarChart2 size={12} className="w-3 h-3" /> Gráfica
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMaximized(true)}
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 shadow-sm transition-all"
              title="Ampliar visualización"
            >
              <Maximize2 size={12} className="w-3 h-3" />
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm cursor-pointer hover:shadow transition-all"
            >
              <Download size={12} className="w-3 h-3 text-blue-600" /> Exportar
            </button>
          </div>
        </div>

        <div className="bg-white max-h-[160px] overflow-hidden relative">
          {/* Overlay to indicate click to expand */}
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all duration-300 flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-blue-800 text-[9px] font-extrabold px-2.5 py-1.5 rounded-full border border-blue-100 shadow-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
              <Maximize2 size={10} className="w-2.5 h-2.5" /> Ampliar visualización
            </span>
          </div>

          {activeView === 'table' ? (
            <div className="overflow-x-auto max-h-[160px] scrollbar-thin select-none pointer-events-none">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead className="bg-blue-900 text-white sticky top-0 font-bold">
                  <tr>
                    {Object.keys(registros[0]).map((k) => (
                      <th key={k} className="px-3 py-2 border-r border-blue-800 last:border-0 font-bold uppercase tracking-wider">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {registros.slice(0, 5).map((fila, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors odd:bg-slate-50/30">
                      {Object.values(fila).map((val, cellIdx) => (
                        <td key={cellIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-0 truncate max-w-[120px]">
                          {val === null ? <span className="text-slate-400 italic">null</span> : (typeof val === 'number' && !String(val).includes('.') ? val : String(val))}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {registros.length > 5 && (
                    <tr className="bg-slate-50 text-slate-400 font-bold">
                      <td colSpan={Object.keys(registros[0]).length} className="text-center py-2 text-[9px] uppercase tracking-wide">
                        + {registros.length - 5} registros más. Clic para verlos todos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="w-full h-[140px] p-2 flex justify-center items-center pointer-events-none select-none" style={{ minWidth: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registros.slice(0, 8)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={stringKey} tick={{ fontSize: 7, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#64748b' }} />
                  <Bar dataKey={numberKey} fill="#004f9f" radius={[2, 2, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {tiempos && (
          <div className="px-3 py-1 bg-slate-50 text-[8px] text-slate-400 font-semibold border-t border-slate-100 text-right">
            IA: {tiempos.ia_segundos}s | DB: {tiempos.bd_segundos}s | Registros: {total_registros || registros.length}
          </div>
        )}
      </div>
      {/* Side-by-Side Floating Visualizer Panel */}
      {isMaximized && createPortal(
        <div 
          ref={popoutRef}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-[414px] w-auto md:w-[600px] lg:w-[800px] xl:w-[950px] max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-450px)] h-[600px] max-h-[85vh] bg-white border border-slate-200 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col z-[200] overflow-hidden animate-in fade-in slide-in-from-right duration-300"
        >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950">Visualizador de Consultas Orbis AI</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Mostrando {filteredRegistros.length} de {registros.length} registros {tiempos ? `(IA: ${tiempos.ia_segundos}s | DB: ${tiempos.bd_segundos}s)` : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                {activeView === 'table' && (
                  <div className="relative flex items-center bg-slate-100 border border-transparent focus-within:border-blue-400 focus-within:bg-white rounded-xl px-3 py-1.5 shadow-inner transition-all w-48 md:w-64">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar datos en esta tabla..."
                      className="w-full text-xs bg-transparent outline-none pr-6 text-slate-850"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {/* View Selector inside Modal */}
                <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveView('table')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-bold transition-all ${activeView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    <Table size={13} className="w-3.5 h-3.5" /> Tabla
                  </button>
                  {canChart && (
                    <button
                      onClick={() => setActiveView('chart')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-bold transition-all ${activeView === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      <BarChart2 size={13} className="w-3.5 h-3.5" /> Gráfica
                    </button>
                  )}
                </div>

                {/* Export Button */}
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm hover:shadow cursor-pointer transition-all"
                >
                  <Download size={13} className="w-3.5 h-3.5 text-blue-600" /> Exportar CSV
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setIsMaximized(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 rounded-full transition-colors cursor-pointer"
                  title="Cerrar Visualización"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto bg-white p-6 custom-scrollbar">
              {activeView === 'table' ? (
                filteredRegistros.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <span className="text-3xl">🔍</span>
                    <span className="text-sm font-semibold mt-2">No se encontraron registros que coincidan con la búsqueda</span>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-blue-900 text-white sticky top-0 font-bold">
                        <tr>
                          {Object.keys(registros[0]).map((k) => (
                            <th key={k} className="px-4 py-3 border-r border-blue-800 last:border-0 font-bold uppercase tracking-wider">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredRegistros.map((fila, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors odd:bg-slate-50/20">
                            {Object.values(fila).map((val, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-2.5 border-r border-slate-100 last:border-0 truncate max-w-[240px]" title={val !== null ? String(val) : ""}>
                                {val === null ? <span className="text-slate-400 italic">null</span> : (typeof val === 'number' && !String(val).includes('.') ? val : String(val))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="w-full h-full p-2 flex flex-col justify-center items-center" style={{ minHeight: 320 }}>
                  <ResponsiveContainer width="95%" height="95%">
                    <BarChart data={registros} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={stringKey} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Bar dataKey={numberKey} fill="#004f9f" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function OrbisFace({ emotion }: { emotion: 'idle' | 'listening' | 'thinking' | 'sad' | 'error' | 'happy' }) {
  const getGlowColor = () => {
    switch (emotion) {
      case 'listening': return 'bg-amber-500/30 animate-pulse';
      case 'thinking': return 'bg-blue-600/30 animate-pulse';
      case 'happy': return 'bg-emerald-400/30';
      case 'sad':
      case 'error': return 'bg-rose-500/30';
      default: return 'bg-blue-500/20';
    }
  };

  const getOrbFill = () => {
    switch (emotion) {
      case 'listening': return '#f59e0b';
      case 'thinking': return '#2563eb';
      case 'happy': return '#10b981';
      case 'sad':
      case 'error': return '#ef4444';
      default: return '#3b82f6';
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
  const orbisChatRef = useRef<HTMLDivElement>(null);
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

  // Handle click outside to close dropdown or chatbot
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setVentasOpen(false);
      }
      if (orbisOpen && orbisChatRef.current && !orbisChatRef.current.contains(event.target as Node)) {
        const headerButton = document.querySelector('.orbis-header-btn');
        if (!headerButton || !headerButton.contains(event.target as Node)) {
          setOrbisOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [orbisOpen]);

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
              <span className="text-xs font-semibold text-blue-600 truncate max-w-[150px]">
                {selectedEmpresa.nombre}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center h-full space-x-1">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `flex items-center space-x-2 px-4 h-full border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>

            {/* Filtros Toggle Button */}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center space-x-2 px-4 h-full border-b-2 transition-colors cursor-pointer ${
                isFilterOpen ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
                    ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50' 
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
                            ? 'bg-blue-50 text-blue-800 font-bold' 
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
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 cursor-pointer relative group orbis-header-btn"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles size={16} className="animate-pulse text-amber-300" />
            <span className="font-bold text-sm tracking-wide">Orbis AI</span>
          </button>

          <button className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform">
            JR
          </div>
        </div>
      </header>

      {/* Orbis Floating Chat Widget */}
      {orbisOpen && (
        <div ref={orbisChatRef} className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] max-w-[calc(100vw-2rem)] bg-white border border-slate-200/80 rounded-[28px] shadow-[0_20px_50px_rgba(37,99,235,0.12)] flex flex-col z-[100] overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right animate-in fade-in slide-in-from-bottom-5 orbis-chat-widget">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-blue-800 via-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot size={18} className="text-amber-400" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs tracking-wider text-white uppercase">Orbis Assistant</span>
                <span className="text-[8px] font-bold text-emerald-400 tracking-widest uppercase">En Línea</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={clearHistory}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                title="Limpiar Historial"
              >
                <Trash2 size={15} />
              </button>
              <button 
                onClick={() => setOrbisOpen(false)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-3 custom-scrollbar bg-slate-50/40">
            {messages.length === 1 && messages[0].id === 'welcome' ? (
              // Welcome Screen
              <div className="flex-1 flex flex-col items-center justify-center text-center px-3 py-6">
                <OrbisFace emotion={emotion} />
                <h3 className="font-extrabold text-lg text-slate-950 mb-1">
                  ¡Hola! Soy <span className="bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">Orbis</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mb-5">
                  Tu asistente inteligente de Multillantas Nieto. Consúltame datos de ventas, asesores, inventario y más.
                </p>

                {/* Starter Suggestions */}
                <div className="w-full max-w-[280px] space-y-2 text-left">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1 px-1">Consultas sugeridas</span>
                  {[
                    "¿Cuáles son las marcas más vendidas?",
                    "Muestra las ventas totales de este mes",
                    "¿Quién es el asesor con mayores ventas?"
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 px-3 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer block"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat conversation
              <div className="flex flex-col space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-1.5 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'orbis' && (
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm shrink-0 self-end mb-1">
                        <Bot size={11} />
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[82%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-700 to-sky-600 text-white rounded-2xl rounded-br-none px-3 py-1.5 text-xs shadow-md select-text break-words'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-3 py-1.5 text-xs shadow-sm select-text break-words'
                      }>
                        {msg.text}
                      </div>

                      {/* Visor de datos si hay registros */}
                      {msg.sender === 'orbis' && msg.registros && msg.registros.length > 0 && (
                        <MessageDataViewer
                          registros={msg.registros}
                          tiempos={msg.tiempos}
                          total_registros={msg.total_registros}
                        />
                      )}

                      {/* Sugerencias contextuales de Orbis */}
                      {msg.sender === 'orbis' && msg.sugerencias && msg.sugerencias.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 justify-start">
                          {msg.sugerencias.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSuggestionClick(sug)}
                              className="text-[9px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm"
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
                  <div className="flex gap-1.5 w-full justify-start animate-fade-in">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm shrink-0 self-end mb-1">
                      <Bot size={11} />
                    </div>
                    <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none px-3 py-1.5 text-xs shadow-sm flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin text-blue-600" />
                      <span>Orbis está analizando...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Footer (Input Form & Brand name) */}
          <div className="p-2.5 border-t border-slate-100 bg-white flex flex-col shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex items-center gap-1.5">
              {/* Altavoz Toggle */}
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer border ${voiceEnabled ? 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                title={voiceEnabled ? "Desactivar salida de voz" : "Activar salida de voz"}
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              {/* Input de Texto tipo píldora */}
              <div className="flex-1 relative flex items-center bg-slate-100 hover:bg-slate-100/80 rounded-full px-3.5 py-1.5 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all duration-200 shadow-inner">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu consulta aquí..."
                  disabled={chatLoading}
                  className="w-full text-xs bg-transparent outline-none pr-6 text-slate-800"
                />
                {chatInput.trim() && (
                  <button
                    type="submit"
                    className="absolute right-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Send size={12} className="text-blue-600" />
                  </button>
                )}
              </div>

              {/* Botón de Micrófono */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-all duration-200 shadow-sm cursor-pointer border flex items-center justify-center ${
                  isRecording
                    ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={isRecording ? "Detener grabación de voz" : "Grabar consulta de voz"}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            </form>
            <div className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2 select-none">
              Multillantas Nieto © 2026
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-transparent relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-transparent pointer-events-none" />
          <Outlet context={{ isFilterOpen, setIsFilterOpen, sucursales }} />
      </main>
    </div>
  );
}
