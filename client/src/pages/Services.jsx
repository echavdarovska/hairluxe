import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card } from "../components/Card";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import { Scissors, Paintbrush2, Sparkles, Wind } from "lucide-react";

function categoryMeta(category = "") {
  const c = String(category).toLowerCase();

  if (c.includes("color") || c.includes("colour") || c.includes("balayage") || c.includes("highlight"))
    return { label: category || "Color", icon: Paintbrush2, tone: "amber" };

  if (c.includes("treat") || c.includes("care") || c.includes("keratin") || c.includes("mask") || c.includes("repair"))
    return { label: category || "Treatment", icon: Sparkles, tone: "violet" };

  if (c.includes("style") || c.includes("blow") || c.includes("event") || c.includes("waves") || c.includes("curl"))
    return { label: category || "Styling", icon: Wind, tone: "sky" };

  return { label: category || "Hair", icon: Scissors, tone: "green" };
}

const PILL = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");
        setServices(res.data.services || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

 const filtered = useMemo(() => {
  const query = q.trim().toLowerCase();


  const activeServices = (services || []).filter((s) => s.active !== false);

  if (!query) return activeServices;

  return activeServices.filter((s) =>
    `${s.name || ""} ${s.category || ""} ${s.description || ""}`
      .toLowerCase()
      .includes(query)
  );
}, [services, q]);


  return (
    <div className="w-full flex justify-center">
      <div className="w-full px-4 sm:px-6 lg:w-[80vw] lg:max-w-[80vw] lg:min-w-[80vw] pb-24">
        <PageHeader
          title="Services"
          subtitle="Browse available services."
          actions={
            <div className="w-full sm:w-[360px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, category, or description..."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none shadow-sm
                           focus:ring-2 focus:ring-hlgreen-600/30"
              />
            </div>
          }
        />

        {loading ? (
          <div className="mt-6 text-sm text-black/60">Loading...</div>
        ) : (
          <>
            {/* Optional summary row */}
            <div className="mt-4 flex items-center justify-between text-xs text-black/50">
              <div>
                Showing <span className="font-semibold text-black/70">{filtered.length}</span>{" "}
                service{filtered.length === 1 ? "" : "s"}
              </div>
              {q.trim() ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="font-semibold text-hlgreen-700 hover:underline"
                >
                  Clear search
                </button>
              ) : (
                <span />
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const meta = categoryMeta(s.category);
                const Icon = meta.icon;

                return (
                  <Link
                    key={s._id}
                    to={`/book?service=${encodeURIComponent(s._id)}`}
                    className="block"
                    title={`Book: ${s.name}`}
                  >
                    <Card
                      className="group h-full overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition
                                 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-hlgreen-600/30"
                    >
                      {/* Header strip instead of picture */}
                      <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-gradient-to-b from-black/[0.02] to-transparent px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            PILL[meta.tone] || PILL.green
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {meta.label}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/70 ring-1 ring-black/10">
                          <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                          {s.durationMinutes} min
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-lg font-extrabold text-hlblack">
                              {s.name}
                            </div>

                            <div className="mt-1 text-sm text-black/70 line-clamp-3">
                              {s.description || "No description provided yet."}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xs font-semibold text-black/45">Price</div>
                            <div className="mt-0.5 text-lg font-extrabold text-hlblack">
                              {s.price} €
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Badge tone="green">Available</Badge>

                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-hlgreen-700">
                            <span className="opacity-80">Book</span>
                            <span className="transition group-hover:translate-x-0.5">→</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-sm text-black/60">No services found.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
