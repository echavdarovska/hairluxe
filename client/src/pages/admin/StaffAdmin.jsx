import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  Power,
  Save,
  X,
  Search,
  Users,
  UserPlus2,
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Select from "../../components/Select";
import { Card, CardBody } from "../../components/Card";
import PageHeader from "../../components/PageHeader";

export default function StaffAdmin() {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");

  const [saving, setSaving] = useState(false);
  const [svcQ, setSvcQ] = useState("");

  const [expandedStaff, setExpandedStaff] = useState(() => new Set());

  const [form, setForm] = useState({
    name: "",
    active: "true",
    services: [],
  });

  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSvcQ, setEditSvcQ] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    active: "true",
    services: [],
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

  const serviceById = useMemo(() => {
    const map = new Map();
    services.forEach((s) => map.set(String(s._id), s));
    return map;
  }, [services]);

  const metrics = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.active).length;
    const disabled = total - active;
    return { total, active, disabled };
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return staff;
    return staff.filter((s) => String(s.name || "").toLowerCase().includes(qq));
  }, [staff, q]);

  const selectableServices = useMemo(
    () => services.filter((s) => s.active !== false),
    [services]
  );

  const filteredServices = useMemo(() => {
    const qq = svcQ.trim().toLowerCase();
    if (!qq) return selectableServices;
    return selectableServices.filter((s) =>
      `${s.name} ${s.description || ""}`.toLowerCase().includes(qq)
    );
  }, [selectableServices, svcQ]);

  const filteredEditServices = useMemo(() => {
    const qq = editSvcQ.trim().toLowerCase();
    if (!qq) return selectableServices;
    return selectableServices.filter((s) =>
      `${s.name} ${s.description || ""}`.toLowerCase().includes(qq)
    );
  }, [selectableServices, editSvcQ]);

  const toggleService = (serviceId) => {
    const id = String(serviceId);
    setForm((p) => {
      const has = p.services.includes(id);
      return {
        ...p,
        services: has ? p.services.filter((x) => x !== id) : [...p.services, id],
      };
    });
  };

  const toggleEditService = (serviceId) => {
    const id = String(serviceId);
    setEditForm((p) => {
      const has = p.services.includes(id);
      return {
        ...p,
        services: has ? p.services.filter((x) => x !== id) : [...p.services, id],
      };
    });
  };

  function normalizeServiceIds(input) {
    const list = Array.isArray(input) ? input : [];
    return list
      .map((x) =>
        typeof x === "object" ? String(x?._id || "") : String(x || "")
      )
      .filter(Boolean);
  }

  async function create(e) {
    e.preventDefault();

    const serviceIds = normalizeServiceIds(form.services).filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id)
    );

    const payload = {
      name: String(form.name || "").trim(),
      active: form.active === "true",
      serviceIds,
    };

    if (!payload.name) return toast.error("Name is required");

    try {
      setSaving(true);
      await api.post("/staff", payload);
      toast.success("Staff created");

      setForm({ name: "", active: "true", services: [] });
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
      if (editingId === String(s._id))
        setEditForm((p) => ({ ...p, active: String(!s.active) }));
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
      services: normalizeServiceIds(st.serviceIds ?? st.services ?? st.specialties),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setSavingEdit(false);
    setEditSvcQ("");
  }

  async function saveEdit(id) {
    const serviceIds = normalizeServiceIds(editForm.services).filter((x) =>
      /^[0-9a-fA-F]{24}$/.test(x)
    );

    const payload = {
      name: String(editForm.name || "").trim(),
      active: editForm.active === "true",
      serviceIds,
    };

    if (!payload.name) return toast.error("Name is required");

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

  // chips: ids or populated objects
  const staffServices = (st) => {
    const raw = st.serviceIds ?? st.services ?? st.specialties ?? [];
    const list = Array.isArray(raw) ? raw : [];

    return list
      .map((x) => {
        if (!x) return null;

        if (typeof x === "object") {
          if (!x.name) return null;
          return { key: String(x._id || x.name), name: x.name };
        }

        const svc = serviceById.get(String(x));
        if (!svc) return null;
        return { key: String(svc._id), name: svc.name };
      })
      .filter(Boolean);
  };

  const toggleExpandStaff = (id) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/admin/services" title="Services">
        <Button variant="outline" size="sm" className="rounded-xl">
          Services
        </Button>
      </Link>
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Staff"
        subtitle="Create and manage team members and the services they can perform."
        actions={headerActions}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card className="rounded-3xl">
          <CardBody>
            <div className="text-xs font-semibold text-black/50">Total</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-3xl font-extrabold text-hlblack">
                {metrics.total}
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <Users className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-3xl">
          <CardBody>
            <div className="text-xs font-semibold text-black/50">Active</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-3xl font-extrabold text-hlblack">
                {metrics.active}
              </div>
              <span className="inline-flex items-center rounded-full bg-hlgreen-600/10 px-3 py-1 text-xs font-semibold text-hlgreen-700 ring-1 ring-hlgreen-600/15">
                Enabled
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-3xl">
          <CardBody>
            <div className="text-xs font-semibold text-black/50">Disabled</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-3xl font-extrabold text-hlblack">
                {metrics.disabled}
              </div>
              <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/60 ring-1 ring-black/10">
                Off
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[440px_1fr]">
        {/* CREATE STAFF */}
        <Card className="rounded-3xl">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-hlblack">
                  Create staff
                </div>
                <div className="mt-1 text-xs text-black/60">
                  Assign services (active services only).
                </div>
              </div>

              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
                <UserPlus2 className="h-5 w-5 text-hlgreen-700" />
              </span>
            </div>

            <form className="mt-5 space-y-3" onSubmit={create}>
              <InputField
                label="Name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />

              <Select
                label="Status"
                value={form.active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, active: e.target.value }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </Select>

              {/* Services picker */}
              <div className="rounded-3xl border border-black/10 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-hlblack">
                      Services
                    </div>
                    <div className="text-xs text-black/60">
                      Pick which services this staff member can perform.
                    </div>
                  </div>

                  <div className="w-full sm:w-[220px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                      <input
                        value={svcQ}
                        onChange={(e) => setSvcQ(e.target.value)}
                        placeholder="Search services..."
                        className="w-full rounded-2xl border border-black/10 bg-white px-9 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-hlgreen-600/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 max-h-[280px] overflow-auto pr-1 space-y-2">
                  {filteredServices.map((s) => {
                    const id = String(s._id);
                    const checked = form.services.includes(id);

                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/10 bg-cream-50 px-3 py-2 hover:bg-cream-100 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-hlblack truncate">
                            {s.name}
                          </div>
                          <div className="text-xs text-black/60">
                            {s.durationMinutes} min • {s.price} €
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(id)}
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

                {form.services.length ? (
                  <div className="mt-3">
                    <div className="text-xs text-black/60">Selected</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.services
                        .map((id) => serviceById.get(String(id)))
                        .filter(Boolean)
                        .slice(0, 12)
                        .map((svc) => (
                          <span
                            key={`sel-${svc._id}`}
                            className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-black/70"
                            title={svc.name}
                          >
                            {svc.name}
                          </span>
                        ))}

                      {form.services.length > 12 ? (
                        <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/60">
                          +{form.services.length - 12} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saving}
                loading={saving}
              >
                Create
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ALL STAFF */}
        <Card className="rounded-3xl">
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-hlblack">
                  All staff
                </div>
                <div className="mt-0.5 text-xs text-black/50">
                  Showing {filteredStaff.length} of {staff.length}
                </div>
              </div>

              <div className="w-full sm:w-[260px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search staff..."
                    className="w-full rounded-2xl border border-black/10 bg-white px-9 py-2.5 text-sm outline-none shadow-sm focus:ring-2 focus:ring-hlgreen-600/30"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[640px] overflow-auto pr-1">
              {filteredStaff.map((s) => {
                const id = String(s._id);
                const chips = staffServices(s);
                const isExpanded = expandedStaff.has(id);
                const isEditing = editingId === id;

                const visibleCount = isExpanded ? chips.length : 6;
                const extra = Math.max(0, chips.length - visibleCount);

                return (
                  <div
                    key={id}
                    className={[
                      "rounded-3xl border p-4 shadow-sm transition",
                      isEditing
                        ? "border-hlgreen-600/30 bg-hlgreen-600/5 ring-2 ring-hlgreen-600/10"
                        : "border-black/10 bg-white hover:bg-cream-50",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-base font-semibold text-hlblack">
                            {s.name}
                          </div>

                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                              s.active
                                ? "bg-hlgreen-600/10 text-hlgreen-700 ring-hlgreen-600/15"
                                : "bg-black/5 text-black/60 ring-black/10",
                            ].join(" ")}
                          >
                            {s.active ? "Active" : "Disabled"}
                          </span>

                          {chips.length ? (
                            <span className="text-[11px] text-black/50">
                              • {chips.length} services
                            </span>
                          ) : null}
                        </div>

                        {!isEditing ? (
                          <div className="mt-2">
                            {chips.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {chips.slice(0, visibleCount).map((c) => (
                                  <span
                                    key={`${id}-${c.key}`}
                                    className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-black/70"
                                    title={c.name}
                                  >
                                    {c.name}
                                  </span>
                                ))}

                                {extra > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandStaff(id)}
                                    className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] text-black/70 hover:bg-black/10"
                                  >
                                    +{extra} more
                                  </button>
                                ) : chips.length > 6 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandStaff(id)}
                                    className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] text-black/70 hover:bg-black/10"
                                  >
                                    Show less
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-xs text-black/50">
                                No services assigned.
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {!isEditing ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(s)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
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
                            onClick={() => del(id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
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
                              setEditForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            required
                          />

                          <Select
                            label="Status"
                            value={editForm.active}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                active: e.target.value,
                              }))
                            }
                          >
                            <option value="true">Active</option>
                            <option value="false">Disabled</option>
                          </Select>
                        </div>

                        <div className="mt-3 rounded-3xl border border-black/10 bg-cream-50 p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-hlblack">
                                Services
                              </div>
                              <div className="text-xs text-black/60">
                                Update which services this staff member can
                                perform.
                              </div>
                            </div>

                            <div className="w-full sm:w-[220px]">
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                                <input
                                  value={editSvcQ}
                                  onChange={(e) => setEditSvcQ(e.target.value)}
                                  placeholder="Search services..."
                                  className="w-full rounded-2xl border border-black/10 bg-white px-9 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-hlgreen-600/30"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 max-h-[260px] overflow-auto pr-1 space-y-2">
                            {filteredEditServices.map((svc) => {
                              const sid = String(svc._id);
                              const checked = editForm.services.includes(sid);

                              return (
                                <label
                                  key={`edit-${sid}`}
                                  className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 hover:bg-cream-100 transition"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-hlblack truncate">
                                      {svc.name}
                                    </div>
                                    <div className="text-xs text-black/60">
                                      {svc.durationMinutes} min • {svc.price} €
                                    </div>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleEditService(sid)}
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
