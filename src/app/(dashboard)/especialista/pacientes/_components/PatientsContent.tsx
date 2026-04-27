import { redirect } from 'next/navigation'
import { WifiOff } from 'lucide-react'
import { getSpecialistPatients, AuthError } from '../../../../../lib/especialista/patients'
import PatientsClient from './PatientsClient'

export default async function PatientsContent() {
  try {
    const { patients, specialistId } = await getSpecialistPatients()
    return <PatientsClient initialPatients={patients} specialistId={specialistId} />
  } catch (err) {
    if (err instanceof AuthError) redirect('/login')
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 text-center">
        <WifiOff className="h-10 w-10 mx-auto mb-4 text-slate-300" />
        <p className="font-semibold text-slate-500 mb-1">No se pudieron cargar los pacientes</p>
        <p className="text-sm text-slate-400 mb-5">Verifica tu conexión e intenta de nuevo</p>
        <a
          href="/especialista/pacientes"
          className="inline-flex items-center px-4 py-2 bg-[#136dec] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all"
        >
          Reintentar
        </a>
      </div>
    )
  }
}
