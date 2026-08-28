import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Layout from "./components/layout/Layout";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import ProtectedRoute from "./components/common/ProtectedRoute"; // 1. IMPORT YOUR GUARD COMPONENT

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import TeacherSignup from "./pages/auth/TeacherSignup.jsx";

// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Community workspace
import Clubs from "./pages/clubs/Clubs";
import ClubDetail from "./pages/clubs/ClubDetail";
import CreateClub from "./pages/clubs/CreateClub";
import Events from "./pages/events/Events.jsx";
import EventDetail from "./pages/events/EventDetail.jsx";
import EventForm from "./pages/events/EventForm.jsx";
import MyEvents from "./pages/events/MyEvents.jsx";
import Announcements from "./pages/announcements/AnnouncementCard.jsx";
import AnnouncementForm from "./pages/announcements/AnnouncementForm.jsx";

// Academics workspace
import Classroom from "./pages/academics/classroom/Classroom.jsx";
import Discussions from "./pages/discussions/Discussions.jsx";
import CompetitivePrep from "./pages/academics/competitive/CompetitivePrep.jsx";
import SubjectDetail from "./pages/academics/classroom/SubjectDetail.jsx";
import NoticeForm from "./components/forms/NoticeForm.jsx";

// Attendance
import MarkAttendance from "./pages/attendance/MarkAttendance.jsx";
import FaceEnrollment from "./pages/attendance/FaceEnrollment.jsx";
import AttendanceHistory from "./pages/attendance/AttendanceHistory.jsx";
import KioskCheckIn from "./pages/attendance/KioskCheckIn.jsx";

// Faculty workspace
import FacultyAttendance from "./pages/faculty/FacultyAttendance.jsx";
import FacultyExams from "./pages/faculty/FacultyExams.jsx";
import ExamBuilder from "./pages/faculty/ExamBuilder.jsx";
import ExamGrading from "./pages/faculty/ExamGrading.jsx";
import FacultyAssignments from "./pages/faculty/FacultyAssignments.jsx";
import AssignmentGrading from "./pages/faculty/AssignmentGrading.jsx";
import FacultyNotes from "./pages/faculty/FacultyNotes.jsx";

// Student exams
import StudentExams from "./pages/exams/StudentExams.jsx";
import TakeExam from "./pages/exams/TakeExam.jsx";
import ExamAnalysis from "./pages/exams/ExamAnalysis.jsx";
import StudentAssignments from "./pages/exams/StudentAssignments.jsx";
import StudentNotes from "./pages/exams/StudentNotes.jsx";

// Alumni
import AlumniStories from "./pages/alumni/AlumniStories.jsx";
import StoryDetail from "./pages/alumni/StoryDetail.jsx";
import ShareExperience from "./pages/alumni/ShareExperience.jsx";

// Career workspace
import CareerDashboard from "./pages/career/CareerDashboard.jsx";
import DrivesList from "./pages/career/DrivesList.jsx";
import MyApplications from "./pages/career/MyApplications.jsx";
import DriveDetail from "./pages/career/DriveDetail.jsx";
import CreateDrive from "./pages/career/CreateDrive.jsx";

// Admin workspace
import AdminPanel from "./pages/admin/AdminPanel";
import ManageClubs from "./pages/admin/ManageClubs";
import ManageDrives from "./pages/admin/ManageDrives";
import ModerationQueue from "./pages/admin/ModerationQueue";
import AttendanceAdmin from "./pages/admin/AttendanceAdmin.jsx";
import FacultyManagement from "./pages/admin/FacultyManagement.jsx";
import TestApproval from "./pages/admin/TestApproval.jsx";
import AlumniManagement from "./pages/admin/AlumniManagement.jsx";

// Profile
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";
import CreateDeadline from "./pages/academics/classroom/CreateDeadline.jsx";
import DiscussionDetail from "./pages/discussions/DiscussionDetail.jsx";
import useAuth from "./hooks/useAuth.js";
import EditClub from "./pages/clubs/EditClub.jsx";

const adminTabs = [
  { label: "Clubs", path: "/admin", end: true },
  { label: "Drives", path: "/admin/drives", end: false },
  { label: "Moderation", path: "/admin/moderation", end: false },
  { label: "Notices", path: "/admin/notices", end: false },
  { label: "Attendance", path: "/admin/attendance", end: false },
  { label: "Faculty", path: "/admin/faculty", end: false },
  { label: "Tests", path: "/admin/tests", end: false },
  { label: "Alumni", path: "/admin/alumni", end: false },
];

