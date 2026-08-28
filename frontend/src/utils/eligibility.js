// Client-side only — for UI feedback
// Real check always happens server-side
export const checkEligibility = (user, criteria) => {
  const reasons = []
  if (criteria.eligibleBranches?.length && !criteria.eligibleBranches.includes(user.branch))
    reasons.push(`Open to ${criteria.eligibleBranches.join(', ')} only`)
  if (criteria.eligibleYears?.length && !criteria.eligibleYears.includes(user.year))
    reasons.push(`Open to year ${criteria.eligibleYears.join(', ')} only`)
  if (criteria.minCGPA && user.cgpa < criteria.minCGPA)
    reasons.push(`Minimum CGPA ${criteria.minCGPA} required`)
  return { eligible: reasons.length === 0, reasons }
}
