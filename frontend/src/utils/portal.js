// Maps a user's backend role to which Login-page portal tab represents
// them, so we can send someone back to the right tab after logging out.
export const roleToPortal = (role) => {
  if (role === "faculty") return "teacher";
  if (role === "superadmin") return "admin";
  return "student"; // student, classrep, alumni
};