import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card } from "../components/Card";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";

function pickServiceImage(service) {
  const key = `${service?.name || ""} ${service?.category || ""}`.toLowerCase();

  const map = [
    {
      match: ["cut", "haircut", "trim", "classic"],
      url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
    },
    {
      match: ["color", "tone", "balayage", "highlights", "blonde", "ombre"],
      url: "https://images.unsplash.com/photo-1520975958225-89e6b42f6a4b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      match: ["blowout", "styling", "style", "waves", "curl", "event"],
      url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      match: ["treatment", "mask", "repair", "hydration", "keratin", "care"],
      url: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  for (const row of map) {
    if (row.match.some((m) => key.includes(m))) return row.url;
  }

  return "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80";
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data.services || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) =>
      (s.name + " " + s.category).toLowerCase().includes(q.toLowerCase())
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
        placeholder="Search by name or category..."
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none shadow-sm
                   focus:ring-2 focus:ring-hlgreen-600/30"
      />
    </div>
  }
/>

        {loading ? (
          <div className="mt-6 text-sm text-black/60">Loading...</div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const img = pickServiceImage(s);

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
                    {/* Image header */}
                    <div className="relative h-40 w-full">
                      <img
                        src={img}
                        alt={s.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                      <div className="absolute right-4 top-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black shadow-sm ring-1 ring-black/5">
                          <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                          {s.durationMinutes} min
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black/80 shadow-sm ring-1 ring-black/5">
                          {s.category || "Service"}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-extrabold text-hlblack">
                            {s.name}
                          </div>
                          <div className="mt-1 text-sm text-black/70 line-clamp-2">
                            {s.description || "—"}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs font-semibold text-black/50">Price</div>
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
        )}
      </div>
    </div>
  );
}
