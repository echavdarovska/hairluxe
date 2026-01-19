import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

import Button from "../components/Button";
import Badge from "../components/Badge";
import { Card, CardBody } from "../components/Card";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get("/notifications");
    setItems(res.data.notifications || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await load();
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  }

  async function markAll() {
    try {
      await api.patch("/notifications/read-all");
      await load();
    } catch (e) {
      toast.error("Failed to mark all");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-hlblack">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-black/60">
            In-app updates for appointment actions.
          </p>
        </div>

        {items.length > 0 && (
          <Button variant="outline" onClick={markAll}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-black/60">Loading...</div>
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((n) => (
            <Card key={n._id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="mt-1 text-sm text-black/70">
                      {n.message}
                    </div>
                    <div className="mt-2 text-xs text-black/50">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {!n.isRead ? (
                      <Badge tone="yellow">NEW</Badge>
                    ) : (
                      <Badge tone="gray">Read</Badge>
                    )}

                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markRead(n._id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-sm text-black/60">
              No notifications.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
