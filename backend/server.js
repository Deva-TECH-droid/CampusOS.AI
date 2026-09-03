
import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'
import errorMiddleware from './middleware/errorMiddleware.js'
import authRouter from './routes/auth.routes.js';
import clubRouter from './routes/club.routes.js';
import eventRouter from './routes/event.routes.js';
import noticeRouter from './routes/notice.routes.js';
import driveRouter from './routes/drive.routes.js';
import announcementRouter from './routes/announcement.routes.js';
import applicationRouter from './routes/application.routes.js';
import classRoomRouter from './routes/classroom.routes.js';
import discussionRouter from './routes/discussion.routes.js';
import careerRouter from './routes/career.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import uploadRouter from './routes/upload.route.js';
import attendanceRouter from './routes/attendance.routes.js';
import facultyRouter from './routes/faculty.routes.js';
import examRouter from './routes/exam.routes.js';
import alumniRouter from './routes/alumni.routes.js';
import assignmentRouter from './routes/assignment.routes.js';
import noteRouter from './routes/note.routes.js';
import chatbotRouter from './routes/chatbot.routes.js';
import internalRouter from './routes/internal.routes.js';
dotenv.config();

const app = express();
await connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth",authRouter);
app.use("/api/dashboard",dashboardRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/events', eventRouter);
app.use('/api/classroom', classRoomRouter);
app.use('/api/discussions',discussionRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/announcements', announcementRouter);

app.use('/api/drives',driveRouter);
app.use('/api/career',careerRouter);
app.use('/api/applications', applicationRouter);

app.use("/api/v1/upload", uploadRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/exams", examRouter);
app.use("/api/alumni", alumniRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/notes", noteRouter);
app.use("/api/chatbot", chatbotRouter);  
app.use("/api/internal/chatbot", internalRouter); 

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
