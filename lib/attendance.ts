import { supabase } from "@/lib/supabase";
import { Student } from "@/types";

const ATTENDANCE_COLUMNS = "id, sessions_attended, attendance_dates";

export async function markAttendance(studentId: string, addSessionOnly = false) {
  const today = new Date().toISOString().split("T")[0];
  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select(ATTENDANCE_COLUMNS)
    .eq("id", studentId)
    .single();

  if (fetchError) throw fetchError;

  const attendanceDates = ((student as Partial<Student>).attendance_dates ?? []) as string[];
  const alreadyMarkedToday = attendanceDates.includes(today);

  if (!addSessionOnly && alreadyMarkedToday) {
    throw new Error("Already marked present today. Use 'Add Session' for extra batches.");
  }

  const nextAttendanceDates = addSessionOnly ? attendanceDates : [...attendanceDates, today];
  const currentSessions = Number((student as Partial<Student>).sessions_attended ?? 0);
  const { error: updateError } = await supabase
    .from("students")
    .update({
      sessions_attended: currentSessions + 1,
      attendance_dates: nextAttendanceDates,
    })
    .eq("id", studentId);

  if (updateError) throw updateError;

  const actionType = addSessionOnly ? "attendance_add_session" : "attendance_mark_present";
  const { error: logError } = await supabase.from("logs").insert({
    student_id: studentId,
    action_type: actionType,
    points: 0,
  });
  if (logError) throw logError;
}
