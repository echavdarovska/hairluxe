import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Power,
  Search,
  Plus,
} from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import { Card, CardBody } from "../../components/Card";
import PageHeader from "../../components/PageHeader";

function tonePill(active) {
  return active
    ? "bg-hlgreen-600/10 text-hlgreen-700 ring-1 ring-hlgreen-600/15"
    : "bg-black/5 text-black/60 ring-1 ring-black/10";
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "10",
    durationMinutes: "30",
    active: "true",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "10",
    durationMinutes: "30",
    active: "true",
  });

  const load = useCallback(async () => {
    const res = await api.get("/services");
    setServices(res.data.services || []);
  }, []);

  useEffect(() => {
    load().catch(() => toast.error("Failed to load services"));
  }, [load]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return services;

    return services.filter((s) => {
      return `${s.name} ${s.description || ""}`.toLowerCase().includes(qq);
    });
  }, [services, q]);

  const metrics = useMemo(() => {
    const active = services.filter((s) => s.active).length;
    const inactive = services.length - active;
    return { total: services.length, active, inactive };
  }, [services]);

  function validateServicePayload(payload) {
    if (!payload.name) return toast.error("Name is required"), false;

    if (!Number.isFinite(payload.price) || payload.price < 0)
      return toast.error("Price must be a valid number"), false;

    if (!Number.isFinite(payload.durationMinutes) || payload.durationMinutes < 15)
      return toast.error("Duration must be at least 15 minutes"), false;

    return true;
  }

  async function create(e) {
    e.preventDefault();

    const payload = {
      name: String(form.name || "").trim(),
      description: String(form.description || "").trim(),
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      active: form.active === "true",
    };

    if (!validateServicePayload(payload)) return;

    try {
      setSaving(true);
      await api.post("/services", payload);
      toast.success("Service created");

      setForm({
        name: "",
        description: "",
        price: "10",
        durationMinutes: "30",
        active: "true",
      });

      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s) {
    try {
      await api.put(`/services/${s._id}`, { active: !s.active });
      await load();

      if (editingId === s._id) {
        setEditForm((p) => ({ ...p, active: String(!s.active) }));
      }
    } catch {
      toast.error("Failed");
    }
  }

  async function del(id) {
    if (!confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success("Deleted");
      if (editingId === id) setEditingId(null);
      await load();
    } catch {
      toast.error("Failed");
    }
  }

  function startEdit(s) {
    setEditingId(s._id);
    setEditForm({
      name: String(s.name ?? ""),
      description: String(s.description ?? ""),
      price: String(s.price ?? 0),
      durationMinutes: String(s.durationMinutes ?? 30),
      active: String(!!s.active),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setSavingEdit(false);
  }

  async function saveEdit(id) {
    const payload = {
      name: String(editForm.name || "").trim(),
      description: String(editForm.description || "").trim(),
      price: Number(editForm.price),
      durationMinutes: Number(editForm.durationMinutes),
      active: editForm.active === "true",
    };

    if (!validateServicePayload(payload)) return;

    try {
      setSavingEdit(true);
      await api.put(`/services/${id}`, payload);
      toast.success("Service updated");
      setEditingId(null);
      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  }

  const headerActions = (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <div className="relative w-full sm:w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services..."
          className="w-full rounded-2xl border border-black/10 bg-white px-10 py-2.5 text-sm outline-none shadow-sm focus:ring-2 focus:ring-hlgreen-600/30"
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Services"
        subtitle="Create, edit and enable/disable services that appear in booking."
        actions={headerActions}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-black/60 ring-1 ring-black/5">
          Total: <span className="text-hlblack">{metrics.total}</span>
        </span>
        <span className="rounded-full bg-hlgreen-600/10 px-3 py-1 font-semibold text-hlgreen-700 ring-1 ring-hlgreen-600/15">
          Active: <span className="text-hlgreen-800">{metrics.active}</span>
        </span>
        <span className="rounded-full bg-black/5 px-3 py-1 font-semibold text-black/60 ring-1 ring-black/10">
          Inactive: <span className="text-hlblack">{metrics.inactive}</span>
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[420px_1fr]">
        {/* CREATE */}
        <Card className="rounded-3xl">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-hlblack">Create service</div>
                <div className="mt-1 text-xs text-black/60">
                  Active services show up for booking.
                </div>
              </div>

              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <Plus className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>

            <form className="mt-5 space-y-3" onSubmit={create}>
              <InputField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <InputField
                label="Description"
                hint="Optional"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                inputClassName="min-h-[44px]"
              />

              <div className="grid grid-cols-2 gap-2">
                <InputField
                  label="Price (€)"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />

                <InputField
                  label="Duration (min)"
                  type="number"
                  min="15"
                  step="5"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, durationMinutes: e.target.value }))
                  }
                />
              </div>

              <Select
                label="Status"
                value={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
              />

              <Button type="submit" className="w-full" loading={saving} disabled={saving}>
                Create
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* LIST */}
        <Card className="rounded-3xl">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-hlblack">All services</div>
              <div className="text-xs text-black/50">{filtered.length} shown</div>
            </div>

            <div className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
              {filtered.map((s) => {
                const isEditing = editingId === s._id;

                return (
                  <div
                    key={s._id}
                    className={[
                      "rounded-3xl border p-4 shadow-sm transition",
                      isEditing
                        ? "border-hlgreen-600/30 bg-hlgreen-600/5 ring-2 ring-hlgreen-600/10"
                        : "border-black/10 bg-white hover:bg-cream-50",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-base font-semibold text-hlblack">
                            {s.name}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tonePill(
                              !!s.active
                            )}`}
                          >
                            {s.active ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                Inactive
                              </>
                            )}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-black/60">
                          {s.durationMinutes} min • {s.price} €
                        </div>

                        {s.description ? (
                          <div className="mt-2 text-sm text-black/70">{s.description}</div>
                        ) : null}
                      </div>

                      {!isEditing ? (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(s)}
                            className="gap-2"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(s)}
                            className="gap-2"
                            title="Enable/Disable"
                          >
                            <Power className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {s.active ? "Disable" : "Enable"}
                            </span>
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => del(s._id)}
                            className="gap-2"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(s._id)}
                            loading={savingEdit}
                            disabled={savingEdit}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-4 rounded-3xl border border-black/10 bg-white p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField
                            label="Name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, name: e.target.value }))
                            }
                            required
                          />

                          <InputField
                            label="Price (€)"
                            type="number"
                            min="0"
                            step="1"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, price: e.target.value }))
                            }
                          />

                          <InputField
                            label="Duration (min)"
                            type="number"
                            min="15"
                            step="5"
                            value={editForm.durationMinutes}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                durationMinutes: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <InputField
                            label="Description"
                            hint="Optional"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            inputClassName="min-h-[44px]"
                          />

                          <Select
                            label="Status"
                            value={editForm.active}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, active: e.target.value }))
                            }
                            options={[
                              { value: "true", label: "Active" },
                              { value: "false", label: "Inactive" },
                            ]}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-sm text-black/60">No services.</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
