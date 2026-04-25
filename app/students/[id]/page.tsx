import { StudentProfileClient } from "@/app/students/[id]/StudentProfileClient";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentProfileClient studentId={id} />;
}
