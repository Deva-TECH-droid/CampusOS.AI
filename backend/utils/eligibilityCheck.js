// Core eligibility engine
// Evaluates user profile against event or drive criteria
const checkEligibility = (user, criteria) => {
  const reasons = [];
  // TODO: implement checks for branch, year, cgpa, backlogs
  return { eligible: reasons.length === 0, reasons };
};
module.exports = { checkEligibility };
