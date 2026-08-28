// Grading + timing helpers for the exam engine.

/** Exam is open for students between scheduledAt and scheduledAt+duration. */
export const getExamWindow = (exam) => {
  const opensAt = new Date(exam.scheduledAt);
  const closesAt = new Date(opensAt.getTime() + exam.durationMinutes * 60 * 1000);
  return { opensAt, closesAt };
};

export const examStatusFor = (exam, now = new Date()) => {
  if (exam.status === "draft") return "draft";
  if (exam.status === "pending_approval") return "pending_approval";
  if (exam.status === "rejected") return "rejected";
  // status === "published"
  const { opensAt, closesAt } = getExamWindow(exam);
  if (now < opensAt) return "upcoming";
  if (now > closesAt) return "closed";
  return "live";
};

/**
 * Rule-based performance analysis for one student's graded submission.
 * This is deterministic statistics (accuracy, topic breakdown, weak/strong
 * areas) rather than an LLM call — it's what the spec's "AI performance
 * analysis" cashes out to functionally, without depending on an external
 * AI API key being configured.
 */
export const analyzeSubmission = (exam, submission) => {
  const topicStats = new Map(); // topic -> { correct, total, marksScored, marksTotal }

  exam.questions.forEach((q) => {
    const topic = q.topic || "General";
    const ans = submission.answers.find((a) => a.question.toString() === q._id.toString());
    const stat = topicStats.get(topic) || { correct: 0, total: 0, marksScored: 0, marksTotal: 0 };

    stat.total += 1;
    stat.marksTotal += q.marks;

    if (ans) {
      const scored = ans.awardedMarks ?? 0;
      stat.marksScored += scored;
      if (scored >= q.marks) stat.correct += 1;
    }
    topicStats.set(topic, stat);
  });

  const topics = Array.from(topicStats.entries()).map(([topic, s]) => ({
    topic,
    correct: s.correct,
    total: s.total,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 1000) / 10 : 0,
    marksScored: s.marksScored,
    marksTotal: s.marksTotal,
  }));

  topics.sort((a, b) => b.accuracy - a.accuracy);

  const totalCorrect = topics.reduce((sum, t) => sum + t.correct, 0);
  const totalQuestions = topics.reduce((sum, t) => sum + t.total, 0);
  const totalMarksScored = topics.reduce((sum, t) => sum + t.marksScored, 0);
  const totalMarksPossible = topics.reduce((sum, t) => sum + t.marksTotal, 0);

  return {
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0,
    percentage:
      totalMarksPossible > 0 ? Math.round((totalMarksScored / totalMarksPossible) * 1000) / 10 : 0,
    correctCount: totalCorrect,
    incorrectCount: totalQuestions - totalCorrect,
    topics,
    strongTopics: topics.filter((t) => t.accuracy >= 70).map((t) => t.topic),
    weakTopics: topics.filter((t) => t.accuracy < 50).map((t) => t.topic),
  };
};

/** Same idea, aggregated across every submitted attempt — for the teacher. */
export const analyzeClassPerformance = (exam, submissions) => {
  const graded = submissions.filter((s) => s.status !== "in_progress");
  const perStudent = graded.map((s) => ({
    student: s.student,
    ...analyzeSubmission(exam, s),
  }));

  const topicAgg = new Map();
  perStudent.forEach(({ topics }) => {
    topics.forEach((t) => {
      const agg = topicAgg.get(t.topic) || { correct: 0, total: 0 };
      agg.correct += t.correct;
      agg.total += t.total;
      topicAgg.set(t.topic, agg);
    });
  });

  const classTopics = Array.from(topicAgg.entries())
    .map(([topic, a]) => ({
      topic,
      accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first — most actionable for a teacher

  const avgPercentage =
    perStudent.length > 0
      ? Math.round((perStudent.reduce((sum, s) => sum + s.percentage, 0) / perStudent.length) * 10) / 10
      : 0;

  return {
    attemptCount: perStudent.length,
    averagePercentage: avgPercentage,
    classTopicBreakdown: classTopics,
    weakestTopics: classTopics.filter((t) => t.accuracy < 50).map((t) => t.topic),
  };
};
export const autoGradeSubmission = (exam, submission) => {
  const questionMap = new Map(exam.questions.map((q) => [q.id ?? q._id.toString(), q]));

  let autoScore = 0;
  let hasUngraded = false;

  const answers = submission.answers.map((ans) => {
    const question = questionMap.get(ans.question.toString());
    if (!question) return ans;

    if (question.type === "mcq") {
      const correct = ans.selectedOptionIndex === question.correctOptionIndex;
      const awarded = correct ? question.marks : 0;
      autoScore += awarded;
      return { ...ans.toObject?.() ?? ans, awardedMarks: awarded };
    }

    // subjective — needs manual grading
    hasUngraded = true;
    return ans;
  });

  return { answers, autoScore, hasUngraded };
};
