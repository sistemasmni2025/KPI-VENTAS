import React, { useState } from 'react';
import { ShoppingBag, HelpCircle, DollarSign, Target } from 'lucide-react';

// Format currency in MXN
const formatMXN = (val: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

interface BarData {
  name: string;
  Ventas: number;
  Meta: number;
}

interface ThreeDBarChartProps {
  data: BarData[];
  onClickBar?: (name: string) => void;
  height?: number;
  colorByGender?: boolean;
  colorByBrand?: boolean;
}

function getBrandFromGroupName(name: string): 'michelin' | 'bfgoodrich' | 'bridgestone' | 'uniroyal' | 'firestone' | 'pirelli' | 'yokohama' | 'other' {
  const n = name.toLowerCase();
  if (n.includes('michelin') || n.includes('miche.')) return 'michelin';
  if (n.includes('bfgoodrich') || n.includes('bfg')) return 'bfgoodrich';
  if (n.includes('bridgestone') || n.includes('bridge')) return 'bridgestone';
  if (n.includes('uniroyal')) return 'uniroyal';
  if (n.includes('firestone') || n.includes('fire')) return 'firestone';
  if (n.includes('pirelli')) return 'pirelli';
  if (n.includes('yokohama')) return 'yokohama';
  return 'other';
}

const getBrandColors = (brand: string) => {
  switch (brand) {
    case 'michelin':
      return { ventas: '#1E40AF', meta: '#FBBF24' };
    case 'bfgoodrich':
      return { ventas: '#EF4444', meta: '#94A3B8' };
    case 'bridgestone':
      return { ventas: '#334155', meta: '#DC2626' };
    case 'uniroyal':
      return { ventas: '#F97316', meta: '#3B82F6' };
    case 'firestone':
      return { ventas: '#DC2626', meta: '#CBD5E1' };
    case 'pirelli':
      return { ventas: '#FBBF24', meta: '#EF4444' };
    case 'yokohama':
      return { ventas: '#B91C1C', meta: '#1E293B' };
    default:
      return { ventas: '#22D3EE', meta: '#FBBF24' };
  }
};

function getGenderFromName(name: string): 'male' | 'female' | 'other' {
  const n = name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (
    n.startsWith('.') || 
    n.startsWith('(') ||
    n.includes('MECANITECK') ||
    n.includes('FLECHA') ||
    n.includes('ASESOR') ||
    n.includes('TALLER') ||
    n.includes('SISTEMAS') ||
    n.includes('MOSTRADOR') ||
    n.includes('PUBLICO') ||
    n.includes('VENTAS') ||
    n.includes('EMPRESA') ||
    n.includes('REFACCION') ||
    n.includes('LINEA') ||
    n.includes('GOL') ||
    n.includes('BODEGA')
  ) {
    return 'other';
  }

  const femaleKeywords = [
    'MARIA', 'MARI', 'MA.', 'ESPERANZA', 'ANA', 'PATRICIA', 'LETICIA', 'ROSA', 
    'GABRIELA', 'ADRIANA', 'ALEJANDRA', 'SILVIA', 'ELIZABETH', 'VERONICA', 
    'JUANA', 'TERESA', 'BEATRIZ', 'CLARA', 'MONICA', 'LAURA', 'CARMEN',
    'ISABEL', 'MARTHA', 'YOLANDA', 'GLORIA', 'GUADALUPE', 'LUPITA',
    'CLAUDIA', 'SARA', 'SOFIA', 'ANGELA', 'DIANA', 'LUCIA', 'IRMA',
    'CECILIA', 'ELENA', 'KARLA', 'SONIA', 'MARGARITA'
  ];

  const maleKeywords = [
    'JUAN', 'JOSE', 'DAVID', 'FEDERICO', 'MIGUEL', 'CARLOS', 'LUIS', 'JORGE', 
    'ALBERTO', 'FRANCISCO', 'ANTONIO', 'MANUEL', 'MANUE', 'PEDRO', 'JESUS', 
    'JAIME', 'JAVIER', 'FERNANDO', 'DANIEL', 'RICARDO', 'ALEJANDRO', 'RAUL', 
    'EDUARDO', 'SERGIO', 'ENRIQUE', 'HUGO', 'ROBERTO', 'RAMON', 'ARTURO', 
    'OSCAR', 'MARTIN', 'ADRIAN', 'HECTOR', 'GUILLERMO', 'VICTOR', 'ALFREDO',
    'ARMANDO', 'FELIPE', 'RENE', 'GERARDO', 'MARIO', 'RAFAEL'
  ];

  const words = n.split(/[\s,./]+/);
  
  if (words.some(w => ['JUAN', 'JOSE', 'DAVID', 'FEDERICO', 'MIGUEL', 'CARLOS', 'LUIS', 'JORGE', 'ALBERTO', 'FRANCISCO', 'ANTONIO', 'MANUEL', 'PEDRO', 'JESUS', 'JAIME', 'JAVIER', 'FERNANDO', 'DANIEL', 'RICARDO', 'EDUARDO', 'SERGIO', 'ENRIQUE', 'HUGO', 'ROBERTO', 'RAMON', 'ARTURO', 'OSCAR', 'MARTIN', 'ADRIAN', 'HECTOR', 'GUILLERMO', 'VICTOR', 'ALFREDO', 'ARMANDO', 'FELIPE', 'RENE', 'GERARDO', 'MARIO', 'RAFAEL'].includes(w))) {
    return 'male';
  }

  if (words.some(w => femaleKeywords.includes(w))) {
    return 'female';
  }

  if (words.some(w => maleKeywords.includes(w))) {
    return 'male';
  }

  const firstWord = words[0] || '';
  if (firstWord.length > 2) {
    if (firstWord.endsWith('A')) {
      return 'female';
    }
    if (firstWord.endsWith('O') || firstWord.endsWith('OR') || firstWord.endsWith('EL')) {
      return 'male';
    }
  }

  return 'other';
}

const getGenderColors = (gender: 'male' | 'female' | 'other' | 'default') => {
  switch (gender) {
    case 'female':
      return {
        ventas: '#D946EF', // Rosa fiusha
        meta: '#FDA4AF',   // Rosa pastel
      };
    case 'male':
      return {
        ventas: '#3B82F6', // Azul
        meta: '#7DD3FC',   // Celeste
      };
    case 'other':
      return {
        ventas: '#94A3B8', // Plata
        meta: '#CBD5E1',   // Platino
      };
    default:
      return {
        ventas: '#22D3EE', // Cian
        meta: '#FBBF24',   // Amarillo
      };
  }
};

const getGradientSuffix = (val: string) => {
  if (val === 'default') return '';
  return val.charAt(0).toUpperCase() + val.slice(1);
};

export function ThreeDBarChart({ data, onClickBar, height = 340, colorByGender = false, colorByBrand = false }: ThreeDBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
        Sin datos disponibles
      </div>
    );
  }

  // Calculate scales
  const maxVal = Math.max(...data.map(d => Math.max(d.Ventas, d.Meta)), 100000);
  // Add 15% head room
  const chartMax = maxVal * 1.15;

  const margin = { top: 40, right: 30, bottom: 65, left: 85 };
  const itemWidth = 80;
  const plotWidth = data.length * itemWidth;
  const svgWidth = plotWidth + margin.left + margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Render grid lines
  const gridTicks = 5;
  const gridLines = Array.from({ length: gridTicks }).map((_, idx) => {
    const val = (chartMax / (gridTicks - 1)) * idx;
    const y = margin.top + plotHeight - (val / chartMax) * plotHeight;
    return { val, y };
  });

  // Isometric offsets for 3D cuboids
  const dx = 5;
  const dy = 5;
  const barW = 20;

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Get cursor relative coordinates inside scroll container
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 80,
    });
    setHoveredIndex(index);
  };

  return (
    <div className="relative w-full overflow-hidden bg-transparent rounded-2xl">
      {/* Scrollable Container */}
      <div className="w-full overflow-x-auto scrollbar-thin scroll-smooth pb-2">
        <div style={{ width: svgWidth, height }} className="relative">
          <svg width={svgWidth} height={height} className="overflow-visible select-none">
            {/* Gradients Definition */}
            <defs>
              {/* Ventas gradients (Teal/Cyan) */}
              <linearGradient id="ventasFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
              <linearGradient id="ventasSide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0E7490" />
                <stop offset="100%" stopColor="#155E75" />
              </linearGradient>
              <linearGradient id="ventasTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>

              {/* Meta gradients (Amber/Orange) */}
              <linearGradient id="metaFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="metaSide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="metaTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>

              {/* Female Gradients (Rosa Fiusha) */}
              <linearGradient id="ventasFrontFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E9D5FF" />
                <stop offset="10%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>
              <linearGradient id="ventasSideFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A21CAF" />
                <stop offset="100%" stopColor="#701A75" />
              </linearGradient>
              <linearGradient id="ventasTopFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5D0FE" />
                <stop offset="100%" stopColor="#E879F9" />
              </linearGradient>

              <linearGradient id="metaFrontFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE4E6" />
                <stop offset="20%" stopColor="#FDA4AF" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
              <linearGradient id="metaSideFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BE123C" />
                <stop offset="100%" stopColor="#9F1239" />
              </linearGradient>
              <linearGradient id="metaTopFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE4E6" />
                <stop offset="100%" stopColor="#FDA4AF" />
              </linearGradient>

              {/* Male Gradients (Azul) */}
              <linearGradient id="ventasFrontMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="20%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="ventasSideMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="ventasTopMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>

              <linearGradient id="metaFrontMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="20%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="metaSideMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0369A1" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
              <linearGradient id="metaTopMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>

              {/* Other Gradients (Verde) */}
              <linearGradient id="ventasFrontOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="20%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="ventasSideOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="ventasTopOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>

              <linearGradient id="metaFrontOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="20%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="metaSideOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="metaTopOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>

              {/* Michelin Gradients */}
              <linearGradient id="ventasFrontMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#172554" />
              </linearGradient>
              <linearGradient id="ventasSideMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="ventasTopMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="metaFrontMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
              <linearGradient id="metaSideMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A16207" />
                <stop offset="100%" stopColor="#854D0E" />
              </linearGradient>
              <linearGradient id="metaTopMichelin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>

              {/* BFGoodrich Gradients */}
              <linearGradient id="ventasFrontBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="ventasSideBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#991B1B" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </linearGradient>
              <linearGradient id="ventasTopBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="metaFrontBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="metaSideBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="metaTopBfgoodrich" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              {/* Bridgestone Gradients */}
              <linearGradient id="ventasFrontBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="ventasSideBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="ventasTopBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="metaFrontBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E53E3E" />
                <stop offset="100%" stopColor="#9B2C2C" />
              </linearGradient>
              <linearGradient id="metaSideBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#822727" />
                <stop offset="100%" stopColor="#5C2323" />
              </linearGradient>
              <linearGradient id="metaTopBridgestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEB2B2" />
                <stop offset="100%" stopColor="#E53E3E" />
              </linearGradient>

              {/* Uniroyal Gradients */}
              <linearGradient id="ventasFrontUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
              <linearGradient id="ventasSideUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9A3412" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
              <linearGradient id="ventasTopUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="metaFrontUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="metaSideUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="metaTopUniroyal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>

              {/* Firestone Gradients */}
              <linearGradient id="ventasFrontFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <linearGradient id="ventasSideFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7F1D1D" />
                <stop offset="100%" stopColor="#450A0A" />
              </linearGradient>
              <linearGradient id="ventasTopFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="metaFrontFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <linearGradient id="metaSideFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="metaTopFirestone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>

              {/* Pirelli Gradients */}
              <linearGradient id="ventasFrontPirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="metaSidePirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#991B1B" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </linearGradient>
              <linearGradient id="ventasTopPirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="metaFrontPirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="ventasSidePirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="metaTopPirelli" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>

              {/* Yokohama Gradients */}
              <linearGradient id="ventasFrontYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B91C1C" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </linearGradient>
              <linearGradient id="ventasSideYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#450A0A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="ventasTopYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="metaFrontYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="metaSideYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#020617" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>
              <linearGradient id="metaTopYokohama" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLines.map((line, idx) => (
              <g key={`grid-${idx}`}>
                <line
                  x1={margin.left}
                  y1={line.y}
                  x2={svgWidth - margin.right}
                  y2={line.y}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={margin.left - 12}
                  y={line.y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-bold tracking-wider"
                >
                  {formatMXN(line.val)}
                </text>
              </g>
            ))}

            {/* Base line */}
            <line
              x1={margin.left}
              y1={margin.top + plotHeight}
              x2={svgWidth - margin.right}
              y2={margin.top + plotHeight}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />

            {/* Draw 3D Columns */}
            {data.map((item, idx) => {
              const colX = margin.left + idx * itemWidth + 20;

              // Ventas Heights
              const hV = Math.max((item.Ventas / chartMax) * plotHeight, 3);
              const yV = margin.top + plotHeight - hV;

              // Meta Heights
              const hM = Math.max((item.Meta / chartMax) * plotHeight, 3);
              const yM = margin.top + plotHeight - hM;

              const isHovered = hoveredIndex === idx;

              // Ventas Column drawing (xOffset = 0)
              const vx = colX;
              const vy = yV;
              const vFrontPoints = `${vx},${vy} ${vx + barW},${vy} ${vx + barW},${vy + hV} ${vx},${vy + hV}`;
              const vSidePoints = `${vx + barW},${vy} ${vx + barW + dx},${vy - dy} ${vx + barW + dx},${vy + hV - dy} ${vx + barW},${vy + hV}`;
              const vTopPoints = `${vx},${vy} ${vx + dx},${vy - dy} ${vx + barW + dx},${vy - dy} ${vx + barW},${vy}`;

              // Meta Column drawing (xOffset = 26)
              const mx = colX + 26;
              const my = yM;
              const mFrontPoints = `${mx},${my} ${mx + barW},${my} ${mx + barW},${my + hM} ${mx},${my + hM}`;
              const mSidePoints = `${mx + barW},${my} ${mx + barW + dx},${my - dy} ${mx + barW + dx},${my + hM - dy} ${mx + barW},${my + hM}`;
              const mTopPoints = `${mx},${my} ${mx + dx},${my - dy} ${mx + barW + dx},${my - dy} ${mx + barW},${my}`;

              const genderOrBrand = colorByGender 
                ? getGenderFromName(item.name) 
                : (colorByBrand ? getBrandFromGroupName(item.name) : 'default');
              const gradSuffix = getGradientSuffix(genderOrBrand);

              return (
                <g
                  key={`col-group-${idx}`}
                  className="cursor-pointer transition-opacity duration-300"
                  style={{ opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1 }}
                  onMouseMove={(e) => handleMouseMove(e, idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onClickBar?.(item.name)}
                >
                  {/* Ventas 3D Pillar */}
                  <polygon points={vFrontPoints} fill={`url(#ventasFront${gradSuffix})`} />
                  <polygon points={vSidePoints} fill={`url(#ventasSide${gradSuffix})`} />
                  <polygon points={vTopPoints} fill={`url(#ventasTop${gradSuffix})`} />

                  {/* Meta 3D Pillar */}
                  <polygon points={mFrontPoints} fill={`url(#metaFront${gradSuffix})`} />
                  <polygon points={mSidePoints} fill={`url(#metaSide${gradSuffix})`} />
                  <polygon points={mTopPoints} fill={`url(#metaTop${gradSuffix})`} />

                  {/* Highlight overlay on hover */}
                  {isHovered && (
                    <rect
                      x={colX - 8}
                      y={margin.top - 10}
                      width={62}
                      height={plotHeight + 20}
                      fill="rgba(99, 102, 241, 0.04)"
                      stroke="rgba(99, 102, 241, 0.15)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      className="rounded-lg pointer-events-none"
                    />
                  )}

                  {/* X Axis Label */}
                  <text
                    x={colX + 23}
                    y={margin.top + plotHeight + 24}
                    textAnchor="middle"
                    className={`text-[10px] font-extrabold uppercase tracking-wide transition-all ${isHovered ? 'fill-indigo-600 font-black' : 'fill-slate-500'
                      }`}
                  >
                    {item.name.length > 10 ? `${item.name.substring(0, 10)}.` : item.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Dynamic Tooltip inside scroll wrapper to prevent clipping */}
          {hoveredIndex !== null && (() => {
            const tooltipGenderOrBrand = colorByGender 
              ? getGenderFromName(data[hoveredIndex].name)
              : (colorByBrand ? getBrandFromGroupName(data[hoveredIndex].name) : 'default');
            const tooltipColors = colorByBrand 
              ? getBrandColors(tooltipGenderOrBrand)
              : getGenderColors(tooltipGenderOrBrand as any);
            return (
              <div
                className="absolute z-[999] bg-slate-950/95 text-white border border-slate-800 p-4 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-none transition-all duration-100 flex flex-col space-y-1.5"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  minWidth: '220px',
                }}
              >
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1 mb-1">
                  {data[hoveredIndex].name}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center font-semibold gap-1.5" style={{ color: tooltipColors.ventas }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltipColors.ventas }} />
                    Ventas:
                  </span>
                  <span className="font-black text-white">{formatMXN(data[hoveredIndex].Ventas)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center font-semibold gap-1.5" style={{ color: tooltipColors.meta }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltipColors.meta }} />
                    Meta:
                  </span>
                  <span className="font-black text-white">{formatMXN(data[hoveredIndex].Meta)}</span>
                </div>
                {data[hoveredIndex].Meta > 0 && (
                  <div className="text-[10px] text-right font-black mt-1 text-slate-300">
                    Cumplimiento: {Math.round((data[hoveredIndex].Ventas / data[hoveredIndex].Meta) * 100)}%
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

interface TankData {
  name: string;
  value: number;
}

interface ThreeDCylinderTankProps {
  data: TankData[];
  onClickTank?: (name: string) => void;
  title?: string;
}

export function ThreeDCylinderTank({ data, onClickTank }: ThreeDCylinderTankProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
        Sin datos disponibles
      </div>
    );
  }

  // Calculate sum for percentages
  const totalVal = data.reduce((acc, curr) => acc + curr.value, 0);

  // Soft palette of fluid colors
  const tankColors = [
    { fill: 'url(#liqCyan)', top: '#22D3EE', shadow: 'shadow-cyan-500/10' },
    { fill: 'url(#liqAmber)', top: '#FBBF24', shadow: 'shadow-amber-500/10' },
    { fill: 'url(#liqRose)', top: '#FB7185', shadow: 'shadow-rose-500/10' },
    { fill: 'url(#liqPurple)', top: '#C084FC', shadow: 'shadow-purple-500/10' },
    { fill: 'url(#liqEmerald)', top: '#34D399', shadow: 'shadow-emerald-500/10' },
    { fill: 'url(#liqIndigo)', top: '#818CF8', shadow: 'shadow-indigo-500/10' },
  ];

  return (
    <div className="w-full">
      {/* Grids of 3D Progress Cylinders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
        {data.map((item, idx) => {
          const percentage = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
          const isHovered = hoveredIdx === idx;
          const colorSet = tankColors[idx % tankColors.length];

          const tankH = 120;
          const tankW = 50;

          // Calculate liquid height based on percentage
          const liquidH = Math.max((percentage / 100) * (tankH - 24), 2);
          const liquidY = tankH - liquidH - 12;

          return (
            <div
              key={`tank-${idx}`}
              className={`bg-white border rounded-3xl p-4 flex items-center space-x-4 cursor-pointer transition-all duration-300 ${isHovered
                  ? 'border-indigo-400 shadow-md transform -translate-y-1'
                  : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
                }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onClickTank?.(item.name)}
            >
              {/* SVG Cylinder Tank */}
              <div className="flex-shrink-0 relative" style={{ width: tankW, height: tankH }}>
                <svg width={tankW} height={tankH} className="overflow-visible select-none">
                  <defs>
                    {/* Glass tank reflections */}
                    <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(241, 245, 249, 0.4)" />
                      <stop offset="30%" stopColor="rgba(255, 255, 255, 0.8)" />
                      <stop offset="70%" stopColor="rgba(241, 245, 249, 0.2)" />
                      <stop offset="100%" stopColor="rgba(203, 213, 225, 0.5)" />
                    </linearGradient>

                    {/* Cyan liquid */}
                    <linearGradient id="liqCyan" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0891B2" />
                      <stop offset="40%" stopColor="#22D3EE" />
                      <stop offset="100%" stopColor="#0E7490" />
                    </linearGradient>

                    {/* Amber liquid */}
                    <linearGradient id="liqAmber" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#D97706" />
                      <stop offset="40%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>

                    {/* Rose liquid */}
                    <linearGradient id="liqRose" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E11D48" />
                      <stop offset="40%" stopColor="#FB7185" />
                      <stop offset="100%" stopColor="#9F1239" />
                    </linearGradient>

                    {/* Purple liquid */}
                    <linearGradient id="liqPurple" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7E22CE" />
                      <stop offset="40%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#581C87" />
                    </linearGradient>

                    {/* Emerald liquid */}
                    <linearGradient id="liqEmerald" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#047857" />
                      <stop offset="40%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#065F46" />
                    </linearGradient>

                    {/* Indigo liquid */}
                    <linearGradient id="liqIndigo" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4338CA" />
                      <stop offset="40%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#312E81" />
                    </linearGradient>
                  </defs>

                  {/* Glass Outer Cylinder */}
                  {/* Bottom cap */}
                  <ellipse cx={tankW / 2} cy={tankH - 12} rx={tankW / 2} ry={6} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={1} />
                  {/* Cylinder Tube */}
                  <rect x={0} y={12} width={tankW} height={tankH - 24} fill="url(#glassGrad)" stroke="#CBD5E1" strokeWidth={1} />
                  {/* Top cap */}
                  <ellipse cx={tankW / 2} cy={12} rx={tankW / 2} ry={6} fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={1} />

                  {/* Filled Liquid Portion */}
                  {percentage > 0 && (
                    <g className="transition-all duration-500 ease-out">
                      {/* Liquid bottom ellipse */}
                      <ellipse cx={tankW / 2} cy={tankH - 12} rx={(tankW - 2) / 2} ry={5} fill={colorSet.top} opacity={0.6} />

                      {/* Liquid rect body */}
                      <rect x={1} y={liquidY} width={tankW - 2} height={liquidH} fill={colorSet.fill} />

                      {/* Liquid top ellipse */}
                      <ellipse cx={tankW / 2} cy={liquidY} rx={(tankW - 2) / 2} ry={4} fill={colorSet.top} />
                    </g>
                  )}

                  {/* Glass reflection shine */}
                  <rect x={tankW * 0.75} y={13} width={2.5} height={tankH - 26} fill="rgba(255, 255, 255, 0.45)" rx={1} />
                </svg>
                {/* Floating percentage inside cylinder */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-black text-slate-800 bg-white/70 px-1 py-0.5 rounded shadow-sm border border-slate-100">
                  {Math.round(percentage)}%
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate mb-1" title={item.name}>
                  {item.name}
                </span>
                <span className="text-sm font-black text-slate-900 tracking-tight leading-none">
                  {formatMXN(item.value)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  del total general
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
interface DonutData {
  name: string;
  value: number;
}

interface ThreeDDonutChartProps {
  data: DonutData[];
  onClickSegment?: (name: string) => void;
}

export function ThreeDDonutChart({ data, onClickSegment }: ThreeDDonutChartProps) {
  const [rotation, setRotation] = useState(-Math.PI / 4); // Start rotated slightly
  const [tilt, setTilt] = useState(0.48); // Perspective ratio (ry / rx)
  const [scale, setScale] = useState(1.0); // Zoom scale
  const [explodedIdx, setExplodedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleSvgWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.45), 1.8));
    };

    svgEl.addEventListener('wheel', handleSvgWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleSvgWheel);
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
        Sin datos disponibles
      </div>
    );
  }

  const total = data.reduce((acc, c) => acc + c.value, 0);

  // Soft premium colors
  const colors = [
    { top: '#38BDF8', side: '#0284C7', inner: '#0369A1', tag: 'bg-sky-400' },     // Sky Blue
    { top: '#FBBF24', side: '#D97706', inner: '#B45309', tag: 'bg-amber-400' },   // Amber
    { top: '#FB7185', side: '#E11D48', inner: '#9F1239', tag: 'bg-rose-500' },    // Rose
    { top: '#C084FC', side: '#7E22CE', inner: '#581C87', tag: 'bg-purple-500' },  // Purple
    { top: '#34D399', side: '#047857', inner: '#065F46', tag: 'bg-emerald-500' }, // Emerald
    { top: '#818CF8', side: '#4338CA', inner: '#312E81', tag: 'bg-indigo-500' },  // Indigo
    { top: '#94A3B8', side: '#475569', inner: '#334155', tag: 'bg-slate-500' },   // Slate
  ];

  // Calculate cumulative slices
  let cumulativePercent = 0;
  const slices = data.map((item, idx) => {
    const percent = total > 0 ? item.value / total : 0;
    const safePercent = Math.min(percent, 0.999);
    const startAngleRaw = cumulativePercent * 2 * Math.PI;
    const endAngleRaw = (cumulativePercent + safePercent) * 2 * Math.PI;
    cumulativePercent += percent;

    return {
      index: idx,
      name: item.name,
      value: item.value,
      percent,
      startAngleRaw,
      endAngleRaw,
    };
  });

  // Process coordinates with current rotation
  const processedSlices = slices.map(s => {
    const startAngle = s.startAngleRaw + rotation;
    const endAngle = s.endAngleRaw + rotation;
    const bisectAngle = (startAngle + endAngle) / 2;
    return { ...s, startAngle, endAngle, bisectAngle };
  });

  // Painters algorithm sort
  const sortedSlices = [...processedSlices].sort((a, b) => Math.sin(a.bisectAngle) - Math.sin(b.bisectAngle));

  // Geometry
  const baseCx = 120;
  const baseCy = 95;
  const baseRx = 75;
  const rx = baseRx * scale;
  const ry = baseRx * scale * tilt;
  const thickness = 24 * scale;
  const explodeDist = 16 * scale;

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(prev => prev + dx * 0.009);
    setTilt(prev => Math.min(Math.max(prev - dy * 0.005, 0.12), 0.88));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setRotation(prev => prev + dx * 0.009);
    setTilt(prev => Math.min(Math.max(prev - dy * 0.005, 0.12), 0.88));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4 w-full">
      {/* 3D Rotatable Pie SVG */}
      <div className="relative flex-shrink-0 select-none bg-slate-50/50 p-3 rounded-[32px] border border-slate-100 shadow-inner">
        {/* Control buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
          <button
            type="button"
            onClick={() => setScale(prev => Math.min(prev * 1.15, 1.8))}
            className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black rounded-lg shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Zoom +"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setScale(prev => Math.max(prev * 0.85, 0.45))}
            className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black rounded-lg shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Zoom -"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => { setRotation(-Math.PI / 4); setTilt(0.48); setScale(1.0); setExplodedIdx(null); }}
            className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-lg shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 text-[10px]"
            title="Restaurar"
          >
            🔄
          </button>
        </div>
        <svg
          ref={svgRef}
          width="240"
          height="220"
          className={`overflow-visible touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
        >
          {/* Shadow platform at the base */}
          <ellipse
            cx={baseCx}
            cy={baseCy + thickness + 15}
            rx={rx + 10}
            ry={ry + 5}
            fill="rgba(15, 23, 42, 0.04)"
            filter="blur(4px)"
          />

          {/* Render slices in sorted order */}
          {sortedSlices.map(slice => {
            const isExploded = explodedIdx === slice.index;
            const isHovered = hoveredIdx === slice.index;
            const color = colors[slice.index % colors.length];

            // Adjust center if exploded
            const cx = isExploded
              ? baseCx + explodeDist * Math.cos(slice.bisectAngle)
              : baseCx;
            const cy = isExploded
              ? baseCy + explodeDist * Math.sin(slice.bisectAngle)
              : baseCy;

            // Geometry calculations
            const sx = cx + rx * Math.cos(slice.startAngle);
            const sy = cy + ry * Math.sin(slice.startAngle);
            const ex = cx + rx * Math.cos(slice.endAngle);
            const ey = cy + ry * Math.sin(slice.endAngle);

            const largeArcFlag = (slice.endAngle - slice.startAngle) > Math.PI ? 1 : 0;

            // Path 1: Outer Curved Wall
            const outerWallPath = `
              M ${sx} ${sy}
              A ${rx} ${ry} 0 ${largeArcFlag} 1 ${ex} ${ey}
              L ${ex} ${ey + thickness}
              A ${rx} ${ry} 0 ${largeArcFlag} 0 ${sx} ${sy + thickness}
              Z
            `;

            // Path 2: Inner Start Wall
            const startWallPath = `
              M ${cx} ${cy}
              L ${cx} ${cy + thickness}
              L ${sx} ${sy + thickness}
              L ${sx} ${sy}
              Z
            `;

            // Path 3: Inner End Wall
            const endWallPath = `
              M ${cx} ${cy}
              L ${cx} ${cy + thickness}
              L ${ex} ${ey + thickness}
              L ${ex} ${ey}
              Z
            `;

            // Path 4: Top Face
            const topFacePath = `
              M ${cx} ${cy}
              L ${sx} ${sy}
              A ${rx} ${ry} 0 ${largeArcFlag} 1 ${ex} ${ey}
              Z
            `;

            // Floating Label position on the top face
            const tx = cx + rx * 0.62 * Math.cos(slice.bisectAngle);
            const ty = cy + ry * 0.62 * Math.sin(slice.bisectAngle);

            return (
              <g
                key={`slice-${slice.index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExplodedIdx(prev => prev === slice.index ? null : slice.index);
                  onClickSegment?.(slice.name);
                }}
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="transition-all duration-300"
              >
                {/* 1. Curved Outer Wall */}
                <path
                  d={outerWallPath}
                  fill={color.side}
                  stroke={color.side}
                  strokeWidth={0.5}
                  style={{ filter: isHovered ? 'brightness(1.15)' : 'none' }}
                />

                {/* 2. Inner Start Wall */}
                <path
                  d={startWallPath}
                  fill={color.inner}
                  stroke={color.inner}
                  strokeWidth={0.5}
                />

                {/* 3. Inner End Wall */}
                <path
                  d={endWallPath}
                  fill={color.inner}
                  stroke={color.inner}
                  strokeWidth={0.5}
                />

                {/* 4. Top Face */}
                <path
                  d={topFacePath}
                  fill={color.top}
                  stroke={color.top}
                  strokeWidth={0.5}
                  style={{ filter: isHovered ? 'brightness(1.1)' : 'none' }}
                />

                {/* Glassy reflection overlay on top face */}
                <path
                  d={topFacePath}
                  fill="rgba(255,255,255,0.06)"
                  className="pointer-events-none"
                />

                {/* Floating percentage text */}
                {slice.percent > 0.03 && (
                  <text
                    x={tx}
                    y={ty + 3}
                    textAnchor="middle"
                    fill="#FFF"
                    className="text-[9px] font-black pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                  >
                    {Math.round(slice.percent * 100)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip/instructions inside the chart */}
        <div className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm pointer-events-none">
          Arrastra para girar/inclinar | Rueda para zoom
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-2 scrollbar-thin">
        {processedSlices.map((item) => {
          const color = colors[item.index % colors.length];
          const isExploded = explodedIdx === item.index;
          const isHovered = hoveredIdx === item.index;

          return (
            <div
              key={`legend-${item.index}`}
              className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all duration-200 ${isExploded ? 'bg-indigo-50 border-indigo-200 border shadow-sm' : 'border border-transparent hover:bg-slate-50'
                } ${isHovered ? 'bg-indigo-50/40 scale-[1.02]' : ''}`}
              onMouseEnter={() => setHoveredIdx(item.index)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                setExplodedIdx(prev => prev === item.index ? null : item.index);
                onClickSegment?.(item.name);
              }}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className={`w-3.5 h-3.5 rounded-xl ${color.tag} flex-shrink-0 shadow-sm`} />
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider truncate">
                  {item.name}
                </span>
              </div>
              <div className="text-right pl-3 flex-shrink-0 flex items-baseline space-x-1.5">
                <span className="text-xs font-black text-slate-800">{formatMXN(item.value)}</span>
                <span className="text-[10px] font-bold text-slate-400">({Math.round(item.percent * 100)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
