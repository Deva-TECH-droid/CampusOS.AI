// Extracted from drive.controller.js, where this logic previously lived as
// a local, unexported helper. Centralizing it here means anything that
// needs to check placement-drive eligibility -- the drives list/detail
// endpoints, and eventually the campus chatbot's eligibility tool -- uses
// this exact function, so the rule can never drift between call sites.

export const checkEligibility = (drive, user) => {
  const reasons = [];

  if (drive.minCGPA > 0 && user.cgpa < drive.minCGPA)
    reasons.push(`Min CGPA ${drive.minCGPA} required (yours: ${user.cgpa})`);

  if (
    drive.eligibleBranches?.length > 0 &&
    !drive.eligibleBranches.includes(user.branch)
  )
    reasons.push(`Open to ${drive.eligibleBranches.join(", ")} only`);

  if (drive.minYear && user.year < drive.minYear)
    reasons.push(`Min year ${drive.minYear} required`);

  if (drive.maxYear && user.year > drive.maxYear)
    reasons.push(`Open to year ${drive.maxYear} and below`);

  if (drive.maxBacklogs !== undefined && user.backlogs > drive.maxBacklogs)
    reasons.push(
      `Maximum of ${drive.maxBacklogs} backlogs allowed (yours: ${user.backlogs})`,
    );

  return { eligible: reasons.length === 0, reasons };
};