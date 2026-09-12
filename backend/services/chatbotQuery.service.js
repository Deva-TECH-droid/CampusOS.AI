import Event from "../models/Event.js";
import Club from "../models/Club.js";
import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import PlacementDrive from "../models/PlacementDrive.js";
import AlumniTalk from "../models/AlumniTalk.js";
import Announcement from "../models/Announcement.js";
import Notice from "../models/Notice.js";

/**
 * Intelligent CampusOS knowledge querying engine.
 * Performs real-time semantic extraction and queries actual database models.
 * Strictly avoids hallucinating information — returns unavailability notices if data is absent.
 */
export const answerCampusQuery = async (queryText, user) => {
  const query = (queryText || "").trim();
  const lower = query.toLowerCase();

  // 1. Check for Teacher / Faculty specific inquiries
  // e.g. "What subject does Mr. Rohit teach?", "Which classes does Devansh teach?", "Who teaches Java?"
  const teacherSubjectMatch = lower.match(/(?:who teaches|what subject does|which subject does|which class does|which classes does|classes does|subject does)\s+(?:mr\.?|ms\.?|dr\.?|prof\.?)?\s*([a-z0-9_\s]+)/i);
  const teacherNameDirectMatch = lower.match(/(?:mr\.?|ms\.?|dr\.?|prof\.?)\s*([a-z]+)/i);

  if (
    lower.includes("teach") ||
    lower.includes("faculty") ||
    lower.includes("professor") ||
    teacherNameDirectMatch
  ) {
    const facultyMembers = await User.find({ role: "faculty" })
      .select("firstName lastName email department requestedSubjects facultyAssignments")
      .populate("facultyAssignments.classroom", "className branch year section")
      .lean();

    // Check if query is asking about a specific teacher
    let matchedFaculty = null;
    for (const f of facultyMembers) {
      const fullName = `${f.firstName} ${f.lastName}`.toLowerCase();
      const first = f.firstName.toLowerCase();
      const last = f.lastName.toLowerCase();
      if (lower.includes(fullName) || lower.includes(first) || (last && lower.includes(last))) {
        matchedFaculty = f;
        break;
      }
    }

    if (matchedFaculty) {
      const name = `Mr. ${matchedFaculty.firstName} ${matchedFaculty.lastName}`;
      const assignments = matchedFaculty.facultyAssignments || [];

      if (assignments.length === 0) {
        if (matchedFaculty.requestedSubjects?.length) {
          return `${name} is registered for ${matchedFaculty.requestedSubjects.join(", ")} in the ${matchedFaculty.department || "academic"} department. Class schedules are currently being finalized.`;
        }
        return `${name} is registered in the ${matchedFaculty.department || "Faculty"} department, but no classroom assignments are currently scheduled.`;
      }

      const assignmentSummaries = assignments.map((a) => {
        const clsName = a.classroom?.className || "assigned class";
        return `${a.subject} to ${clsName}`;
      });

      // Find timetables for timings if available
      const classroomIds = assignments.map((a) => a.classroom?._id).filter(Boolean);
      const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).lean();
      
      const timingDetails = [];
      for (const cls of classrooms) {
        if (cls.timetable) {
          for (const [day, periods] of Object.entries(cls.timetable)) {
            for (const p of periods || []) {
              const facultyStr = (p.faculty || "").toLowerCase();
              if (
                facultyStr.includes(matchedFaculty.firstName.toLowerCase()) ||
                facultyStr.includes(matchedFaculty.lastName.toLowerCase())
              ) {
                timingDetails.push(`${p.subject} for ${cls.className} on ${day} (${p.startTime} – ${p.endTime})`);
              }
            }
          }
        }
      }

      let response = `${name} teaches ${assignmentSummaries.join(" and ")}.`;
      if (timingDetails.length > 0) {
        response += `\n\nScheduled timings:\n• ` + timingDetails.slice(0, 5).join("\n• ");
      }
      return response;
    }

    // Check if query asks "Who teaches <Subject>?"
    const subjectNames = ["java", "web development", "data structures", "database management", "operating systems", "python", "networking", "c++", "machine learning"];
    const askedSubject = subjectNames.find((s) => lower.includes(s));
    if (askedSubject) {
      const teachersForSubject = facultyMembers.filter((f) =>
        (f.facultyAssignments || []).some((a) => a.subject?.toLowerCase().includes(askedSubject)) ||
        (f.requestedSubjects || []).some((s) => s.toLowerCase().includes(askedSubject))
      );

      if (teachersForSubject.length > 0) {
        const list = teachersForSubject.map((t) => `Mr. ${t.firstName} ${t.lastName} (${t.department || "Faculty"})`).join(", ");
        return `The following faculty member(s) teach ${askedSubject.toUpperCase()}: ${list}.`;
      }
      return `Information regarding faculty for ${askedSubject} is currently unavailable in the database.`;
    }

    // Check if query asks "Has a new teacher joined the campus?"
    if (lower.includes("new teacher") || lower.includes("new faculty") || lower.includes("joined")) {
      const recentTeachers = await User.find({ role: "faculty" })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("firstName lastName department createdAt")
        .lean();

      if (recentTeachers.length > 0) {
        const list = recentTeachers.map(
          (t) => `• Mr./Ms. ${t.firstName} ${t.lastName} joined the ${t.department || "Engineering"} department on ${new Date(t.createdAt).toLocaleDateString("en-IN")}`
        ).join("\n");
        return `Recent faculty additions to campus:\n${list}`;
      }
      return "No new teacher additions have been recorded recently.";
    }
  }

  // 2. Check for Club Inquiries
  // e.g. "Does the Sports Club have any activity today?", "Which club is organizing today's event?", "Tell me about Robotics club"
  const clubs = await Club.find().lean();
  const matchedClub = clubs.find((c) =>
    lower.includes(c.clubName.toLowerCase()) ||
    (c.category && lower.includes(c.category.toLowerCase()))
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (matchedClub || lower.includes("club")) {
    if (matchedClub) {
      // Find events by this specific club
      const clubEvents = await Event.find({
        organizerClub: matchedClub._id,
        startDateTime: { $gte: todayStart, $lte: todayEnd },
      }).lean();

      if (clubEvents.length > 0) {
        const ev = clubEvents[0];
        const startStr = new Date(ev.startDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const endStr = new Date(ev.endDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return `Yes. The ${matchedClub.clubName} is organizing "${ev.eventName}" today from ${startStr} to ${endStr} at ${ev.venue}. Description: ${ev.description}`;
      }

      // Check upcoming events for this club
      const upcomingClubEvents = await Event.find({
        organizerClub: matchedClub._id,
        startDateTime: { $gt: todayEnd },
      })
        .sort({ startDateTime: 1 })
        .limit(2)
        .lean();

      if (upcomingClubEvents.length > 0) {
        const u = upcomingClubEvents[0];
        const dateStr = new Date(u.startDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return `There are no ${matchedClub.clubName} activities scheduled for today. However, their next event "${u.eventName}" is scheduled for ${dateStr} at ${u.venue}.`;
      }

      return `There are no ${matchedClub.clubName} activities scheduled for today. ${matchedClub.description || ""}`;
    }

    // General club list or query
    if (clubs.length > 0) {
      const clubNames = clubs.map((c) => `• ${c.clubName} (${c.category || "General"})`).join("\n");
      return `Registered clubs on campus:\n${clubNames}\n\nYou can ask about specific club schedules anytime.`;
    }
    return "Club information is currently unavailable in the database.";
  }

  // 3. Events, Seminars, Workshops, Activities happening today
  if (
    lower.includes("event") ||
    lower.includes("seminar") ||
    lower.includes("workshop") ||
    lower.includes("activity") ||
    lower.includes("activities") ||
    lower.includes("today")
  ) {
    const todayEvents = await Event.find({
      startDateTime: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "Cancelled" },
    })
      .populate("organizerClub", "clubName")
      .lean();

    if (todayEvents.length > 0) {
      const summaries = todayEvents.map((e) => {
        const time = new Date(e.startDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const organizer = e.organizerClub?.clubName ? ` (Organized by ${e.organizerClub.clubName})` : "";
        return `• "${e.eventName}" at ${e.venue} starting at ${time}${organizer} — Category: ${e.category}`;
      });
      return `Events & activities happening today:\n${summaries.join("\n")}`;
    }

    if (lower.includes("seminar") || lower.includes("workshop")) {
      const upcomingWorkshops = await Event.find({
        category: { $in: ["Technical", "Workshop", "Seminar"] },
        startDateTime: { $gte: todayStart },
      })
        .sort({ startDateTime: 1 })
        .limit(3)
        .populate("organizerClub", "clubName")
        .lean();

      if (upcomingWorkshops.length > 0) {
        const list = upcomingWorkshops.map((e) => {
          const dt = new Date(e.startDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return `• "${e.eventName}" on ${dt} at ${e.venue} (${e.category})`;
        }).join("\n");
        return `There are no seminars or workshops scheduled for today. Here are upcoming ones:\n${list}`;
      }
      return "There are no seminars or workshops scheduled for today.";
    }

    // Check if any upcoming events
    const upcoming = await Event.find({ startDateTime: { $gt: todayEnd } })
      .sort({ startDateTime: 1 })
      .limit(3)
      .populate("organizerClub", "clubName")
      .lean();

    if (upcoming.length > 0) {
      const list = upcoming.map((e) => {
        const dt = new Date(e.startDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return `• "${e.eventName}" on ${dt} (${e.organizerClub?.clubName || "Campus"})`;
      }).join("\n");
      return `There are no events scheduled for today. Here are upcoming campus events:\n${list}`;
    }
    return "There are no campus events scheduled for today.";
  }

  // 4. Placement Drives
  if (lower.includes("placement") || lower.includes("drive") || lower.includes("job") || lower.includes("internship")) {
    const drives = await PlacementDrive.find({
      status: { $in: ["Active", "Upcoming"] },
    })
      .sort({ date: 1 })
      .limit(3)
      .lean();

    if (drives.length > 0) {
      const list = drives.map((d) => {
        const dt = d.date ? new Date(d.date).toLocaleDateString("en-IN") : "Announced";
        return `• ${d.companyName} for role "${d.role}" (Drive date: ${dt}) — Package: ${d.package || "As per policy"}`;
      }).join("\n");
      return `Placement drives on CampusOS:\n${list}`;
    }
    return "There are no active placement drives scheduled for today.";
  }

  // 5. Alumni Talks
  if (lower.includes("alumni") || lower.includes("alumnus") || lower.includes("talk")) {
    const talks = await AlumniTalk.find({ status: { $in: ["Upcoming", "Ongoing"] } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (talks.length > 0) {
      const list = talks.map((t) => `• "${t.topic}" by ${t.speaker} (${t.company}) on ${t.date} at ${t.time}`).join("\n");
      return `Upcoming Alumni Talks:\n${list}`;
    }
    return "There are no Alumni Talks scheduled for today. You can check the Alumni section for recent experience posts.";
  }

  // 6. Announcements & Notices
  if (lower.includes("announcement") || lower.includes("notice") || lower.includes("circular") || lower.includes("update")) {
    const notices = await Notice.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    const items = [];
    notices.forEach((n) => items.push(`• [Notice] ${n.title} (Priority: ${n.priority || "Normal"})`));
    announcements.forEach((a) => items.push(`• [Announcement] ${a.title}`));

    if (items.length > 0) {
      return `Important campus announcements and notices:\n${items.join("\n")}`;
    }
    return "There are no new campus announcements or notices at this time.";
  }

  // 7. Timetable / Classes
  if (lower.includes("timetable") || lower.includes("class") || lower.includes("schedule")) {
    if (user?.classroom) {
      const classroom = await Classroom.findById(user.classroom).lean();
      if (classroom?.timetable) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayName = days[new Date().getDay()];
        const periods = classroom.timetable[todayName] || [];

        if (periods.length > 0) {
          const list = periods.map((p) => `• ${p.startTime} – ${p.endTime}: ${p.subject} with ${p.faculty} (${p.room || "Classroom"})`).join("\n");
          return `Today's schedule for your class (${classroom.className}):\n${list}`;
        }
        return `No classes are scheduled for your class (${classroom.className}) today (${todayName}).`;
      }
    }
    return "Class schedule details are available under Academics → Classroom. Please select your assigned class to view periods.";
  }

  // 8. General fallback when information is unavailable or query is unknown
  return "The requested information is currently unavailable in the campus records. Please check the relevant section (Events, Clubs, Academics, or Announcements) or contact the campus administrator.";
};
