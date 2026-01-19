import  { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../../lib/api";
import AdminLayout from "../../components/AdminLayout";

import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { Card, CardBody } from "../../components/Card";

const DOW = [
  
  { id: 0, name: "Monday" },
  { id: 1, name: "Tuesday" },
  { id: 2, name: "Wednesday" },
  { id: 3, name: "Thursday" },
  { id: 4, name: "Friday" },
  { id: 5, name: "Saturday" },
  { id: 6, name: "Sunday" },
];

export default function SettingsAdmin() {
  const [workingHours, setWorkingHours] = useState([]);
  const [slotLengthMinutes, setSlotLengthMinutes] = useState(30);

  async function load() {
    const [whRes, slRes] = await Promise.all([
      api.get("/settings/working-hours"),
      api.get("/settings/slot-length"),
    ]);

    setWorkingHours(whRes.data.workingHours || []);
    setSlotLengthMinutes(slRes.data.slotLengthMinutes || 30);
  }

  useEffect(() => {
    load();
  }, []);

  function getRow(dayId) {
    return (
      workingHours.find((x) => x.dayOfWeek === dayId) || {
        dayOfWeek: dayId,
        startTime: "09:00",
        endTime: "17:00",
        breakStart: "",
        breakEnd: "",
        isClosed: dayId === 0,
      }
    );
  }

  function updateRow(dayId, patch) {
    setWorkingHours((prev) => {
      const idx = prev.findIndex((x) => x.dayOfWeek === dayId);
      if (idx >= 0) {
        return prev.map((x, i) =>
          i === idx ? { ...x, ...patch } : x
        );
      }
      return [...prev, { ...getRow(dayId), ...patch }];
    });
  }

  async function saveWorkingHours() {
    try {
      const normalized = DOW.map((d) => getRow(d.id));
      await api.put("/settings/working-hours", {
        workingHours: normalized,
      });
      toast.success("Working hours saved");
      await load();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed"
      );
    }
  }

  async function saveSlotLength() {
    try {
      await api.put("/settings/slot-length", {
        slotLengthMinutes: Number(slotLengthMinutes),
      });
      toast.success("Slot length saved");
      await load();
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-hlblack">
        Settings
      </h2>
      
    </AdminLayout>
  );
}
