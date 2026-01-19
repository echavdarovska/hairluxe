import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Power,
} from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import { Card, CardBody } from "../../components/Card";

const SPECIALTY_OPTIONS = [
  { value: "Haircut", label: "Haircut" },
  { value: "Coloring", label: "Coloring" },
  { value: "Styling", label: "Styling" },
  { value: "Treatment", label: "Treatment" },
  { value: "Extensions", label: "Extensions" },
  { value: "General", label: "General" },
];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  // edit mode
  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "10",
    durationMinutes: "30",
    specialty: "Haircut",
    active: "true",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "10",
    durationMinutes: "30",
    specialty: "Haircut",
    active: "true",
  });

  async function load() {
    const res = await api.get("/services");
    setServices(res.data.services || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return services;

    return services.filter((s) => {
      const specialty = s.specialty ?? s.category ?? "General";
      return `${s.name} ${specialty}`.toLowerCase().includes(qq);
    });
  }, [services, q]);

  function validateServicePayload(payload) {
    if (!payload.name) return toast.error("Name is required"), false;
    if (!payload.specialty) return toast.error("Specialty is required"), false;

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
      specialty: String(form.specialty || "General").trim(),
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
        specialty: "Haircut",
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

      // if editing same record, keep the edit form's status in sync
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
    const specialty = s.specialty ?? s.category ?? "General";
    setEditingId(s._id);
    setEditForm({
      name: String(s.name ?? ""),
      description: String(s.description ?? ""),
      price: String(s.price ?? 0),
      durationMinutes: String(s.durationMinutes ?? 30),
      specialty: String(specialty || "General"),
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
      specialty: String(editForm.specialty || "General").trim(),
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

  return (
    <AdminLayout>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hlblack">Services</h2>
          <p className="mt-1 text-sm text-black/60">
            Create and manage services.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* CREATE SERVICE */}
        <Card>
          <CardBody>
            <div className="text-sm font-semibold">Create service</div>

            <form className="mt-4 space-y-3" onSubmit={create}>
              <InputField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <Select
                label="Specialty"
                value={form.specialty}
                onChange={(e) =>
                  setForm((p) => ({ ...p, specialty: e.target.value }))
                }
                options={SPECIALTY_OPTIONS}
              />

              <InputField
                label="Description"
                hint="Optional"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
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

              <Button
                type="submit"
                className="w-full"
                loading={saving}
                disabled={saving}
              >
                Create
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ALL SERVICES */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">All services</div>

              <InputField
                className="max-w-[220px]"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
              {filtered.map((s) => {
                const specialty = s.specialty ?? s.category ?? "General";
                const isEditing = editingId === s._id;

                return (
                  <div
                    key={s._id}
                    className={`rounded-xl border bg-cream-50 p-3 ${
                      isEditing ? "border-hlgreen-600/30 ring-2 ring-hlgreen-600/10" : "border-black/10"
                    }`}
                  >
                    {/* HEADER ROW */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-hlblack truncate">
                            {s.name}
                          </div>

                          {s.active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-hlgreen-600/10 px-2 py-0.5 text-[11px] font-semibold text-hlgreen-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/60">
                              <XCircle className="h-3.5 w-3.5" />
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-black/60">
                          {specialty} • {s.durationMinutes} min • {s.price} €
                        </div>

                        {s.description ? (
                          <div className="mt-2 text-sm text-black/70">
                            {s.description}
                          </div>
                        ) : null}
                      </div>

                      {/* ACTIONS (ROW) */}
                      {!isEditing ? (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(s)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                         
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(s)}
                            className="gap-2"
                          >
                            <Power className="h-4 w-4" />
                            {s.active ? "Disable" : "Enable"}
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => del(s._id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                       
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
                        
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* EDIT PANEL */}
                    {isEditing ? (
                      <div className="mt-4 rounded-xl border border-black/10 bg-white p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField
                            label="Name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, name: e.target.value }))
                            }
                            required
                          />

                          <Select
                            label="Specialty"
                            value={editForm.specialty}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                specialty: e.target.value,
                              }))
                            }
                            options={SPECIALTY_OPTIONS}
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
