"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, differenceInYears, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Lock,
  Save,
  Stethoscope,
  Tag,
  X,
  BarChart3,
  Gamepad2,
} from "lucide-react";
import type {
  AppointmentTimeline,
  ClinicalRecordData,
  DiagnosisCategory,
  InterventionCode,
  InteractiveSessionSummary,
  PatientExamSummary,
} from "../actions/specialists";
import {
  listDiagnosisCategories,
  listInterventionCodes,
  loadClinicalRecord,
  loadInteractiveSessionSummaries,
  loadPatientExamSummaries,
  loadPatientTimeline,
  saveClinicalRecordDraft,
  signClinicalRecord,
} from "../actions/specialists";

interface Props {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientBirthDate?: string | null;
  specialistId: string;
  patientDni?: string | null;
  attentionType?: string | null;
}

const ATTENTION_LABELS: Record<string, string> = {
  completed: "Seguimiento",
  confirmed: "Consulta Programada",
  scheduled: "Consulta Programada",
  cancelled: "Atencion cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  signed_and_locked: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  empty: "bg-slate-100 text-slate-500",
};

const CONDITION_COLORS: Record<string, string> = {
  TEA: "bg-purple-100 text-purple-700",
  TDAH: "bg-blue-100 text-blue-700",
  DI: "bg-orange-100 text-orange-700",
};

function summarizeMetrics(metrics: Record<string, unknown>): string {
  const preferredKeys = [
    "accuracy",
    "score",
    "avg_reaction_ms",
    "completed",
    "hits",
    "errors",
    "level",
  ];

  const chunks: string[] = [];
  for (const key of preferredKeys) {
    const value = metrics[key];
    if (value === undefined || value === null) continue;
    const label = key.replace(/_/g, " ");
    chunks.push(`${label}: ${String(value)}`);
    if (chunks.length === 2) break;
  }

  if (chunks.length === 0) return "Sin metricas resumidas";
  return chunks.join(" - ");
}

