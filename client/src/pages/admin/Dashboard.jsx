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

function labelize(status) {
  if (!status) return "—";
  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
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
      .sort((a, b) =>
        String(a.startTime || "").localeCompare(String(b.startTime || ""))
      );

    const pendingItems = list.filter((a) => a.status === "PENDING_ADMIN_REVIEW");
    const proposedItems = list.filter((a) => a.status === "PROPOSED_TO_CLIENT");
    const confirmedToday = todayItems.filter((a) => a.status === "CONFIRMED");
    const notConfirmedToday = todayItems.filter(
      (a) => !["CONFIRMED", "CANCELLED", "DECLINED", "NO_SHOW"].includes(a.status)
    );

    const total = list.length || 0;
    const totalSafe = total || 1;

    const byStatus = list.reduce((acc, a) => {
      const s = a.status || "UNKNOWN";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const get = (key) => byStatus[key] || 0;

    const counts = {
      CONFIRMED: get("CONFIRMED"),
      PENDING_ADMIN_REVIEW: get("PENDING_ADMIN_REVIEW"),
      PROPOSED_TO_CLIENT: get("PROPOSED_TO_CLIENT"),
      COMPLETED: get("COMPLETED"),
      CANCELLED: get("CANCELLED"),
      DECLINED: get("DECLINED"),
      NO_SHOW: get("NO_SHOW"),
      OTHER:
        total -
        (get("CONFIRMED") +
          get("PENDING_ADMIN_REVIEW") +
          get("PROPOSED_TO_CLIENT") +
          get("COMPLETED") +
          get("CANCELLED") +
          get("DECLINED") +
          get("NO_SHOW")),
    };

    const pct = (n) => Math.round((n / totalSafe) * 100);

    const inFlight =
      counts.PENDING_ADMIN_REVIEW + counts.PROPOSED_TO_CLIENT + counts.OTHER;
    const closedOut =
      counts.CONFIRMED +
      counts.COMPLETED +
      counts.CANCELLED +
      counts.DECLINED +
      counts.NO_SHOW;

    const mixRows = [
      {
        key: "CONFIRMED",
        label: "Confirmed",
        tone: "green",
        count: counts.CONFIRMED,
        pct: pct(counts.CONFIRMED),
      },
      {
        key: "PENDING_ADMIN_REVIEW",
        label: "Pending review",
        tone: "blue",
        count: counts.PENDING_ADMIN_REVIEW,
        pct: pct(counts.PENDING_ADMIN_REVIEW),
      },
      {
        key: "PROPOSED_TO_CLIENT",
        label: "Proposed",
        tone: "yellow",
        count: counts.PROPOSED_TO_CLIENT,
        pct: pct(counts.PROPOSED_TO_CLIENT),
      },
      {
        key: "COMPLETED",
        label: "Completed",
        tone: "gray",
        count: counts.COMPLETED,
        pct: pct(counts.COMPLETED),
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
        tone: "red",
        count: counts.CANCELLED,
        pct: pct(counts.CANCELLED),
      },
      {
        key: "DECLINED",
        label: "Declined",
        tone: "red",
        count: counts.DECLINED,
        pct: pct(counts.DECLINED),
      },
      {
        key: "NO_SHOW",
        label: "No show",
        tone: "red",
        count: counts.NO_SHOW,
        pct: pct(counts.NO_SHOW),
      },
      {
        key: "OTHER",
        label: "Other",
        tone: "gray",
        count: Math.max(0, counts.OTHER),
        pct: pct(Math.max(0, counts.OTHER)),
      },
    ];

    mixRows.sort((a, b) => b.count - a.count);

    return {
      todayItems,
      pendingItems,
      proposedItems,
      confirmedToday,
      notConfirmedToday,
      total,
      byStatus,
      counts,
      mixRows,
      inFlight,
      closedOut,
      inFlightPct: pct(inFlight),
      closedOutPct: pct(closedOut),
    };
  }, [appointments, today]);

  return (
    <AdminLayout>

      <div className="rounded-3xl border border-black/5 bg-gradient-to-br from-cream-100 to-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-hlblack sm:text-3xl">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Operational snapshot — what needs attention and what’s coming up
              today.
            </p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-2">
            <Link
              to={`/admin/appointments?date=${today}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5 md:w-auto"
            >
              <CalendarDays className="h-4 w-4" />
              Today
            </Link>

            <Link
              to={`/admin/appointments?status=PENDING_ADMIN_REVIEW`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-hlgreen-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 md:w-auto"
            >
              <ListChecks className="h-4 w-4" />
              Review queue
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-5 sm:p-6">
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
          <CardBody className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black/60">
                Pending review
              </div>
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

        <Card className="rounded-3xl border border-black/5 sm:col-span-2 lg:col-span-1">
          <CardBody className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black/60">
                Proposed to client
              </div>
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

      <div className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-[1fr_380px]">
        {/* Today preview */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-hlblack">
                  Today’s schedule
                </div>
                <div className="mt-1 text-xs text-black/60">
                  Next up (max 6). Keep it tight, keep it on-time.
                </div>
              </div>

              <Link
                to={`/admin/appointments?date=${today}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:bg-black/5 sm:w-auto"
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
                    className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-[11px] font-extrabold text-hlgreen-700 sm:text-sm">
                        {String(a.startTime || "—")}
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-hlblack">
                          {a.serviceId?.name || "Service"}
                        </div>
                        <div className="mt-0.5 text-xs text-black/60">
                          {a.staffId?.name ? `Staff: ${a.staffId.name}` : "Staff: —"}{" "}
                          <span className="mx-1">·</span>
                          {fmtTime(a.startTime)}–{fmtTime(a.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end sm:block">
                      <Badge tone={tone(a.status)}>{labelize(a.status)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Workflow mix */}
        <Card className="rounded-3xl border border-black/5">
          <CardBody className="p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-hlblack">
                  Workflow mix
                </div>
                <div className="mt-1 text-xs text-black/60">
                  Volume split by status (counts + share). Use this to manage
                  throughput.
                </div>
              </div>

              <Link
                to={`/admin/appointments`}
                className="text-xs font-semibold text-hlgreen-700 hover:underline"
              >
                Open list →
              </Link>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-cream-100 p-3">
                <div className="text-[11px] font-semibold text-black/60">
                  Total
                </div>
                <div className="mt-1 text-lg font-extrabold text-hlblack">
                  {derived.total}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-3">
                <div className="text-[11px] font-semibold text-black/60">
                  In-flight
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-lg font-extrabold text-hlblack">
                    {derived.inFlight}
                  </div>
                  <div className="text-[11px] font-semibold text-black/60">
                    {derived.inFlightPct}%
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-3">
                <div className="text-[11px] font-semibold text-black/60">
                  Closed out
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-lg font-extrabold text-hlblack">
                    {derived.closedOut}
                  </div>
                  <div className="text-[11px] font-semibold text-black/60">
                    {derived.closedOutPct}%
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-5 text-sm text-black/60">Loading...</div>
            ) : derived.total === 0 ? (
              <div className="mt-5 rounded-2xl border border-black/5 bg-cream-100 p-4 text-xs text-black/70">
                No appointments in the system yet. Once bookings start, this
                panel becomes your control tower.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {derived.mixRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-2xl border border-black/5 bg-white p-3"
                  >
                 
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-xs font-extrabold text-hlblack">
                            {row.label}
                          </div>
                          <Badge tone={row.tone}>{row.count}</Badge>
                        </div>
                        <div className="mt-0.5 text-[11px] text-black/60">
                          Share of total:{" "}
                          <span className="font-semibold text-hlblack">
                            {row.pct}%
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-black/60">
                        {row.count}/{derived.total}
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-black/10">
                      <div
                        className="h-2 rounded-full bg-hlgreen-600"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
