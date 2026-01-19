import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { Card } from "../components/Card";
import Badge from "../components/Badge";

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
    <div>
      <h2 className="text-2xl font-extrabold">Services</h2>
      <p className="mt-1 text-sm text-black/60">Browse available services.</p>

      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or category..."
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hlgreen-600/30"
        />
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-black/60">Loading...</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <Card key={s._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">{s.name}</div>
                  <div className="mt-1 text-sm text-black/70">{s.description || "—"}</div>
                </div>
                <Badge tone="green">{s.durationMinutes} min</Badge>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-black/60">{s.category}</div>
                <div className="font-bold">{s.price} €</div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-black/60">No services found.</div>
          )}
        </div>
      )}
    </div>
  );
}
