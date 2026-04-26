"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri default shown first

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface NewBlock { day_of_week: number; start_time: string; end_time: string }

export default function EspecialistaHorariosPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]  = useState(true);
  const [saved, setSaved]      = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newBlock, setNewBlock] = useState<NewBlock>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });
  const [addError, setAddError] = useState<string | null>(null);

  const supabase = createClient();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("specialist_schedules")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("specialist_id", user.id)
      .order("day_of_week")
      .order("start_time");
    setSchedules((data ?? []) as Schedule[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    setAddError(null);
    if (newBlock.start_time >= newBlock.end_time) {
      setAddError("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("specialist_schedules").insert({
        specialist_id: user.id,
        day_of_week:   newBlock.day_of_week,
        start_time:    newBlock.start_time,
        end_time:      newBlock.end_time,
        is_active:     true,
      });
      if (error) { setAddError("Ya existe un bloque con ese horario."); return; }
      await load();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await supabase.from("specialist_schedules").update({ is_active: !current }).eq("id", id);
      await load();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await supabase.from("specialist_schedules").delete().eq("id", id);
      await load();
    });
  };

  const byDay: Record<number, Schedule[]> = {};
  schedules.forEach((s) => {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
    byDay[s.day_of_week].push(s);
  });

  const allDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Horario</h1>
          <p className="text-slate-500 text-sm mt-1">Define tus bloques de disponibilidad semanal</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> Guardado
          </div>
        )}
      </div>

      {/* Add new block */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
        <h2 className="font-semibold text-sm mb-4">Agregar bloque de disponibilidad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Día</label>
            <select
              value={newBlock.day_of_week}
              onChange={(e) => setNewBlock((p) => ({ ...p, day_of_week: Number(e.target.value) }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
            >
              {allDays.map((d) => (
                <option key={d} value={d}>{DAYS[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Inicio</label>
            <input
              type="time"
              value={newBlock.start_time}
              onChange={(e) => setNewBlock((p) => ({ ...p, start_time: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Fin</label>
            <input
              type="time"
              value={newBlock.end_time}
              onChange={(e) => setNewBlock((p) => ({ ...p, end_time: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="flex items-center justify-center gap-2 w-full py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        {addError && (
          <p className="text-xs text-red-500 mt-2">{addError}</p>
        )}
      </div>

      {/* Weekly view */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Sin horarios configurados</p>
          <p className="text-slate-400 text-sm mt-1">Agrega bloques de disponibilidad para que los pacientes puedan agendar citas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allDays.filter((d) => byDay[d]?.length > 0).map((d) => (
            <div key={d} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="font-semibold text-sm text-slate-700">{DAYS[d]}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {byDay[d].map((s) => (
                  <div key={s.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${!s.is_active ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#136dec]" />
                      <span className="font-medium text-sm">
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </span>
                      {!s.is_active && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactivo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(s.id, s.is_active)}
                        disabled={isPending}
                        className="text-xs text-slate-400 hover:text-[#136dec] font-medium transition-colors disabled:opacity-50"
                      >
                        {s.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isPending}
                        className="p-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
