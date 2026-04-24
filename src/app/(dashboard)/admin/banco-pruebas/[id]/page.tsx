import ExamEditor from "../../../../../components/ExamEditor";

export default async function AdminExamEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExamEditor examId={id} backHref="/admin/banco-pruebas" />;
}
