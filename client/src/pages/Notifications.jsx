import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

import Button from "../components/Button";
import Badge from "../components/Badge";
import { Card, CardBody } from "../components/Card";
import PageHeader from "../components/PageHeader";

function isUnread(n) {
  const isReadRaw = n?.isRead ?? n?.is_read;
  const hasReadAt = !!(n?.readAt ?? n?.read_at);

  if (hasReadAt) return false;

  if (typeof isReadRaw === "boolean") return !isReadRaw;
  if (typeof isReadRaw === "number") return isReadRaw === 0;
  if (typeof isReadRaw === "string") return isReadRaw === "0" || isReadRaw.toLowerCase() === "false";

  return true; 
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setItems(res.data.notifications || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      window.dispatchEvent(new Event("notifications:updated")); 
      await load();
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  }

  async function markAll() {
    try {
      await api.patch("/notifications/read-all");
      window.dispatchEvent(new Event("notifications:updated"));
      await load();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all");
    }
  }

  return (

    <div className="w-full flex justify-center">
      <div className="w-full px-4 sm:px-6 lg:w-[80vw] lg:max-w-[80vw] lg:min-w-[80vw] pb-24">
        <PageHeader
          title="Notifications"
          subtitle="In-app updates for appointment actions."
          meta={
            unreadCount > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
                  Unread: {unreadCount}
                </span>
              </span>
            ) : (
              <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-black/60">
                All caught up
              </span>
            )
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-black/5 transition"
                onClick={load}
                title="Refresh"
              >
                Refresh
              </button>

              {items.length > 0 ? (
                <Button variant="outline" onClick={markAll}>
                  Mark all read
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? (
          <div className="mt-6 flex items-center justify-between rounded-3xl border border-black/5 bg-white p-6">
            <div className="text-sm font-semibold text-black/70">Loading notifications…</div>
            <div className="h-2 w-44 overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-1/2 animate-pulse bg-black/20" />
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {items.map((n) => {
              const unread = isUnread(n);

              return (
                <Card
                  key={n._id}
                  className={[
                    "rounded-3xl transition overflow-hidden",
                    unread ? "border border-black/10 shadow-sm" : "border border-black/5",
                  ].join(" ")}
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-base font-extrabold text-hlblack">
                            {n.title}
                          </div>
                          {unread ? (
                            <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                          ) : null}
                        </div>

                        {n.message ? (
                          <div className="mt-1 text-sm text-black/70">
                            {n.message}
                          </div>
                        ) : null}

                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-black/50">
                          <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>

                          {n.type ? (
                            <span className="rounded-full bg-cream-100 px-2 py-1 font-semibold text-black/60">
                              {String(n.type).replaceAll("_", " ").toLowerCase()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {unread ? <Badge tone="yellow">NEW</Badge> : <Badge tone="gray">Read</Badge>}

                        {unread ? (
                          <Button size="sm" variant="ghost" onClick={() => markRead(n._id)}>
                            Mark read
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            {items.length === 0 && (
              <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
                <div className="text-lg font-extrabold text-hlblack">No notifications</div>
                <div className="mt-2 text-sm text-black/60">
                  You’ll see updates here when appointments are confirmed, proposed, or changed.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
