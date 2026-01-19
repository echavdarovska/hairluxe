import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  Power,
  Save,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import { Card, CardBody } from "../../components/Card";

export default function StaffAdmin() {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");

  const [saving, setSaving] = useState(false);
  const [svcQ, setSvcQ] = useState("");

  // expand/collapse per staff card (to show full specialty names)
  const [expandedStaff, setExpandedStaff] = useState(() => new Set());

  // CREATE FORM
  const [form, setForm] = useState({
    name: "",
    active: "true",
    specialties: [],
  });

  // EDIT MODE
  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSvcQ, setEditSvcQ] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    active: "true",
    specialties: [],
  });

  async function load() {
    try {
      const [stRes, sRes] = await Promise.all([
        api.get("/staff"),
        api.get("/services"),
      ]);
      setStaff(stRes.data.staff || []);
      setServices(sRes.data.services || []);
    } catch {
      toast.error("Failed to load staff/services");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Backward-compatible (old data may still have category)
  const serviceSpecialty = (s) => s.specialty ?? s.category ?? "General";

  const serviceById = useMemo(() => {
    const map = new Map();
    services.forEach((s) => map.set(String(s._id), s));
    return map;
  }, [services]);

  const filteredStaff = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return staff;
    return staff.filter((s) =>
      String(s.name || "").toLowerCase().includes(qq)
    );
  }, [staff, q]);

  // Only active services are selectable specialties
  const selectableServices = useMemo(() => {
    return services.filter((s) => s.active !== false);
  }, [services]);

  const filteredServices = useMemo(() => {
    const qq = svcQ.trim().toLowerCase();
    if (!qq) return selectableServices;
    return selectableServices.filter((s) => {
      const sp = serviceSpecialty(s);
      return `${s.name} ${sp}`.toLowerCase().includes(qq);
    });
  }, [selectableServices, svcQ]);

  const filteredEditServices = useMemo(() => {
    const qq = editSvcQ.trim().toLowerCase();
    if (!qq) return selectableServices;
    return selectableServices.filter((s) => {
      const sp = serviceSpecialty(s);
      return `${s.name} ${sp}`.toLowerCase().includes(qq);
    });
  }, [selectableServices, editSvcQ]);

  const toggleSpecialty = (serviceId) => {
    const id = String(serviceId);
    setForm((p) => {
      const has = p.specialties.includes(id);
      return {
        ...p,
        specialties: has
          ? p.specialties.filter((x) => x !== id)
          : [...p.specialties, id],
      };
    });
  };

  const toggleEditSpecialty = (serviceId) => {
    const id = String(serviceId);
    setEditForm((p) => {
      const has = p.specialties.includes(id);
      return {
        ...p,
        specialties: has
          ? p.specialties.filter((x) => x !== id)
          : [...p.specialties, id],
      };
    });
  };

  function normalizeSpecialties(input) {
    const list = Array.isArray(input) ? input : [];
    // accept populated objects or id strings
    return list
      .map((x) => {
        if (!x) return null;
        if (typeof x === "object") return String(x._id || "");
        return String(x);
      })
      .filter(Boolean);
  }

  async function create(e) {
    e.preventDefault();

    const specialties = normalizeSpecialties(form.specialties).filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id)
    );

    const payload = {
      name: String(form.name || "").trim(),
      active: form.active === "true",
      specialties,
    };

    if (!payload.name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/staff", payload);
      toast.success("Staff created");

      setForm({ name: "", active: "true", specialties: [] });
      setSvcQ("");
      await load();
    } catch (e2) {
      const data = e2?.response?.data;
      const msg =
        data?.message ||
        (Array.isArray(data?.issues)
          ? data.issues.map((i) => i.message).join(", ")
          : null) ||
        (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
        e2?.message ||
        "Failed";

      console.log("CREATE STAFF ERROR:", e2?.response?.status, data);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s) {
    try {
      await api.put(`/staff/${s._id}`, { active: !s.active });
      await load();
      if (editingId === String(s._id)) {
        setEditForm((p) => ({ ...p, active: String(!s.active) }));
      }
    } catch {
      toast.error("Failed");
    }
  }

  async function del(id) {
    if (!confirm("Delete this staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Deleted");
      if (editingId === String(id)) cancelEdit();
      await load();
    } catch {
      toast.error("Failed");
    }
  }

  function startEdit(st) {
    setEditingId(String(st._id));
    setEditSvcQ("");
    setEditForm({
      name: String(st.name ?? ""),
      active: String(!!st.active),
      specialties: normalizeSpecialties(st.specialties),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setSavingEdit(false);
    setEditSvcQ("");
  }

  async function saveEdit(id) {
    const specialties = normalizeSpecialties(editForm.specialties).filter((x) =>
      /^[0-9a-fA-F]{24}$/.test(x)
    );

    const payload = {
      name: String(editForm.name || "").trim(),
      active: editForm.active === "true",
      specialties,
    };

    if (!payload.name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSavingEdit(true);
      await api.put(`/staff/${id}`, payload);
      toast.success("Staff updated");
      setEditingId(null);
      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  }

  // Convert specialties to pretty chips (handles ids or populated objects)
  const staffSpecialties = (st) => {
    const list = Array.isArray(st.specialties) ? st.specialties : [];
    return list
      .map((x) => {
        if (!x) return null;

        // populated object
        if (typeof x === "object") {
          const name = x.name;
          const sp = serviceSpecialty(x);
          if (!name) return null;
          return { key: String(x._id || name), name, specialty: sp };
        }

        // id string
        const svc = serviceById.get(String(x));
        if (!svc) return null;
        return {
          key: String(svc._id),
          name: svc.name,
          specialty: serviceSpecialty(svc),
        };
      })
      .filter(Boolean);
  };

  // little tone system so chips look nicer than plain grey blobs
  const toneFor = (specialty) => {
    const s = String(specialty || "").toLowerCase();
    if (s.includes("color"))
      return "bg-amber-50 text-amber-800 border-amber-200";
    if (s.includes("haircut") || s.includes("cut"))
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (s.includes("curl"))
      return "bg-violet-50 text-violet-800 border-violet-200";
    if (s.includes("extension"))
      return "bg-sky-50 text-sky-800 border-sky-200";
    if (s.includes("treat"))
      return "bg-teal-50 text-teal-800 border-teal-200";
    if (s.includes("styl"))
      return "bg-rose-50 text-rose-800 border-rose-200";
    return "bg-slate-50 text-slate-800 border-slate-200";
  };

  const toggleExpandStaff = (id) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chipText = (c) => `${c.name} • ${c.specialty}`;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-hlblack">Staff</h2>
      <p className="mt-1 text-sm text-black/60">Create and manage staff.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* CREATE STAFF */}
        <Card>
          <CardBody>
            <div className="text-sm font-semibold">Create staff</div>

            <form className="mt-4 space-y-3" onSubmit={create}>
              <InputField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <Select
                label="Status"
                value={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </Select>

              {/* Specialties picker */}
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-hlblack">
                      Specialties
                    </div>
                    <div className="text-xs text-black/60">
                      Pick which services this staff member can perform.
                    </div>
                  </div>

                  <InputField
                    className="max-w-[220px]"
                    placeholder="Search services..."
                    value={svcQ}
                    onChange={(e) => setSvcQ(e.target.value)}
                  />
                </div>

                <div className="mt-3 max-h-[260px] overflow-auto pr-1 space-y-2">
                  {filteredServices.map((s) => {
                    const id = String(s._id);
                    const checked = form.specialties.includes(id);

                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/10 bg-cream-50 px-3 py-2 hover:bg-cream-100"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-hlblack truncate">
                            {s.name}
                          </div>
                          <div className="text-xs text-black/60">
                            {serviceSpecialty(s)} • {s.durationMinutes} min •{" "}
                            {s.price} €
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSpecialty(id)}
                          className="h-4 w-4 accent-hlgreen-600"
                        />
                      </label>
                    );
                  })}

                  {filteredServices.length === 0 ? (
                    <div className="text-sm text-black/60">
                      No services found.
                    </div>
                  ) : null}
                </div>

                {form.specialties.length ? (
                  <div className="mt-3">
                    <div className="text-xs text-black/60">Selected</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.specialties
                        .map((id) => serviceById.get(String(id)))
                        .filter(Boolean)
                        .slice(0, 10)
                        .map((svc) => {
                          const sp = serviceSpecialty(svc);
                          return (
                            <span
                              key={`sel-${svc._id}`}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] leading-4 ${toneFor(
                                sp
                              )}`}
                              title={`${svc.name} (${sp})`}
                            >
                              <span className="font-semibold">{svc.name}</span>
                              <span className="opacity-70">• {sp}</span>
                            </span>
                          );
                        })}

                      {form.specialties.length > 10 ? (
                        <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/60">
                          +{form.specialties.length - 10} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={saving} loading={saving}>
                Create
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ALL STAFF */}
        <Card>
          <CardBody>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">All staff</div>
                <div className="mt-0.5 text-xs text-black/50">
                  {filteredStaff.length} total
                </div>
              </div>

              <InputField
                className="max-w-[240px]"
                placeholder="Search staff..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-3 max-h-[560px] overflow-auto pr-1">
              {filteredStaff.map((s) => {
                const id = String(s._id);
                const chips = staffSpecialties(s);
                const isExpanded = expandedStaff.has(id);
                const isEditing = editingId === id;

                const visibleCount = isExpanded ? chips.length : 4;
                const extra = Math.max(0, chips.length - visibleCount);

                return (
                  <div
                    key={id}
                    className={`rounded-2xl border bg-white p-3 shadow-sm ${
                      isEditing
                        ? "border-hlgreen-600/30 ring-2 ring-hlgreen-600/10"
                        : "border-black/10"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-hlblack truncate">{s.name}</div>

                          {s.active ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            
                              Disabled
                            </span>
                          )}

                          {chips.length ? (
                            <span className="text-[11px] text-black/50">
                              • {chips.length} specialties
                            </span>
                          ) : null}
                        </div>

                        {/* chips (read mode) */}
                        {!isEditing ? (
                          <div className="mt-2">
                            {chips.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {chips.slice(0, visibleCount).map((c) => (
                                  <span
                                    key={`${id}-${c.key}`}
                                    className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] leading-4 ${toneFor(
                                      c.specialty
                                    )}`}
                                    title={chipText(c)}
                                  >
                                    <span className="whitespace-nowrap">
                                      {isExpanded ? chipText(c) : c.name}
                                    </span>
                                  </span>
                                ))}

                                {extra > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandStaff(id)}
                                    className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] text-black/70 hover:bg-black/10"
                                    title="Show all specialties"
                                  >
                                    +{extra} more
                                  </button>
                                ) : chips.length > 4 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandStaff(id)}
                                    className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] text-black/70 hover:bg-black/10"
                                    title="Collapse"
                                  >
                                    Show less
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-xs text-black/50">
                                No specialties assigned.
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Actions row (horizontal) */}
                      {!isEditing ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(s)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                           
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => toggleActive(s)} className="gap-2">
                            <Power className="h-4 w-4" />
                            {s.active ? "Disable" : "Enable"}
                          </Button>

                          <Button size="sm" variant="danger" onClick={() => del(id)} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                           
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(id)}
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

                    {/* Edit panel */}
                    {isEditing ? (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-cream-50 p-3">
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
                            label="Status"
                            value={editForm.active}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, active: e.target.value }))
                            }
                          >
                            <option value="true">Active</option>
                            <option value="false">Disabled</option>
                          </Select>
                        </div>

                        {/* Specialties editor */}
                        <div className="mt-3 rounded-2xl border border-black/10 bg-white p-3">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-hlblack">
                                Specialties
                              </div>
                              <div className="text-xs text-black/60">
                                Update which services this staff member can perform.
                              </div>
                            </div>

                            <InputField
                              className="max-w-[220px]"
                              placeholder="Search services..."
                              value={editSvcQ}
                              onChange={(e) => setEditSvcQ(e.target.value)}
                            />
                          </div>

                          <div className="mt-3 max-h-[260px] overflow-auto pr-1 space-y-2">
                            {filteredEditServices.map((svc) => {
                              const sid = String(svc._id);
                              const checked = editForm.specialties.includes(sid);

                              return (
                                <label
                                  key={`edit-${sid}`}
                                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/10 bg-cream-50 px-3 py-2 hover:bg-cream-100"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-hlblack truncate">
                                      {svc.name}
                                    </div>
                                    <div className="text-xs text-black/60">
                                      {serviceSpecialty(svc)} • {svc.durationMinutes} min •{" "}
                                      {svc.price} €
                                    </div>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleEditSpecialty(sid)}
                                    className="h-4 w-4 accent-hlgreen-600"
                                  />
                                </label>
                              );
                            })}

                            {filteredEditServices.length === 0 ? (
                              <div className="text-sm text-black/60">
                                No services found.
                              </div>
                            ) : null}
                          </div>

                          {editForm.specialties.length ? (
                            <div className="mt-3">
                              <div className="text-xs text-black/60">Selected</div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {editForm.specialties
                                  .map((sid) => serviceById.get(String(sid)))
                                  .filter(Boolean)
                                  .slice(0, 10)
                                  .map((svc) => {
                                    const sp = serviceSpecialty(svc);
                                    return (
                                      <span
                                        key={`edit-sel-${svc._id}`}
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] leading-4 ${toneFor(
                                          sp
                                        )}`}
                                        title={`${svc.name} (${sp})`}
                                      >
                                        <span className="font-semibold">{svc.name}</span>
                                        <span className="opacity-70">• {sp}</span>
                                      </span>
                                    );
                                  })}

                                {editForm.specialties.length > 10 ? (
                                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/60">
                                    +{editForm.specialties.length - 10} more
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {filteredStaff.length === 0 && (
                <div className="text-sm text-black/60">No staff.</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
