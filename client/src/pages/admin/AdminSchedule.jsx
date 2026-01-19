// src/pages/admin/AdminSchedule.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";
import { Card, CardBody } from "../../components/Card";

const MIN_PER_COL = 15; // 15-minute grid
const STAFF_COL_PX = 220;

function hhmmToMin(t) {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + m;
}
function minToHHMM(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function statusLabel(status) {
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "PROPOSED_TO_CLIENT") return "Proposed";
  if (status === "PENDING_ADMIN_REVIEW") return "Pending";
  if (status === "DECLINED") return "Declined";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "COMPLETED") return "Completed";
  if (status === "NO_SHOW") return "No show";
  return status || "Unknown";
}

function statusStyle(status) {
  if (status === "CONFIRMED") return "bg-emerald-600 text-white border-emerald-700";
  if (status === "PROPOSED_TO_CLIENT") return "bg-sky-200 text-black border-sky-300";
  if (status === "DECLINED" || status === "CANCELLED")
    return "bg-black/10 text-black/70 border-black/10";
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "NO_SHOW") return "bg-rose-200 text-black border-rose-300";
  return "bg-amber-200 text-black border-amber-300"; // pending default
}

function StatusPill({ label, dotClass }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-black/70">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <StatusPill label="Working hours" dotClass="bg-emerald-100" />
      <StatusPill label="Confirmed" dotClass="bg-emerald-600" />
      <StatusPill label="Pending" dotClass="bg-amber-300" />
      <StatusPill label="Proposed" dotClass="bg-sky-300" />
      <StatusPill label="Time off" dotClass="bg-black/20" />
      <StatusPill label="No show" dotClass="bg-rose-300" />
    </div>
  );
}

