import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, CalendarDays, FilterX } from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import Badge from "../../components/Badge";
import { Card, CardBody } from "../../components/Card";
import PageHeader from "../../components/PageHeader";

const STATUSES = [
  "",
  "PENDING_ADMIN_REVIEW",
  "CONFIRMED",
  "DECLINED",
  "PROPOSED_TO_CLIENT",
  "CLIENT_REJECTED_PROPOSAL",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
];

function tone(status) {
  if (status === "CONFIRMED") return "green";
  if (["DECLINED", "CANCELLED", "NO_SHOW"].includes(status)) return "red";
  if (status === "PROPOSED_TO_CLIENT") return "yellow";
  if (status === "PENDING_ADMIN_REVIEW") return "blue";
  return "gray";
}

function staffIdVal(staffId) {
  return typeof staffId === "string" ? staffId : staffId?._id;
}

function isISODate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default function AdminAppointments() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    staffId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [declineReason, setDeclineReason] = useState({});
  const [proposal, setProposal] = useState({});

  // ✅ Read query params from URL (Dashboard links)
  const urlFilters = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const status = sp.get("status") || "";
    const date = sp.get("date") || "";
    const staffId = sp.get("staffId") || sp.get("staff") || ""; // support both keys

    const next = {
      status: STATUSES.includes(status) ? status : "",
      staffId: staffId || "",
      dateFrom: isISODate(date) ? date : "",
      dateTo: isISODate(date) ? date : "",
    };

    return next;
  }, [location.search]);

  const load = useCallback(
    async (overrideFilters) => {
      try {
        setLoading(true);
        const params = overrideFilters || filters;
        const res = await api.get("/appointments", { params });
        setItems(res.data.appointments || []);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // initial load: staff + appointments
  useEffect(() => {
    (async () => {
      try {
        const stRes = await api.get("/staff");
        setStaff(stRes.data.staff || []);
      } catch {
        setStaff([]);
      }
    })();
  }, []);


  useEffect(() => {
    setFilters((prev) => {
      const merged = {
        ...prev,
        ...urlFilters,
      };

 
      const same =
        prev.status === merged.status &&
        prev.staffId === merged.staffId &&
        prev.dateFrom === merged.dateFrom &&
        prev.dateTo === merged.dateTo;

      return same ? prev : merged;
    });

  }, [urlFilters]);


  useEffect(() => {
    load();
  }, [filters, load]);

  async function confirm(id) {
    try {
      await api.patch(`/appointments/${id}/confirm`);
      toast.success("Confirmed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function decline(id) {
    try {
      const reason = declineReason[id] || "";
      if (reason.trim().length < 2)
        return toast.error("Add a decline reason (min 2 chars)");

      await api.patch(`/appointments/${id}/decline`, { reason });
      toast.success("Declined");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function proposeChanges(id) {
    try {
      const p = proposal[id];
      if (!p?.staffId || !p?.date || !p?.startTime)
        return toast.error("Fill staff, date and start time");

      await api.patch(`/appointments/${id}/propose`, {
        staffId: p.staffId,
        date: p.date,
        startTime: p.startTime,
        message: p.message || "",
      });

      toast.success("Proposed to client");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function setFinalStatus(id, status) {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success("Updated");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  function clearFilters() {
    setFilters({ status: "", staffId: "", dateFrom: "", dateTo: "" });
  }

  const headerActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        onClick={() => load(filters)}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        onClick={clearFilters}
        disabled={loading}
        title="Clear filters"
      >
        <FilterX className="h-4 w-4" />
        Clear
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Appointments"
        subtitle="Review requests, propose changes, and keep the schedule under control."
        actions={headerActions}
      />

      {/* FILTERS */}
      <Card className="mt-5 rounded-3xl border border-black/5">
        <CardBody className="p-5">
          <div className="grid gap-2 md:grid-cols-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </Select>

            <Select
              label="Staff"
              value={filters.staffId}
              onChange={(e) =>
                setFilters((p) => ({ ...p, staffId: e.target.value }))
              }
            >
              <option value="">All</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <InputField
              label="Date from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((p) => ({ ...p, dateFrom: e.target.value }))
              }
            />

            <InputField
              label="Date to"
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((p) => ({ ...p, dateTo: e.target.value }))
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-black/60">
            <span className="rounded-full bg-cream-100 px-3 py-1 ring-1 ring-black/5">
              Showing <b className="text-hlblack">{items.length}</b>
            </span>

            {filters.status ? (
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/10">
                Status: <b className="text-hlblack">{filters.status}</b>
              </span>
            ) : null}

            {filters.staffId ? (
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/10">
                Staff:{" "}
                <b className="text-hlblack">
                  {staff.find((s) => s._id === filters.staffId)?.name || "—"}
                </b>
              </span>
            ) : null}

            {filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo ? (
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/10 inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Date: <b className="text-hlblack">{filters.dateFrom}</b>
              </span>
            ) : filters.dateFrom || filters.dateTo ? (
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/10">
                Range:{" "}
                <b className="text-hlblack">
                  {filters.dateFrom || "…"} → {filters.dateTo || "…"}
                </b>
              </span>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* LIST */}
      <div className="mt-6 grid gap-4">
        {items.map((a) => {
          const sid = staffIdVal(a.staffId);

          const scheduleHrefFiltered =
            sid && a.date
              ? `/admin/schedule?mode=filtered&date=${encodeURIComponent(
                  a.date
                )}&staff=${encodeURIComponent(sid)}`
              : a.date
              ? `/admin/schedule?mode=all&date=${encodeURIComponent(a.date)}`
              : `/admin/schedule`;

          const scheduleHrefWhole =
            a.date
              ? `/admin/schedule?mode=all&date=${encodeURIComponent(a.date)}`
              : `/admin/schedule`;

          return (
            <Card key={a._id} className="rounded-3xl border border-black/5">
              <CardBody className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-hlblack">
                      {a.serviceId?.name || "Service"}{" "}
                      <span className="text-sm font-semibold text-black/50">
                        ({a.serviceId?.durationMinutes || "—"} min)
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      Client: <b>{a.clientId?.name || "—"}</b>{" "}
                      <span className="text-black/50">
                        ({a.clientId?.email || "—"})
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      {a.date || "—"} — {a.startTime || "—"} to {a.endTime || "—"} •{" "}
                      <b>{a.staffId?.name || "—"}</b>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to={scheduleHrefFiltered}
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
                        title="Open Schedule focused on this staff and date"
                      >
                        View schedule (staff)
                      </Link>

                      <Link
                        to={scheduleHrefWhole}
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
                        title="Open full day schedule for this date"
                      >
                        Whole day
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <Badge tone={tone(a.status)}>{a.status}</Badge>
                    {loading ? (
                      <div className="text-xs text-black/40">Loading…</div>
                    ) : null}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 space-y-3">
                  {a.status === "PENDING_ADMIN_REVIEW" && (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                      <Button onClick={() => confirm(a._id)}>Confirm</Button>

                      <Button variant="outline" onClick={() => decline(a._id)}>
                        Decline
                      </Button>

                      <InputField
                        placeholder="Decline reason..."
                        className="w-full md:max-w-[420px]"
                        value={declineReason[a._id] || ""}
                        onChange={(e) =>
                          setDeclineReason((p) => ({
                            ...p,
                            [a._id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {[
                    "PENDING_ADMIN_REVIEW",
                    "CLIENT_REJECTED_PROPOSAL",
                    "PROPOSED_TO_CLIENT",
                  ].includes(a.status) && (
                    <div className="rounded-2xl border border-black/5 bg-cream-100 p-4">
                      <div className="mb-2 text-sm font-semibold text-hlblack">
                        Propose changes
                      </div>

                      <div className="grid gap-2 md:grid-cols-4">
                        <Select
                          value={proposal[a._id]?.staffId || ""}
                          onChange={(e) =>
                            setProposal((p) => ({
                              ...p,
                              [a._id]: {
                                ...(p[a._id] || {}),
                                staffId: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Select staff...</option>
                          {staff
                            .filter((s) => s.active)
                            .map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                        </Select>

                        <InputField
                          type="date"
                          value={proposal[a._id]?.date || ""}
                          onChange={(e) =>
                            setProposal((p) => ({
                              ...p,
                              [a._id]: {
                                ...(p[a._id] || {}),
                                date: e.target.value,
                              },
                            }))
                          }
                        />

                        <InputField
                          type="time"
                          value={proposal[a._id]?.startTime || ""}
                          onChange={(e) =>
                            setProposal((p) => ({
                              ...p,
                              [a._id]: {
                                ...(p[a._id] || {}),
                                startTime: e.target.value,
                              },
                            }))
                          }
                        />

                        <Button
                          variant="outline"
                          onClick={() => proposeChanges(a._id)}
                        >
                          Send
                        </Button>
                      </div>

                      <InputField
                        className="mt-2"
                        placeholder="Optional message..."
                        value={proposal[a._id]?.message || ""}
                        onChange={(e) =>
                          setProposal((p) => ({
                            ...p,
                            [a._id]: {
                              ...(p[a._id] || {}),
                              message: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}

                  {a.status === "CONFIRMED" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setFinalStatus(a._id, "COMPLETED")}
                      >
                        Completed
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setFinalStatus(a._id, "NO_SHOW")}
                      >
                        No-show
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}

        {items.length === 0 && !loading && (
          <div className="text-sm text-black/60">
            No appointments match filters.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
