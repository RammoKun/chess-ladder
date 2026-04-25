import { supabase } from "@/lib/supabase";
import { Admin, Log, Student } from "@/types";
import { generateStudentCode } from "@/utils/studentCode";
import { dedupeTagsCaseInsensitive, isValidTagName, normalizeTagName, tagsEqualCaseInsensitive } from "@/utils/tags";
import { getTierFromScore } from "@/utils/tier";

const STUDENT_COLUMNS =
  "id, name, photo_url, student_code, tags, weekly_points, monthly_points, all_time_points, sessions_attended, attendance_dates, weekly_sessions_attended, admin_notes, tier, created_at";

function normalizeStudent(student: Partial<Student>) {
  return {
    ...student,
    tags: student.tags ?? [],
    sessions_attended: student.sessions_attended ?? 0,
    attendance_dates: student.attendance_dates ?? [],
    weekly_sessions_attended: student.weekly_sessions_attended ?? 0,
    admin_notes: student.admin_notes ?? null,
  } as Student;
}

export async function listStudents() {
  const { data, error } = await supabase.from("students").select(STUDENT_COLUMNS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((student) => normalizeStudent(student as Partial<Student>));
}

export async function getStudentById(studentId: string) {
  const { data, error } = await supabase.from("students").select(STUDENT_COLUMNS).eq("id", studentId).single();
  if (error) throw error;
  return normalizeStudent(data as Partial<Student>);
}

export async function listLogs(studentId?: string) {
  let query = supabase.from("logs").select("id, student_id, action_type, points, created_at").order("created_at", {
    ascending: false,
  });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Log[];
}

export async function listStudentsForParent() {
  const parentColumns = "id, name, photo_url, student_code, tags, weekly_points, monthly_points, all_time_points, tier, created_at";
  const { data, error } = await supabase.from("students").select(parentColumns).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<
    Pick<Student, "id" | "name" | "photo_url" | "student_code" | "tags" | "weekly_points" | "monthly_points" | "all_time_points" | "tier" | "created_at">
  >;
}

export async function createStudent(input: { name: string; photo_url?: string; tags?: string[] }) {
  let studentCode = generateStudentCode();
  let attempts = 0;

  const normalizedTags = dedupeTagsCaseInsensitive((input.tags ?? []).map((tag) => normalizeTagName(tag))).filter((tag) =>
    isValidTagName(tag)
  );

  while (attempts < 5) {
    const { data, error } = await supabase
      .from("students")
      .insert({
        name: input.name,
        photo_url: input.photo_url || null,
        student_code: studentCode,
        tags: normalizedTags,
        weekly_points: 0,
        monthly_points: 0,
        all_time_points: 0,
        sessions_attended: 0,
        attendance_dates: [],
        weekly_sessions_attended: 0,
        admin_notes: null,
        tier: "Pawn",
      })
      .select(STUDENT_COLUMNS)
      .single();

    if (!error) return normalizeStudent(data as Partial<Student>);
    if (error.code !== "23505") throw error;

    attempts += 1;
    studentCode = generateStudentCode();
  }

  throw new Error("Unable to generate a unique student code. Please try again.");
}

export async function applyScoreAction(student: Student, actionType: string, points: number) {
  // Keep score mutation and log insert in order for simple, reliable MVP behavior.
  const updatedAllTime = student.all_time_points + points;
  const updatedPayload = {
    weekly_points: student.weekly_points + points,
    monthly_points: student.monthly_points + points,
    all_time_points: updatedAllTime,
    tier: getTierFromScore(updatedAllTime),
  };

  const { data: updatedStudent, error: updateError } = await supabase
    .from("students")
    .update(updatedPayload)
    .eq("id", student.id)
    .select(STUDENT_COLUMNS)
    .single();

  if (updateError) throw updateError;

  const { error: logError } = await supabase.from("logs").insert({
    student_id: student.id,
    action_type: actionType,
    points,
  });

  if (logError) throw logError;
  return normalizeStudent(updatedStudent as Partial<Student>);
}

export async function applyUnforcedDraw(studentA: Student, studentB: Student) {
  const minusPoints = -3;
  const payloadA = {
    weekly_points: studentA.weekly_points + minusPoints,
    monthly_points: studentA.monthly_points + minusPoints,
    all_time_points: studentA.all_time_points + minusPoints,
    tier: getTierFromScore(studentA.all_time_points + minusPoints),
  };
  const payloadB = {
    weekly_points: studentB.weekly_points + minusPoints,
    monthly_points: studentB.monthly_points + minusPoints,
    all_time_points: studentB.all_time_points + minusPoints,
    tier: getTierFromScore(studentB.all_time_points + minusPoints),
  };

  const [updateA, updateB] = await Promise.all([
    supabase.from("students").update(payloadA).eq("id", studentA.id).select(STUDENT_COLUMNS).single(),
    supabase.from("students").update(payloadB).eq("id", studentB.id).select(STUDENT_COLUMNS).single(),
  ]);

  if (updateA.error) throw updateA.error;
  if (updateB.error) throw updateB.error;

  const { error: logError } = await supabase.from("logs").insert([
    { student_id: studentA.id, action_type: "match_unforced_draw", points: minusPoints },
    { student_id: studentB.id, action_type: "match_unforced_draw", points: minusPoints },
  ]);

  if (logError) throw logError;

  return [normalizeStudent(updateA.data as Partial<Student>), normalizeStudent(updateB.data as Partial<Student>)];
}

export async function listAdmins() {
  const { data, error } = await supabase.from("admins").select("id, email, role").order("email");
  if (error) throw error;
  return (data ?? []) as Admin[];
}

export async function addAdmin(email: string) {
  const { data, error } = await supabase.from("admins").insert({ email, role: "admin" }).select("id, email, role").single();
  if (error) throw error;
  return data as Admin;
}

export async function removeAdmin(adminId: string) {
  const { error } = await supabase.from("admins").delete().eq("id", adminId);
  if (error) throw error;
}

export async function resetWeeklyScores() {
  const rpcResult = await supabase.rpc("reset_weekly_scores_manually");
  if (!rpcResult.error) return;

  const fallback = await supabase.from("students").update({ weekly_points: 0 }).not("id", "is", null);
  if (fallback.error) throw fallback.error;
}

export async function resetMonthlyScores() {
  const { error } = await supabase.from("students").update({ monthly_points: 0 }).gte("monthly_points", -99999);
  if (error) throw error;
}

export async function applyCustomPoints(student: Student, points: number, note: string) {
  const updatedAllTime = student.all_time_points + points;
  const updatedPayload = {
    weekly_points: student.weekly_points + points,
    monthly_points: student.monthly_points + points,
    all_time_points: updatedAllTime,
    tier: getTierFromScore(updatedAllTime),
  };

  const { data: updatedStudent, error: updateError } = await supabase
    .from("students")
    .update(updatedPayload)
    .eq("id", student.id)
    .select(STUDENT_COLUMNS)
    .single();

  if (updateError) throw updateError;

  const sanitizedNote = note.trim();
  const { error: logError } = await supabase.from("logs").insert({
    student_id: student.id,
    action_type: sanitizedNote ? `custom_points: ${sanitizedNote}` : "custom_points",
    points,
  });

  if (logError) throw logError;
  return normalizeStudent(updatedStudent as Partial<Student>);
}

export async function renameStudent(studentId: string, name: string) {
  const { data, error } = await supabase.from("students").update({ name }).eq("id", studentId).select(STUDENT_COLUMNS).single();
  if (error) throw error;
  return normalizeStudent(data as Partial<Student>);
}

export async function deleteStudent(studentId: string) {
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw error;
}

export async function markStudentSession(student: Student) {
  const { data, error } = await supabase
    .from("students")
    .update({
      sessions_attended: student.sessions_attended + 1,
      weekly_sessions_attended: student.weekly_sessions_attended + 1,
    })
    .eq("id", student.id)
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw error;

  const { error: logError } = await supabase.from("logs").insert({
    student_id: student.id,
    action_type: "mark_session",
    points: 0,
  });
  if (logError) throw logError;

  return normalizeStudent(data as Partial<Student>);
}

export async function addTagToStudent(studentId: string, tagName: string) {
  const normalizedTag = normalizeTagName(tagName);
  if (!normalizedTag) throw new Error("Tag cannot be empty.");
  if (!isValidTagName(normalizedTag)) throw new Error("Tag must be 1-50 chars and only use letters, numbers, spaces, - or _.");

  const student = await getStudentById(studentId);
  const existingTags = student.tags ?? [];
  if (existingTags.some((tag) => tagsEqualCaseInsensitive(tag, normalizedTag))) {
    throw new Error("Tag already exists for this student.");
  }

  const nextTags = dedupeTagsCaseInsensitive([...existingTags, normalizedTag]);
  const { data, error } = await supabase.from("students").update({ tags: nextTags }).eq("id", studentId).select(STUDENT_COLUMNS).single();
  if (error) throw error;
  return normalizeStudent(data as Partial<Student>);
}

export async function removeTagFromStudent(studentId: string, tagName: string) {
  const normalizedTag = normalizeTagName(tagName);
  const student = await getStudentById(studentId);
  const nextTags = (student.tags ?? []).filter((tag) => !tagsEqualCaseInsensitive(tag, normalizedTag));
  const { data, error } = await supabase.from("students").update({ tags: nextTags }).eq("id", studentId).select(STUDENT_COLUMNS).single();
  if (error) throw error;
  return normalizeStudent(data as Partial<Student>);
}

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_all_unique_tags");
  if (!error && Array.isArray(data)) {
    return dedupeTagsCaseInsensitive(data.map((tag) => String(tag)));
  }

  const fallback = await listStudents();
  return dedupeTagsCaseInsensitive(fallback.flatMap((student) => student.tags ?? []));
}