export default function AdminSchedule() {
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlDate = params.get("date"); // YYYY-MM-DD
  const urlStaff = params.get("staff"); // staffId
  const urlMode = params.get("mode"); // "filtered" | "all"

  const [date, setDate] = useState(urlDate || new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState(urlMode === "filtered" ? "filtered" : "all");

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState({});
  const [showOnlyWorking, setShowOnlyWorking] = useState(false);
  const [autoWindow, setAutoWindow] = useState(true);
  const [density, setDensity] = useState("comfy"); // compact | comfy | spacious

  const timelineWrapRef = useRef(null);
  const [timelinePxWidth, setTimelinePxWidth] = useState(0);

  // Apply URL changes (when opened from appointment request)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const d = p.get("date");
    const m = p.get("mode");

    if (d) setDate(d);
    if (m) setViewMode(m === "filtered" ? "filtered" : "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!timelineWrapRef.current) return;
    const el = timelineWrapRef.current;

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      setTimelinePxWidth(Math.max(320, Math.floor(w)));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const densityConfig = useMemo(() => {
    if (density === "compact") return { pad: 45, minWindow: 8 * 60, minPxCol: 12, rowH: 62, headerH: 42 };
    if (density === "spacious") return { pad: 15, minWindow: 4 * 60, minPxCol: 18, rowH: 78, headerH: 46 };
    return { pad: 30, minWindow: 6 * 60, minPxCol: 15, rowH: 70, headerH: 44 };
  }, [density]);

  async function load() {
    setLoading(true);
    const res = await api.get(`/admin/schedule-board?date=${date}`);
    setBoard(res.data);
    setLoading(false);

    const staff = res.data?.staff || [];

    setSelected((prev) => {
      // if user already touched selection, keep it
      if (Object.keys(prev).length) return prev;

      const next = {};

      // If opened from request: mode=filtered & staff=id => select only that staff
      const p = new URLSearchParams(location.search);
      const staffParam = p.get("staff");
      const modeParam = p.get("mode");

      if (modeParam === "filtered" && staffParam) {
        staff.forEach((s) => (next[s._id] = s._id === staffParam));
        return next;
      }

      // Default: whole schedule (select all)
      staff.forEach((s) => (next[s._id] = true));
      return next;
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, viewMode]);

  const staffList = board?.staff || [];

  const visibleStaff = useMemo(() => {
    let list = staffList.filter((s) => selected[s._id]);
    if (showOnlyWorking) list = list.filter((s) => !!s.workingHours);
    return list;
  }, [staffList, selected, showOnlyWorking]);

  function toggleStaff(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const next = {};
    staffList.forEach((s) => (next[s._id] = true));
    setSelected(next);
  }

  function selectOnlyStaff(staffId) {
    const next = {};
    staffList.forEach((s) => (next[s._id] = s._id === staffId));
    setSelected(next);
  }

  const { dayStartMin, dayEndMin } = useMemo(() => {
    let start = hhmmToMin("08:00");
    let end = hhmmToMin("20:00");

    if (!autoWindow || !visibleStaff.length) return { dayStartMin: start, dayEndMin: end };

    const withHours = visibleStaff.filter((s) => s.workingHours);
    if (!withHours.length) return { dayStartMin: start, dayEndMin: end };

    const minStart = Math.min(...withHours.map((s) => hhmmToMin(s.workingHours.startTime)));
    const maxEnd = Math.max(...withHours.map((s) => hhmmToMin(s.workingHours.endTime)));

    start = clamp(minStart - densityConfig.pad, 0, 23 * 60);
    end = clamp(maxEnd + densityConfig.pad, 60, 24 * 60);

    if (end - start < densityConfig.minWindow) {
      end = clamp(start + densityConfig.minWindow, 60, 24 * 60);
    }

    return { dayStartMin: start, dayEndMin: end };
  }, [autoWindow, visibleStaff, densityConfig]);

  const totalMinutes = Math.max(60, dayEndMin - dayStartMin);
  const cols = Math.ceil(totalMinutes / MIN_PER_COL);

  const pxPerCol = useMemo(() => {
    if (!timelinePxWidth) return densityConfig.minPxCol;
    const w = Math.max(320, timelinePxWidth - 16);
    return Math.max(densityConfig.minPxCol, Math.floor(w / cols));
  }, [timelinePxWidth, cols, densityConfig]);

  function minutesToX(min) {
    const offset = min - dayStartMin;
    const col = offset / MIN_PER_COL;
    return col * pxPerCol;
  }

  function rangeToBar(startHHMM, endHHMM) {
    const st = hhmmToMin(startHHMM);
    const en = hhmmToMin(endHHMM);
    const left = minutesToX(clamp(st, dayStartMin, dayEndMin));
    const right = minutesToX(clamp(en, dayStartMin, dayEndMin));
    const width = Math.max(right - left, 14);
    return { left, width };
  }

  const hourTicks = useMemo(() => {
    const ticks = [];
    const firstHour = Math.ceil(dayStartMin / 60) * 60;
    for (let m = firstHour; m <= dayEndMin; m += 60) ticks.push(m);
    return ticks;
  }, [dayStartMin, dayEndMin]);

  const gridTicks = useMemo(() => {
    const step = pxPerCol >= 20 ? 15 : pxPerCol >= 15 ? 30 : 60;
    const ticks = [];
    const first = Math.ceil(dayStartMin / step) * step;
    for (let m = first; m <= dayEndMin; m += step) ticks.push(m);
    return ticks;
  }, [dayStartMin, dayEndMin, pxPerCol]);

  const staffChipBase = "rounded-full px-3 py-1.5 text-xs font-semibold border transition shadow-sm";
  const staffChipOn = "bg-black text-white border-black";
  const staffChipOff = "bg-white text-black border-black/15 hover:bg-black/5";
  const staffChipDisabled = "bg-black/5 text-black/40 border-black/10 hover:bg-black/10";

  const toolbarPill =
    "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/70";

  const smallBtn =
    "rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition";

  const modeToggleWrap = "inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1";
  const modeBtnBase = "rounded-full px-3 py-1.5 text-sm  transition";
  const modeBtnOn = "bg-black text-white";
  const modeBtnOff = "text-black/70 hover:bg-black/5";

  const hasFilteredContext = !!urlStaff;

  return (
    <AdminLayout>
      {/* Title + toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <h2 className="text-2xl font-bold text-hlblack">Schedule</h2>
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/60">
              Admin view
            </span>
          </div>
          <p className="mt-1 text-sm text-black/60">
            Whole schedule by default. Open from a request for filtered context.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Whole vs From request toggle */}
          <div className={modeToggleWrap}>
            <button
              className={`${modeBtnBase} ${viewMode === "all" ? modeBtnOn : modeBtnOff}`}
              onClick={() => {
                setViewMode("all");
                selectAll();
              }}
              title="Show all staff"
            >
              Whole
            </button>
            <button
              className={`${modeBtnBase} ${viewMode === "filtered" ? modeBtnOn : modeBtnOff}`}
              onClick={() => {
                if (!hasFilteredContext) return;
                setViewMode("filtered");
                selectOnlyStaff(urlStaff);
              }}
              disabled={!hasFilteredContext}
              title={!hasFilteredContext ? "Open from an appointment request to enable this" : "Show only request staff"}
            >
              From request
            </button>
          </div>

          <label className={toolbarPill}>
            <input
              type="checkbox"
              checked={showOnlyWorking}
              onChange={(e) => setShowOnlyWorking(e.target.checked)}
              className="h-4 w-4"
            />
            Only working
          </label>

          <label className={toolbarPill}>
            <input
              type="checkbox"
              checked={autoWindow}
              onChange={(e) => setAutoWindow(e.target.checked)}
              className="h-4 w-4"
            />
            Auto window
          </label>

          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5">
            <span className="text-xs font-semibold text-black/50">Density</span>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="bg-transparent text-sm font-semibold text-black outline-none"
            >
              <option value="compact">Compact</option>
              <option value="comfy">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5">
            <span className="text-xs font-semibold text-black/50">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setSelected({}); // allow re-init selection if coming from request
                setDate(e.target.value);
              }}
              className="bg-transparent text-sm font-semibold text-black outline-none"
            />
          </div>
        </div>
      </div>

      {/* Staff selector */}
      <div className="mt-4">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {staffList.map((s) => {
                  const active = !!selected[s._id];
                  const hasHours = !!s.workingHours;

                  const cls = active ? staffChipOn : hasHours ? staffChipOff : staffChipDisabled;

                  return (
                    <button
                      key={s._id}
                      onClick={() => toggleStaff(s._id)}
                      className={`${staffChipBase} ${cls}`}
                      title={s.workingHours ? `${s.workingHours.startTime}-${s.workingHours.endTime}` : "No working hours"}
                    >
                      {s.name}
                    </button>
                  );
                })}

                {!staffList.length && !loading && (
                  <div className="text-sm text-black/60">No staff found.</div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className={smallBtn} onClick={selectAll}>
                  Select all
                </button>
                <button className={smallBtn} onClick={() => setSelected({})}>
                  Clear
                </button>
                <button className={smallBtn} onClick={load} title="Refresh board">
                  Refresh
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Board */}
      <div className="mt-3">
        <Card>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-black/70">Loading schedule…</div>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-black/10">
                  <div className="h-full w-1/2 animate-pulse bg-black/20" />
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-black/10 bg-white overflow-visible">
                  {/* header row */}
                  <div className="grid bg-white" style={{ gridTemplateColumns: `${STAFF_COL_PX}px 1fr` }}>
                    <div className="border-b border-black/10 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-black/50">
                        Staff
                      </div>
                    </div>

                    <div className="border-b border-black/10 px-4 py-3" ref={timelineWrapRef}>
                      <div className="relative w-full" style={{ height: densityConfig.headerH }}>
                        {gridTicks.map((m) => {
                          const x = minutesToX(m);
                          const isHour = m % 60 === 0;
                          return (
                            <div
                              key={m}
                              className={`absolute top-0 bottom-0 ${
                                isHour ? "border-l border-black/15" : "border-l border-black/8"
                              }`}
                              style={{ left: x }}
                            />
                          );
                        })}

                        {hourTicks.map((m) => {
                          const x = minutesToX(m);
                          return (
                            <div
                              key={m}
                              className="absolute top-1 text-[12px] font-semibold text-black/55"
                              style={{ left: x + 8 }}
                            >
                              {minToHHMM(m)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* rows */}
                  <div className="divide-y divide-black/10">
                    {visibleStaff.map((s, idx) => {
                      const wh = s.workingHours;
                      const rowBg = idx % 2 === 0 ? "bg-white" : "bg-black/[0.015]";

                      return (
                        <div
                          key={s._id}
                          className={`grid ${rowBg}`}
                          style={{ gridTemplateColumns: `${STAFF_COL_PX}px 1fr` }}
                        >
                          {/* staff cell */}
                          <div className="px-4 py-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-[15px] font-bold text-black">
                                  {s.name}
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-black/50">
                                  {wh ? `${wh.startTime}–${wh.endTime}` : "No working hours"}
                                </div>
                              </div>

                              {!wh ? (
                                <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold text-black/40">
                                  Off
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* timeline cell */}
                          <div className="px-4 py-4">
                            <div
                              className="relative w-full rounded-2xl border border-black/5 bg-white"
                              style={{ height: densityConfig.rowH }}
                            >
                              {/* grid */}
                              {gridTicks.map((m) => {
                                const x = minutesToX(m);
                                const isHour = m % 60 === 0;
                                return (
                                  <div
                                    key={m}
                                    className={`absolute top-0 bottom-0 ${
                                      isHour ? "border-l border-black/10" : "border-l border-black/5"
                                    }`}
                                    style={{ left: x }}
                                  />
                                );
                              })}

                              {/* working band */}
                              {wh && (
                                <div
                                  className="absolute top-2 bottom-2 rounded-xl bg-emerald-50"
                                  style={{
                                    left: minutesToX(hhmmToMin(wh.startTime)),
                                    width:
                                      minutesToX(hhmmToMin(wh.endTime)) -
                                      minutesToX(hhmmToMin(wh.startTime)),
                                  }}
                                />
                              )}

                              {/* time off */}
                              {(s.timeOff || []).map((t, tIdx) => {
                                const { left, width } = rangeToBar(t.startTime, t.endTime);
                                return (
                                  <div
                                    key={tIdx}
                                    className="absolute top-3 bottom-3 rounded-xl bg-black/15"
                                    style={{ left, width }}
                                    title={t.reason || "Time off"}
                                  />
                                );
                              })}

                              {/* appointments (smart + hover details) */}
                              {(s.appointments || []).map((a) => {
                                const { left, width } = rangeToBar(a.startTime, a.endTime);
                                const cls = statusStyle(a.status);
                                const dashed = a.status !== "CONFIRMED" ? "border-dashed" : "";

                                const serviceName = a.serviceId?.name || "Service";
                                const timeLabel = `${a.startTime}–${a.endTime}`;

                                const canFitFull = width >= 140;
                                const canFitShort = width >= 80;
                                const short =
                                  serviceName.length > 12 ? serviceName.slice(0, 12) + "…" : serviceName;

                                return (
                                  <div
                                    key={a._id}
                                    className="absolute"
                                    style={{ left, width, top: 10, bottom: 10 }}
                                  >
                                    <div
                                      className={[
                                        "group relative h-full w-full rounded-2xl border shadow-sm transition",
                                        "hover:z-50 hover:shadow-2xl hover:scale-y-[1.12] origin-center",
                                        cls,
                                        dashed,
                                      ].join(" ")}
                                    >
                                      <div className="h-full w-full px-3 py-2">
                                        {!canFitShort ? (
                                          <div className="flex h-full items-center justify-center">
                                            <span className="h-2.5 w-2.5 rounded-full bg-black/40" />
                                          </div>
                                        ) : (
                                          <div className="flex h-full flex-col justify-center">
                                            <div className="truncate text-[13px] font-bold leading-4">
                                              {canFitFull ? serviceName : short}
                                            </div>
                                            {canFitFull ? (
                                              <div className="truncate text-[11px] font-semibold opacity-90">
                                                {timeLabel}
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>

                                      <div className="pointer-events-none absolute left-1/2 top-0 hidden -translate-x-1/2 -translate-y-[112%] group-hover:block">
                                        <div className="pointer-events-auto w-[280px] rounded-2xl border border-black/10 bg-white p-3 text-xs text-black shadow-2xl">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <div className="truncate text-sm font-semibold text-black">
                                                {serviceName}
                                              </div>
                                              <div className="mt-0.5 text-black/60">{timeLabel}</div>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold text-black/60">
                                              {statusLabel(a.status)}
                                            </span>
                                          </div>

                                          {a.clientId?.name ? (
                                            <div className="mt-2 text-black/70">
                                              Client:{" "}
                                              <span className="font-semibold">{a.clientId.name}</span>
                                            </div>
                                          ) : null}

                                          {a.adminNote ? (
                                            <div className="mt-1 text-black/60">Note: {a.adminNote}</div>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!visibleStaff.length ? (
                      <div className="p-10 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="text-lg font-semibold text-black">No staff selected</div>
                          <div className="mt-1 text-sm text-black/60">
                            Select staff chips above to display their timeline.
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <Legend />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
