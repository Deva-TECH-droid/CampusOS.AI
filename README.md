# CampusOS

A full-stack MERN platform that centralizes college academics, student communities, campus events, discussions, and placement management into a single application.

CampusOS provides students with one unified platform to manage classroom activities, discover and participate in campus events, engage with clubs, collaborate through discussions, and track placement opportunities.

---

## Live Demo

> 🚧 Coming Soon

---

## Screenshots

> 🚧 Screenshots will be added soon.

---

# Features

## Authentication & Authorization

- JWT Authentication
- Refresh Token Authentication
- Secure Password Hashing (bcrypt)
- Protected Routes
- Role-Based Access Control (RBAC)

---

## Dashboard

- Personalized dashboard
- Today's summary
- Upcoming deadlines
- Upcoming events
- Latest notices
- Recent placement drives

---

## Classroom Module

- Dynamic timetable (planning to implement soon)
- Subject management
- Study resources
- Assignment deadlines
- Class representative management
- Competitive preparation resources

---

## Community Module

### Clubs

- Browse clubs
- Follow clubs
- Club administration
- Club announcements

### Events

- Event creation
- Event registration
- Event organizers
- Event announcements

### Discussions

- Community discussions
- Replies
- Moderation support

---

## Placement Portal

- Placement drives
- Eligibility checking
- Apply for drives
- Track application status
- Placement dashboard

---

## Notice System

Supports targeted notices for:

- Platform
- Classroom
- Clubs
- Events
- Placement

Features include:

- Priority levels
- Expiry dates
- Dynamic notice feed
- Metadata-based notices

---

## User Profile

- Student profile
- Academic information
- Community activity
- Placement activity
- Personal statistics

---

## Admin Panel

- Manage clubs
- Manage placement drives
- Discussion moderation
- Platform management

---

## File Uploads

- Cloudinary integration
- Image uploads using Multer
- Reusable upload component
- Profile pictures
- Club logos & banners
- Event posters
- Automatic temporary file cleanup

---

# Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Axios
- Context API

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Multer
- Cloudinary

---

# Project Structure


CampusOS
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── config
│   ├── constants
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── sockets
│   ├── utils
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# Installation

## Clone the repository

```bash
git clone https://github.com/aravindpulkam3/CampusOS.git
```

```bash
cd CampusOS
```

---

## Backend

```bash
cd backend
npm install
```

Create a `.env` file.

```env
PORT=

MONGODB_URI=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

REDIS_URL=
```

Run the backend

```bash
npm run dev
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Architecture

The backend follows a layered architecture.

```text
Routes
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Database
```

Authentication, authorization, validation, and error handling are implemented using reusable middleware.

---

# Upcoming Features

- Real-time updates using Socket.IO
- Redis caching
- Background jobs using BullMQ
- Global search
- Notification system
- AI-powered resume analysis
- Recommendation engine
- Browser push notifications
- Docker support

---

# Contributing

Contributions, suggestions, and feedback are welcome.

Feel free to fork the repository and open a pull request.

---

# License

This project is licensed under the MIT License.

---

# Author

**Aravind Pulkam**

GitHub: https://github.com/aravindpulkam3