export async function updateTagName(oldName: string, newName: string) {
  const oldNormalized = normalizeTagName(oldName);
  const newNormalized = normalizeTagName(newName);
  if (!oldNormalized || !newNormalized) throw new Error("Tag names cannot be empty.");
  if (!isValidTagName(newNormalized)) throw new Error("Tag must be 1-50 chars and only use letters, numbers, spaces, - or _.");

  const students = await listStudents();
  const updates = students
    .filter((student) => (student.tags ?? []).some((tag) => tagsEqualCaseInsensitive(tag, oldNormalized)))
    .map(async (student) => {
      const replaced = (student.tags ?? []).map((tag) => (tagsEqualCaseInsensitive(tag, oldNormalized) ? newNormalized : tag));
      const nextTags = dedupeTagsCaseInsensitive(replaced);
      const { error } = await supabase.from("students").update({ tags: nextTags }).eq("id", student.id);
      if (error) throw error;
    });

  await Promise.all(updates);
}

export async function deleteTagFromAllStudents(tagName: string) {
  const normalizedTag = normalizeTagName(tagName);
  const students = await listStudents();
  const updates = students
    .filter((student) => (student.tags ?? []).some((tag) => tagsEqualCaseInsensitive(tag, normalizedTag)))
    .map(async (student) => {
      const nextTags = (student.tags ?? []).filter((tag) => !tagsEqualCaseInsensitive(tag, normalizedTag));
      const { error } = await supabase.from("students").update({ tags: nextTags }).eq("id", student.id);
      if (error) throw error;
    });
  await Promise.all(updates);
}

export async function getStudentsByTag(tagName: string) {
  const normalizedTag = normalizeTagName(tagName);
  const students = await listStudents();
  return students.filter((student) => (student.tags ?? []).some((tag) => tagsEqualCaseInsensitive(tag, normalizedTag)));
}

export async function mergeTags(fromTag: string, toTag: string) {
  const fromNormalized = normalizeTagName(fromTag);
  const toNormalized = normalizeTagName(toTag);
  if (!fromNormalized || !toNormalized) throw new Error("Both tags are required.");
  if (!isValidTagName(toNormalized)) throw new Error("Target tag must be valid.");

  const students = await listStudents();
  const updates = students
    .filter((student) => (student.tags ?? []).some((tag) => tagsEqualCaseInsensitive(tag, fromNormalized)))
    .map(async (student) => {
      const replaced = (student.tags ?? []).map((tag) => (tagsEqualCaseInsensitive(tag, fromNormalized) ? toNormalized : tag));
      const nextTags = dedupeTagsCaseInsensitive(replaced);
      const { error } = await supabase.from("students").update({ tags: nextTags }).eq("id", student.id);
      if (error) throw error;
    });

  await Promise.all(updates);
}
