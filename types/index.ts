export type Tier = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";

export interface Student {
  id: string;
  name: string;
  photo_url: string | null;
  student_code: string;
  tags: string[];
  weekly_points: number;
  monthly_points: number;
  all_time_points: number;
  sessions_attended: number;
  attendance_dates: string[];
  weekly_sessions_attended: number;
  admin_notes: string | null;
  tier: Tier;
  created_at: string;
}

export interface Log {
  id: string;
  student_id: string;
  action_type: string;
  points: number;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  role: "admin";
}

export interface ScoreAction {
  label: string;
  actionType: string;
  points: number;
  category: "MATCH" | "BEHAVIOR" | "GROWTH";
}
