import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import Badge from "../../components/Badge";
import { Card, CardBody } from "../../components/Card";

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
  // staffId can be populated object or plain id string
  return typeof staffId === "string" ? staffId : staffId?._id;
}

export default function AdminAppointments() {
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    staffId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [declineReason, setDeclineReason] = useState({});
  const [proposal, setProposal] = useState({});

  async function load() {
    const res = await api.get("/appointments", { params: filters });
    setItems(res.data.appointments || []);
  }

  useEffect(() => {
    (async () => {
      const stRes = await api.get("/staff");
      setStaff(stRes.data.staff || []);
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
      if (reason.trim().length < 2) return toast.error("Add a decline reason (min 2 chars)");

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

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-hlblack">Appointments</h2>
      <p className="mt-1 text-sm text-black/60">
        Review requests and manage proposals. Use Schedule links for fast context.
      </p>

      {/* FILTERS */}
      <Card className="mt-6">
        <CardBody>
          <div className="grid gap-2 md:grid-cols-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
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
              onChange={(e) => setFilters((p) => ({ ...p, staffId: e.target.value }))}
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
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            />

            <InputField
              label="Date to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            />
          </div>
        </CardBody>
      </Card>

      {/* LIST */}
      <div className="mt-6 grid gap-4">
        {items.map((a) => {
          const sid = staffIdVal(a.staffId);

          // Decide which date/staff should be used for context:
          // - normally use a.date + a.staffId
          // - if admin is proposing changes, you might also want a link based on proposed fields
          const scheduleHrefFiltered =
            sid && a.date
              ? `/admin/schedule?mode=filtered&date=${encodeURIComponent(a.date)}&staff=${encodeURIComponent(sid)}`
              : `/admin/schedule?mode=all&date=${encodeURIComponent(a.date || "")}`;

          const scheduleHrefWhole =
            a.date ? `/admin/schedule?mode=all&date=${encodeURIComponent(a.date)}` : `/admin/schedule`;

          return (
            <Card key={a._id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {a.serviceId?.name}{" "}
                      <span className="text-sm text-black/50">({a.serviceId?.durationMinutes} min)</span>
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      Client: <b>{a.clientId?.name}</b>{" "}
                      <span className="text-black/50">({a.clientId?.email})</span>
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      {a.date} — {a.startTime} to {a.endTime} • <b>{a.staffId?.name}</b>
                    </div>

                    {/* ✅ QUICK SCHEDULE LINKS */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to={scheduleHrefFiltered}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
                        title="Open Schedule focused on this staff and date"
                      >
                        View schedule (filtered)
                      </Link>

                      <Link
                        to={scheduleHrefWhole}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
                        title="Open full day schedule for this date"
                      >
                        Whole day
                      </Link>
                    </div>
                  </div>

                  <Badge tone={tone(a.status)}>{a.status}</Badge>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 space-y-3">
                  {a.status === "PENDING_ADMIN_REVIEW" && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => confirm(a._id)}>Confirm</Button>

                      <Button variant="outline" onClick={() => decline(a._id)}>
                        Decline
                      </Button>

                      <InputField
                        placeholder="Decline reason..."
                        className="max-w-[320px]"
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

                  {["PENDING_ADMIN_REVIEW", "CLIENT_REJECTED_PROPOSAL", "PROPOSED_TO_CLIENT"].includes(
                    a.status
                  ) && (
                    <div>
                      <div className="mb-2 text-sm font-semibold">Propose changes</div>

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

                        <Button variant="outline" onClick={() => proposeChanges(a._id)}>
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
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setFinalStatus(a._id, "COMPLETED")}>
                        Completed
                      </Button>
                      <Button variant="outline" onClick={() => setFinalStatus(a._id, "NO_SHOW")}>
                        No-show
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-black/60">No appointments match filters.</div>
        )}
      </div>
    </AdminLayout>
  );
}
