import { Suspense } from 'react'
import { PatientsSkeleton } from './loading'
import PatientsContent from './_components/PatientsContent'
import RefreshButton from '../../../../components/RefreshButton'
import { revalidateSpecialistPatientsCache } from '../../../../actions/cache'

export default function PacientesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black">Mis Pacientes</h1>
        <RefreshButton action={revalidateSpecialistPatientsCache} />
      </div>
      <Suspense fallback={<PatientsSkeleton />}>
        <PatientsContent />
      </Suspense>
    </div>
  )
}
