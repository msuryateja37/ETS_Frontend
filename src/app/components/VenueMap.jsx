"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info, Maximize2 } from 'lucide-react';

export default function VenueMap({
  venue,
  eventId,
  seats,
  onSeatClick,
  selectedSeatIds,
  sectionToZoneMap,
  zoneInfo,
  currency = 'R',
  onSectionClick,
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.4 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const hasMovedRef = useRef(false);

  const getStrId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return id.toString();
  };

  // Zone colors - vibrant and distinct
  const ZONE_COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16"  // Lime
  ];

  // Map zone names to colors
  const zoneColorMap = useMemo(() => {
    const map = new Map();
    if (zoneInfo) {
      Array.from(zoneInfo.entries()).forEach(([zoneName, info], idx) => {
        map.set(zoneName, ZONE_COLORS[info.index % ZONE_COLORS.length]);
      });
    }
    return map;
  }, [zoneInfo]);

  // Map section IDs to zone colors
  const sectionColorsByZone = useMemo(() => {
    const map = new Map();
    if (sectionToZoneMap) {
      sectionToZoneMap.forEach((zoneData, sectionId) => {
        const color = zoneColorMap.get(zoneData.zoneName);
        if (color) {
          map.set(sectionId, color);
        }
      });
    }
    return map;
  }, [sectionToZoneMap, zoneColorMap]);

  // Map Dimensions
  const rawDims = venue?.mapDimensions || { width: 1000, height: 800 };
  const viewWidth = typeof rawDims.width === "object" && rawDims.width?.$numberLong != null ? Number(rawDims.width.$numberLong) : Number(rawDims.width) || 1000;
  const viewHeight = typeof rawDims.height === "object" && rawDims.height?.$numberLong != null ? Number(rawDims.height.$numberLong) : Number(rawDims.height) || 800;

  // Seat placement logic
  const seatPositionMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(venue?.sections)) {
      venue.sections.forEach((section) => {
        const sectionId = getStrId(section.id ?? section.sectionId);
        if (Array.isArray(section.seats)) {
          section.seats.forEach((seatConfig) => {
            const num = seatConfig.number ?? seatConfig.seatNumber ?? seatConfig.num;
            const key = `${sectionId}-${seatConfig.row}-${num}`;
            const pos = seatConfig.position ?? (seatConfig.x != null && seatConfig.y != null ? { x: seatConfig.x, y: seatConfig.y } : null);
            if (pos) map.set(key, pos);
          });
        }
      });
    }
    return map;
  }, [venue?.sections]);

  const seatsWithPosition = useMemo(() => {
    let result = seats
      .map((seat) => {
        const sectionId = getStrId(seat.sectionId ?? seat.zoneId);
        const key = `${sectionId}-${seat.row}-${seat.seatNumber}`;
        const position = seat.position ?? seatPositionMap.get(key);
        return { ...seat, position, sectionId };
      })
      .filter((seat) => seat.position);

    if (result.length === 0 && (seats?.length || 0) > 0 && Array.isArray(venue?.sections)) {
      const seatsByZone = new Map();
      (seats || []).forEach((seat) => {
        const zid = getStrId(seat.sectionId ?? seat.zoneId);
        if (!seatsByZone.has(zid)) seatsByZone.set(zid, []);
        seatsByZone.get(zid).push(seat);
      });

      const tempSeatsWithPos = [];
      (venue?.sections || []).forEach((section) => {
        const sectionId = getStrId(section.id ?? section.sectionId);
        const zoneSeats = seatsByZone.get(sectionId) || [];
        if (zoneSeats.length === 0 || !Array.isArray(section.boundary) || section.boundary.length === 0) return;

        const xs = section.boundary.map((p) => p.x);
        const ys = section.boundary.map((p) => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const paddingX = (maxX - minX) * 0.08, paddingY = (maxY - minY) * 0.12;
        const innerMinX = minX + paddingX, innerMaxX = maxX - paddingX, innerMinY = minY + paddingY, innerMaxY = maxY - paddingY;
        const width = innerMaxX - innerMinX, height = innerMaxY - innerMinY;
        const columns = Math.max(4, Math.min(Math.max(Math.round(width / 25), 8), Math.max(12, Math.ceil(zoneSeats.length / 3))));
        const rows = Math.ceil(zoneSeats.length / columns);
        const gapX = width / Math.max(columns - 1, 1), gapY = rows > 1 ? height / Math.max(rows - 1, 1) : 0;

        zoneSeats.forEach((seat, index) => {
          const col = index % columns, row = Math.floor(index / columns);
          tempSeatsWithPos.push({ ...seat, position: { x: innerMinX + col * gapX, y: rows === 1 ? (innerMinY + innerMaxY) / 2 : innerMinY + row * gapY } });
        });
      });

      if (tempSeatsWithPos.length > 0) result = tempSeatsWithPos;
    }
    return result;
  }, [seats, seatPositionMap, venue?.sections, viewWidth, viewHeight]);

  // Initial Fit-to-View
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const { offsetWidth: cWidth, offsetHeight: cHeight } = containerRef.current;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Include seats in bounding box
    seatsWithPosition.forEach(s => {
      minX = Math.min(minX, s.position.x); minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x); maxY = Math.max(maxY, s.position.y);
    });

    // Include sections in bounding box
    (venue?.sections || []).forEach(section => {
      (section.boundary || []).forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      });
    });

    // Include stage in bounding box (400x80 rect centered at stagePosition)
    if (venue.stagePosition) {
      const stageX = venue.stagePosition.x;
      const stageY = venue.stagePosition.y;
      minX = Math.min(minX, stageX - 200);
      maxX = Math.max(maxX, stageX + 200);
      minY = Math.min(minY, stageY - 40);
      maxY = Math.max(maxY, stageY + 40);
    }

    if (minX === Infinity) return;

    const contentWidth = (maxX - minX);
    const contentHeight = (maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Use responsive padding (10% of viewport or at least 40px)
    const padding = Math.max(40, Math.min(cWidth, cHeight) * 0.1);
    const scaleX = (cWidth - padding * 2) / contentWidth;
    const scaleY = (cHeight - padding * 2) / contentHeight;
    let k = Math.min(scaleX, scaleY, 1);

    // Ensure we don't zoom in TOO much for tiny venues, but allow zooming out as much as needed
    k = Math.max(0.05, Math.min(1, k));

    setTransform({
      x: cWidth / 2 - centerX * k,
      y: cHeight / 2 - centerY * k,
      k: k
    });
  }, [seatsWithPosition, venue?.sections, venue?.stagePosition]);

  useEffect(() => {
    const hasData = seatsWithPosition.length > 0 || (venue?.sections || []).length > 0;
    if (!isInitialized && hasData) {
      fitToView();
      setIsInitialized(true);
    }
  }, [seatsWithPosition, venue?.sections, isInitialized, fitToView]);

  // Panning
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    hasMovedRef.current = false;
  };

  useEffect(() => {
    if (!isDragging) return;

    const moveHandler = (e) => {
      const dx = e.clientX - (dragStart.x + transform.x);
      const dy = e.clientY - (dragStart.y + transform.y);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;

      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const upHandler = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
    };
  }, [isDragging, dragStart, transform.x, transform.y]);

  // Zooming
  const handleZoom = (factor, centerX, centerY) => {
    setTransform(prev => {
      const newK = Math.max(0.1, Math.min(1, prev.k * factor));
      if (newK === prev.k) return prev;

      const cx = centerX ?? containerRef.current.offsetWidth / 2;
      const cy = centerY ?? containerRef.current.offsetHeight / 2;

      return {
        k: newK,
        x: cx - (cx - prev.x) * (newK / prev.k),
        y: cy - (cy - prev.y) * (newK / prev.k),
      };
    });
  };

  const handleMapClick = (e) => {
    if (hasMovedRef.current) return;

    if (e.detail === 2) {
      fitToView();
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    handleZoom(1.4, e.clientX - rect.left, e.clientY - rect.top);
  };

  const boundaryToPath = (boundary) => {
    if (!boundary || !Array.isArray(boundary) || boundary.length === 0) return '';
    return boundary.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  // Get section name for display
  const getSectionName = (sectionId) => {
    const section = venue?.sections?.find(s => getStrId(s.id ?? s.sectionId) === sectionId);
    return section?.name || 'Unknown Section';
  };

  return (
    <div className="venue-map-container bg-white select-none rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100">
      {/* Premium Light Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">{venue.name} Seating Plan</h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => handleZoom(1.2)} className="p-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all active:scale-95 shadow-sm group"><ZoomIn className="w-4 h-4 text-gray-600 group-hover:text-blue-600" /></button>
          <button onClick={() => handleZoom(0.8)} className="p-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all active:scale-95 shadow-sm group"><ZoomOut className="w-4 h-4 text-gray-600 group-hover:text-blue-600" /></button>
          <button onClick={fitToView} className="p-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all active:scale-95 shadow-sm group"><RotateCcw className="w-4 h-4 text-gray-600 group-hover:text-blue-600" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-8 bg-gray-50/50">
        {/* Light Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Interactive Legend</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { label: 'Available', color: 'border-blue-400 bg-white', isAvailable: true },
                { label: 'Selected', color: '#10B981' },
                { label: 'Locked', color: '#F97316' },
                { label: 'Sold', color: '#E2E8F0' },
                { label: 'Blocked', color: '#EF4444' }
              ].map(item => (
                <div key={item.label} className="flex items-center space-x-3 group cursor-default">
                  {item.isAvailable ? (
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${item.color}`}></div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                  )}
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Zone Pricing</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 thin-scrollbar">
              {zoneInfo && Array.from(zoneInfo.entries()).map(([zoneName, info]) => {
                const zoneColor = zoneColorMap.get(zoneName);
                return (
                  <div key={zoneName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all cursor-help group">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: zoneColor }}
                      />
                      <span className="text-xs font-bold text-gray-600 truncate group-hover:text-gray-900 uppercase">{zoneName}</span>
                    </div>
                    <span className="text-xs font-black text-blue-600 ml-2">{currency} {info.price.toFixed(2)}</span>
                  </div>
                );
              })}
              {(!zoneInfo || zoneInfo.size === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">No zone pricing available</p>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-4 relative group">
          <div
            ref={containerRef}
            className={`relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-inner ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ height: '600px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onClick={handleMapClick}
          >
            {/* Interactive SVG Layer */}
            <div
              className="transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                transformOrigin: '0 0'
              }}
            >
              <svg
                width={viewWidth}
                height={viewHeight}
                className="overflow-visible"
              >
                <g>
                  {/* Stage Design */}
                  {venue.stagePosition && (
                    <g>
                      <defs>
                        <linearGradient id="stageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#1E40AF" />
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.5" />
                        </filter>
                      </defs>
                      <rect
                        x={venue.stagePosition.x - 200}
                        y={venue.stagePosition.y - 40}
                        width={400}
                        height={80}
                        fill="url(#stageGrad)"
                        rx={16}
                        filter="url(#shadow)"
                      />
                      <text
                        x={venue.stagePosition.x}
                        y={venue.stagePosition.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="32"
                        fontWeight="900"
                        letterSpacing="8"
                        className="select-none pointer-events-none"
                      >STAGE</text>
                    </g>
                  )}

                  {/* Sections with Zone Coloring */}
                  {(venue?.sections || []).map((sec, idx) => {
                    const sId = getStrId(sec.id ?? sec.sectionId);
                    const color = sectionColorsByZone.get(sId) || '#CBD5E1';
                    const zoneData = sectionToZoneMap.get(sId);

                    return (
                      <g key={sId ?? idx} className="hover:opacity-100 transition-opacity opacity-80">
                        <path
                          d={boundaryToPath(sec.boundary)}
                          fill={color}
                          fillOpacity={0.05}
                          stroke={color}
                          strokeWidth={3}
                          strokeDasharray="8,8"
                          className="transition-all duration-300"
                        />
                        {sec.boundary?.[0] && (
                          <text
                            x={sec.boundary[0].x + 40}
                            y={sec.boundary[0].y + 40}
                            fontSize="36"
                            fontWeight="900"
                            fill={color}
                            opacity={0.15}
                            className="select-none pointer-events-none uppercase italic"
                          >
                            {zoneData?.zoneName || sec.name || sId}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Advanced Dynamic Seats with Zone Colors */}
                  {seatsWithPosition.map((seat) => {
                    const isS = selectedSeatIds.has(getStrId(seat._id));
                    const sId = getStrId(seat.sectionId ?? seat.zoneId);

                    // Get zone data from seat's enriched data or from mapping
                    let zoneColor = '#4B5563'; // Default gray
                    if (seat.zoneName && zoneColorMap.has(seat.zoneName)) {
                      zoneColor = zoneColorMap.get(seat.zoneName);
                    } else {
                      const zoneData = sectionToZoneMap.get(sId);
                      if (zoneData && zoneData.zoneName) {
                        zoneColor = zoneColorMap.get(zoneData.zoneName) || '#4B5563';
                      }
                    }

                    let color = '#CBD5E1';
                    let fill = 'white';
                    let stroke = 'rgba(0,0,0,0.1)';
                    let strokeW = 1.5;

                    if (isS) {
                      color = '#10B981';
                      fill = '#10B981';
                      stroke = '#10B981';
                      strokeW = 3;
                    }
                    else if (seat.status === 'LOCKED') {
                      color = '#F97316';
                      fill = '#F97316';
                      stroke = '#F97316';
                      strokeW = 2;
                    }
                    else if (seat.status === 'SOLD') {
                      color = '#E2E8F0';
                      fill = '#E2E8F0';
                      stroke = '#94A3B8';
                      strokeW = 1.5;
                    }
                    else if (seat.status === 'BLOCKED') {
                      color = '#EF4444';
                      fill = '#EF4444';
                      stroke = '#EF4444';
                      strokeW = 2;
                    }
                    else if (seat.status === 'AVAILABLE') {
                      color = zoneColor;
                      fill = 'white';
                      stroke = zoneColor;
                      strokeW = 2.5; // Make available seats more visible
                    }

                    return (
                      <g
                        key={getStrId(seat._id)}
                        transform={`translate(${seat.position.x}, ${seat.position.y})`}
                        onClick={(e) => { e.stopPropagation(); onSeatClick(seat); }}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                        className="cursor-pointer group/seat"
                      >
                        <rect
                          x={-10} y={-10} width={20} height={20} rx={6}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          className="opacity-0 group-hover/seat:opacity-100 transition-opacity"
                        />
                        <rect
                          x={-8} y={-8} width={16} height={16} rx={4}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                          className="transition-all duration-200"
                        />
                        {(seat.status === 'SOLD') && (
                          <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        )}
                        {isS && (
                          <circle r={12} fill="none" stroke="#10B981" strokeWidth={2} className="animate-ping opacity-75" />
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Top Overlay Controls */}
            <div className="absolute top-6 left-6 flex space-x-3 pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md border border-gray-100 px-5 py-2 rounded-2xl shadow-lg flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Map View</span>
                <div className="h-4 w-[1px] bg-gray-200" />
                <span className="text-xs font-black text-gray-900">{Math.round(transform.k * 100)}%</span>
              </div>
            </div>

            {/* Floating Tooltip */}
            {hoveredSeat && (
              <div
                className="fixed z-[9999] pointer-events-none bg-white/95 backdrop-blur-md text-gray-900 px-4 py-3 rounded-2xl border border-gray-100 shadow-2xl transition-all duration-150 ease-out min-w-[200px]"
                style={{
                  left: `${mousePos.x + 15}px`,
                  top: `${mousePos.y + 15}px`,
                }}
              >
                <div className="space-y-2">
                  {/* Zone Info */}
                  {(() => {
                    const sId = getStrId(hoveredSeat.sectionId ?? hoveredSeat.zoneId);

                    // Try to get zone info from seat's enriched data first
                    let zoneName = hoveredSeat.zoneName;
                    let zonePrice = hoveredSeat.price;
                    let zoneColor = null;

                    // If not in seat data, get from mapping
                    if (!zoneName) {
                      const zoneData = sectionToZoneMap.get(sId);
                      if (zoneData) {
                        zoneName = zoneData.zoneName;
                        zonePrice = zoneData.price;
                      }
                    }

                    if (zoneName) {
                      zoneColor = zoneColorMap.get(zoneName);
                    }

                    if (zoneName && typeof zonePrice === 'number') {
                      return (
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            {zoneColor && (
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: zoneColor }}
                              />
                            )}
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              {zoneName}
                            </span>
                          </div>
                          <span className="text-xs font-black text-blue-600">{currency} {zonePrice.toFixed(2)}</span>
                        </div>
                      );
                    }
                  })()}

                  {/* Section Info */}
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">
                      {getSectionName(getStrId(hoveredSeat.sectionId ?? hoveredSeat.zoneId))}
                    </div>
                    <div className="text-sm font-bold">Row {hoveredSeat.row} • Seat {hoveredSeat.seatNumber}</div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${hoveredSeat.status === 'AVAILABLE' ? 'bg-green-500' :
                        hoveredSeat.status === 'LOCKED' ? 'bg-orange-500' :
                          hoveredSeat.status === 'SOLD' ? 'bg-gray-400' : 'bg-red-500'
                        }`} />
                      <span className="text-xs font-black text-gray-900 uppercase">{hoveredSeat.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .will-change-transform { will-change: transform; }
      `}</style>
    </div>
  );
}