import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";

import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Badge from "../components/Badge";
import InputField from "../components/InputField";
import { Card, CardBody } from "../components/Card";

function statusTone(status) {
  if (status === "CONFIRMED") return "green";
  if (status === "DECLINED" || status === "CANCELLED" || status === "NO_SHOW") return "red";
  if (status === "PROPOSED_TO_CLIENT") return "yellow";
  if (status === "PENDING_ADMIN_REVIEW") return "blue";
  return "gray";
}

function prettyStatus(status) {
  if (status === "PENDING_ADMIN_REVIEW") return "Pending review";
  if (status === "PROPOSED_TO_CLIENT") return "Proposed";
  if (status === "CLIENT_REJECTED_PROPOSAL") return "Proposal rejected";
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "DECLINED") return "Declined";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "COMPLETED") return "Completed";
  if (status === "NO_SHOW") return "No show";
  return status || "Unknown";
}

export default function MyAppointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectMsg, setRejectMsg] = useState({});

  async function load() {
    setLoading(true);
    const res = await api.get("/appointments/my");
    setItems(res.data.appointments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const pending = items.filter((a) => a.status === "PENDING_ADMIN_REVIEW").length;
    const proposed = items.filter((a) => a.status === "PROPOSED_TO_CLIENT").length;
    const confirmed = items.filter((a) => a.status === "CONFIRMED").length;
    return { pending, proposed, confirmed, total: items.length };
  }, [items]);

  async function accept(id) {
    try {
      await api.patch(`/appointments/${id}/accept-proposal`);
      toast.success("Proposal accepted");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function reject(id) {
    try {
      await api.patch(`/appointments/${id}/reject-proposal`, {
        message: rejectMsg[id] || "",
      });
      toast.success("Proposal rejected");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function cancel(id) {
    if (!confirm("Cancel this appointment request?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Cancelled");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  return (
    // ✅ SAME 80vw SHELL AS SERVICES/HOME/BOOK
    <div className="w-full flex justify-center">
      <div className="w-full px-4 sm:px-6 lg:w-[80vw] lg:max-w-[80vw] lg:min-w-[80vw] pb-24">
        <PageHeader
          title="My Appointments"
          subtitle="Track requests, proposals, and confirmations."
          meta={
            metrics.total ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-black/70">
                  Total: {metrics.total}
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-800">
                  Pending: {metrics.pending}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900">
                  Proposed: {metrics.proposed}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-900">
                  Confirmed: {metrics.confirmed}
                </span>
              </span>
            ) : null
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-black/5 transition"
                onClick={load}
                title="Refresh list"
              >
                Refresh
              </button>
              <Link
                to="/book"
                className="rounded-xl bg-hlgreen-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
              >
                New booking
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="mt-6 flex items-center justify-between rounded-3xl border border-black/5 bg-white p-6">
            <div className="text-sm font-semibold text-black/70">Loading appointments…</div>
            <div className="h-2 w-44 overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-1/2 animate-pulse bg-black/20" />
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {items.map((a) => {
              const canCancel = ["PENDING_ADMIN_REVIEW", "PROPOSED_TO_CLIENT", "CLIENT_REJECTED_PROPOSAL", "CONFIRMED"].includes(
                a.status
              );

              return (
                <Card key={a._id} className="rounded-3xl">
                  <CardBody className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-extrabold text-hlblack truncate">
                            {a.serviceId?.name || "Service"}
                          </div>
                          <Badge tone={statusTone(a.status)}>{prettyStatus(a.status)}</Badge>
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-black/70">
                          <div>
                            Staff: <span className="font-semibold text-hlblack">{a.staffId?.name || "—"}</span>
                          </div>
                          <div>
                            {a.date} — {a.startTime} to {a.endTime}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canCancel && (
                          <Button variant="danger" onClick={() => cancel(a._id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {a.status === "DECLINED" && a.declineReason ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                        Decline reason: <span className="font-semibold">{a.declineReason}</span>
                      </div>
                    ) : null}

                    {a.status === "PROPOSED_TO_CLIENT" && a.proposed ? (
                      <div className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white">
                        <div className="flex items-center justify-between border-b border-black/10 bg-cream-100 px-5 py-3">
                          <div className="text-sm font-extrabold text-hlblack">Admin proposal</div>
                          <span className="text-[11px] font-semibold text-black/60">
                            Choose accept or reject
                          </span>
                        </div>

                        <div className="p-5">
                          <div className="grid gap-1 text-sm text-black/70">
                            <div>
                              Proposed:{" "}
                              <span className="font-semibold text-hlblack">
                                {a.proposed.date} · {a.proposed.startTime}–{a.proposed.endTime}
                              </span>
                            </div>
                            <div>
                              Staff:{" "}
                              <span className="font-semibold text-hlblack">
                                {a.proposed.staffId?.name || "Updated staff"}
                              </span>
                            </div>
                          </div>

                          {a.proposed.message ? (
                            <div className="mt-3 rounded-2xl border border-black/5 bg-black/[0.02] p-4 text-sm text-black/70">
                              <span className="font-semibold text-black/60">Message:</span>{" "}
                              <span className="italic">{a.proposed.message}</span>
                            </div>
                          ) : null}

                          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                            <div>
                              <div className="text-xs font-semibold text-black/50">Optional note to admin</div>
                              <div className="mt-2">
                                <InputField
                                  placeholder="Tell us what you prefer..."
                                  value={rejectMsg[a._id] || ""}
                                  onChange={(e) =>
                                    setRejectMsg((prev) => ({
                                      ...prev,
                                      [a._id]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <Button onClick={() => accept(a._id)}>Accept</Button>

                            <Button variant="outline" onClick={() => reject(a._id)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              );
            })}

            {items.length === 0 && (
              <div className="mt-2 rounded-3xl border border-black/5 bg-white p-10 text-center">
                <div className="text-lg font-extrabold text-hlblack">No appointments yet</div>
                <div className="mt-2 text-sm text-black/60">
                  Create your first booking request and we’ll confirm it fast.
                </div>
                <div className="mt-6 flex justify-center">
                  <Link to="/book">
                    <Button>Book Appointment</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