function App() {
  const { loading } = useAuth(); // 2. FIXED: Added parenthesis to invoke hook properly

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup-teacher" element={<TeacherSignup />} />

        {/* 3. WRAP THE MASTER LAYOUT ROUTE IN PROTECTEDROUTE */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* All nested internal routes are now automatically hidden behind login */}
          <Route path="/" element={<Dashboard />} />

          {/* Community workspace — grouping page removed per updated spec; Clubs & Events are now top-level nav items but keep their paths to avoid breaking existing links */}
          <Route path="/community/clubs" element={<Clubs />} />
          <Route path="/community/clubs/:clubId" element={<ClubDetail />} />
          <Route
            path="/community/clubs/create"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <CreateClub />
              </ProtectedRoute>
            }
          />
          <Route path="/community/clubs/:clubId/edit" element={<EditClub />} />
          <Route path="/community/events" element={<Events />} />
          <Route path="/community/events/:id" element={<EventDetail />} />
          <Route
            path="/community/clubs/:clubId/events/create"
            element={<EventForm mode="create" />}
          />
          <Route
            path="/community/events/:eventId/edit"
            element={<EventForm mode="edit" />}
          />
          <Route
            path="/community/:targetType/:targetId/announcements/create"
            element={<AnnouncementForm />}
          />
          <Route path="/community/announcements" element={<Announcements />} />

          {/* Academics workspace */}
          <Route
            path="/academics/classroom/:classroomId"
            element={<Classroom />}
          />
          <Route path="/academics/competitive" element={<CompetitivePrep />} />
          <Route path="/academics/subjects/:name" element={<SubjectDetail />} />
          <Route
            path="/:targetType/:targetId/create-notice"
            element={<NoticeForm />}
          />
          <Route
            path="/academics/:classroomId/deadline/form/:deadlineId?"
            element={<CreateDeadline />}
          />

          {/* Attendance */}
          <Route path="/attendance" element={<MarkAttendance />} />
          <Route path="/attendance/enroll" element={<FaceEnrollment />} />
          <Route path="/attendance/history" element={<AttendanceHistory />} />
          <Route path="/attendance/kiosk" element={<KioskCheckIn />} />

          {/* Faculty workspace */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/exams"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/exams/new"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <ExamBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/exams/:id"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <ExamGrading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/assignments"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/assignments/:id"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <AssignmentGrading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/notes"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyNotes />
              </ProtectedRoute>
            }
          />

          {/* Student exams */}
          <Route path="/exams" element={<StudentExams />} />
          <Route path="/exams/:id/take" element={<TakeExam />} />
          <Route path="/exams/:id/analysis" element={<ExamAnalysis />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/notes" element={<StudentNotes />} />

          {/* Alumni */}
          <Route path="/alumni" element={<AlumniStories />} />
          <Route path="/alumni/:id" element={<StoryDetail />} />
          <Route path="/alumni/share" element={<ShareExperience />} />

          {/* Career workspace */}
          <Route path="/career" element={<CareerDashboard />} />
          <Route path="/career/drives" element={<DrivesList />} />
          <Route path="/career/drives/create" element={<CreateDrive />} />
          <Route path="/career/drives/:id" element={<DriveDetail />} />
          <Route path="/career/my-applications" element={<MyApplications />} />

          {/* Discussions */}
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/discussions/:id" element={<DiscussionDetail />} />

          {/* Admin workspace — Fine-grained specific role verification option */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={["superadmin", "placementCoordinator"]}
              >
                <WorkspaceLayout tabs={adminTabs} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminPanel />} />
            <Route path="drives" element={<ManageDrives />} />
            <Route path="moderation" element={<ModerationQueue />} />
            <Route path="notices" element={<ManageClubs />} />
            <Route path="attendance" element={<AttendanceAdmin />} />
            <Route path="faculty" element={<FacultyManagement />} />
            <Route path="tests" element={<TestApproval />} />
            <Route path="alumni" element={<AlumniManagement />} />
          </Route>

          {/* Profile — no tabs */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
