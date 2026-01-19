import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Save,
  CalendarOff,
  RefreshCw,
  Clock3,
  User2,
} from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { Card, CardBody } from "../../components/Card";
import PageHeader from "../../components/PageHeader";

const DOW = [
  { id: 0, name: "Monday" },
  { id: 1, name: "Tuesday" },
  { id: 2, name: "Wednesday" },
  { id: 3, name: "Thursday" },
  { id: 4, name: "Friday" },
  { id: 5, name: "Saturday" },
  { id: 6, name: "Sunday" },
];

function mkDefault(dayOfWeek) {
  return { dayOfWeek, startTime: "09:00", endTime: "17:00" };
}

export default function WorkingHoursStaff() {
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState("");

  const [workingHours, setWorkingHours] = useState([]);
  const [savingHours, setSavingHours] = useState(false);

  const [timeOff, setTimeOff] = useState([]);
  const [loadingTimeOff, setLoadingTimeOff] = useState(false);
  const [savingTimeOff, setSavingTimeOff] = useState(false);

  const [loadingHours, setLoadingHours] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayISO = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [timeOffForm, setTimeOffForm] = useState({
    startDate: todayISO,
    endDate: todayISO,
    reason: "Day off",
  });

  const selectedStaff = useMemo(
    () => staff.find((s) => String(s._id) === String(staffId)),
    [staff, staffId]
  );

  const hoursSummary = useMemo(() => {
    // days where THIS staff member works (rows present)
    const workingDays = workingHours.length;

    const toMin = (t) => {
      const [h, m] = String(t || "").split(":").map((x) => Number(x));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
      return h * 60 + m;
    };

    let total = 0;
    workingHours.forEach((r) => {
      const a = toMin(r.startTime);
      const b = toMin(r.endTime);
      if (b > a) total += b - a;
    });

    const hours = Math.floor(total / 60);
    const mins = total % 60;

    return {
      workingDays,
      totalMinutes: total,
      totalLabel: `${hours}h${mins ? ` ${mins}m` : ""}`,
    };
  }, [workingHours]);

  async function loadStaff() {
    const res = await api.get("/staff");
    const list = res.data?.staff || res.data || [];
    setStaff(list);
    if (!staffId && list[0]?._id) setStaffId(list[0]._id);
  }

  async function loadHours(id) {
    setLoadingHours(true);
    try {
      const res = await api.get(`/admin/staff/${id}/working-hours`);
      setWorkingHours(res.data?.workingHours || []);
    } catch (e) {
      setWorkingHours([]);
      toast.error(e?.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoadingHours(false);
    }
  }

  async function loadTimeOff(id) {
    setLoadingTimeOff(true);
    try {
      const res = await api.get(`/admin/staff/${id}/time-off`);
      const items = res.data?.items || res.data?.timeOff || res.data || [];
      setTimeOff(Array.isArray(items) ? items : []);
    } catch (e) {
      setTimeOff([]);
      toast.error(
        e?.response?.data?.message ||
          "Failed to load time off (check API endpoint)"
      );
    } finally {
      setLoadingTimeOff(false);
    }
  }

  const loadAllForStaff = useCallback(async (id) => {
    if (!id) return;
    await Promise.all([loadHours(id), loadTimeOff(id)]);
  }, []);

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!staffId) return;
    loadAllForStaff(staffId);
  }, [staffId, loadAllForStaff]);

  function rowFor(dayId) {
    return workingHours.find((x) => x.dayOfWeek === dayId) || mkDefault(dayId);
  }

  function isNotWorking(dayId) {
    // For THIS staff member: if no row exists, they are not working that weekday.
    return !workingHours.some((x) => x.dayOfWeek === dayId);
  }

  function setNotWorking(dayId, notWorking) {
    setWorkingHours((prev) => {
      if (notWorking) return prev.filter((x) => x.dayOfWeek !== dayId);
      if (prev.some((x) => x.dayOfWeek === dayId)) return prev;
      return [...prev, mkDefault(dayId)];
    });
  }

  function updateRow(dayId, patch) {
    setWorkingHours((prev) => {
      const idx = prev.findIndex((x) => x.dayOfWeek === dayId);
      if (idx < 0) return [...prev, { ...mkDefault(dayId), ...patch }];
      return prev.map((x, i) => (i === idx ? { ...x, ...patch } : x));
    });
  }

  function isValidISODate(s) {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  }

  function normalizeDateRange(startDate, endDate) {
    const a = new Date(startDate + "T00:00:00");
    const b = new Date(endDate + "T00:00:00");
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    if (b < a) return { startDate: endDate, endDate: startDate };
    return { startDate, endDate };
  }

  async function saveHours() {
    if (!staffId) return;

    try {
      setSavingHours(true);

      // Only send days THIS staff member is working
      const normalized = [...workingHours]
        .map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      await api.put(`/admin/staff/${staffId}/working-hours`, {
        workingHours: normalized,
      });

      toast.success("Schedule saved");
      await loadHours(staffId);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to save schedule");
    } finally {
      setSavingHours(false);
    }
  }

  async function addTimeOff() {
    if (!staffId) return;

    const { startDate, endDate, reason } = timeOffForm;

    if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
      toast.error("Pick valid dates");
      return;
    }

    const range = normalizeDateRange(startDate, endDate);
    if (!range) {
      toast.error("Invalid date range");
      return;
    }

    const payload = {
      startDate: range.startDate,
      endDate: range.endDate,
      reason: String(reason || "").trim() || "Time off",
    };

    try {
      setSavingTimeOff(true);
      await api.post(`/admin/staff/${staffId}/time-off`, payload);
      toast.success("Time off added");
      await loadTimeOff(staffId);
      setTimeOffForm((p) => ({
        ...p,
        startDate: todayISO,
        endDate: todayISO,
      }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to add time off");
    } finally {
      setSavingTimeOff(false);
    }
  }

  async function deleteTimeOff(item) {
    if (!staffId) return;
    const id = item?._id;
    if (!id) {
      toast.error("Missing time off id");
      return;
    }
    if (!confirm("Delete this time off entry?")) return;

    try {
      await api.delete(`/admin/staff/${staffId}/time-off/${id}`);
      toast.success("Deleted");
      await loadTimeOff(staffId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    }
  }

  async function refresh() {
    if (!staffId) return;
    try {
      setRefreshing(true);
      await loadAllForStaff(staffId);
      toast.success("Refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  const sortedTimeOff = useMemo(() => {
    const list = Array.isArray(timeOff) ? [...timeOff] : [];
    list.sort((a, b) =>
      String(b.startDate || "").localeCompare(String(a.startDate || ""))
    );
    return list;
  }, [timeOff]);

  const headerActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        onClick={refresh}
        disabled={!staffId || refreshing}
        loading={refreshing}
        title="Refresh"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>

      <Button
        size="sm"
        className="rounded-xl gap-2"
        onClick={saveHours}
        loading={savingHours}
        disabled={!staffId || savingHours}
        title="Save schedule"
      >
        <Save className="h-4 w-4" />
        Save
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Staff Schedule"
        subtitle="Set weekly working times per staff member and add time off. This affects only the selected staff member."
        actions={headerActions}
      />

      {/* Top strip: staff selector + quick stats */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-hlblack">Staff member</div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <User2 className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>

            <select
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-hlgreen-600/30"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="mt-3 text-xs text-black/60">
              {selectedStaff?.name ? (
                <>
                  Managing schedule for{" "}
                  <span className="font-semibold text-hlblack">
                    {selectedStaff.name}
                  </span>
                  .
                </>
              ) : (
                "Select a staff member to edit."
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-hlblack">Weekly summary</div>
                <div className="mt-1 text-xs text-black/60">
                  Days this staff member works + approximate weekly time.
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/5">
                <Clock3 className="h-5 w-5 text-black/60" />
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-cream-100 p-3">
                <div className="text-xs text-black/60">Working days</div>
                <div className="mt-1 text-xl font-extrabold text-hlblack">
                  {hoursSummary.workingDays}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-3">
                <div className="text-xs text-black/60">Weekly time</div>
                <div className="mt-1 text-xl font-extrabold text-hlblack">
                  {hoursSummary.totalLabel}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-3">
                <div className="text-xs text-black/60">Time off entries</div>
                <div className="mt-1 text-xl font-extrabold text-hlblack">
                  {sortedTimeOff.length}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* WEEKLY SCHEDULE */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-hlblack">
                  Weekly working times
                </div>
                <div className="mt-1 text-xs text-black/60">
                  Toggle “Not working” for days this staff member does not work.
                </div>
              </div>
              {loadingHours ? (
                <div className="text-xs text-black/50">Loading…</div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2">
              {DOW.map((d) => {
                const notWorking = isNotWorking(d.id);
                const row = rowFor(d.id);

                return (
                  <div
                    key={d.id}
                    className={[
                      "grid items-center gap-2 rounded-2xl border p-3 transition",
                      notWorking ? "border-black/10 bg-white" : "border-black/10 bg-cream-50",
                      "md:grid-cols-[120px_1fr_1fr_140px]",
                    ].join(" ")}
                  >
                    <div className="font-semibold text-hlblack">{d.name}</div>

                    <InputField
                      type="time"
                      disabled={notWorking}
                      value={row.startTime}
                      onChange={(e) =>
                        updateRow(d.id, { startTime: e.target.value })
                      }
                    />

                    <InputField
                      type="time"
                      disabled={notWorking}
                      value={row.endTime}
                      onChange={(e) =>
                        updateRow(d.id, { endTime: e.target.value })
                      }
                    />

                    <label className="flex items-center gap-2 text-sm text-black/70">
                      <input
                        type="checkbox"
                        checked={notWorking}
                        onChange={(e) => setNotWorking(d.id, e.target.checked)}
                        className="h-4 w-4 accent-hlgreen-600"
                      />
                      Not working
                    </label>

                    {notWorking ? (
                      <div className="md:col-span-4 mt-1 text-xs text-black/45">
                        This staff member is unavailable on this weekday (other staff may still work).
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-black/5 bg-cream-100 p-4 text-xs text-black/70">
              “Not working” affects only the selected staff member’s availability. Use Time off below to block specific dates.
            </div>
          </CardBody>
        </Card>

        {/* TIME OFF */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-hlblack">
                  <CalendarOff className="h-4 w-4" />
                  Time off
                </div>
                <div className="mt-1 text-xs text-black/60">
                  Blocks specific dates for this staff member (vacation, sick leave, etc).
                </div>
              </div>
            </div>

            {/* Add new time off */}
            <div className="mt-4 rounded-3xl border border-black/10 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
                <InputField
                  label="Start date"
                  type="date"
                  value={timeOffForm.startDate}
                  onChange={(e) =>
                    setTimeOffForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                />

                <InputField
                  label="End date"
                  type="date"
                  value={timeOffForm.endDate}
                  onChange={(e) =>
                    setTimeOffForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                />

                <InputField
                  label="Reason"
                  placeholder="Vacation / Sick / Day off..."
                  value={timeOffForm.reason}
                  onChange={(e) =>
                    setTimeOffForm((p) => ({ ...p, reason: e.target.value }))
                  }
                />

                <Button
                  onClick={addTimeOff}
                  disabled={!staffId || savingTimeOff}
                  loading={savingTimeOff}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* List time off */}
            <div className="mt-4 space-y-2">
              {loadingTimeOff ? (
                <div className="text-sm text-black/60">Loading time off…</div>
              ) : sortedTimeOff.length ? (
                sortedTimeOff.map((item) => {
                  const sameDay = item.startDate === item.endDate;
                  return (
                    <div
                      key={
                        item._id || `${item.startDate}-${item.endDate}-${item.reason}`
                      }
                      className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-cream-50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-hlblack">
                          {sameDay
                            ? item.startDate
                            : `${item.startDate} → ${item.endDate}`}
                        </div>
                        <div className="mt-0.5 text-xs text-black/60 truncate">
                          {item.reason || "Time off"}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteTimeOff(item)}
                        className="gap-2 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-black/5 bg-cream-100 p-4 text-sm text-black/70">
                  No time off entries for this staff member.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
