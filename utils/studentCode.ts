const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateStudentCode(length = 6): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * ALPHANUMERIC.length);
    value += ALPHANUMERIC[randomIndex];
  }
  return value;
}
