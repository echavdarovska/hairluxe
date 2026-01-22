// src/pages/Book.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";

import { Card } from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
import InputField from "../components/InputField";

function getStaffServiceIds(st) {
  const raw =
    st?.serviceIds ?? st?.services ?? st?.specialties ?? st?.service_ids ?? [];
  if (Array.isArray(raw))
    return raw
      .map((x) => (typeof x === "string" ? x : x?._id))
      .filter(Boolean);
  return [];
}

/**
 * Local "YYYY-MM-DD" (NOT UTC) so min date matches user's real today.
 */
function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function compareYMD(a, b) {
  // Works for YYYY-MM-DD strings
  return String(a).localeCompare(String(b));
}

function timeToMinutes(t) {
  const [h, m] = String(t || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isSlotInPast(dateStr, startTime) {
  const today = todayLocalISO();
  if (dateStr !== today) return false;

  const slotMin = timeToMinutes(startTime);
  if (slotMin == null) return false;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return slotMin < nowMin;
}

function StepHeader({ n, title, subtitle, done, disabled }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold",
            disabled
              ? "bg-black/5 text-black/35"
              : done
              ? "bg-hlgreen-600 text-white"
              : "bg-cream-100 text-hlgreen-700",
          ].join(" ")}
        >
          {done ? "✓" : n}
        </div>

        <div>
          <div
            className={[
              "text-sm font-semibold",
              disabled ? "text-black/45" : "text-hlblack",
            ].join(" ")}
          >
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-black/60">{subtitle}</div>
          ) : null}
        </div>
      </div>

      {done ? (
        <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold text-black/60">
          Done
        </span>
      ) : null}
    </div>
  );
}

