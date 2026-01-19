import  { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Badge from "../../components/Badge";
import { Card, CardBody } from "../../components/Card";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get("/appointments");
      setAppointments(res.data.appointments || []);
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const todayItems = appointments.filter((a) => a.date === today);
    const pending = appointments.filter(
      (a) => a.status === "PENDING_ADMIN_REVIEW"
    ).length;
    const proposed = appointments.filter(
      (a) => a.status === "PROPOSED_TO_CLIENT"
    ).length;

    return {
      todayTotal: todayItems.length,
      pending,
      proposed,
    };
  }, [appointments, today]);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-hlblack">Dashboard</h2>
      <p className="mt-1 text-sm text-black/60">Quick overview.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-sm text-black/60">Today</div>
            <div className="mt-2 text-3xl font-extrabold">
              {metrics.todayTotal}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-black/60">Pending review</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-3xl font-extrabold">
                {metrics.pending}
              </div>
              <Badge tone="blue">PENDING</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-black/60">
              Proposed to client
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-3xl font-extrabold">
                {metrics.proposed}
              </div>
              <Badge tone="yellow">PROPOSED</Badge>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
