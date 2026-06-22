import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Play, Pause, RotateCcw } from 'lucide-react';

// Format currency in MXN
const formatMXN = (val: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

interface SalesData {
  name: string;
  Ventas: number;
  Meta: number;
}

interface SalesChartProps {
  data?: SalesData[];
}

const defaultData: SalesData[] = [
  { name: 'Ene', Ventas: 4000, Meta: 2400 },
  { name: 'Feb', Ventas: 3000, Meta: 2800 },
  { name: 'Mar', Ventas: 4500, Meta: 3200 },
  { name: 'Abr', Ventas: 3780, Meta: 3500 },
  { name: 'May', Ventas: 4890, Meta: 4000 },
  { name: 'Jun', Ventas: 5390, Meta: 4200 },
  { name: 'Jul', Ventas: 6490, Meta: 4800 },
  { name: 'Ago', Ventas: 6200, Meta: 5000 },
  { name: 'Sep', Ventas: 7100, Meta: 5200 },
  { name: 'Oct', Ventas: 6800, Meta: 5500 },
  { name: 'Nov', Ventas: 8200, Meta: 6000 },
  { name: 'Dic', Ventas: 9500, Meta: 6500 },
];

export function SalesChart({ data: propData }: SalesChartProps) {
  const chartData = propData && propData.length > 0 ? propData : defaultData;

  // 3D Viewport States
  const [rotation, setRotation] = useState(-Math.PI / 6); // Initial rotation angle
  const [tilt, setTilt] = useState(0.45); // Pitch perspective ratio (vertical squash)
  const [scale, setScale] = useState(1.15); // Zoom scale
  const [hoveredPillar, setHoveredPillar] = useState<{ monthIdx: number, type: 'Ventas' | 'Meta' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartScale, setTouchStartScale] = useState<number>(1.15);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;

    let animId: number;
    const tick = () => {
      setRotation(prev => (prev + 0.005) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, isDragging]);

  // Active wheel listener to prevent page scrolling
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleSvgWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 2.0));
    };

    svgEl.addEventListener('wheel', handleSvgWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleSvgWheel);
    };
  }, []);

  // 3D Projection Constants
  const cx = 150; // Screen center X
  const cy = 160; // Screen center Y
  const max3DHeight = 110; // Max height of columns in 3D units

  // 3D Projection Function (calculated at base scale = 1.0)
  const project = (x3d: number, y3d: number, z3d: number) => {
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    // Rotate around Y axis
    const rotatedX = x3d * cosR - z3d * sinR;
    const rotatedZ = x3d * sinR + z3d * cosR;

    // Project to screen
    const screenX = cx + rotatedX;
    const screenY = cy + (rotatedZ * tilt) - y3d;

    return { x: screenX, y: screenY, depth: rotatedZ };
  };

  // Find max value for height scaling
  const maxVal = Math.max(...chartData.map(d => Math.max(d.Ventas, d.Meta)), 1000);

  // Construct pillars list (12 months * 2 pillars = 24 pillars)
  const pillarsList: {
    monthName: string;
    monthIdx: number;
    type: 'Ventas' | 'Meta';
    value: number;
    x3d: number;
    y3d: number;
    z3d: number;
  }[] = [];

  const xSpacing = 24; // Spacing along the X axis
  const zOffset = 18;  // Separation between Ventas and Meta along the Z axis

  chartData.forEach((item, idx) => {
    // Center X around 0
    const x3d = (idx - 5.5) * xSpacing;

    // Y heights mapped to 0..max3DHeight
    const yV = (item.Ventas / maxVal) * max3DHeight;
    const yM = (item.Meta / maxVal) * max3DHeight;

    // Ventas pillar (forward)
    pillarsList.push({
      monthName: item.name,
      monthIdx: idx,
      type: 'Ventas',
      value: item.Ventas,
      x3d,
      y3d: yV,
      z3d: -zOffset,
    });

    // Meta pillar (backward)
    pillarsList.push({
      monthName: item.name,
      monthIdx: idx,
      type: 'Meta',
      value: item.Meta,
      x3d,
      y3d: yM,
      z3d: zOffset,
    });
  });

  // Calculate dynamic depths and sort back-to-front (painters algorithm)
  const projectedPillars = pillarsList.map(p => {
    const projCenter = project(p.x3d, p.y3d / 2, p.z3d);
    return { ...p, depth: projCenter.depth };
  });

  // Sort by depth ascending so that further objects render first (underneath)
  const sortedPillars = projectedPillars.sort((a, b) => a.depth - b.depth);

  // Drag handles
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
    setTouchStartDist(null);
  };

  // Touch drag & zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTouchStartDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setTouchStartDist(dist);
      setTouchStartScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setRotation(prev => prev + dx * 0.009);
      setTilt(prev => Math.min(Math.max(prev - dy * 0.005, 0.12), 0.88));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / touchStartDist;
      setScale(Math.min(Math.max(touchStartScale * ratio, 0.4), 2.0));
    }
  };

  // Floor grid coordinate generation
  const gridLines: { p1: { x: number, y: number }, p2: { x: number, y: number } }[] = [];
  const minX = -6 * xSpacing;
  const maxX = 6 * xSpacing;
  const minZ = -zOffset - 12;
  const maxZ = zOffset + 12;

  // Grid lines parallel to Z axis (along X)
  for (let idx = 0; idx <= 12; idx++) {
    const x = minX + idx * xSpacing;
    gridLines.push({
      p1: project(x, 0, minZ),
      p2: project(x, 0, maxZ),
    });
  }

  // Grid lines parallel to X axis (along Z)
  const zTicks = 4;
  for (let idx = 0; idx <= zTicks; idx++) {
    const z = minZ + (idx / zTicks) * (maxZ - minZ);
    gridLines.push({
      p1: project(minX, 0, z),
      p2: project(maxX, 0, z),
    });
  }

  // Colors (Original Cyan and Gold as requested)
  const colors = {
    Ventas: { top: '#67E8F9', side: '#0E7490', front: '#22D3EE' },
    Meta: { top: '#FDE68A', side: '#B45309', front: '#FBBF24' },
  };

  const hoveredData = hoveredPillar !== null ? chartData[hoveredPillar.monthIdx] : null;

  return (
    <div className="relative w-full h-full min-h-[300px] select-none p-2 rounded-3xl border border-slate-100/50 bg-slate-50/20 shadow-inner flex flex-col md:flex-row items-center justify-around gap-6">
      {/* Glassmorphism Floating Toolbar relocated to outer container's top-right */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-1 shadow-lg z-30">
        <button
          type="button"
          onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
          className="w-8 h-8 rounded-xl bg-transparent hover:bg-slate-100 border border-transparent text-slate-700 font-extrabold flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          title="Acercar (Zoom +)"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setScale(prev => Math.max(prev - 0.1, 0.4))}
          className="w-8 h-8 rounded-xl bg-transparent hover:bg-slate-100 border border-transparent text-slate-700 font-extrabold flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          title="Alejar (Zoom -)"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsAutoRotating(prev => !prev)}
          className={`w-8 h-8 rounded-xl border border-transparent flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
            isAutoRotating ? 'text-cyan-600 bg-cyan-50 font-bold animate-pulse' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={isAutoRotating ? "Pausar Rotación" : "Giro Automático"}
        >
          {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          onClick={() => {
            setRotation(-Math.PI / 6);
            setTilt(0.45);
            setScale(1.15);
            setIsAutoRotating(false);
          }}
          className="w-8 h-8 rounded-xl bg-transparent hover:bg-slate-100 border border-transparent text-slate-500 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          title="Restablecer vista"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 3D Viewport Area */}
      <div className="relative flex-shrink-0">
        <svg
          ref={svgRef}
          width="320"
          height="280"
          className={`overflow-visible touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
        >
          {/* Base shadow platform */}
          <ellipse
            cx={cx}
            cy={cy + 15}
            rx={145}
            ry={45 * tilt}
            fill="rgba(15, 23, 42, 0.03)"
            filter="blur(5px)"
          />

          {/* Group wrapper to scale around projection center (cx, cy) */}
          <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}>
            {/* Floor grid */}
            {gridLines.map((line, idx) => (
              <line
                key={`grid-${idx}`}
                x1={line.p1.x}
                y1={line.p1.y}
                x2={line.p2.x}
                y2={line.p2.y}
                stroke="#E2E8F0"
                strokeWidth={0.8}
              />
            ))}

            {/* Draw Sorted Pillars */}
            {sortedPillars.map((pillar) => {
              const isHovered = hoveredPillar?.monthIdx === pillar.monthIdx && hoveredPillar?.type === pillar.type;
              const isAnyHovered = hoveredPillar !== null;
              const opacity = isAnyHovered && !isHovered ? 0.5 : 1.0;

              const color = colors[pillar.type];

              // Pillar dimensions (3D units)
              const w = 5.5; // width
              const d = 5.5; // depth
              const h = pillar.y3d;

              const px = pillar.x3d;
              const pz = pillar.z3d;

              // Project 8 vertices of the cuboid
              const v0 = project(px - w, 0, pz - d);
              const v1 = project(px + w, 0, pz - d);
              const v2 = project(px + w, 0, pz + d);
              const v3 = project(px - w, 0, pz + d);

              const v4 = project(px - w, h, pz - d);
              const v5 = project(px + w, h, pz - d);
              const v6 = project(px + w, h, pz + d);
              const v7 = project(px - w, h, pz + d);

              // Construct face paths
              const topPath = `M ${v4.x} ${v4.y} L ${v5.x} ${v5.y} L ${v6.x} ${v6.y} L ${v7.x} ${v7.y} Z`;
              const frontPath = `M ${v3.x} ${v3.y} L ${v2.x} ${v2.y} L ${v6.x} ${v6.y} L ${v7.x} ${v7.y} Z`;
              const leftPath = `M ${v0.x} ${v0.y} L ${v3.x} ${v3.y} L ${v7.x} ${v7.y} L ${v4.x} ${v4.y} Z`;
              const rightPath = `M ${v2.x} ${v2.y} L ${v1.x} ${v1.y} L ${v5.x} ${v5.y} L ${v6.x} ${v6.y} Z`;

              // Calculate floor coordinates of labels (slightly forward Z)
              const labelPos = project(px, -2, maxZ + 6);

              return (
                <g
                  key={`pillar-${pillar.monthIdx}-${pillar.type}`}
                  onMouseEnter={() => setHoveredPillar({ monthIdx: pillar.monthIdx, type: pillar.type })}
                  onMouseLeave={() => setHoveredPillar(null)}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ opacity }}
                >
                  {/* 1. Left side face */}
                  <path d={leftPath} fill={color.inner} stroke={color.inner} strokeWidth={0.3} />

                  {/* 2. Right side face */}
                  <path d={rightPath} fill={color.inner} stroke={color.inner} strokeWidth={0.3} />

                  {/* 3. Front face */}
                  <path d={frontPath} fill={color.front} stroke={color.front} strokeWidth={0.3} />

                  {/* 4. Top face */}
                  <path d={topPath} fill={color.top} stroke={color.top} strokeWidth={0.3} />

                  {/* Highlight top layer on hover */}
                  {isHovered && (
                    <path d={topPath} fill="rgba(255, 255, 255, 0.25)" className="pointer-events-none" />
                  )}

                  {/* Floating Month Labels - Draw only for Ventas pillars to avoid duplicates */}
                  {pillar.type === 'Ventas' && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 6}
                      textAnchor="middle"
                      className="fill-slate-400 text-[8px] font-extrabold uppercase select-none pointer-events-none"
                      style={{ transform: `scaleY(0.9)` }}
                    >
                      {pillar.monthName}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Viewport instruction label */}
        <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm pointer-events-none">
          Arrastra para girar/inclinar | Pellizca para zoom
        </div>
      </div>

      {/* Info Details panel (instead of legend/tooltips that get clipped) */}
      <div className="flex-1 min-w-[150px] bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-col justify-center gap-1.5 h-full">
        {hoveredData ? (
          <>
            <span className={`text-[10px] font-black uppercase tracking-widest border-b border-slate-100 pb-1 mb-1 ${
              hoveredPillar?.type === 'Ventas' ? 'text-cyan-600' : 'text-amber-500'
            }`}>
              {hoveredData.name} ({hoveredPillar?.type === 'Ventas' ? 'Ventas' : 'Meta'})
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Ventas</span>
              <span className="text-base font-black text-slate-900 leading-none">{formatMXN(hoveredData.Ventas)}</span>
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Meta</span>
              <span className="text-base font-black text-slate-900 leading-none">{formatMXN(hoveredData.Meta)}</span>
            </div>
            {hoveredData.Meta > 0 && (
              <div className="mt-2 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl self-start">
                Alcance: {Math.round((hoveredData.Ventas / hoveredData.Meta) * 100)}%
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-slate-400 font-bold italic text-xs flex flex-col items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-extrabold text-[10px] not-italic">
              i
            </span>
            Coloca el cursor sobre una columna para ver el detalle de tendencia
          </div>
        )}
      </div>
    </div>
  );
}
