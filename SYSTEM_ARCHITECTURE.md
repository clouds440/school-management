# School Management System - System Architecture Documentation

**Version:** 1.0  
**Date:** April 22, 2026  
**Document Type:** Technical Architecture Specification  

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Main Business Flows](#main-business-flows)
5. [API Structure](#api-structure)
6. [Security Model](#security-model)
7. [Technology Stack](#technology-stack)
8. [Deployment Considerations](#deployment-considerations)

---

## System Overview

### 1.1 Purpose

The School Management System is a comprehensive web-based platform designed to streamline educational institution administration. The system provides role-based access for administrators, teachers, and students to manage courses, sections, enrollments, assessments, attendance, grades, and communications.

### 1.2 Scope

The system supports:
- Multi-organization architecture with hierarchical organization management
- Role-based access control (RBAC) with granular permissions
- Student and teacher lifecycle management
- Course and section administration
- Bulk enrollment and assignment operations
- Assessment creation, grading, and grade publishing
- Attendance tracking and reporting
- Real-time chat and notification systems
- Internal mail system for organization communication
- Timetable and schedule management

### 1.3 User Roles

| Role | Description | Key Capabilities |
|------|-------------|-------------------|
| SUPER_ADMIN | Platform-level administrator | Full platform access, platform admin management |
| PLATFORM_ADMIN | Platform administrator | Organization approval/rejection, platform-level operations |
| ORG_ADMIN | Organization administrator | Full organization management, teacher/student management |
| ORG_MANAGER | Organization manager | Organization operations, limited administrative functions |
| TEACHER | Faculty member | Section management, assessment grading, attendance, chat |
| STUDENT | Student | View grades, submit assessments, attendance, limited chat |

---

## Architecture

### 2.1 High-Level Architecture

The system follows a **monolithic backend** with a **single-page application (SPA)** frontend architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│                  Next.js (React) SPA                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         │ WebSocket (Chat)
┌────────────────────────▼────────────────────────────────────┐
│                   API Gateway Layer                           │
│                   NestJS Application                          │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │   Auth   │ │   Admin  │ │    Org   │ │     Chat      │ │
│  │ Service  │ │ Service  │ │ Service  │ │   Service     │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Notify  │ │   Mail   │ │   Files  │ │  Announce-   │ │
│  │ Service  │ │ Service  │ │ Service  │ │   ment Service│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Data Access Layer                          │
│                  Prisma ORM                                   │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                              │
│              PostgreSQL Database                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Backend Architecture (NestJS)

The backend is built using **NestJS**, a progressive Node.js framework that provides:

- **Modular Architecture**: Each domain (auth, admin, org, chat, etc.) is encapsulated in its own module
- **Dependency Injection**: Built-in DI container for service management
- **Guards & Interceptors**: Authentication and authorization middleware
- **DTO Validation**: Class-validator for request validation
- **Exception Filters**: Centralized error handling

**Module Structure:**
```
backend/src/
├── admin/          # Platform administration
├── auth/           # Authentication & session management
├── chat/           # Real-time chat system
├── common/         # Shared utilities, enums, guards
├── events/         # WebSocket gateway for real-time features
├── files/          # File upload/management
├── mail/           # Internal mail system
├── notifications/  # User notifications
├── announcements/  # Organization announcements
├── org/            # Organization-specific operations
├── prisma/         # Database client
└── main.ts         # Application entry point
```

### 2.3 Frontend Architecture (Next.js)

The frontend is built using **Next.js 15** with TypeScript:

- **App Router**: File-based routing in `app/` directory
- **Server Components**: Optimized for SEO and initial render
- **Client Components**: Interactive components with `use client` directive
- **Context API**: State management (AuthContext, GlobalContext)
- **Custom Hooks**: Reusable logic (usePaginatedData, useSocket, useDebounce)
- **Resource Stores**: Factory-based caching for paginated data

**Frontend Structure:**
```
frontend/
├── app/                    # Next.js App Router
│   ├── (org)/             # Organization dashboard routes
│   ├── admin/             # Platform admin routes
│   ├── login/             # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── sections/          # Section-specific components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API client
│   ├── api.ts             # API client with request helper
│   └── *Store.ts          # Resource stores for caching
└── types/                 # TypeScript type definitions
```

### 2.4 Database Architecture

**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema:** Located in `backend/prisma/schema.prisma`

The database follows a relational model with proper foreign key relationships and cascading deletes for data integrity.

---

## Data Model

### 3.1 Core Entities

#### Organization
```typescript
{
  id: string
  name: string
  location: string
  type: string
  contactEmail: string
  phone: string?
  status: OrgStatus (PENDING | APPROVED | REJECTED | SUSPENDED)
  statusHistory: Json[]  // Status change audit trail
  logoUrl: string?
  accentColor: Json?
  parentOrgId: string?
  parentOrg: Organization? (self-referencing for hierarchy)
  subOrgs: Organization[]
  users: User[]
  students: Student[]
  teachers: Teacher[]
  courses: Course[]
  sections: Section[]
  assessments: Assessment[]
  mails: Mail[]
  chats: Chat[]
  announcements: Announcement[]
}
```

#### User
```typescript
{
  id: string
  email: string (unique)
  password: string (bcrypt hashed)
  role: Role (SUPER_ADMIN | PLATFORM_ADMIN | ORG_ADMIN | ORG_MANAGER | TEACHER | STUDENT)
  isFirstLogin: boolean
  organizationId: string?
  name: string?
  phone: string?
  themeMode: ThemeMode (LIGHT | DARK | SYSTEM)
  avatarUrl: string?
  avatarUpdatedAt: DateTime?
  organization: Organization?
  studentProfile: Student?
  teacherProfile: Teacher?
  sessions: Session[]
  createdMails: Mail[]
  assignedMails: Mail[]
  participatingMails: Mail[]
  sentMessages: MailMessage[]
  performedActions: MailActionLog[]
  viewedMails: MailUserView[]
  createdChats: Chat[]
  chatParticipations: ChatParticipant[]
  sentChatMessages: ChatMessage[]
  deletedChatMessages: ChatMessage[]
  userNotifications: Notification[]
  createdAnnouncements: Announcement[]
}
```

#### Session
```typescript
{
  id: string
  userId: string
  deviceId: string
  deviceName: string?  // e.g., "Chrome on Windows"
  deviceType: string?  // e.g., "desktop", "mobile", "tablet"
  browser: string?     // e.g., "Chrome", "Safari"
  os: string?          // e.g., "Windows", "iOS"
  location: string?    // Country from IP geolocation
  ip: string?          // IP address
  token: string       // JWT token for this session
  isActive: boolean
  lastSeenAt: DateTime
  createdAt: DateTime
  expiresAt: DateTime
  user: User
}
```

#### Teacher
```typescript
{
  id: string
  userId: string (unique)
  organizationId: string
  salary: float
  subject: string
  designation: string
  education: string
  address: string?
  bloodGroup: string?
  department: string?
  emergencyContact: string?
  joiningDate: DateTime
  status: TeacherStatus (ACTIVE | SUSPENDED | ON_LEAVE | DELETED)
  organization: Organization
  user: User
  sections: Section[]  // Assigned sections
}
```

#### Student
```typescript
{
  id: string
  userId: string (unique)
  organizationId: string
  registrationNumber: string (unique within org)
  rollNumber: string (unique within org)
  fatherName: string?
  fee: float
  age: int?
  address: string?
  major: string
  department: string?
  admissionDate: DateTime
  graduationDate: DateTime?
  bloodGroup: string?
  emergencyContact: string?
  feePlan: string
  gender: string
  status: StudentStatus (ACTIVE | SUSPENDED | ALUMNI | DELETED)
  updatedBy: string?
  organization: Organization
  user: User
  enrollments: Enrollment[]
  grades: Grade[]
  submissions: Submission[]
  attendanceRecords: AttendanceRecord[]
}
```

#### Course
```typescript
{
  id: string
  name: string
  description: string?
  organizationId: string
  organization: Organization
  updatedBy: string?
  sections: Section[]
  assessments: Assessment[]
}
```

#### Section
```typescript
{
  id: string
  name: string
  semester: string?
  year: string?
  room: string?
  courseId: string
  course: Course
  enrollments: Enrollment[]  // Student enrollments
  teachers: Teacher[]       // Assigned teachers
  schedules: SectionSchedule[]
  attendanceSessions: AttendanceSession[]
  assessments: Assessment[]
}
```

#### Enrollment (Junction Table)
```typescript
{
  id: string
  studentId: string
  sectionId: string
  student: Student
  section: Section
  @@unique([studentId, sectionId])  // One enrollment per student per section
}
```

### 3.2 Assessment & Grading Entities

#### Assessment
```typescript
{
  id: string
  sectionId: string
  courseId: string
  title: string
  type: AssessmentType (ASSIGNMENT | QUIZ | MIDTERM | FINAL | PROJECT)
  totalMarks: float
  weightage: float  // Percentage 0-100
  dueDate: DateTime?
  allowSubmissions: boolean
  externalLink: string?
  isVideoLink: boolean
  section: Section
  course: Course
  organization: Organization
  grades: Grade[]
  submissions: Submission[]
}
```

#### Grade
```typescript
{
  id: string
  assessmentId: string
  studentId: string
  marksObtained: float
  feedback: string?
  status: GradeStatus (DRAFT | PUBLISHED | FINALIZED)
  updatedBy: string?  // userId
  assessment: Assessment
  student: Student
  @@unique([assessmentId, studentId])
}
```

#### Submission
```typescript
{
  id: string
  assessmentId: string
  studentId: string
  fileUrl: string?
  submittedAt: DateTime
  assessment: Assessment
  student: Student
}
```

### 3.3 Communication Entities

#### Chat
```typescript
{
  id: string
  type: ChatType (DIRECT | GROUP)
  name: string?  // For group chats
  avatarUrl: string?
  avatarUpdatedAt: DateTime?
  organizationId: string?
  creatorId: string
  readOnly: boolean  // Only ADMIN/MOD can send messages
  organization: Organization?
  creator: User
  participants: ChatParticipant[]
  messages: ChatMessage[]
}
```

#### ChatParticipant
```typescript
{
  id: string
  chatId: string
  userId: string
  role: ChatParticipantRole (ADMIN | MOD | MEMBER)
  isActive: boolean
  lastReadMessageId: string?
  joinedAt: DateTime
  membershipHistory: ChatMembershipHistory[]
  chat: Chat
  user: User
  @@unique([chatId, userId])
}
```

#### ChatMessage
```typescript
{
  id: string
  chatId: string
  senderId: string
  organizationId: string?
  content: string  // Markdown supported
  type: ChatMessageType (TEXT | SYSTEM)
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime?
  deletedById: string?
  chat: Chat
  sender: User
  deletedBy: User?
  replyToId: string?
  replyTo: ChatMessage?
  replies: ChatMessage[]
}
```

#### Mail
```typescript
{
  id: string
  subject: string
  category: string
  priority: string (LOW | NORMAL | HIGH | URGENT)
  status: MailStatus (OPEN | IN_PROGRESS | AWAITING_RESPONSE | RESOLVED | CLOSED | NO_REPLY)
  creatorId: string
  creatorRole: string
  creator: User
  organizationId: string?
  organization: Organization?
  targetRole: string?
  assigneeId: string?
  assignee: User?
  assignees: User[]
  metadata: Json?
  messages: MailMessage[]
  actionLogs: MailActionLog[]
  userViews: MailUserView[]
}
```

#### Notification
```typescript
{
  id: string
  userId: string
  title: string
  body: string?
  actionUrl: string?
  type: string?
  metadata: Json?
  isRead: boolean
  createdAt: DateTime
  user: User
}
```

#### Announcement
```typescript
{
  id: string
  title: string
  body: string  // Markdown
  targetType: TargetType (GLOBAL | ORG | ROLE | SECTION)
  targetId: string?
  actionUrl: string?
  priority: AnnouncementPriority (LOW | NORMAL | HIGH | URGENT)
  creatorId: string
  organizationId: string?
  creator: User
  organization: Organization?
}
```

### 3.4 Attendance Entities

#### SectionSchedule
```typescript
{
  id: string
  sectionId: string
  day: int  // 0 = Sunday, 1 = Monday ... 6 = Saturday
  startTime: string  // "09:00"
  endTime: string    // "10:00"
  room: string?
  section: Section
  attendanceSessions: AttendanceSession[]
}
```

#### AttendanceSession
```typescript
{
  id: string
  sectionId: string
  scheduleId: string?
  isAdhoc: boolean
  date: DateTime
  startTime: string?
  endTime: string?
  section: Section
  schedule: SectionSchedule?
  records: AttendanceRecord[]
  @@unique([scheduleId, date])
}
```

#### AttendanceRecord
```typescript
{
  id: string
  sessionId: string
  studentId: string
  status: AttendanceStatus (PRESENT | ABSENT | LATE | EXCUSED)
  session: AttendanceSession
  student: Student
  @@unique([sessionId, studentId])
}
```

---

## Main Business Flows

### 4.1 Authentication & Authorization Flow

#### 4.1.1 Registration Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ POST /auth/register
       │ { name, email, password, org details }
       ▼
┌─────────────────────────────────┐
│   AuthService.register()         │
│   - Validate email uniqueness   │
│   - Hash password (bcrypt)      │
│   - Create Organization          │
│   - Create User (ORG_ADMIN)      │
│   - Link User to Organization   │
└─────────────────────────────────┘
       │
       │ Return: { id, email, orgName }
       ▼
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ POST /auth/login
       │ { email, password, deviceId, deviceInfo }
       ▼
┌─────────────────────────────────┐
│   AuthService.login()           │
│   - Validate credentials         │
│   - Generate JWT token           │
│   - Create/Update Session       │
│   - IP Geolocation lookup        │
│   - New device notification     │
│   - Country change detection   │
└─────────────────────────────────┘
       │
       │ Return: { access_token, role }
       ▼
┌─────────────┐
│   Client    │
│   Store     │
│   Token     │
└─────────────┘
```

**Key Features:**
- **Device Fingerprinting**: Sessions are bound to deviceId for security
- **IP Geolocation**: Country lookup for suspicious activity detection
- **Session Management**: Multiple active sessions per user with revocation capability
- **New Device Notifications**: Alerts when login from new device detected
- **Country Change Detection**: Suspicious activity alerts when location changes
- **Remember Me**: Optional 30-day token expiration vs 1-day default

#### 4.1.2 Authorization Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       │ Bearer Token
       ▼
┌─────────────────────────────────┐
│   JWT Strategy                  │
│   - Verify token signature      │
│   - Extract user info           │
│   - Check expiration            │
└─────────────────────────────────┘
       │
       │ User Payload
       ▼
┌─────────────────────────────────┐
│   Roles Guard                    │
│   - Check role permissions      │
│   - Verify organization access   │
│   - Apply route restrictions     │
└─────────────────────────────────┘
       │
       │ Authorized?
       ▼
    [YES]   [NO]
       │       │
       │   ┌───┴───┐
       │   │403     │
       │   │Forbidden│
       │   └───────┘
       ▼
┌─────────────┐
│   Handler   │
└─────────────┘
```

**Role-Based Access Control:**
- **SUPER_ADMIN**: Full platform access
- **PLATFORM_ADMIN**: Organization management, platform admin management
- **ORG_ADMIN**: Full organization access
- **ORG_MANAGER**: Organization operations, limited admin functions
- **TEACHER**: Section management, grading, attendance, chat (students in their sections)
- **STUDENT**: View grades, submit assessments, view attendance, limited chat

### 4.2 Organization Management Flow

#### 4.2.1 Organization Registration & Approval

```
┌─────────────┐
│   Org Admin  │
│   Register   │
└──────┬──────┘
       │
       │ POST /auth/register
       ▼
┌─────────────────────────────────┐
│   Create Organization           │
│   Status: PENDING              │
└─────────────────────────────────┘
       │
       │ Awaiting Approval
       ▼
┌─────────────────────────────────┐
│   Platform Admin                │
│   Dashboard                     │
└──────┬──────┘
       │
       │ GET /admin/organizations?status=PENDING
       ▼
┌─────────────────────────────────┐
│   View Pending Organizations    │
└─────────────────────────────────┘
       │
       │ Approve / Reject / Suspend
       ▼
┌─────────────────────────────────┐
│   AdminService.approveOrg()     │
│   - Update status to APPROVED   │
│   - Add status history entry    │
│   - Revoke all org sessions     │
│   - Send welcome mail           │
└─────────────────────────────────┘
```

**Approval Actions:**
- **Approve**: Sets status to APPROVED, revokes all sessions, sends welcome mail
- **Reject**: Sets status to REJECTED, revokes all sessions, sends rejection mail with reason
- **Suspend**: Sets status to SUSPENDED, revokes all sessions, sends suspension mail
- **Edit Message**: Updates status message for rejected/suspended orgs

**Instant Revocation**: All sessions for organization users are immediately revoked on status change to enforce access control.

### 4.3 Student Management Flow

#### 4.3.1 Student Creation

```
┌─────────────┐
│   Org Admin  │
│   Add Student│
└──────┬──────┘
       │
       │ POST /org/students
       │ { student details, sectionIds[] }
       ▼
┌─────────────────────────────────┐
│   OrgService.createStudent()    │
│   - Validate unique reg/roll num│
│   - Hash password               │
│   - Create User (STUDENT role)  │
│   - Create Student profile      │
│   - Create Enrollments         │
│   - Audit trail (updatedBy)     │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   studentsStore│
└─────────────┘
```

#### 4.3.2 Student Update

```
┌─────────────┐
│   Org Admin  │
│   Edit Student│
└──────┬──────┘
       │
       │ PATCH /org/students/:id
       │ { updated fields, sectionIds[] }
       ▼
┌─────────────────────────────────┐
│   OrgService.updateStudent()    │
│   - Validate reg/roll uniqueness│
│   - Update User fields          │
│   - Update Student profile      │
│   - Update Enrollments:        │
│     - Delete existing enrollments│
│     - Create new enrollments   │
│   - Audit trail (updatedBy)     │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   studentsStore│
└─────────────┘
```

**Enrollment Update Logic:**
When `sectionIds` is provided in update:
1. Delete all existing enrollments for the student
2. Create new enrollments for each sectionId in the array
3. This ensures enrollment state is always in sync

### 4.4 Teacher Management Flow

#### 4.4.1 Teacher Creation

```
┌─────────────┐
│   Org Admin  │
│   Add Teacher│
└──────┬──────┘
       │
       │ POST /org/teachers
       │ { teacher details }
       ▼
┌─────────────────────────────────┐
│   OrgService.createTeacher()    │
│   - Hash password               │
│   - Create User (TEACHER role)  │
│   - Create Teacher profile      │
│   - Link to Organization        │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   teachersStore│
└─────────────┘
```

#### 4.4.2 Teacher Section Assignment (Bulk)

```
┌─────────────┐
│   Org Admin  │
│   Bulk Assign│
│   Sections   │
└──────┬──────┘
       │
       │ PATCH /org/teachers/:id
       │ { sectionIds[] }
       ▼
┌─────────────────────────────────┐
│   OrgService.updateTeacher()    │
│   - Update Teacher profile      │
│   - Update Section assignments  │
│   - Audit trail (updatedBy)     │
└─────────────────────────────────┘
```

### 4.5 Course & Section Management Flow

#### 4.5.1 Course Creation

```
┌─────────────┐
│   Org Admin  │
│   Create Course│
└──────┬──────┘
       │
       │ POST /org/courses
       │ { name, description }
       ▼
┌─────────────────────────────────┐
│   OrgService.createCourse()     │
│   - Create Course               │
│   - Link to Organization        │
│   - Audit trail (updatedBy)     │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   coursesStore│
└─────────────┘
```

#### 4.5.2 Section Creation

```
┌─────────────┐
│   Org Admin  │
│   Create Section│
└──────┬──────┘
       │
       │ POST /org/sections
       │ { name, semester, year, room, courseId }
       ▼
┌─────────────────────────────────┐
│   OrgService.createSection()    │
│   - Create Section               │
│   - Link to Course              │
│   - Audit trail (updatedBy)     │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   sectionsStore│
└─────────────┘
```

### 4.6 Enrollment Flow

#### 4.6.1 Student to Section Enrollment (Bulk from Section Edit)

```
┌─────────────┐
│   Org Admin  │
│   Edit Section│
│   Select Students│
└──────┬──────┘
       │
       │ GET /org/students (all students)
       ▼
┌─────────────┐
│   Display     │
│   All Students│
│   Pre-select  │
│   Enrolled    │
└──────┬──────┘
       │
       │ PATCH /org/sections/:id
       │ { section details }
       │ + For each student:
       │   - Add: updateStudent(studentId, { sectionIds: [...existing, sectionId] })
       │   - Remove: updateStudent(studentId, { sectionIds: [...existing].filter(id !== sectionId) })
       ▼
┌─────────────────────────────────┐
│   OrgService.updateSection()    │
│   - Update Section details      │
│   - Handle enrollment changes   │
│   - Update each student's       │
│     sectionIds array            │
└─────────────────────────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│   Invalidate│
│   sectionsStore│
│   studentsStore│
└─────────────┘
```

**Enrollment Implementation:**
The enrollment is managed from the **student's side** (student.sectionIds). When enrolling students to a section:
1. Get current enrolled students (section.students)
2. Calculate newly enrolled (selected but not enrolled)
3. Calculate removed (enrolled but not selected)
4. For newly enrolled: Add sectionId to student's sectionIds
5. For removed: Remove sectionId from student's sectionIds
6. Call updateStudent for each affected student

### 4.7 Assessment & Grading Flow

#### 4.7.1 Assessment Creation

```
┌─────────────┐
│   Teacher    │
│   Create Assessment│
└──────┬──────┘
       │
       │ POST /org/assessments
       │ { title, type, totalMarks, weightage, dueDate, externalLink, allowSubmissions }
       ▼
┌─────────────────────────────────┐
│   OrgService.createAssessment() │
│   - Create Assessment           │
│   - Link to Section & Course    │
│   - Link to Organization        │
└─────────────────────────────────┘
```

#### 4.7.2 Grading Flow

```
┌─────────────┐
│   Teacher    │
│   Open Assessment│
│   Grade Students│
└──────┬──────┘
       │
       │ GET /org/assessments/:id
       ▼
┌─────────────┐
│   Display     │
│   Students    │
│   with Grades │
└──────┬──────┘
       │
       │ PATCH /org/grades/:gradeId
       │ { marksObtained, feedback, status }
       ▼
┌─────────────────────────────────┐
│   OrgService.updateGrade()      │
│   - Update Grade record         │
│   - Update audit trail          │
└─────────────────────────────────┘
       │
       │ Status: PUBLISHED
       ▼
┌─────────────┐
│   Notify     │
│   Students    │
└─────────────┘
```

**Grade Status Workflow:**
- **DRAFT**: Initial grade, not visible to students
- **PUBLISHED**: Visible to students, can be modified
- **FINALIZED**: Locked grade, cannot be modified

### 4.8 Chat Flow

#### 4.8.1 Direct Chat Creation

```
┌─────────────┐
│   User       │
│   Search Users│
└──────┬──────┘
       │
       │ GET /org/chat/users?search=query
       ▼
┌─────────────────────────────────┐
│   ChatService.searchUsers()    │
│   - Apply role-based filters   │
│   - Teachers: Can see Org Admins, Managers, their section students
│   - Org Admins/Managers: Can see all except students
│   - Students: Cannot initiate chats
│   - Platform Admins: Can see other platform admins
└─────────────────────────────────┘
       │
       │ Select User
       ▼
┌─────────────┐
│   POST /org/chat/direct        │
│   { participantId }            │
└──────┬──────┘
       ▼
┌─────────────────────────────────┐
│   ChatService.createDirectChat()│
│   - Check for existing chat     │
│   - Create new if not exists    │
│   - Add both as participants    │
│   - Create SYSTEM message       │
└─────────────────────────────────┘
       │
       │ WebSocket
       ▼
┌─────────────┐
│   Real-time  │
│   Message     │
└─────────────┘
```

#### 4.8.2 Group Chat Creation

```
┌─────────────┐
│   User       │
│   Create Group│
└──────┬──────┘
       │
       │ POST /org/chat/group
       │ { name, participantIds[], readOnly }
       ▼
┌─────────────────────────────────┐
│   ChatService.createGroupChat() │
│   - Create Chat (GROUP)         │
│   - Add creator as ADMIN        │
│   - Add participants as MEMBER   │
│   - Create SYSTEM message       │
└─────────────────────────────────┘
```

**Chat Permissions:**
- **ADMIN**: Full control, can add/remove participants, change settings
- **MOD**: Can manage messages, add/remove participants
- **MEMBER**: Can send messages (unless readOnly is true)
- **readOnly mode**: Only ADMIN and MOD can send messages

### 4.9 Notification Flow

```
┌─────────────┐
│   System     │
│   Event      │
└──────┬──────┘
       │
       │ NotificationsService.create()
       ▼
┌─────────────────────────────────┐
│   Create Notification           │
│   { userId, title, body, actionUrl, type, metadata }│
└─────────────────────────────────┘
       │
       │ WebSocket
       ▼
┌─────────────┐
│   Push to     │
│   Client     │
└─────────────┘
       │
       │ Client updates notificationStore
       ▼
┌─────────────┐
│   UI Update  │
│   Badge Count│
└─────────────┘
```

**Notification Types:**
- SECURITY: Session alerts, suspicious activity
- ASSESSMENT: New assessment, grade published
- ANNOUNCEMENT: New announcement
- MAIL: New mail assigned
- CHAT: New chat message (if not in chat view)

### 4.10 Attendance Flow

#### 4.10.1 Schedule Creation

```
┌─────────────┐
│   Teacher    │
│   Create Schedule│
└──────┬──────┘
       │
       │ POST /org/schedules
       │ { sectionId, day, startTime, endTime, room }
       ▼
┌─────────────────────────────────┐
│   OrgService.createSchedule()    │
│   - Create SectionSchedule       │
│   - Link to Section             │
└─────────────────────────────────┘
```

#### 4.10.2 Attendance Marking

```
┌─────────────┐
│   Teacher    │
│   Open Section│
│   Attendance  │
└──────┬──────┘
       │
       │ GET /org/sections/:id/attendance?date=YYYY-MM-DD
       ▼
┌─────────────┐
│   Display     │
│   Students    │
│   with Status │
└──────┬──────┘
       │
       │ POST /org/attendance/mark
       │ { sessionId, records: [{ studentId, status }] }
       ▼
┌─────────────────────────────────┐
│   OrgService.markAttendance()   │
│   - Upsert AttendanceRecords    │
│   - Update audit trail          │
└─────────────────────────────────┘
```

### 4.11 Mail System Flow

```
┌─────────────┐
│   User       │
│   Create Mail │
└──────┬──────┘
       │
       │ POST /org/mail
       │ { subject, category, priority, message, assigneeIds[] }
       ▼
┌─────────────────────────────────┐
│   MailService.createMail()       │
│   - Create Mail thread           │
│   - Create initial message      │
│   - Mark as read for creator     │
│   - Notify assignees            │
└─────────────────────────────────┘
       │
       │ Assignee responds
       ▼
┌─────────────┐
│   POST /org/mail/:mailId/messages│
│   { content }                   │
└──────┬──────┘
       ▼
┌─────────────────────────────────┐
│   MailService.addMessage()       │
│   - Create MailMessage          │
│   - Update Mail status          │
│   - Create action log           │
│   - Mark as read for sender     │
│   - Notify participants         │
└─────────────────────────────────┘
```

**Mail Status Flow:**
- **OPEN**: Initial state
- **IN_PROGRESS**: Being worked on
- **AWAITING_RESPONSE**: Waiting for response
- **RESOLVED**: Issue resolved
- **CLOSED**: Closed without resolution
- **NO_REPLY**: System flag for non-reply notices

---

## API Structure

### 5.1 Authentication Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/change-password
PATCH  /auth/profile
GET    /auth/sessions
DELETE /auth/sessions/:id
DELETE /auth/sessions
```

### 5.2 Admin Endpoints

```
GET    /admin/organizations
PATCH  /admin/organizations/:id/approve
PATCH  /admin/organizations/:id/reject
PATCH  /admin/organizations/:id/suspend
GET    /admin/stats
GET    /admin/platform-admins
POST   /admin/platform-admins
PATCH  /admin/platform-admins/:id
DELETE /admin/platform-admins/:id
```

### 5.3 Organization Endpoints

```
GET    /org/settings
PATCH  /org/settings
PATCH  /org/logo
GET    /org/stats

# Teachers
GET    /org/teachers
POST   /org/teachers
PATCH  /org/teachers/:id
DELETE /org/teachers/:id

# Students
GET    /org/students
POST   /org/students
PATCH  /org/students/:id
DELETE /org/students/:id

# Courses
GET    /org/courses
POST   /org/courses
PATCH  /org/courses/:id
DELETE /org/courses/:id

# Sections
GET    /org/sections
POST   /org/sections
PATCH  /org/sections/:id
DELETE /org/sections/:id

# Assessments
GET    /org/assessments
POST   /org/assessments
PATCH  /org/assessments/:id
DELETE /org/assessments/:id

# Grades
GET    /org/grades
PATCH  /org/grades/:gradeId
GET    /org/grades/final

# Schedules
GET    /org/schedules
POST   /org/schedules
PATCH  /org/schedules/:id
DELETE /org/schedules/:id

# Attendance
GET    /org/attendance/:sectionId
POST   /org/attendance/mark
GET    /org/attendance/range
```

### 5.4 Chat Endpoints

```
GET    /org/chat/users
POST   /org/chat/direct
POST   /org/chat/group
GET    /org/chat/:id
POST   /org/chat/:id/messages
GET    /org/chats
```

### 5.5 Notification Endpoints

```
GET    /org/notifications
PATCH  /org/notifications/:id/read
PATCH  /org/notifications/read-all
```

### 5.6 Mail Endpoints

```
GET    /org/mail
POST   /org/mail
GET    /org/mail/:id
POST   /org/mail/:id/messages
PATCH  /org/mail/:id
```

### 5.7 Announcement Endpoints

```
GET    /org/announcements
POST   /org/announcements
```

---

## Security Model

### 6.1 Authentication

**JWT-Based Authentication:**
- Access tokens with configurable expiration (1 day default, 30 days with remember me)
- Token payload includes: userId, email, name, role, orgId, orgName, orgLogoUrl, avatarUrl, themeMode, status, isFirstLogin
- Tokens stored in localStorage on client
- Bearer token sent in Authorization header for API requests

### 6.2 Authorization

**Role-Based Access Control (RBAC):**
- Implemented using NestJS Guards
- Roles: SUPER_ADMIN, PLATFORM_ADMIN, ORG_ADMIN, ORG_MANAGER, TEACHER, STUDENT
- Route-level protection using @Roles() decorator
- Service-level authorization checks

**Organization-Level Isolation:**
- All org-scoped endpoints validate organizationId matches user's organization
- Platform admins can access any organization
- Cross-organization access prevented at service level

### 6.3 Session Management

**Multi-Device Support:**
- Each device (deviceId) can have one active session
- Sessions tracked with device fingerprint (deviceId, deviceName, deviceType, browser, os)
- IP geolocation for security monitoring
- Session expiration based on token expiry
- Old inactive sessions (>90 days) auto-cleaned

**Security Features:**
- New device detection and notification
- Country change detection (suspicious activity alert)
- Instant session revocation on organization status change
- Session revocation on password change
- Cannot revoke current session (must logout instead)

### 6.4 Data Security

**Password Security:**
- Bcrypt hashing with configurable rounds
- Minimum password requirements enforced
- Password change required on first login

**File Upload Security:**
- File type validation
- File size limits
- Avatar/logo replacement with cache-busting (avatarUpdatedAt timestamp)
- File audit trail via File entity

**SQL Injection Prevention:**
- Prisma ORM parameterized queries
- No raw SQL in application code

**XSS Prevention:**
- React's built-in XSS protection
- Content sanitization in markdown renderer

---

## Technology Stack

### 7.1 Backend

**Framework:**
- NestJS (Progressive Node.js framework)
- TypeScript (Type-safe JavaScript)

**Database:**
- PostgreSQL (Relational database)
- Prisma ORM (Type-safe database client)

**Authentication:**
- JWT (JSON Web Tokens)
- Passport (Authentication middleware)
- Bcrypt (Password hashing)

**Real-Time:**
- Socket.IO (WebSocket support)
- EventsGateway (Real-time chat/notifications)

**File Storage:**
- Multer (File upload handling)
- Cloud storage integration (via FilesService)

**Validation:**
- class-validator (DTO validation)
- class-transformer (Data transformation)

**Other:**
- RxJS (Reactive programming)
- UUID (Unique identifiers)

### 7.2 Frontend

**Framework:**
- Next.js 15 (React framework with App Router)
- TypeScript (Type-safe JavaScript)

**UI Components:**
- TailwindCSS (Utility-first CSS)
- Lucide React (Icon library)
- Custom components (DataTable, ModalForm, CustomSelect, CustomMultiSelect, etc.)

**State Management:**
- React Context API (AuthContext, GlobalContext, ThemeContext, UIContext)
- Custom stores with factory pattern (createResourceStore)
- React hooks (useState, useEffect, useCallback, useLayoutEffect)

**HTTP Client:**
- Fetch API with custom request helper
- Request/response interceptors
- Error handling and 401 detection

**Real-Time:**
- Socket.IO Client (WebSocket connection)
- Custom useSocket hook

**Forms:**
- React Hook Form (Form management)
- Zod (Schema validation)

**Other:**
- Markdown rendering (react-markdown)
- Date formatting (date-fns)

### 7.3 Development Tools

**Backend:**
- ESLint (Linting)
- Prettier (Code formatting)
- Jest (Testing framework)
- ts-node (TypeScript execution)

**Frontend:**
- ESLint (Linting)
- PostCSS (CSS processing)
- TypeScript (Type checking)

---

## Deployment Considerations

### 8.1 Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRATION=1d
PORT=3000
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 8.2 Database Migrations

Prisma migrations are used for schema changes:
```bash
npx prisma migrate dev --name migration_name
npx prisma migrate deploy  # Production
```

### 8.3 Production Build

**Backend:**
```bash
npm run build
npm run start:prod
```

**Frontend:**
```bash
npm run build
npm start
```

### 8.4 Scaling Considerations

**Database:**
- Connection pooling for PostgreSQL
- Indexed columns for frequently queried fields
- Prisma query optimization

**Backend:**
- Stateless API design (JWT tokens)
- Redis for caching (future enhancement)
- CDN for static assets

**Frontend:**
- Client-side caching with resource stores
- Lazy loading of components
- Image optimization with Next.js

---

## Appendix

### A.1 Status Codes

**Organization Status:**
- PENDING: Awaiting platform approval
- APPROVED: Active and operational
- REJECTED: Application denied
- SUSPENDED: Temporarily suspended

**Teacher Status:**
- ACTIVE: Currently teaching
- SUSPENDED: Temporarily suspended
- ON_LEAVE: On leave of absence
- DELETED: Soft-deleted

**Student Status:**
- ACTIVE: Currently enrolled
- SUSPENDED: Temporarily suspended
- ALUMNI: Graduated
- DELETED: Soft-deleted

**Grade Status:**
- DRAFT: Initial grade, not visible to students
- PUBLISHED: Visible to students, can be modified
- FINALIZED: Locked grade, cannot be modified

**Mail Status:**
- OPEN: Initial state
- IN_PROGRESS: Being worked on
- AWAITING_RESPONSE: Waiting for response
- RESOLVED: Issue resolved
- CLOSED: Closed without resolution
- NO_REPLY: System flag for non-reply notices

### A.2 Cache Invalidation Strategy

**Resource Stores (Frontend):**
- TTL-based: organizationsStore (3 minutes)
- Mutation-based: studentsStore, teachersStore, coursesStore, sectionsStore
  - Invalidate after create, update, delete operations
  - Invalidate after enrollment changes

**Cache Keys:**
- Pagination parameters (page, limit, search, sortBy, sortOrder)
- Organization-specific filters
- Section-specific filters (for student queries)

### A.3 WebSocket Events

**Chat Events:**
- `chat:message` - New message in chat
- `chat:typing` - User typing indicator
- `chat:read` - Message read receipt

**Notification Events:**
- `notification:new` - New notification
- `notification:read` - Notification marked as read

**Presence Events:**
- `presence:online` - User came online
- `presence:offline` - User went offline

---

**Document End**

This document provides a comprehensive overview of the School Management System architecture. For implementation details, refer to the source code and inline documentation.
