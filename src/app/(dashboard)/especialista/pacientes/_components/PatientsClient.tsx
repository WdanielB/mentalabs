"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, AlertCircle, ClipboardList, X, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '../../../../../../utils/supabase/client'
import { differenceInYears } from 'date-fns'
import type { SafePatient } from '../../../../../lib/especialista/patients'

interface PublishedExam {
  id: string
  title: string
  description: string | null
  question_count: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactivo', color: 'bg-slate-100 text-slate-500' },
  in_treatment: { label: 'En tratamiento', color: 'bg-blue-100 text-[#136dec]' },
}

interface Props {
  initialPatients: SafePatient[]
  specialistId: string
}

export default function PatientsClient({ initialPatients, specialistId }: Props) {
  const [patients, setPatients] = useState<SafePatient[]>(initialPatients)
  const [search, setSearch] = useState('')

  const [assignTarget, setAssignTarget] = useState<SafePatient | null>(null)
  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([])
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [loadingExams, setLoadingExams] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignedFlash, setAssignedFlash] = useState(false)

  const filtered = search
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      )
    : patients

  const openAssignModal = async (patient: SafePatient) => {
    setAssignTarget(patient)
    setSelectedExam(null)
    setAssignedFlash(false)
    setLoadingExams(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('exams')
      .select('id, title, description')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      const ids = data.map((e: any) => e.id)
      const { data: qCounts } = await supabase.from('questions').select('exam_id').in('exam_id', ids)
      const cMap: Record<string, number> = {}
      qCounts?.forEach((q: any) => { cMap[q.exam_id] = (cMap[q.exam_id] ?? 0) + 1 })
      setPublishedExams(data.map((e: any) => ({ ...e, question_count: cMap[e.id] ?? 0 })))
    } else {
      setPublishedExams([])
    }
    setLoadingExams(false)
  }

  const handleAssign = async () => {
    if (!assignTarget || !selectedExam) return
    setAssigning(true)
    const supabase = createClient()
    await supabase.from('exam_attempts').insert({
      patient_id: assignTarget.id,
      exam_id: selectedExam,
      assigned_by: specialistId,
      status: 'pending',
    })
    setAssigning(false)
    setAssignedFlash(true)

    setPatients((prev) =>
      prev.map((p) =>
        p.id === assignTarget.id ? { ...p, pendingExams: p.pendingExams + 1 } : p
      )
    )

    setTimeout(() => {
      setAssignTarget(null)
      setAssignedFlash(false)
    }, 1500)
  }

  const getAge = (birth_date: string | null) =>
    birth_date ? `${differenceInYears(new Date(), new Date(birth_date))} años` : '—'

  return (
    <>
      <p className="text-slate-500 text-sm mb-6">
        {patients.length} paciente{patients.length !== 1 ? 's' : ''} en total
      </p>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Último Examen</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-semibold text-slate-500">
              {search ? 'Sin resultados para esa búsqueda' : 'Aún no tienes pacientes'}
            </p>
          </div>
        )}

        {filtered.map((p) => {
          const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active
          return (
            <div
              key={p.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center"
            >
              <div className="col-span-2 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{p.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {p.email} · {getAge(p.birth_date)}
                  </p>
                </div>
                {p.pendingExams > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full shrink-0">
                    <AlertCircle className="h-3 w-3" />
                    {p.pendingExams}
                  </span>
                )}
              </div>

              <div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${st.color}`}>
                  {st.label}
                </span>
              </div>

              <div className="min-w-0">
                {p.lastExamTitle ? (
                  <>
                    <p className="text-sm font-medium truncate">{p.lastExamTitle}</p>
                    {p.lastScore !== null && (
                      <p className="text-xs text-slate-400">Score: {p.lastScore}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Sin exámenes</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/especialista/pacientes/${p.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all"
                >
                  Ver Historia
                </Link>
                <button
                  onClick={() => openAssignModal(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#136dec]/10 text-[#136dec] hover:bg-[#136dec] hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  <ClipboardList className="h-3.5 w-3.5" /> Asignar Examen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assignment Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base">Asignar Examen</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Para: <span className="font-semibold">{assignTarget.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => setAssignTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              {loadingExams && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#136dec]" />
                </div>
              )}

              {!loadingExams && publishedExams.length === 0 && (
                <div className="text-center py-10">
                  <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-500 text-sm">Sin exámenes publicados</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Crea y publica un examen desde "Mis Exámenes".
                  </p>
                </div>
              )}

              {assignedFlash && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="h-6 w-6 text-[#0bda5e] shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-700">¡Examen asignado!</p>
                    <p className="text-xs text-green-600">El paciente lo verá en su dashboard.</p>
                  </div>
                </div>
              )}

              {!assignedFlash &&
                publishedExams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => setSelectedExam(exam.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left mb-2 border-2 transition-all ${
                      selectedExam === exam.id
                        ? 'border-[#136dec] bg-blue-50'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedExam === exam.id
                          ? 'bg-[#136dec] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{exam.title}</p>
                      {exam.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{exam.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {exam.question_count} pregunta{exam.question_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedExam === exam.id && (
                      <CheckCircle2 className="h-5 w-5 text-[#136dec] shrink-0 ml-auto" />
                    )}
                  </button>
                ))}
            </div>

            {!assignedFlash && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedExam || assigning}
                  className="flex items-center gap-2 px-5 py-2 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md shadow-[#136dec]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  Asignar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
