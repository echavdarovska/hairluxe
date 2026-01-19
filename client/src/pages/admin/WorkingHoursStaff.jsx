import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Save, CalendarOff } from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { Card, CardBody } from "../../components/Card";

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

/**
 * Time-off record expected shape (recommended):
 * {
 *   _id: string,
 *   startDate: "YYYY-MM-DD",
 *   endDate: "YYYY-MM-DD", // can be same as startDate for single-day
 *   reason?: string,
 *   createdAt?: string
 * }
 */

export default function WorkingHoursStaff() {
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState("");

  const [workingHours, setWorkingHours] = useState([]);
  const [savingHours, setSavingHours] = useState(false);

  const [timeOff, setTimeOff] = useState([]);
  const [loadingTimeOff, setLoadingTimeOff] = useState(false);
  const [savingTimeOff, setSavingTimeOff] = useState(false);

  const todayISO = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [timeOffForm, setTimeOffForm] = useState({
    startDate: todayISO,
    endDate: todayISO,
    reason: "Day off", // default label
  });

  async function loadStaff() {
    const res = await api.get("/staff");
    const list = res.data?.staff || res.data || [];
    setStaff(list);
    if (!staffId && list[0]?._id) setStaffId(list[0]._id);
  }

  async function loadHours(id) {
    const res = await api.get(`/admin/staff/${id}/working-hours`);
    setWorkingHours(res.data?.workingHours || []);
  }

  async function loadTimeOff(id) {
    setLoadingTimeOff(true);
    try {
      const res = await api.get(`/admin/staff/${id}/time-off`);
      const items = res.data?.items || res.data?.timeOff || res.data || [];
      setTimeOff(Array.isArray(items) ? items : []);
    } catch (e) {
      // Don’t hard fail whole page if endpoint not ready
      setTimeOff([]);
      toast.error(
        e?.response?.data?.message ||
          "Failed to load time off (check API endpoint)"
      );
    } finally {
      setLoadingTimeOff(false);
    }
  }

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!staffId) return;
    loadHours(staffId);
    loadTimeOff(staffId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  function rowFor(dayId) {
    return workingHours.find((x) => x.dayOfWeek === dayId) || mkDefault(dayId);
  }

  function isClosed(dayId) {
    // "Closed" = no row exists in DB for that day
    return !workingHours.some((x) => x.dayOfWeek === dayId);
  }

  function setClosed(dayId, closed) {
    setWorkingHours((prev) => {
      if (closed) return prev.filter((x) => x.dayOfWeek !== dayId);
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
    // Make sure end >= start
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

      // Only send open days (existing rows)
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

      toast.success("Working hours saved");
      await loadHours(staffId);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to save working hours");
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
        reason: p.reason || "Day off",
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

  const sortedTimeOff = useMemo(() => {
    const list = Array.isArray(timeOff) ? [...timeOff] : [];
    list.sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")));
    return list;
  }, [timeOff]);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-hlblack">Working Hours</h2>
      <p className="mt-1 text-sm text-black/60">
        Set weekly schedule per staff member and manage time off (leave/sick days).
      </p>

      <div className="mt-6 grid gap-4">
        {/* STAFF PICKER + SAVE */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-sm">
                <div className="text-sm font-semibold">Staff member</div>
                <select
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={saveHours}
                loading={savingHours}
                disabled={!staffId || savingHours}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save hours
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* WEEKLY WORKING HOURS */}
        <Card>
          <CardBody>
            <div className="text-sm font-semibold">Weekly schedule</div>

            <div className="mt-4 grid gap-2">
              {DOW.map((d) => {
                const closed = isClosed(d.id);
                const row = rowFor(d.id);

                return (
                  <div
                    key={d.id}
                    className="grid items-center gap-2 rounded-xl border border-black/10 bg-cream-50 p-3 md:grid-cols-[120px_1fr_1fr_110px]"
                  >
                    <div className="font-semibold">{d.name}</div>

                    <InputField
                      type="time"
                      disabled={closed}
                      value={row.startTime}
                      onChange={(e) =>
                        updateRow(d.id, { startTime: e.target.value })
                      }
                    />

                    <InputField
                      type="time"
                      disabled={closed}
                      value={row.endTime}
                      onChange={(e) =>
                        updateRow(d.id, { endTime: e.target.value })
                      }
                    />

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={closed}
                        onChange={(e) => setClosed(d.id, e.target.checked)}
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* TIME OFF */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarOff className="h-4 w-4" />
                  Time off / leave / sick days
                </div>
                <div className="mt-1 text-xs text-black/60">
                  These dates must be excluded from availability so bookings can’t be scheduled.
                </div>
              </div>
            </div>

            {/* Add new time off */}
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto] md:items-end">
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
                  placeholder="Day off / Sick / Vacation..."
                  value={timeOffForm.reason}
                  onChange={(e) =>
                    setTimeOffForm((p) => ({ ...p, reason: e.target.value }))
                  }
                />

                <Button
                  onClick={addTimeOff}
                  disabled={!staffId || savingTimeOff}
                  loading={savingTimeOff}
                  className="gap-2"
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
                      key={item._id || `${item.startDate}-${item.endDate}-${item.reason}`}
                      className="flex flex-col gap-2 rounded-xl border border-black/10 bg-cream-50 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-hlblack">
                          {sameDay
                            ? item.startDate
                            : `${item.startDate} → ${item.endDate}`}
                        </div>
                        <div className="text-xs text-black/60 truncate">
                          {item.reason || "Time off"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteTimeOff(item)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-black/60">
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
