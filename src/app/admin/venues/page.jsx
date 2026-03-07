"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Building2,
  ToggleLeft,
  ToggleRight,
  Save,
  Wrench,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Edit2,
  X,
} from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ─────────────────────────────────────────────────────────────
   Utility – safe string ID extraction
───────────────────────────────────────────────────────────── */
function getStrId(id) {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (id.$oid) return id.$oid;
  if (id.toString) return id.toString();
  return null;
}

/* ─────────────────────────────────────────────────────────────
   Maintenance Seat Map (rendered inside the venue detail view)
───────────────────────────────────────────────────────────── */
function MaintenanceSeatMap({ venue, token, onBack, onVenueUpdated }) {
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // {ok, msg}
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.4 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState(null);
  // cursorPos: position of the crosshair in container-local coords
  const [cursorPos, setCursorPos] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  // contextMenu: { seat, x, y } – shown when clicking a maintenance seat
  const [contextMenu, setContextMenu] = useState(null);

  const containerRef = useRef(null);
  const hasMovedRef = useRef(false);
  // Touch-pinch tracking refs
  const pinchStartDistRef = useRef(null);
  const pinchStartKRef = useRef(null);
  const pinchMidRef = useRef(null);

  /* Flatten all seats from venue sections */
  const allSeats = useMemo(() => {
    const seats = [];
    (venue?.sections || []).forEach((section) => {
      const sId = getStrId(section.id ?? section._id);
      (section.seats || []).forEach((seat) => {
        const num = seat.number ?? seat.seatNumber ?? seat.num;
        seats.push({
          ...seat,
          sectionId: sId,
          sectionName: section.name,
          _seatId: getStrId(seat.id ?? seat._id) || `${sId}-${seat.row}-${num}`,
        });
      });
    });
    return seats;
  }, [venue]);

  /* Pre-select seats already under maintenance */
  useEffect(() => {
    const pre = new Set(
      allSeats
        .filter((s) => s.isMaintanance)
        .map((s) => s._seatId)
        .filter(Boolean),
    );
    setSelectedSeatIds(pre);
  }, [allSeats]);

  /* Build seat position map from venue sections */
  const seatPositionMap = useMemo(() => {
    const map = new Map();
    (venue?.sections || []).forEach((section) => {
      const sId = getStrId(section.id ?? section._id);
      (section.seats || []).forEach((seat) => {
        const num = seat.number ?? seat.seatNumber ?? seat.num;
        const key = `${sId}-${seat.row}-${num}`;
        if (seat.x != null && seat.y != null) {
          map.set(key, { x: seat.x, y: seat.y });
        }
      });
    });
    return map;
  }, [venue]);

  /* Seats with positions */
  const seatsWithPos = useMemo(() => {
    return allSeats
      .map((seat) => {
        const num = seat.number ?? seat.seatNumber ?? seat.num;
        const key = `${seat.sectionId}-${seat.row}-${num}`;
        const pos =
          seatPositionMap.get(key) ??
          (seat.x != null ? { x: seat.x, y: seat.y } : null);
        return { ...seat, position: pos };
      })
      .filter((s) => s.position);
  }, [allSeats, seatPositionMap]);

  /* Map dimensions */
  const rawDims = venue?.mapDimensions || { width: 1000, height: 800 };
  const viewWidth = Number(rawDims.width?.$numberLong ?? rawDims.width) || 1000;
  const viewHeight =
    Number(rawDims.height?.$numberLong ?? rawDims.height) || 800;

  /* Fit to view */
  const fitToView = useCallback(() => {
    if (!containerRef.current || seatsWithPos.length === 0) return;
    const { offsetWidth: cW, offsetHeight: cH } = containerRef.current;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    seatsWithPos.forEach((s) => {
      minX = Math.min(minX, s.position.x);
      minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x);
      maxY = Math.max(maxY, s.position.y);
    });
    (venue?.sections || []).forEach((sec) =>
      (sec.boundary || []).forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }),
    );
    if (minX === Infinity) return;
    const scaleX = cW / (maxX - minX + 120);
    const scaleY = cH / (maxY - minY + 120);
    const k = Math.min(scaleX, scaleY, 1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setTransform({ x: cW / 2 - centerX * k, y: cH / 2 - centerY * k, k });
  }, [seatsWithPos, venue?.sections]);

  useEffect(() => {
    if (!isInitialized && seatsWithPos.length > 0) {
      fitToView();
      setIsInitialized(true);
    }
  }, [seatsWithPos, isInitialized, fitToView]);

  /* Drag handlers */
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setContextMenu(null);
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    hasMovedRef.current = false;
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const dx = e.clientX - (dragStart.x + transform.x);
      const dy = e.clientY - (dragStart.y + transform.y);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isDragging, dragStart, transform.x, transform.y]);

  /* Zoom (shared between wheel scroll and pinch) */
  const handleZoom = useCallback((factor, cx, cy) => {
    setTransform((prev) => {
      const newK = Math.max(0.1, Math.min(4, prev.k * factor));
      if (newK === prev.k) return prev;
      const px =
        cx ?? (containerRef.current ? containerRef.current.offsetWidth / 2 : 0);
      const py =
        cy ??
        (containerRef.current ? containerRef.current.offsetHeight / 2 : 0);
      return {
        k: newK,
        x: px - (px - prev.x) * (newK / prev.k),
        y: py - (py - prev.y) * (newK / prev.k),
      };
    });
  }, []);

  /* Pinch-to-zoom: attach non-passive touch listeners so we can preventDefault */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (t1, t2) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const getTouchMid = (t1, t2, rect) => ({
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    });

    let touchStartPos = null;

    const onTouchStart = (e) => {
      setContextMenu(null);
      if (e.touches.length === 2) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        pinchStartDistRef.current = getTouchDist(e.touches[0], e.touches[1]);
        pinchStartKRef.current = null; // will be set on first move
        pinchMidRef.current = getTouchMid(e.touches[0], e.touches[1], rect);
        hasMovedRef.current = true; // suppress click after pinch
      } else if (e.touches.length === 1) {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hasMovedRef.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const mid = getTouchMid(e.touches[0], e.touches[1], rect);
        if (pinchStartDistRef.current && dist > 0) {
          const ratio = dist / pinchStartDistRef.current;
          setTransform((prev) => {
            if (pinchStartKRef.current === null) {
              pinchStartKRef.current = prev.k;
            }
            const newK = Math.max(
              0.1,
              Math.min(4, pinchStartKRef.current * ratio),
            );
            return {
              k: newK,
              x: mid.x - (mid.x - prev.x) * (newK / prev.k),
              y: mid.y - (mid.y - prev.y) * (newK / prev.k),
            };
          });
        }
      } else if (e.touches.length === 1 && touchStartPos) {
        const dx = e.touches[0].clientX - touchStartPos.x;
        const dy = e.touches[0].clientY - touchStartPos.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          hasMovedRef.current = true;
          touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
      }
    };

    const onTouchEnd = () => {
      pinchStartDistRef.current = null;
      pinchStartKRef.current = null;
      pinchMidRef.current = null;
      touchStartPos = null;
    };

    /* Non-passive wheel listener so preventDefault() actually works and
       stops the browser from zooming the entire page on scroll. */
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      handleZoom(factor, e.clientX - rect.left, e.clientY - rect.top);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [handleZoom]);

  /* Dismiss context menu on outside click */
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    window.addEventListener("click", dismiss);
    return () => window.removeEventListener("click", dismiss);
  }, [contextMenu]);

  /* Seat click: if the seat is already under maintenance (DB value), show context menu */
  const handleSeatClick = (seat, e) => {
    const sid = seat._seatId;
    if (!sid) return;

    const isCurrentlyMaintenance = seat.isMaintanance;
    const isSelected = selectedSeatIds.has(sid);

    // If this seat is currently in maintenance (DB) and still selected,
    // show a context menu offering to remove it from maintenance.
    if (isCurrentlyMaintenance && isSelected) {
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({
        seat,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      return;
    }

    // Otherwise just toggle normally
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  /* Context menu: remove seat from maintenance */
  const handleRemoveMaintenance = (seat) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      next.delete(seat._seatId);
      return next;
    });
    setContextMenu(null);
  };

  /* Context menu: keep maintenance (dismiss) */
  const handleKeepMaintenance = () => setContextMenu(null);

  /* Boundary path */
  const boundaryToPath = (boundary) => {
    if (!boundary?.length) return "";
    return (
      boundary.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
      " Z"
    );
  };

  /* Save maintenance seats */
  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const venueId = getStrId(venue?._id ?? venue?.id);

      /* Build a complete seatStateMap: every seat gets its desired boolean value.
         This is sent in a single PATCH request to avoid race conditions. */
      const seatStateMap = {};
      allSeats.forEach((s) => {
        if (s._seatId) {
          seatStateMap[s._seatId] = selectedSeatIds.has(s._seatId);
        }
      });

      const toMarkCount = Array.from(selectedSeatIds).length;
      const toClearCount = allSeats.length - toMarkCount;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/venue/${venueId}/maintenance-seats`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seatStateMap }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.status}`);
      }

      const data = await res.json();

      setSaveResult({
        ok: true,
        msg: `${toMarkCount} seat(s) marked for maintenance, ${toClearCount} cleared.`,
      });

      if (data.venue && onVenueUpdated) {
        onVenueUpdated(data.venue);
      }
    } catch (err) {
      setSaveResult({ ok: false, msg: err.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all mb-3"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Venue Details
          </button>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Wrench className="w-6 h-6 text-amber-500" />
            Mark Maintenance Seats
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-sm font-bold border border-amber-500/20">
              {selectedSeatIds.size} selected
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click seats to toggle their maintenance status.{" "}
            <span className="text-amber-400 font-semibold">Orange</span> = under
            maintenance. <span className="text-muted-foreground/60">Grey</span>{" "}
            = active.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <Save className="w-4 h-4 shrink-0" />
          )}
          {saving ? "Saving..." : "Save Maintenance"}
        </button>
      </div>

      {/* Save result banner */}
      {saveResult && (
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-xl mb-4 border ${saveResult.ok ? "bg-accent/10 border-accent/20 text-accent" : "bg-destructive/10 border-destructive/20 text-destructive"}`}
        >
          {saveResult.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{saveResult.msg}</span>
          <button
            onClick={() => setSaveResult(null)}
            className="ml-auto p-1 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex-1">
        {/* Map header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {venue.name} — Seat Map
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={fitToView}
              className="p-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div
          className="flex gap-4 p-4 bg-gray-50/50"
          style={{ minHeight: 520 }}
        >
          {/* Legend */}
          <div className="w-44 shrink-0 space-y-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Legend
              </p>
              {[
                { label: "Active", color: "#F1F5F9", border: "#94A3B8" },
                { label: "Maintenance", color: "#F59E0B", border: "#F59E0B" },
                {
                  label: "Newly Selected",
                  color: "#10B981",
                  border: "#10B981",
                },
                { label: "ToBe Cleared", color: "#FEF3C7", border: "#F59E0B" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{
                      backgroundColor: item.color,
                      border: `2px solid ${item.border}`,
                    }}
                  />
                  <span className="text-xs font-bold text-gray-600">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Stats
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total</span>
                  <span className="font-black text-gray-900">
                    {allSeats.length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600 font-semibold">
                    Maintenance
                  </span>
                  <span className="font-black text-amber-600">
                    {selectedSeatIds.size}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Active</span>
                  <span className="font-black text-gray-900">
                    {allSeats.length - selectedSeatIds.size}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <div
              ref={containerRef}
              className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-inner ${isDragging ? "cursor-grabbing" : "cursor-none"}`}
              style={{ height: 480 }}
              onMouseDown={handleMouseDown}
              onMouseMove={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                setCursorPos({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setCursorPos(null)}
              onClick={(e) => {
                // seat clicks are handled by stopPropagation on the <g>;
                // blank-area click only dismisses context menu
                if (hasMovedRef.current) return;
                setContextMenu(null);
              }}
            >
              <div
                style={{
                  transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.k})`,
                  transformOrigin: "0 0",
                  willChange: "transform",
                }}
                className="transition-transform duration-150 ease-out"
              >
                <svg
                  width={viewWidth}
                  height={viewHeight}
                  className="overflow-visible"
                >
                  <g>
                    {/* Stage */}
                    {venue.stagePosition && (
                      <g>
                        <defs>
                          <linearGradient
                            id="mntStageGrad"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#1E40AF" />
                          </linearGradient>
                        </defs>
                        <rect
                          x={venue.stagePosition.x - 200}
                          y={venue.stagePosition.y - 40}
                          width={400}
                          height={80}
                          fill="url(#mntStageGrad)"
                          rx={16}
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
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          STAGE
                        </text>
                      </g>
                    )}

                    {/* Sections */}
                    {(venue?.sections || []).map((sec, idx) => (
                      <g key={getStrId(sec.id ?? sec._id) ?? idx} opacity={0.7}>
                        <path
                          d={boundaryToPath(sec.boundary)}
                          fill="#64748B"
                          fillOpacity={0.04}
                          stroke="#64748B"
                          strokeWidth={2}
                          strokeDasharray="6,6"
                        />
                        {sec.boundary?.[0] && (
                          <text
                            x={sec.boundary[0].x + 30}
                            y={sec.boundary[0].y + 30}
                            fontSize={28}
                            fontWeight="900"
                            fill="#64748B"
                            opacity={0.12}
                            style={{
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {sec.name}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Seats */}
                    {seatsWithPos.map((seat) => {
                      const sid = seat._seatId;
                      const isSelected = selectedSeatIds.has(sid);
                      const wasMaintenace = seat.isMaintanance;
                      const hasChanged = isSelected !== wasMaintenace;

                      let fill = "#F1F5F9";
                      let stroke = "#94A3B8";
                      let strokeW = 1.5;

                      if (isSelected) {
                        if (wasMaintenace) {
                          fill = "#F59E0B";
                          stroke = "#F59E0B";
                          strokeW = 2.5;
                        } else {
                          fill = "#10B981";
                          stroke = "#10B981";
                          strokeW = 2.5;
                        }
                      } else if (wasMaintenace) {
                        fill = "#FEF3C7";
                        stroke = "#F59E0B";
                        strokeW = 1.5;
                      }

                      return (
                        <g
                          key={
                            sid ??
                            `${seat.sectionId}-${seat.row}-${seat.number}`
                          }
                          transform={`translate(${seat.position.x},${seat.position.y})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasMovedRef.current) return;
                            handleSeatClick(seat, e);
                          }}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          onMouseMove={(e) =>
                            setMousePos({ x: e.clientX, y: e.clientY })
                          }
                          style={{ cursor: "crosshair" }}
                        >
                          {/* Pulse ring for maintenance seats */}
                          {wasMaintenace && isSelected && (
                            <circle
                              r={13}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth={1.5}
                              opacity={0.5}
                            />
                          )}
                          {/* Selection ring if changed state */}
                          {hasChanged && (
                            <circle
                              r={12}
                              fill="none"
                              stroke={isSelected ? "#10B981" : "#F59E0B"}
                              strokeWidth={2}
                              opacity={0.4}
                            />
                          )}
                          <rect
                            x={-8}
                            y={-8}
                            width={16}
                            height={16}
                            rx={4}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeW}
                            style={{ transition: "all 0.15s ease" }}
                          />
                          {/* Icon inside seat */}
                          {isSelected && (
                            <text
                              x={0}
                              y={1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={9}
                              fill="white"
                              fontWeight="bold"
                              style={{
                                pointerEvents: "none",
                                userSelect: "none",
                              }}
                            >
                              {wasMaintenace ? "🔧" : "✕"}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Always-visible SVG crosshair cursor */}
              {cursorPos && !isDragging && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: "100%", height: "100%", zIndex: 10 }}
                >
                  {/* Horizontal line */}
                  <line
                    x1={0}
                    y1={cursorPos.y}
                    x2="100%"
                    y2={cursorPos.y}
                    stroke="#64748B"
                    strokeWidth={0.75}
                    strokeDasharray="4,4"
                    opacity={0.4}
                  />
                  {/* Vertical line */}
                  <line
                    x1={cursorPos.x}
                    y1={0}
                    x2={cursorPos.x}
                    y2="100%"
                    stroke="#64748B"
                    strokeWidth={0.75}
                    strokeDasharray="4,4"
                    opacity={0.4}
                  />
                  {/* Centre dot */}
                  <circle
                    cx={cursorPos.x}
                    cy={cursorPos.y}
                    r={hoveredSeat ? 5 : 3}
                    fill={
                      hoveredSeat
                        ? selectedSeatIds.has(hoveredSeat._seatId)
                          ? "#10B981"
                          : hoveredSeat.isMaintanance
                            ? "#F59E0B"
                            : "#64748B"
                        : "#94A3B8"
                    }
                    opacity={0.9}
                    style={{ transition: "r 0.1s ease, fill 0.1s ease" }}
                  />
                  {/* Crosshair arms */}
                  <line
                    x1={cursorPos.x - 8}
                    y1={cursorPos.y}
                    x2={cursorPos.x - 3}
                    y2={cursorPos.y}
                    stroke="#334155"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  <line
                    x1={cursorPos.x + 3}
                    y1={cursorPos.y}
                    x2={cursorPos.x + 8}
                    y2={cursorPos.y}
                    stroke="#334155"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  <line
                    x1={cursorPos.x}
                    y1={cursorPos.y - 8}
                    x2={cursorPos.x}
                    y2={cursorPos.y - 3}
                    stroke="#334155"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  <line
                    x1={cursorPos.x}
                    y1={cursorPos.y + 3}
                    x2={cursorPos.x}
                    y2={cursorPos.y + 8}
                    stroke="#334155"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                </svg>
              )}

              {/* Context menu — shown when clicking a maintenance seat */}
              {contextMenu && (
                <div
                  className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[220px]"
                  style={{
                    left: Math.min(
                      contextMenu.x + 8,
                      (containerRef.current?.offsetWidth ?? 400) - 240,
                    ),
                    top: Math.min(
                      contextMenu.y + 8,
                      (containerRef.current?.offsetHeight ?? 400) - 120,
                    ),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      Seat Action
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      Row {contextMenu.seat.row} • Seat{" "}
                      {contextMenu.seat.number ?? contextMenu.seat.seatNumber}
                    </p>
                    <p className="text-xs text-amber-600 font-semibold">
                      {contextMenu.seat.sectionName}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleRemoveMaintenance(contextMenu.seat)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-left transition-colors group"
                    >
                      <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                        <XCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Remove Maintenance
                        </p>
                        <p className="text-xs text-gray-500">
                          Mark seat as active
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={handleKeepMaintenance}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors group"
                    >
                      <div className="p-1.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                        <Wrench className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Keep Maintenance
                        </p>
                        <p className="text-xs text-gray-500">
                          Leave seat under maintenance
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Zoom indicator */}
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-xl shadow text-xs font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                {Math.round(transform.k * 100)}%
              </div>

              {/* Pinch hint – visible briefly on mobile */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none select-none md:hidden">
                Pinch to zoom • Drag to pan
              </div>
            </div>

            {/* Tooltip */}
            {hoveredSeat && !contextMenu && (
              <div
                className="fixed z-9999 pointer-events-none bg-white/95 backdrop-blur-md text-gray-900 px-4 py-3 rounded-2xl border border-gray-100 shadow-2xl min-w-[180px]"
                style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {hoveredSeat.sectionName}
                </p>
                <p className="text-sm font-bold">
                  Row {hoveredSeat.row} • Seat{" "}
                  {hoveredSeat.number ?? hoveredSeat.seatNumber}
                </p>
                <div
                  className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${selectedSeatIds.has(hoveredSeat._seatId) ? "text-emerald-600" : hoveredSeat.isMaintanance ? "text-amber-500" : "text-gray-500"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${selectedSeatIds.has(hoveredSeat._seatId) ? "bg-emerald-500" : hoveredSeat.isMaintanance ? "bg-amber-400" : "bg-gray-400"}`}
                  />
                  {selectedSeatIds.has(hoveredSeat._seatId)
                    ? hoveredSeat.isMaintanance
                      ? "Under Maintenance (click to change)"
                      : "Newly marked for Maintenance"
                    : hoveredSeat.isMaintanance
                      ? "Scheduled to be Cleared"
                      : "Active"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Venue Detail Panel
───────────────────────────────────────────────────────────── */
function VenueDetailPanel({ venue, token, onClose, onVenueUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMaintMap, setShowMaintMap] = useState(false);
  const [form, setForm] = useState({
    name: venue.name || "",
    city: venue.city || "",
    isActive: venue.isActive ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setForm({
      name: venue.name || "",
      city: venue.city || "",
      isActive: venue.isActive ?? false,
    });
    setIsEditing(false);
    setShowMaintMap(false);
    setSaveError(null);
  }, [venue]);

  const venueId = getStrId(venue?._id ?? venue?.id);

  const totalSeats = (venue?.sections || []).reduce(
    (s, sec) => s + (sec.seats?.length || 0),
    0,
  );
  const maintSeats = (venue?.sections || []).reduce(
    (s, sec) =>
      s + (sec.seats?.filter((seat) => seat.isMaintanance).length || 0),
    0,
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/venue/${venueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: form.name, city: form.city }),
        },
      );
      if (!res.ok) throw new Error("Failed to update venue");
      const data = await res.json();
      onVenueUpdated(data.venue || { ...venue, ...form });
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/venue/${venueId}/toggle-active`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to toggle status");
      const data = await res.json();
      const updated = data.venue || { ...venue, isActive: !venue.isActive };
      setForm((f) => ({ ...f, isActive: updated.isActive }));
      onVenueUpdated(updated);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (showMaintMap) {
    return (
      <MaintenanceSeatMap
        venue={venue}
        token={token}
        onBack={() => setShowMaintMap(false)}
        onVenueUpdated={onVenueUpdated}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">{venue.name}</h2>
            <p className="text-sm text-muted-foreground">{venue.city}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Sections",
            value: (venue.sections || []).length,
            color: "text-primary",
          },
          { label: "Total Seats", value: totalSeats, color: "text-foreground" },
          { label: "Maintenance", value: maintSeats, color: "text-amber-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-background-elevated rounded-xl p-4 border border-border text-center"
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border mb-6">
        <div>
          <p className="text-sm font-bold text-foreground">Venue Status</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {form.isActive ? "Venue is active & bookable" : "Venue is inactive"}
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className="flex items-center gap-2 transition-all"
        >
          {toggling ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : form.isActive ? (
            <ToggleRight className="w-10 h-10 text-accent" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Edit form */}
      {saveError && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Venue Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              City
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-4 py-3 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSaveError(null);
              }}
              className="px-6 py-3 bg-muted/30 hover:bg-muted/60 text-muted-foreground rounded-xl font-bold transition-all border border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl font-bold transition-all border border-primary/20 mb-4 w-full justify-center"
        >
          <Edit2 className="w-4 h-4" />
          Edit Venue Details
        </button>
      )}

      {/* Sections list */}
      {(venue.sections || []).length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
            Sections
          </p>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {venue.sections.map((sec, idx) => {
              const mCount = (sec.seats || []).filter(
                (s) => s.isMaintanance,
              ).length;
              return (
                <div
                  key={getStrId(sec.id ?? sec._id) ?? idx}
                  className="flex items-center justify-between px-4 py-3 bg-background-elevated rounded-xl border border-border"
                >
                  <p className="text-sm font-bold text-foreground">
                    {sec.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {mCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                        {mCount} maint.
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {sec.seats?.length || 0} seats
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Maintenance Map CTA */}
      <button
        onClick={() => setShowMaintMap(true)}
        className="group mt-auto w-full flex items-center justify-between px-5 py-4 bg-linear-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-amber-600 uppercase tracking-wide">
              Mark Maintenance Seats
            </p>
            <p className="text-xs text-muted-foreground">
              Select seats on the map to mark under maintenance
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Venues Page
───────────────────────────────────────────────────────────── */
export default function AdminVenuesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [detailVenue, setDetailVenue] = useState(null); // full venue object for detail panel
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/venue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch venues");
      const data = await res.json();
      setVenues(data.venues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenue = async (venue) => {
    setSelectedVenue(venue);
    setLoadingDetail(true);
    try {
      const id = getStrId(venue._id ?? venue.id);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/venue/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch venue details");
      const full = await res.json();
      setDetailVenue(full);
    } catch (err) {
      console.error(err);
      setDetailVenue(venue);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleVenueUpdated = (updated) => {
    const id = getStrId(updated._id ?? updated.id);
    setVenues((prev) =>
      prev.map((v) =>
        getStrId(v._id ?? v.id) === id ? { ...v, ...updated } : v,
      ),
    );
    // Replace detailVenue entirely so fresh sections/isMaintanance flags are used.
    setDetailVenue(updated);
  };

  const filtered = venues.filter(
    (v) =>
      !searchQuery ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6" />
          <p className="text-foreground font-semibold text-lg">
            Loading Venues...
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Header */}
          <div className="mb-10 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />
            <div className="py-6">
              <button
                onClick={() => router.back()}
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all mb-6"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight flex flex-wrap items-center gap-4">
                    Venue Management
                    <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                      {venues.length} Total
                    </span>
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Select a venue to edit details or manage maintenance seats.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Main two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Venue List (left) */}
            <div className="lg:col-span-2">
              {/* Search */}
              <div className="relative mb-4">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search venues or cities…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground font-medium transition-all"
                />
              </div>

              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                    <p className="text-muted-foreground font-semibold">
                      No venues found
                    </p>
                  </div>
                ) : (
                  filtered.map((venue) => {
                    const vid = getStrId(venue._id ?? venue.id);
                    const isActive =
                      getStrId(selectedVenue?._id ?? selectedVenue?.id) === vid;
                    const totalS = (venue.sections || []).reduce(
                      (s, sec) => s + (sec.seats?.length || 0),
                      0,
                    );
                    const maintS = (venue.sections || []).reduce(
                      (s, sec) =>
                        s +
                        (sec.seats?.filter((st) => st.isMaintanance).length ||
                          0),
                      0,
                    );

                    return (
                      <button
                        key={vid}
                        onClick={() => handleSelectVenue(venue)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                          isActive
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "bg-card border-border hover:border-primary/40 hover:bg-card"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
                        )}
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`font-black text-base truncate ${isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}`}
                              >
                                {venue.name}
                              </p>
                              {maintS > 0 && (
                                <span className="shrink-0 px-2 py-0.5 text-[10px] font-black bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                                  {maintS} maint.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              {venue.city || "Unknown city"}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {(venue.sections || []).length} section
                                {(venue.sections || []).length !== 1 ? "s" : ""}
                              </span>
                              <span>•</span>
                              <span>{totalS} seats</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span
                              className={`px-2 py-1 text-[10px] font-black rounded-full border ${
                                venue.isActive
                                  ? "bg-accent/10 text-accent border-accent/20"
                                  : "bg-muted/30 text-muted-foreground border-muted/30"
                              }`}
                            >
                              {venue.isActive ? "Active" : "Inactive"}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 transition-all ${isActive ? "text-primary translate-x-0.5" : "text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5"}`}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Detail Panel (right) */}
            <div className="lg:col-span-3">
              {!selectedVenue ? (
                <div className="bg-card rounded-3xl border-2 border-dashed border-border p-16 text-center flex flex-col items-center justify-center min-h-[500px]">
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                    <Sparkles className="w-12 h-12 text-primary opacity-40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Select a Venue
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Choose a venue from the list to view its details, edit
                    information, or manage maintenance seats.
                  </p>
                </div>
              ) : loadingDetail ? (
                <div className="bg-card rounded-3xl border border-border p-16 flex items-center justify-center min-h-[500px]">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mb-4" />
                    <p className="text-muted-foreground font-semibold">
                      Loading venue details…
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden min-h-[500px]">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 h-full">
                    <VenueDetailPanel
                      venue={detailVenue}
                      token={token}
                      onClose={() => {
                        setSelectedVenue(null);
                        setDetailVenue(null);
                      }}
                      onVenueUpdated={handleVenueUpdated}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}
