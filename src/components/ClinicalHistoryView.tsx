"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "../../utils/supabase/client";
import { format, differenceInYears, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText, Lock, Save, Download, Clock, CheckCircle2,
  ChevronDown, ChevronUp, X, Brain, Stethoscope, ClipboardList,
  BookOpen, MessageSquare, Tag, AlertCircle
} from "lucide-react";
import type {
  InterventionCode,
  DiagnosisCategory,
  ClinicalRecordData,
  AppointmentTimeline,
  PatientExamSummary,
} from "../actions/specialists";
import {
  listInterventionCodes,
  listDiagnosisCategories,
  loadClinicalRecord,
  saveClinicalRecordDraft,
  signClinicalRecord,
  loadPatientTimeline,
  loadPatientExamSummaries,
} from "../actions/specialists";

interface Props {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientBirthDate?: string | null;
  specialistId: string;
  specialistName?: string;
}

const CONDITION_COLORS: Record<string, string> = {
  TEA:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  TDAH: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DI:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const CATEGORY_COLORS: Record<string, string> = {
  Psicoterapia:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  Intervención:   "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  Evaluación:     "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Habilitación:   "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800",
  Psicoeducación: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
};

export default function ClinicalHistoryView({
  appointmentId,
  patientId,
  patientName,
  patientBirthDate,
  specialistId,
  specialistName = "Especialista",
}: Props) {
  const [record, setRecord] = useState<ClinicalRecordData | null>(null);
  const [timeline, setTimeline] = useState<AppointmentTimeline[]>([]);
  const [exams, setExams] = useState<PatientExamSummary[]>([]);
  const [interventionCodes, setInterventionCodes] = useState<InterventionCode[]>([]);
  const [diagCategories, setDiagCategories] = useState<DiagnosisCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [diagConditionFilter, setDiagConditionFilter] = useState<string>("TEA");
  const [diagAgeFilter, setDiagAgeFilter] = useState<string>("6-12");
  const [showDiagPicker, setShowDiagPicker] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      const [rec, tl, ex, codes, cats] = await Promise.all([
        loadClinicalRecord(appointmentId),
        loadPatientTimeline(patientId, specialistId),
        loadPatientExamSummaries(patientId),
        listInterventionCodes(),
        listDiagnosisCategories(),
      ]);
      setRecord(rec);
      setTimeline(tl);
      setExams(ex);
      setInterventionCodes(codes);
      setDiagCategories(cats);
      setLoading(false);
    };
    init();
  }, [appointmentId, patientId, specialistId]);

  // Auto-save draft with debounce
  const autoSave = useCallback(
    (updatedRecord: ClinicalRecordData) => {
      if (updatedRecord.status === "signed_and_locked") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          await saveClinicalRecordDraft(appointmentId, patientId, {
            consultation_reason: updatedRecord.consultation_reason,
            clinical_evolution:  updatedRecord.clinical_evolution,
            diagnostic_codes:    updatedRecord.diagnostic_codes,
            treatment_plan:      updatedRecord.treatment_plan,
            intervention_codes:  updatedRecord.intervention_codes,
            observations:        updatedRecord.observations,
          });
        } catch {
          setSaveError("Error al guardar borrador");
        }
        setSaving(false);
      }, 2000);
    },
    [appointmentId, patientId]
  );

  const update = (patch: Partial<ClinicalRecordData>) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      autoSave(next);
      return next;
    });
  };

  const handleSign = async () => {
    if (!record) return;
    if (!confirm("¿Confirmas firmar este registro? No podrás editarlo después.")) return;
    setSigning(true);
    try {
      // Save latest state first
      await saveClinicalRecordDraft(appointmentId, patientId, {
        consultation_reason: record.consultation_reason,
        clinical_evolution:  record.clinical_evolution,
        diagnostic_codes:    record.diagnostic_codes,
        treatment_plan:      record.treatment_plan,
        intervention_codes:  record.intervention_codes,
        observations:        record.observations,
      });
      await signClinicalRecord(appointmentId);
      setRecord((prev) => prev ? { ...prev, status: "signed_and_locked", signed_at: new Date().toISOString() } : prev);
    } catch {
      alert("Error al firmar el registro. Intenta nuevamente.");
    }
    setSigning(false);
  };

  const handleExportPDF = async () => {
    if (!record) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const today = format(new Date(), "d 'de' MMMM yyyy", { locale: es });
      const age = patientBirthDate
        ? `${differenceInYears(new Date(), parseISO(patientBirthDate))} años`
        : "";

      doc.setFontSize(18);
      doc.text("MentaLabs — Registro de Sesión", 20, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Paciente: ${patientName}${age ? ` · ${age}` : ""}`, 20, 32);
      doc.text(`Especialista: ${specialistName}`, 20, 39);
      doc.text(`Fecha: ${today}`, 20, 46);
      doc.text(
        `Estado: ${record.status === "signed_and_locked" ? "Firmado y bloqueado" : "Borrador"}`,
        20, 53
      );

      let y = 65;
      const addSection = (title: string, content: string) => {
        if (!content.trim()) return;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(30);
        doc.text(title, 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(70);
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 8;
      };

      addSection("Motivo de Consulta", record.consultation_reason);
      addSection("Evolución Clínica", record.clinical_evolution);

      if (record.diagnostic_codes.length > 0) {
        addSection("Diagnóstico (CIE-10)", record.diagnostic_codes.join(", "));
      }

      addSection("Plan de Tratamiento", record.treatment_plan);

      if (record.intervention_codes.length > 0) {
        const codeNames = record.intervention_codes.map((ic) => {
          const found = interventionCodes.find((c) => c.code === ic);
          return found ? `${ic} — ${found.name}` : ic;
        });
        addSection("Códigos de Intervención", codeNames.join("\n"));
      }

      addSection("Observaciones", record.observations);

      doc.save(`sesion-${patientName.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch {
      alert("Error al generar el PDF.");
    }
  };

  const toggleInterventionCode = (code: string) => {
    if (!record) return;
    const current = record.intervention_codes;
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    update({ intervention_codes: next });
  };

  const addDiagCode = (code: string) => {
    if (!record || !code.trim()) return;
    const trimmed = code.trim().toUpperCase();
    if (!record.diagnostic_codes.includes(trimmed)) {
      update({ diagnostic_codes: [...record.diagnostic_codes, trimmed] });
    }
  };

  const removeDiagCode = (code: string) => {
    if (!record) return;
    update({ diagnostic_codes: record.diagnostic_codes.filter((c) => c !== code) });
  };

  const isLocked = record?.status === "signed_and_locked";
  const age = patientBirthDate
    ? `${differenceInYears(new Date(), parseISO(patientBirthDate))} años`
    : null;

  const filteredCategories = diagCategories.filter(
    (c) => c.condition === diagConditionFilter && c.age_group === diagAgeFilter
  );

  const groupedCodes = interventionCodes.reduce<Record<string, InterventionCode[]>>(
    (acc, c) => { (acc[c.category] = acc[c.category] ?? []).push(c); return acc; },
    {}
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-[#111822]">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#136dec] border-t-transparent" />
          Cargando registro clínico...
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100">

      {/* ── LEFT PANEL: Timeline ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] overflow-y-auto">
        <div className="px-4 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Sesiones</h3>
        </div>
        <div className="p-3 space-y-2">
          {timeline.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Sin sesiones anteriores</p>
          )}
          {timeline.map((apt) => {
            const isCurrent = apt.id === appointmentId;
            return (
              <div
                key={apt.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10"
                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111822]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">
                    {format(parseISO(apt.start_time), "d MMM yyyy", { locale: es })}
                  </span>
                  {apt.record_status === "signed_and_locked" ? (
                    <Lock className="h-3 w-3 text-slate-400" />
                  ) : apt.record_status === "draft" ? (
                    <Clock className="h-3 w-3 text-amber-500" />
                  ) : null}
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isCurrent ? "Sesión actual" : `Cita — ${apt.status}`}
                </p>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── CENTER PANEL: SS Form ── */}
      <main className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#1a2432] overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a2432] flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{patientName}</h2>
            {age && <p className="text-xs text-slate-500 mt-0.5">{age}</p>}
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-slate-400 italic flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-[#136dec]" />
                Guardando...
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {saveError}
              </span>
            )}
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              isLocked
                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            }`}>
              {isLocked ? (
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Firmado</span>
              ) : (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Borrador</span>
              )}
            </span>
          </div>
        </header>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. Motivo de Consulta */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Motivo de Consulta
            </label>
            <textarea
              rows={3}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#111822] text-sm text-slate-600 dark:text-slate-400 disabled:cursor-not-allowed resize-none"
              value={record.consultation_reason}
              onChange={(e) => update({ consultation_reason: e.target.value })}
              disabled={isLocked}
              placeholder="Describe el motivo de esta sesión..."
            />
          </section>

          {/* 2. Evolución Clínica */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Brain className="h-4 w-4 text-slate-400" />
              Evolución Clínica
              <span className="text-xs font-normal text-slate-400">(solo visible para ti)</span>
            </label>
            <textarea
              rows={5}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none disabled:bg-slate-50 dark:disabled:bg-[#111822] disabled:text-slate-500 resize-none transition-all bg-white dark:bg-[#111822]"
              placeholder="Describe el avance de la sesión, observaciones conductuales, respuesta al tratamiento..."
              value={record.clinical_evolution}
              onChange={(e) => update({ clinical_evolution: e.target.value })}
              disabled={isLocked}
            />
          </section>

          {/* 3. Diagnóstico */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Stethoscope className="h-4 w-4 text-slate-400" />
              Diagnóstico
            </label>

            {/* TEA/TDAH/DI category picker */}
            {!isLocked && (
              <div className="mb-3">
                <button
                  onClick={() => setShowDiagPicker((v) => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#136dec] hover:underline mb-2"
                >
                  {showDiagPicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Seleccionar categoría TEA / TDAH / DI
                </button>

                {showDiagPicker && (
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#111822] space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {["TEA", "TDAH", "DI"].map((cond) => (
                        <button
                          key={cond}
                          onClick={() => setDiagConditionFilter(cond)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            diagConditionFilter === cond
                              ? CONDITION_COLORS[cond]
                              : "bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {["0-6", "6-12", "12-17", "18+"].map((ag) => (
                        <button
                          key={ag}
                          onClick={() => setDiagAgeFilter(ag)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            diagAgeFilter === ag
                              ? "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900"
                              : "bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 text-slate-500"
                          }`}
                        >
                          {ag} años
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (cat.cie_code) addDiagCode(cat.cie_code);
                            setShowDiagPicker(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 hover:border-[#136dec] hover:bg-blue-50 dark:hover:bg-[#136dec]/10 transition-all text-left"
                        >
                          <span className="text-sm font-semibold">{cat.type_label}</span>
                          <span className="text-xs text-slate-400">{cat.cie_code}</span>
                        </button>
                      ))}
                      {filteredCategories.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">Sin categorías para este filtro</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CIE-10 codes */}
            <div className="flex flex-wrap gap-2 mb-2">
              {record.diagnostic_codes.map((code) => (
                <span key={code} className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-bold">
                  {code}
                  {!isLocked && (
                    <button onClick={() => removeDiagCode(code)} className="ml-0.5 hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!isLocked && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("cie") as HTMLInputElement);
                  addDiagCode(input.value);
                  input.value = "";
                }}
                className="flex gap-2"
              >
                <input
                  name="cie"
                  type="text"
                  className="flex-1 h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-[#111822] focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none"
                  placeholder="Añadir código CIE-10 (ej. F84.0)"
                />
                <button type="submit" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
                  Añadir
                </button>
              </form>
            )}
          </section>

          {/* 4. Plan de Tratamiento */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              Plan de Tratamiento
              <span className="text-xs font-normal text-slate-400">(visible para el paciente)</span>
            </label>
            <textarea
              rows={4}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none disabled:bg-slate-50 dark:disabled:bg-[#111822] disabled:text-slate-500 resize-none transition-all bg-white dark:bg-[#111822]"
              placeholder="Ej. TCC semanal, sesiones de habilidades sociales, coordinación con fonoaudiología..."
              value={record.treatment_plan}
              onChange={(e) => update({ treatment_plan: e.target.value })}
              disabled={isLocked}
            />
          </section>

          {/* 5. Códigos de Intervención */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Tag className="h-4 w-4 text-slate-400" />
              Códigos de Intervención Psicológica
            </label>

            {/* Selected codes */}
            {record.intervention_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {record.intervention_codes.map((code) => {
                  const found = interventionCodes.find((c) => c.code === code);
                  return (
                    <span key={code} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      CATEGORY_COLORS[found?.category ?? "Evaluación"] ?? CATEGORY_COLORS.Evaluación
                    }`}>
                      <span className="font-mono">{code}</span>
                      <span className="hidden sm:inline">— {found?.name}</span>
                      {!isLocked && (
                        <button onClick={() => toggleInterventionCode(code)} className="ml-0.5 hover:opacity-60 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {!isLocked && (
              <div>
                <button
                  onClick={() => setShowCodePicker((v) => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#136dec] hover:underline"
                >
                  {showCodePicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showCodePicker ? "Cerrar catálogo" : "Seleccionar del catálogo"}
                </button>

                {showCodePicker && (
                  <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {Object.entries(groupedCodes).map(([category, codes]) => (
                      <div key={category}>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-[#111822] border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {codes.map((c) => {
                            const selected = record.intervention_codes.includes(c.code);
                            return (
                              <button
                                key={c.code}
                                onClick={() => toggleInterventionCode(c.code)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                                  selected
                                    ? "bg-blue-50 dark:bg-[#136dec]/10"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs font-bold text-slate-500 w-14">{c.code}</span>
                                  <span className="text-sm">{c.name}</span>
                                </div>
                                {selected && <CheckCircle2 className="h-4 w-4 text-[#136dec] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 6. Observaciones */}
          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <BookOpen className="h-4 w-4 text-slate-400" />
              Observaciones
            </label>
            <textarea
              rows={3}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none disabled:bg-slate-50 dark:disabled:bg-[#111822] disabled:text-slate-500 resize-none transition-all bg-white dark:bg-[#111822]"
              placeholder="Observaciones adicionales sobre el paciente en esta sesión..."
              value={record.observations}
              onChange={(e) => update({ observations: e.target.value })}
              disabled={isLocked}
            />
          </section>

          {/* Signed info */}
          {isLocked && record.signed_at && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-[#111822] rounded-xl border border-slate-200 dark:border-slate-800">
              <Lock className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Registro firmado y bloqueado</p>
                <p className="text-xs text-slate-400">
                  {format(parseISO(record.signed_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a2432] flex justify-between items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
          <div className="flex items-center gap-2">
            {!isLocked && (
              <>
                <button
                  onClick={() => {
                    if (!record) return;
                    saveClinicalRecordDraft(appointmentId, patientId, {
                      consultation_reason: record.consultation_reason,
                      clinical_evolution:  record.clinical_evolution,
                      diagnostic_codes:    record.diagnostic_codes,
                      treatment_plan:      record.treatment_plan,
                      intervention_codes:  record.intervention_codes,
                      observations:        record.observations,
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" /> Guardar borrador
                </button>
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#136dec] hover:bg-blue-600 rounded-xl shadow-md shadow-[#136dec]/20 transition-all disabled:opacity-50"
                >
                  {signing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Firmar y Cerrar
                </button>
              </>
            )}
          </div>
        </footer>
      </main>

      {/* ── RIGHT PANEL: Diagnostic support ── */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111822] overflow-y-auto">
        <div className="px-4 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apoyo Diagnóstico</h3>
        </div>

        <div className="p-3 space-y-3">
          {/* Exams section */}
          <div className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111822]">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Evaluaciones Completadas
              </span>
            </div>
            <div className="p-3 space-y-2">
              {exams.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  Sin evaluaciones completadas
                </p>
              )}
              {exams.map((exam) => (
                <div key={exam.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111822]">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{exam.exam_title}</p>
                  <div className="flex items-center justify-between mt-1">
                    {exam.total_score !== null && (
                      <span className="text-xs font-bold text-[#136dec]">Score: {exam.total_score}</span>
                    )}
                    {exam.subcategory && (
                      <span className="text-xs text-slate-500 truncate ml-1">{exam.subcategory}</span>
                    )}
                  </div>
                  {exam.completed_at && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(parseISO(exam.completed_at), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Codes reference */}
          <div className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111822]">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Intervenciones Activas
              </span>
            </div>
            <div className="p-3">
              {record.intervention_codes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3 italic">Sin códigos seleccionados</p>
              ) : (
                <div className="space-y-1.5">
                  {record.intervention_codes.map((code) => {
                    const found = interventionCodes.find((c) => c.code === code);
                    return (
                      <div key={code} className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 w-14 shrink-0">{code}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{found?.name ?? code}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