export default function Book() {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const serviceFromUrl = params.get("service");

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  const minDate = useMemo(() => todayLocalISO(), []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingInit(true);
        const [sRes, stRes] = await Promise.all([
          api.get("/services"),
          api.get("/staff"),
        ]);
        setServices(sRes.data.services || []);
        setStaff(stRes.data.staff || []);
      } finally {
        setLoadingInit(false);
      }
    })();
  }, []);

  // ✅ Deep-link: preselect service from URL once services loaded (don’t override manual)
  useEffect(() => {
    if (!serviceFromUrl) return;
    if (!services.length) return;
    if (serviceId) return;

    const exists = services.some((s) => s._id === serviceFromUrl);
    if (exists) setServiceId(serviceFromUrl);
  }, [serviceFromUrl, services, serviceId]);

  const selectedService = useMemo(
    () => services.find((x) => x._id === serviceId),
    [services, serviceId]
  );

  const eligibleStaff = useMemo(() => {
    if (!serviceId) return [];
    return (staff || [])
      .filter((st) => st.active)
      .filter((st) => getStaffServiceIds(st).includes(serviceId));
  }, [staff, serviceId]);

  // resets on service change
  useEffect(() => {
    setStaffId("");
    setDate("");
    setSlot("");
    setSlots([]);
  }, [serviceId]);

  // resets on staff change
  useEffect(() => {
    setDate("");
    setSlot("");
    setSlots([]);
  }, [staffId]);

  // ✅ Guard: if someone types/pastes a past date, reject it
  useEffect(() => {
    if (!date) return;
    if (compareYMD(date, minDate) < 0) {
      toast.error("You can’t book past dates.");
      setDate("");
      setSlot("");
      setSlots([]);
    }
  }, [date, minDate]);

  // load slots
  useEffect(() => {
    async function loadSlots() {
      if (!serviceId || !staffId || !date) {
        setSlots([]);
        setSlot("");
        return;
      }

      // extra guard
      if (compareYMD(date, minDate) < 0) {
        setSlots([]);
        setSlot("");
        return;
      }

      setLoadingSlots(true);
      try {
        const res = await api.get("/availability", {
          params: { serviceId, staffId, date },
        });

        const raw = res.data.slots || [];
        // ✅ filter past times if booking for today
        const filtered = raw.filter((s) => !isSlotInPast(date, s.startTime));

        setSlots(filtered);
        setSlot("");
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [serviceId, staffId, date, minDate]);

  async function submitRequest() {
    if (!serviceId || !staffId || !date || !slot) {
      toast.error("Please complete all steps");
      return;
    }

    // ✅ Frontend hard-stop (backend must also validate)
    if (compareYMD(date, minDate) < 0) {
      toast.error("Cannot book past dates.");
      return;
    }
    if (isSlotInPast(date, slot)) {
      toast.error("That time is already in the past. Pick a later slot.");
      return;
    }

    try {
      await api.post("/appointments", {
        serviceId,
        staffId,
        date,
        startTime: slot,
        clientNote: note,
      });
      toast.success("Request sent. Await admin review.");

      setServiceId("");
      setStaffId("");
      setDate("");
      setSlot("");
      setNote("");
      setSlots([]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create request");
    }
  }

  const stepDone = {
    s1: !!serviceId,
    s2: !!serviceId && !!staffId,
    s3: !!serviceId && !!staffId && !!date,
    s4: !!serviceId && !!staffId && !!date && !!slot,
  };

  return (
    // ✅ SAME 80vw SHELL AS SERVICES/HOME
    <div className="w-full flex justify-center">
      <div className="w-full px-4 sm:px-6 lg:w-[80vw] lg:max-w-[80vw] lg:min-w-[80vw] pb-4">
        {/* Header */}
        <div className="mt-2 rounded-3xl border border-black/5 bg-gradient-to-br from-cream-100 to-white p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-hlblack">
                Book Appointment
              </h2>
              <p className="mt-1 text-sm text-black/60">
                Request a slot. Admin will confirm, decline, or propose a new
                time.
              </p>
              {selectedService ? (
                <div className="mt-2 text-xs text-black/60">
                  Selected:{" "}
                  <span className="font-semibold text-hlblack">
                    {selectedService.name}
                  </span>{" "}
                  · {selectedService.durationMinutes} min ·{" "}
                  {selectedService.price} €
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/services"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-black/5 transition"
              >
                Browse services
              </Link>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Main steps */}
          <div className="grid gap-4">
            <Card className="p-6 rounded-3xl">
              <StepHeader
                n="1"
                title="Choose service"
                subtitle="Pick what you want to book."
                done={stepDone.s1}
                disabled={false}
              />
              <div className="mt-4">
                <Select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  <option value="">Select service...</option>
                  {services
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — {s.durationMinutes} min — {s.price} €
                      </option>
                    ))}
                </Select>
              </div>
            </Card>

            <Card
              className={[
                "p-6 rounded-3xl transition",
                serviceId ? "" : "opacity-60",
              ].join(" ")}
            >
              <StepHeader
                n="2"
                title="Choose staff"
                subtitle="Only staff that can do the service are shown."
                done={stepDone.s2}
                disabled={!serviceId}
              />
              <div className="mt-4">
                <Select
                  disabled={!serviceId}
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">
                    {!serviceId
                      ? "Select service first..."
                      : eligibleStaff.length
                      ? "Select staff..."
                      : "No staff for this service"}
                  </option>
                  {eligibleStaff.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            <Card
              className={[
                "p-6 rounded-3xl transition",
                serviceId && staffId ? "" : "opacity-60",
              ].join(" ")}
            >
              <StepHeader
                n="3"
                title="Choose date"
                subtitle="Pick your preferred day."
                done={stepDone.s3}
                disabled={!serviceId || !staffId}
              />
              <div className="mt-4">
                <InputField
                  disabled={!serviceId || !staffId}
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <div className="mt-2 text-[11px] text-black/50">
                  Earliest bookable date: <span className="font-semibold">{minDate}</span>
                </div>
              </div>
            </Card>

            <Card
              className={[
                "p-6 rounded-3xl transition",
                serviceId && staffId && date ? "" : "opacity-60",
              ].join(" ")}
            >
              <StepHeader
                n="4"
                title="Choose time"
                subtitle="We show only valid slots (hours, time off, bookings)."
                done={stepDone.s4}
                disabled={!serviceId || !staffId || !date}
              />
              <div className="mt-4">
                {loadingSlots ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-black/60">Loading slots...</div>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full w-1/2 animate-pulse bg-black/20" />
                    </div>
                  </div>
                ) : (
                  <Select
                    disabled={!serviceId || !staffId || !date || slots.length === 0}
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  >
                    <option value="">
                      {slots.length ? "Select a time..." : "No available slots"}
                    </option>
                    {slots.map((s) => (
                      <option key={s.startTime} value={s.startTime}>
                        {s.startTime} - {s.endTime}
                      </option>
                    ))}
                  </Select>
                )}

                {serviceId && staffId && date && !loadingSlots && slots.length === 0 ? (
                  <div className="mt-2 text-xs text-black/60">
                    No slots for this day (or remaining times are in the past). Try another date.
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-6 rounded-3xl">
              <div className="text-sm font-semibold text-hlblack">Note (optional)</div>
              <div className="mt-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none shadow-sm
                             focus:ring-2 focus:ring-hlgreen-600/30"
                  placeholder="Any notes for the admin..."
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-black/60">
                  {selectedService
                    ? `Service duration: ${selectedService.durationMinutes} min`
                    : ""}
                </div>

                <Button onClick={submitRequest} disabled={!stepDone.s4}>
                  Send request
                </Button>
              </div>
            </Card>
          </div>

          {/* Right summary panel */}
          <div className="lg:sticky lg:top-6 h-fit">
            <Card className="p-6 rounded-3xl">
              <div className="text-sm font-semibold text-hlblack">Summary</div>

              {loadingInit ? (
                <div className="mt-3 text-sm text-black/60">Loading data...</div>
              ) : (
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Service</span>
                    <span className="font-semibold text-hlblack">
                      {selectedService?.name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Staff</span>
                    <span className="font-semibold text-hlblack">
                      {staff.find((x) => x._id === staffId)?.name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Date</span>
                    <span className="font-semibold text-hlblack">{date || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Time</span>
                    <span className="font-semibold text-hlblack">{slot || "—"}</span>
                  </div>

                  <div className="mt-2 rounded-2xl border border-black/5 bg-cream-100 p-4">
                    <div className="text-xs font-semibold text-black/50">
                      What happens next
                    </div>
                    <div className="mt-1 text-xs text-black/70">
                      Admin reviews your request and either confirms it or proposes a different time.
                    </div>
                  </div>

                  <Button
                    onClick={submitRequest}
                    disabled={!stepDone.s4}
                    className="w-full"
                  >
                    Confirm & Send
                  </Button>

                  <div className="text-[11px] text-black/50 leading-4">
                    Tip: if you came from Services, your service is already preselected.
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
