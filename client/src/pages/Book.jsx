import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

import { Card } from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
import InputField from "../components/InputField";

function getStaffServiceIds(st) {
  // supports multiple possible schema shapes
  const raw =
    st?.serviceIds ??
    st?.services ??
    st?.specialties ??
    st?.service_ids ??
    [];

  // normalize objects -> ids if needed
  if (Array.isArray(raw)) {
    return raw.map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean);
  }
  return [];
}

export default function Book() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");

  const [step, setStep] = useState(1);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    (async () => {
      const [sRes, stRes] = await Promise.all([
        api.get("/services"),
        api.get("/staff"),
      ]);
      setServices(sRes.data.services || []);
      setStaff(stRes.data.staff || []);
    })();
  }, []);

  const selectedService = useMemo(
    () => services.find((x) => x._id === serviceId),
    [services, serviceId]
  );

  // ✅ filter staff based on selected service
  const eligibleStaff = useMemo(() => {
    if (!serviceId) return [];
    return (staff || [])
      .filter((st) => st.active)
      .filter((st) => getStaffServiceIds(st).includes(serviceId));
  }, [staff, serviceId]);

  // ✅ when service changes, reset downstream fields so you never keep invalid picks
  useEffect(() => {
    setStaffId("");
    setDate("");
    setSlot("");
    setSlots([]);
    if (serviceId) setStep(2);
    else setStep(1);
  }, [serviceId]);

  // ✅ when staff changes, reset date/time (optional but sane)
  useEffect(() => {
    setDate("");
    setSlot("");
    setSlots([]);
    if (staffId) setStep(3);
  }, [staffId]);

  useEffect(() => {
    async function loadSlots() {
      if (!serviceId || !staffId || !date) {
        setSlots([]);
        setSlot("");
        return;
      }
      setLoadingSlots(true);
      try {
        const res = await api.get("/availability", {
          params: { serviceId, staffId, date },
        });
        setSlots(res.data.slots || []);
        setSlot("");
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [serviceId, staffId, date]);

  async function submitRequest() {
    if (!serviceId || !staffId || !date || !slot) {
      toast.error("Please complete all steps");
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

      setStep(1);
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

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-extrabold">Book Appointment</h2>
      <p className="mt-1 text-sm text-black/60">
        Send a request. Admin will confirm, decline, or propose a new time.
      </p>

      <div className="mt-6 grid gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold">Step 1 — Choose service</div>
          <div className="mt-3">
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

        <Card className={`p-5 ${serviceId ? "" : "opacity-60"}`}>
          <div className="text-sm font-semibold">Step 2 — Choose staff</div>
          <div className="mt-3">
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

            <div className="mt-2 text-xs text-black/60">
              Staff list is filtered by the selected service.
            </div>
          </div>
        </Card>

        <Card className={`p-5 ${serviceId && staffId ? "" : "opacity-60"}`}>
          <div className="text-sm font-semibold">Step 3 — Choose date</div>
          <div className="mt-3">
            <InputField
              disabled={!serviceId || !staffId}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setStep(4);
              }}
            />
          </div>
        </Card>

        <Card
          className={`p-5 ${
            serviceId && staffId && date ? "" : "opacity-60"
          }`}
        >
          <div className="text-sm font-semibold">Step 4 — Choose time</div>
          <div className="mt-3">
            {loadingSlots ? (
              <div className="text-sm text-black/60">Loading slots...</div>
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

            <div className="mt-2 text-xs text-black/60">
              Availability respects working hours, time off, and confirmed
              bookings.
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Note (optional)</div>
          <div className="mt-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hlgreen-600/30"
              placeholder="Any notes for the admin..."
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-black/60">
              {selectedService
                ? `Service duration: ${selectedService.durationMinutes} min`
                : ""}
            </div>
            <Button onClick={submitRequest}>Send request</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
