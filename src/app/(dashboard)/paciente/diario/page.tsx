"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, SmilePlus, Meh, Frown, Send, Trash2 } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Mood = "bien" | "regular" | "mal";

interface DiaryEntry {
  id: string;
  content: string;
  mood: Mood | null;
  created_at: string;
}

const MOOD_CONFIG: Record<Mood, { icon: React.ElementType; label: string; color: string }> = {
  bien:    { icon: SmilePlus, label: "Bien",    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" },
  regular: { icon: Meh,       label: "Regular", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200" },
  mal:     { icon: Frown,     label: "Mal",     color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200" },
};

export default function PacienteDiarioPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>("regular");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("diary_entries")
      .select("id, content, mood, created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    setEntries((data ?? []) as DiaryEntry[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("diary_entries").insert({
      patient_id: user.id,
      content: content.trim(),
      mood,
    });

    setContent("");
    setMood("regular");
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("diary_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Diario</h1>
          <p className="text-slate-500 text-sm mt-1">
            Un espacio para expresar cómo te sientes
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nueva entrada
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
            ¿Cómo te sientes hoy?
          </p>
          <div className="flex gap-2 mb-4">
            {(["bien", "regular", "mal"] as Mood[]).map((m) => {
              const cfg = MOOD_CONFIG[m];
              const Icon = cfg.icon;
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    mood === m
                      ? cfg.color
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {cfg.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe cómo te sientes, qué piensas, lo que quieras expresar..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111822] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent text-slate-900 dark:text-slate-100"
            rows={5}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setShowForm(false); setContent(""); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Tu diario está vacío</p>
          <p className="text-slate-400 text-sm mt-1">Escribe tu primera entrada para comenzar.</p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => {
          const moodCfg = entry.mood ? MOOD_CONFIG[entry.mood] : null;
          const MoodIcon = moodCfg?.icon;
          return (
            <div
              key={entry.id}
              className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {moodCfg && MoodIcon && (
                    <span
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${moodCfg.color}`}
                    >
                      <MoodIcon className="h-3 w-3" /> {moodCfg.label}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {format(new Date(entry.created_at), "d 'de' MMMM, yyyy · HH:mm", { locale: es })}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  title="Eliminar entrada"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