export default function ClinicalHistoryView({
  appointmentId,
  patientId,
  patientName,
  patientBirthDate,
  specialistId,
  patientDni,
  attentionType,
}: Props) {
  const [timeline, setTimeline] = useState<AppointmentTimeline[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(appointmentId);

  const [record, setRecord] = useState<ClinicalRecordData | null>(null);
  const [loading, setLoading] = useState(true);

  const [exams, setExams] = useState<PatientExamSummary[]>([]);
  const [sessions, setSessions] = useState<InteractiveSessionSummary[]>([]);
  const [examsOpen, setExamsOpen] = useState(true);
  const [sessionsOpen, setSessionsOpen] = useState(true);

  const [interventionCodes, setInterventionCodes] = useState<InterventionCode[]>([]);
  const [diagCategories, setDiagCategories] = useState<DiagnosisCategory[]>([]);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showDiagPicker, setShowDiagPicker] = useState(false);
  const [diagConditionFilter, setDiagConditionFilter] = useState("TEA");
  const [diagAgeFilter, setDiagAgeFilter] = useState("6-12");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCurrentSession = selectedAppointmentId === appointmentId;
  const isLocked = record?.status === "signed_and_locked";
  const readOnlyByContext = !isCurrentSession;
  const disableInputs = isLocked || readOnlyByContext;

  const patientAge = useMemo(() => {
    if (!patientBirthDate) return "No registrado";
    return `${differenceInYears(new Date(), parseISO(patientBirthDate))} anos`;
  }, [patientBirthDate]);

  const insuranceLabel = attentionType ?? "Consulta particular";
  const dniLabel = patientDni ?? "No registrado";

  const groupedCodes = useMemo(
    () =>
      interventionCodes.reduce<Record<string, InterventionCode[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {}),
    [interventionCodes]
  );

  const filteredCategories = useMemo(
    () =>
      diagCategories.filter(
        (cat) => cat.condition === diagConditionFilter && cat.age_group === diagAgeFilter
      ),
    [diagAgeFilter, diagCategories, diagConditionFilter]
  );

  useEffect(() => {
    const init = async () => {
      const [tl, ex, gameSessions, codes, categories] = await Promise.all([
        loadPatientTimeline(patientId, specialistId),
        loadPatientExamSummaries(patientId),
        loadInteractiveSessionSummaries(patientId),
        listInterventionCodes(),
        listDiagnosisCategories(),
      ]);
      setTimeline(tl);
      setExams(ex);
      setSessions(gameSessions);
      setInterventionCodes(codes);
      setDiagCategories(categories);
      setLoading(false);
    };

    init();
  }, [patientId, specialistId]);

  useEffect(() => {
    const loadSelectedRecord = async () => {
      const data = await loadClinicalRecord(selectedAppointmentId);
      setRecord(data);
    };

    loadSelectedRecord();
  }, [selectedAppointmentId]);

  const autoSave = useCallback(
    (nextRecord: ClinicalRecordData) => {
      if (!isCurrentSession) return;
      if (nextRecord.status === "signed_and_locked") return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          await saveClinicalRecordDraft(appointmentId, patientId, {
            consultation_reason: nextRecord.consultation_reason,
            clinical_evolution: nextRecord.clinical_evolution,
            diagnostic_codes: nextRecord.diagnostic_codes,
            treatment_plan: nextRecord.treatment_plan,
            intervention_codes: nextRecord.intervention_codes,
            observations: nextRecord.observations,
          });
        } catch {
          setSaveError("Error en autoguardado");
        }
        setSaving(false);
      }, 30000);
    },
    [appointmentId, isCurrentSession, patientId]
  );

  const updateRecord = (patch: Partial<ClinicalRecordData>) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      autoSave(next);
      return next;
    });
  };

  const saveDraftNow = async () => {
    if (!record || disableInputs) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveClinicalRecordDraft(appointmentId, patientId, {
        consultation_reason: record.consultation_reason,
        clinical_evolution: record.clinical_evolution,
        diagnostic_codes: record.diagnostic_codes,
        treatment_plan: record.treatment_plan,
        intervention_codes: record.intervention_codes,
        observations: record.observations,
      });
    } catch {
      setSaveError("No se pudo guardar el borrador");
    }
    setSaving(false);
  };

  const handleSign = async () => {
    if (!record || disableInputs) return;
    if (!confirm("Finalizar y firmar bloqueara la edicion. Deseas continuar?")) return;
    setSigning(true);
    try {
      await saveDraftNow();
      await signClinicalRecord(appointmentId);
      setRecord((prev) =>
        prev
          ? {
              ...prev,
              status: "signed_and_locked",
              signed_at: new Date().toISOString(),
            }
          : prev
      );
    } finally {
      setSigning(false);
    }
  };

  const addDiagCode = (code: string) => {
    if (!record) return;
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    if (record.diagnostic_codes.includes(normalized)) return;
    updateRecord({ diagnostic_codes: [...record.diagnostic_codes, normalized] });
  };

  const removeDiagCode = (code: string) => {
    if (!record) return;
    updateRecord({ diagnostic_codes: record.diagnostic_codes.filter((c) => c !== code) });
  };

  const toggleInterventionCode = (code: string) => {
    if (!record) return;
    const exists = record.intervention_codes.includes(code);
    const next = exists
      ? record.intervention_codes.filter((c) => c !== code)
      : [...record.intervention_codes, code];
    updateRecord({ intervention_codes: next });
  };

  const attentionTypeLabel = (item: AppointmentTimeline, index: number) => {
    if (item.diagnostic_codes.length > 0) return "Evaluacion Psicometrica";
    if (index === timeline.length - 1) return "Consulta Inicial";
    return ATTENTION_LABELS[item.status] ?? "Seguimiento";
  };

  if (loading || !record) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[24%_52%_24%] h-[calc(100vh-4rem)] bg-slate-50">
        <div className="border-r border-slate-200 bg-white p-4 space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-16 rounded bg-slate-100 animate-pulse" />
          <div className="h-16 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="p-6 space-y-4 bg-white">
          <div className="h-16 rounded bg-slate-100 animate-pulse" />
          <div className="h-40 rounded bg-slate-100 animate-pulse" />
          <div className="h-40 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="border-l border-slate-200 bg-white p-4 space-y-3">
          <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-24 rounded bg-slate-100 animate-pulse" />
          <div className="h-24 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[24%_52%_24%] h-[calc(100vh-4rem)] bg-slate-50 text-slate-900">
      <aside className="border-r border-slate-200 bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Linea de Tiempo</h3>
        </div>

        <div className="p-3 space-y-2">
          {timeline.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-5">Sin atenciones registradas</p>
          )}

          {timeline.map((item, index) => {
            const selected = item.id === selectedAppointmentId;
            const statusKey = item.record_status ?? "empty";
            return (
              <button
                key={item.id}
                onClick={() => setSelectedAppointmentId(item.id)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  selected
                    ? "bg-blue-50 border-[#136dec]/40"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs text-slate-500">
                    {format(parseISO(item.start_time), "d MMM yyyy", { locale: es })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      STATUS_COLORS[statusKey] ?? STATUS_COLORS.empty
                    }`}
                  >
                    {item.record_status === "signed_and_locked"
                      ? "Firmado"
                      : item.record_status === "draft"
                      ? "Borrador"
                      : "Sin registro"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700">{attentionTypeLabel(item, index)}</p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {item.consultation_reason || "Sin motivo registrado"}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="bg-white border-r border-slate-200 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{patientName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Edad: {patientAge}</span>
                <span>DNI: {dniLabel}</span>
                <span>Tipo de Atencion: {insuranceLabel}</span>
              </div>
            </div>
            <div className="text-right">
              {saving && <p className="text-xs text-slate-400">Autoguardando...</p>}
              {saveError && (
                <p className="text-xs text-red-500 flex items-center gap-1 justify-end">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {saveError}
                </p>
              )}
              {readOnlyByContext && (
                <p className="text-xs text-amber-600 font-semibold">Vista historica: solo lectura</p>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-5 space-y-5">
          <section>
            <label className="block text-sm font-bold text-slate-700 mb-2">Motivo de Consulta</label>
            <textarea
              rows={3}
              disabled={disableInputs}
              value={record.consultation_reason}
              onChange={(e) => updateRecord({ consultation_reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Registrar motivo principal de atencion"
            />
          </section>

          <section>
            <label className="block text-sm font-bold text-slate-700 mb-2">Evolucion / Notas Clinicas</label>
            <textarea
              rows={7}
              disabled={disableInputs}
              value={record.clinical_evolution}
              onChange={(e) => updateRecord({ clinical_evolution: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Registro narrativo clinico de la sesion"
            />
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-sm font-bold text-slate-700">Diagnostico (CIE-10 / DSM-5)</label>
              {!disableInputs && (
                <button
                  onClick={() => setShowDiagPicker((v) => !v)}
                  className="text-xs font-semibold text-[#136dec] hover:underline"
                >
                  {showDiagPicker ? "Ocultar categorias" : "Autocompletar por categoria"}
                </button>
              )}
            </div>

            {showDiagPicker && !disableInputs && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["TEA", "TDAH", "DI"].map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setDiagConditionFilter(cond)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        diagConditionFilter === cond
                          ? CONDITION_COLORS[cond]
                          : "bg-white border border-slate-200 text-slate-600"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["0-6", "6-12", "12-17", "18+"].map((ageGroup) => (
                    <button
                      key={ageGroup}
                      onClick={() => setDiagAgeFilter(ageGroup)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        diagAgeFilter === ageGroup
                          ? "bg-slate-700 text-white"
                          : "bg-white border border-slate-200 text-slate-600"
                      }`}
                    >
                      {ageGroup}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (cat.cie_code) addDiagCode(cat.cie_code);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-[#136dec] px-3 py-2 text-left flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{cat.type_label}</span>
                      <span className="text-xs text-slate-500">{cat.cie_code ?? "-"}</span>
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Sin categorias para el filtro</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              {record.diagnostic_codes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold"
                >
                  {code}
                  {!disableInputs && (
                    <button onClick={() => removeDiagCode(code)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!disableInputs && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("diag") as HTMLInputElement) ?? null;
                  if (!input) return;
                  addDiagCode(input.value);
                  input.value = "";
                }}
              >
                <input
                  name="diag"
                  className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="Ej. F41.1, F32.0"
                />
                <button className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold">
                  Agregar
                </button>
              </form>
            )}
          </section>

          <section>
            <label className="block text-sm font-bold text-slate-700 mb-2">Plan de Tratamiento / Acuerdos</label>
            <textarea
              rows={5}
              disabled={disableInputs}
              value={record.treatment_plan}
              onChange={(e) => updateRecord({ treatment_plan: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Proximos pasos, acuerdos terapeuticos y recomendaciones"
            />
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-sm font-bold text-slate-700">Codigos de Intervencion</label>
              {!disableInputs && (
                <button
                  onClick={() => setShowCodePicker((v) => !v)}
                  className="text-xs font-semibold text-[#136dec] hover:underline"
                >
                  {showCodePicker ? "Ocultar catalogo" : "Seleccionar del catalogo"}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {record.intervention_codes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"
                >
                  <Tag className="h-3 w-3" /> {code}
                  {!disableInputs && (
                    <button onClick={() => toggleInterventionCode(code)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {showCodePicker && !disableInputs && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {Object.entries(groupedCodes).map(([category, codes]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {category}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {codes.map((code) => {
                        const selected = record.intervention_codes.includes(code.code);
                        return (
                          <button
                            key={code.id}
                            onClick={() => toggleInterventionCode(code.code)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between ${
                              selected ? "bg-blue-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-sm">
                              <span className="font-mono text-xs text-slate-500 mr-2">{code.code}</span>
                              {code.name}
                            </span>
                            {selected && <CheckCircle2 className="h-4 w-4 text-[#136dec]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones</label>
            <textarea
              rows={3}
              disabled={disableInputs}
              value={record.observations}
              onChange={(e) => updateRecord({ observations: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
            />
          </section>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={saveDraftNow}
              disabled={disableInputs || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Guardar Borrador
            </button>
            <button
              onClick={handleSign}
              disabled={disableInputs || signing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#136dec] text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-50"
            >
              {signing ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />} Finalizar y Firmar
            </button>
          </div>
        </div>
      </main>

      <aside className="bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Examenes y Auxiliares</h3>
        </div>

        <div className="p-3 space-y-3">
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExamsOpen((v) => !v)}
              className="w-full px-3 py-2.5 bg-slate-50 border-b border-slate-100 text-left flex items-center justify-between"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Stethoscope className="h-3.5 w-3.5" /> Examenes Psicometrico
              </span>
              {examsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {examsOpen && (
              <div className="p-2.5 space-y-2">
                {exams.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Sin examenes completados</p>
                )}
                {exams.map((exam) => (
                  <article key={exam.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-xs font-semibold text-slate-700">{exam.exam_title}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Puntaje: {exam.total_score ?? "-"}</span>
                      <span>
                        {exam.completed_at
                          ? format(parseISO(exam.completed_at), "d MMM yyyy", { locale: es })
                          : "Sin fecha"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {exam.subcategory ?? "Sin subcategoria"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setSessionsOpen((v) => !v)}
              className="w-full px-3 py-2.5 bg-slate-50 border-b border-slate-100 text-left flex items-center justify-between"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Gamepad2 className="h-3.5 w-3.5" /> Juegos / Terapia
              </span>
              {sessionsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {sessionsOpen && (
              <div className="p-2.5 space-y-2">
                {sessions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Sin sesiones interactivas</p>
                )}
                {sessions.map((session) => (
                  <article key={session.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700 truncate">{session.game_type}</p>
                      <BarChart3 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {format(parseISO(session.session_start), "d MMM yyyy HH:mm", { locale: es })}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{summarizeMetrics(session.metrics)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">
              Al abrir una atencion previa, la ficha central se muestra en modo solo lectura para preservar la inmutabilidad medica.
            </p>
            {isLocked && (
              <p className="mt-2 text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Registro firmado y bloqueado
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
