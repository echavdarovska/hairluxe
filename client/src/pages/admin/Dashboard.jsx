import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  ListChecks,
  ArrowRight,
} from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";
import Badge from "../../components/Badge";
import { Card, CardBody } from "../../components/Card";

function tone(status) {
  if (status === "CONFIRMED") return "green";
  if (["DECLINED", "CANCELLED", "NO_SHOW"].includes(status)) return "red";
  if (status === "PROPOSED_TO_CLIENT") return "yellow";
  if (status === "PENDING_ADMIN_REVIEW") return "blue";
  return "gray";
}

function fmtTime(t) {
  return t || "—";
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/appointments");
        setAppointments(res.data.appointments || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const derived = useMemo(() => {
    const list = appointments || [];

    const todayItems = list
      .filter((a) => a.date === today)
      .sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));

    const pendingItems = list.filter((a) => a.status === "PENDING_ADMIN_REVIEW");
    const proposedItems = list.filter((a) => a.status === "PROPOSED_TO_CLIENT");
    const confirmedToday = todayItems.filter((a) => a.status === "CONFIRMED");
    const notConfirmedToday = todayItems.filter(
      (a) => !["CONFIRMED", "CANCELLED", "DECLINED", "NO_SHOW"].includes(a.status)
    );

    // quick status distribution (overall)
    const counts = {
      CONFIRMED: list.filter((a) => a.status === "CONFIRMED").length,
      PENDING_ADMIN_REVIEW: pendingItems.length,
      PROPOSED_TO_CLIENT: proposedItems.length,
      OTHER: list.filter(
        (a) =>
          !["CONFIRMED", "PENDING_ADMIN_REVIEW", "PROPOSED_TO_CLIENT"].includes(a.status)
      ).length,
    };
    const total = list.length || 1;
    const pct = (n) => Math.round((n / total) * 100);

    return {
      todayItems,
      pendingItems,
      proposedItems,
      confirmedToday,
      notConfirmedToday,
      counts,
      pct: {
        confirmed: pct(counts.CONFIRMED),
        pending: pct(counts.PENDING_ADMIN_REVIEW),
        proposed: pct(counts.PROPOSED_TO_CLIENT),
        other: pct(counts.OTHER),
      },
    };
  }, [appointments, today]);

  // ✅ Consistent admin shell already gives width; we just improve layout inside
  return (
    <AdminLayout>
      {/* Header */}
      <div className="rounded-3xl border border-black/5 bg-gradient-to-br from-cream-100 to-white p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-hlblack">Dashboard</h2>
            <p className="mt-1 text-sm text-black/60">
              Operational snapshot — what needs attention and what’s coming up today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/appointments?date=${today}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5"
            >
              <CalendarDays className="h-4 w-4" />
              Today
            </Link>

            <Link
              to={`/admin/appointments?status=PENDING_ADMIN_REVIEW`}
              className="inline-flex items-center gap-2 rounded-2xl bg-hlgreen-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              <ListChecks className="h-4 w-4" />
              Review queue
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black/60">Today</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <CalendarDays className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>
            <div className="mt-3 text-4xl font-extrabold text-hlblack">
              {derived.todayItems.length}
            </div>
            <div className="mt-2 text-xs text-black/55">
              Confirmed: <b>{derived.confirmedToday.length}</b> · Needs action:{" "}
              <b>{derived.notConfirmedToday.length}</b>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black/60">Pending review</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white ring-1 ring-black/5">
                <AlertTriangle className="h-5 w-5 text-black/60" />
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-4xl font-extrabold text-hlblack">
                {derived.pendingItems.length}
              </div>
              <Badge tone="blue">PENDING</Badge>
            </div>

            <div className="mt-3">
              <Link
                to={`/admin/appointments?status=PENDING_ADMIN_REVIEW`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-hlgreen-700 hover:underline"
              >
                Open pending list <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black/60">Proposed to client</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <Clock className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-4xl font-extrabold text-hlblack">
                {derived.proposedItems.length}
              </div>
              <Badge tone="yellow">PROPOSED</Badge>
            </div>

            <div className="mt-3">
              <Link
                to={`/admin/appointments?status=PROPOSED_TO_CLIENT`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-hlgreen-700 hover:underline"
              >
                View proposed list <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main grid: Today preview + Status health */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Today preview */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-hlblack">Today’s schedule</div>
                <div className="mt-1 text-xs text-black/60">
                  Next up (max 6). Keep it tight, keep it on-time.
                </div>
              </div>

              <Link
                to={`/admin/appointments?date=${today}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-5 text-sm text-black/60">Loading...</div>
            ) : derived.todayItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-black/5 bg-cream-100 p-4 text-sm text-black/70">
                No appointments for today ({today}). Enjoy the rare calm.
              </div>
            ) : (
              <div className="mt-5 grid gap-2">
                {derived.todayItems.slice(0, 6).map((a) => (
                  <div
                    key={a._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 text-sm font-extrabold text-hlgreen-700">
                        {String(a.startTime || "—").slice(0, 2) || "—"}
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-hlblack">
                          {a.serviceId?.name || "Service"}
                        </div>
                        <div className="mt-0.5 text-xs text-black/60">
                          {a.staffId?.name ? `Staff: ${a.staffId.name}` : "Staff: —"} ·{" "}
                          {fmtTime(a.startTime)}–{fmtTime(a.endTime)}
                        </div>
                      </div>
                    </div>

                    <Badge tone={tone(a.status)}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Status health */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-6">
            <div className="text-sm font-semibold text-hlblack">System health</div>
            <div className="mt-1 text-xs text-black/60">
              Quick distribution across all appointments.
            </div>

            <div className="mt-5 space-y-4">
              {/* simple progress bars (no charts needed) */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/60">Confirmed</span>
                  <span className="font-semibold text-hlblack">{derived.pct.confirmed}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-hlgreen-600"
                    style={{ width: `${derived.pct.confirmed}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/60">Pending</span>
                  <span className="font-semibold text-hlblack">{derived.pct.pending}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${derived.pct.pending}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/60">Proposed</span>
                  <span className="font-semibold text-hlblack">{derived.pct.proposed}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${derived.pct.proposed}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/60">Other</span>
                  <span className="font-semibold text-hlblack">{derived.pct.other}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-slate-500"
                    style={{ width: `${derived.pct.other}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 rounded-2xl border border-black/5 bg-cream-100 p-4 text-xs text-black/70">
                <span className="font-semibold text-hlblack">Focus:</span>{" "}
                Clear pending first, then proposals. That’s the throughput bottleneck.
              </div>

              <div className="grid gap-2">
                <Link
                  to={`/admin/appointments?status=PENDING_ADMIN_REVIEW`}
                  className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5"
                >
                  Pending queue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={`/admin/appointments?status=PROPOSED_TO_CLIENT`}
                  className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5"
                >
                  Proposed queue <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
