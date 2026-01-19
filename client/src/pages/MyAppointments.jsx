import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

import Button from "../components/Button";
import Badge from "../components/Badge";
import InputField from "../components/InputField";
import { Card, CardBody } from "../components/Card";

function statusTone(status) {
  if (status === "CONFIRMED") return "green";
  if (
    status === "DECLINED" ||
    status === "CANCELLED" ||
    status === "NO_SHOW"
  )
    return "red";
  if (status === "PROPOSED_TO_CLIENT") return "yellow";
  if (status === "PENDING_ADMIN_REVIEW") return "blue";
  return "gray";
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
    <div>
      <h2 className="text-2xl font-bold text-hlblack">My Appointments</h2>
      <p className="mt-1 text-sm text-black/60">
        Track requests, proposals, and confirmations.
      </p>

      {loading ? (
        <div className="mt-6 text-sm text-black/60">Loading...</div>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((a) => (
            <Card key={a._id}>
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {a.serviceId?.name}
                    </div>
                    <div className="mt-1 text-sm text-black/70">
                      Staff:{" "}
                      <span className="font-semibold">
                        {a.staffId?.name}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-black/70">
                      {a.date} — {a.startTime} to {a.endTime}
                    </div>
                  </div>

                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </div>

                {a.status === "DECLINED" && a.declineReason && (
                  <div className="mt-3 text-sm text-red-700">
                    Decline reason:{" "}
                    <span className="font-semibold">
                      {a.declineReason}
                    </span>
                  </div>
                )}

                {a.status === "PROPOSED_TO_CLIENT" && a.proposed && (
                  <div className="mt-4 rounded-xl border border-black/10 bg-cream-50 p-4">
                    <div className="text-sm font-semibold">
                      Admin proposal
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      Proposed:{" "}
                      <b>{a.proposed.date}</b> at{" "}
                      <b>{a.proposed.startTime}</b> –{" "}
                      <b>{a.proposed.endTime}</b>
                    </div>

                    <div className="mt-1 text-sm text-black/70">
                      Staff:{" "}
                      <b>
                        {a.proposed.staffId?.name || "Updated staff"}
                      </b>
                    </div>

                    {a.proposed.message && (
                      <div className="mt-2 text-sm text-black/70">
                        Message:{" "}
                        <span className="italic">
                          {a.proposed.message}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => accept(a._id)}>
                        Accept
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => reject(a._id)}
                      >
                        Reject
                      </Button>

                      <div className="flex-1 min-w-[220px]">
                        <InputField
                          placeholder="Optional message to admin..."
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
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "PENDING_ADMIN_REVIEW",
                    "PROPOSED_TO_CLIENT",
                    "CLIENT_REJECTED_PROPOSAL",
                    "CONFIRMED",
                  ].includes(a.status) && (
                    <Button
                      variant="danger"
                      onClick={() => cancel(a._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-sm text-black/60">
              No appointments yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
