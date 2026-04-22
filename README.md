# 



# School Management System - Technical Design Document
**Version:** 1.0
**Date:** January 2025
**Repository:** clouds440/school-management
**Document Type:** Technical Design Document (TDD)

---

## Table of Contents
1. Overview
2. Goals and Non-Goals
3. Architecture
4. Data Model
5. API Design
6. Security Considerations
7. Testing Strategy
8. Rollout Plan
---

## Overview
### Purpose
The School Management System is a comprehensive web-based platform designed to streamline educational institution administration. It provides a multi-tenant architecture supporting multiple organizations with role-based access control for administrators, teachers, and students.

### Scope
The system encompasses:

- **Multi-Organization Management**: Hierarchical organization structure with parent-child relationships
- **User Management**: Role-based access for Super Admins, Platform Admins, Org Admins, Org Managers, Teachers, and Students
- **Academic Management**: Courses, sections, enrollments, assessments, and grading
- **Attendance Tracking**: Schedule management and attendance recording
- **Communication Systems**: Real-time chat, internal mail, notifications, and announcements
- **File Management**: Document and media uploads with cloud storage integration
### Technology Stack Summary
| Layer | Technology |
| ----- | ----- |
| Frontend | Next.js 16.1.6, React 19.2.3, TypeScript 5.x, TailwindCSS 4.x |
| Backend | NestJS 11.x, Node.js, TypeScript 5.7.3 |
| Database | PostgreSQL with Prisma ORM 6.4.1 |
| Real-time | Socket.IO (WebSockets) |
| Authentication | JWT with Passport.js |
| File Storage | Cloudinary |
---

## Goals and Non-Goals
### Goals
- **Scalable Multi-Tenancy**: Support multiple educational institutions with complete data isolation
- **Role-Based Access Control**: Granular permissions for six distinct user roles
- **Real-Time Communication**: Instant messaging and notifications via WebSockets
- **Comprehensive Academic Tracking**: Full lifecycle management of courses, assessments, and grades
- **Session Security**: Multi-device session management with suspicious activity detection
- **Audit Trail**: Complete tracking of administrative actions and data changes
### Non-Goals
- **Mobile Native Applications**: Current scope is web-only (responsive design)
- **Payment Processing**: Fee management is data-only; no payment gateway integration
- **Video Conferencing**: External links supported but no built-in video functionality
- **Offline Support**: Requires active internet connection
- **Multi-Language Support**: English-only in current version
---

## Architecture
### High-Level System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                   Next.js 16 (React 19) SPA                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  App Router  │ │   Context    │ │    Resource Stores       │ │
│  │  (Pages)     │ │   Providers  │ │    (Caching Layer)       │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST + WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                        API LAYER                                 │
│                    NestJS Application                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   Guards     │ │ Interceptors │ │     Rate Limiting        │ │
│  │  (Auth/RBAC) │ │  (Transform) │ │     (Throttler)          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │  Auth   │ │  Admin  │ │   Org   │ │  Chat   │ │   Mail    │ │
│  │ Service │ │ Service │ │ Service │ │ Service │ │  Service  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐│
│  │ Events  │ │  Files  │ │ Notify  │ │     Announcements       ││
│  │ Gateway │ │ Service │ │ Service │ │        Service          ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                             │
│                      Prisma ORM                                  │
├─────────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                                │
│                    PostgreSQL                                    │
└─────────────────────────────────────────────────────────────────┘
```
### Backend Module Structure
```
backend/src/
├── admin/                 # Platform administration module
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── admin.module.ts
├── auth/                  # Authentication & session management
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── guards/
├── chat/                  # Real-time messaging system
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   └── chat.gateway.ts
├── common/                # Shared utilities
│   ├── guards/
│   │   └── active-org.guard.ts
│   ├── decorators/
│   └── enums/
├── events/                # WebSocket gateway
│   └── events.gateway.ts
├── files/                 # File upload management
│   ├── files.controller.ts
│   └── files.service.ts
├── mail/                  # Internal mail system
│   ├── mail.controller.ts
│   └── mail.service.ts
├── notifications/         # User notifications
│   ├── notifications.controller.ts
│   └── notifications.service.ts
├── announcements/         # Organization announcements
│   ├── announcements.controller.ts
│   └── announcements.service.ts
├── org/                   # Organization operations
│   ├── org.controller.ts
│   ├── org.service.ts
│   └── dto/
├── prisma/                # Database client
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts          # Root module
└── main.ts                # Application entry point
```
### Frontend Structure
```
frontend/
├── app/                   # Next.js App Router
│   ├── (org)/            # Organization dashboard routes
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── courses/
│   │   ├── sections/
│   │   ├── assessments/
│   │   ├── attendance/
│   │   ├── chat/
│   │   └── settings/
│   ├── admin/            # Platform admin routes
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   │   ├── DataTable/
│   │   ├── ModalForm/
│   │   ├── CustomSelect/
│   │   └── CustomMultiSelect/
│   ├── forms/           # Form components
│   └── sections/        # Feature-specific components
├── context/             # React Context providers
│   ├── AuthContext.tsx
│   ├── GlobalContext.tsx
│   ├── ThemeContext.tsx
│   └── UIContext.tsx
├── hooks/               # Custom React hooks
│   ├── usePaginatedData.ts
│   ├── useSocket.ts
│   └── useDebounce.ts
├── lib/                 # Utilities and API client
│   ├── api.ts          # API client with request helper
│   └── *Store.ts       # Resource stores for caching
└── types/              # TypeScript type definitions
```
### Main Business Flows
#### 1. Authentication Flow
```
User Login Request
       │
       ▼
┌─────────────────────────┐
│  Validate Credentials   │
│  (Email + Password)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check Organization     │
│  Status (APPROVED?)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Generate JWT Token     │
│  Create/Update Session  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  IP Geolocation Lookup  │
│  Device Fingerprinting  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  New Device Detection?  │──Yes──▶ Send Security Notification
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Return Token + Role    │
└─────────────────────────┘
```
#### 2. Organization Lifecycle Flow
```
Registration (PENDING)
       │
       ▼
Platform Admin Review
       │
       ├──Approve──▶ APPROVED ──▶ Full Access Granted
       │
       ├──Reject───▶ REJECTED ──▶ Access Denied + Reason Email
       │
       └──Suspend──▶ SUSPENDED ─▶ Access Revoked + Sessions Cleared
```
#### 3. Academic Management Flow
```
Course Creation
       │
       ▼
Section Creation (linked to Course)
       │
       ├──▶ Teacher Assignment (many-to-many)
       │
       └──▶ Student Enrollment (via Enrollment table)
              │
              ▼
       Assessment Creation
              │
              ├──▶ Student Submissions
              │
              └──▶ Grade Entry (DRAFT → PUBLISHED → FINALIZED)
```
#### 4. Real-Time Chat Flow
```
User Initiates Chat
│
├──Direct Chat──▶ Find/Create 1:1 Chat
│
└──Group Chat───▶ Create Chat + Add Participants
       │
       ▼
WebSocket Connection (Socket.IO)
       │
       ├──▶ Send Message ──▶ Broadcast to Participants
       │
       ├──▶ Typing Indicator ──▶ Real-time Update
       │
       └──▶ Read Receipt ──▶ Update lastReadMessageId
```
---

## Data Model
### Core Entities
#### Organization
| Field | Type | Description |
| ----- | ----- | ----- |
| id | UUID | Primary key |
| name | String | Organization name |
| location | String | Physical location |
| type | String | Organization type |
| contactEmail | String | Primary contact email |
| phone | String? | Contact phone |
| status | Enum | PENDING, APPROVED, REJECTED, SUSPENDED |
| statusHistory | JSON | Audit trail of status changes |
| logoUrl | String? | Organization logo |
| accentColor | JSON? | Theme customization |
| parentOrgId | UUID? | Parent organization (hierarchy) |
#### User
| Field | Type | Description |
| ----- | ----- | ----- |
| id | UUID | Primary key |
| email | String | Unique email address |
| password | String | Bcrypt hashed password |
| role | Enum | SUPER_ADMIN, PLATFORM_ADMIN, ORG_ADMIN, ORG_MANAGER, TEACHER, STUDENT |
| isFirstLogin | Boolean | Force password change flag |
| organizationId | UUID? | Associated organization |
| name | String? | Display name |
| themeMode | Enum | LIGHT, DARK, SYSTEM |
| avatarUrl | String? | Profile picture URL |
#### Session
| Field | Type | Description |
| ----- | ----- | ----- |
| id | UUID | Primary key |
| userId | UUID | Associated user |
| deviceId | String | Device fingerprint |
| deviceName | String? | Human-readable device name |
| deviceType | String? | desktop, mobile, tablet |
| browser | String? | Browser name |
| os | String? | Operating system |
| location | String? | Country from IP geolocation |
| ip | String? | IP address |
| token | String | JWT token |
| isActive | Boolean | Session validity |
| expiresAt | DateTime | Token expiration |
### Academic Entities
#### Course → Section → Enrollment
```
Course (1) ──────▶ (N) Section (N) ◀────── (N) Teacher
     │
     │ (1)
     ▼
Enrollment (N) ◀────── (1) Student
```
#### Assessment → Grade/Submission
```
Assessment (1) ──────▶ (N) Grade (N) ◀────── (1) Student
│
└──────────────▶ (N) Submission (N) ◀── (1) Student
```
### Communication Entities
#### Chat System
```
Chat (1) ──────▶ (N) ChatParticipant (N) ◀────── (1) User
│
└──────────▶ (N) ChatMessage
                  │
                  └──▶ replyTo (self-referencing)
```
#### Mail System
```
Mail (1) ──────▶ (N) MailMessage
│
├──────────▶ (N) MailActionLog (audit trail)
│
└──────────▶ (N) MailUserView (read tracking)
```
### Attendance Entities
```
Section (1) ──▶ (N) SectionSchedule (1) ──▶ (N) AttendanceSession
│
└──▶ (N) AttendanceRecord
```
### Entity Relationship Diagram Summary
```
Organization
│
├── Users (1:N)
│     ├── Teacher Profile (1:1)
│     └── Student Profile (1:1)
│
├── Courses (1:N)
│     └── Sections (1:N)
│           ├── Enrollments (1:N)
│           ├── Teachers (N:N)
│           ├── Schedules (1:N)
│           └── Assessments (1:N)
│
├── Chats (1:N)
├── Mails (1:N)
└── Announcements (1:N)
```
---

## API Design
### Authentication Endpoints
| Method | Endpoint | Description |
| ----- | ----- | ----- |
| POST | `/auth/register`  | Register new organization with admin |
| POST | `/auth/login`  | Authenticate user, return JWT |
| POST | `/auth/logout`  | Invalidate current session |
| POST | `/auth/change-password`  | Update user password |
| PATCH | `/auth/profile`  | Update user profile |
| GET | `/auth/sessions`  | List active sessions |
| DELETE | `/auth/sessions/:id`  | Revoke specific session |
| DELETE | `/auth/sessions`  | Revoke all sessions except current |
### Admin Endpoints (Platform Level)
| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/admin/organizations`  | List all organizations (paginated) |
| PATCH | `/admin/organizations/:id/approve`  | Approve organization |
| PATCH | `/admin/organizations/:id/reject`  | Reject organization with reason |
| PATCH | `/admin/organizations/:id/suspend`  | Suspend organization |
| GET | `/admin/stats`  | Platform statistics |
| GET | `/admin/platform-admins`  | List platform administrators |
| POST | `/admin/platform-admins`  | Create platform admin |
| PATCH | `/admin/platform-admins/:id`  | Update platform admin |
| DELETE | `/admin/platform-admins/:id`  | Remove platform admin |
### Organization Endpoints
| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/settings`  | Get organization settings |
| PATCH | `/org/settings`  | Update organization settings |
| PATCH | `/org/logo`  | Upload organization logo |
| GET | `/org/stats`  | Organization statistics |
### Resource Management Endpoints
**Teachers**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/teachers`  | List teachers (paginated, filterable) |
| POST | `/org/teachers`  | Create teacher |
| PATCH | `/org/teachers/:id`  | Update teacher |
| DELETE | `/org/teachers/:id`  | Soft-delete teacher |
**Students**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/students`  | List students (paginated, filterable) |
| POST | `/org/students`  | Create student with enrollments |
| PATCH | `/org/students/:id`  | Update student and enrollments |
| DELETE | `/org/students/:id`  | Soft-delete student |
**Courses & Sections**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/courses`  | List courses |
| POST | `/org/courses`  | Create course |
| PATCH | `/org/courses/:id`  | Update course |
| DELETE | `/org/courses/:id`  | Delete course (cascades sections) |
| GET | `/org/sections`  | List sections |
| POST | `/org/sections`  | Create section |
| PATCH | `/org/sections/:id`  | Update section |
| DELETE | `/org/sections/:id`  | Delete section |
**Assessments & Grades**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/assessments`  | List assessments |
| POST | `/org/assessments`  | Create assessment |
| PATCH | `/org/assessments/:id`  | Update assessment |
| DELETE | `/org/assessments/:id`  | Delete assessment |
| GET | `/org/grades`  | Get grades for assessment |
| PATCH | `/org/grades/:gradeId`  | Update grade |
| GET | `/org/grades/final`  | Get final grades report |
**Attendance**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/schedules`  | List section schedules |
| POST | `/org/schedules`  | Create schedule |
| PATCH | `/org/schedules/:id`  | Update schedule |
| DELETE | `/org/schedules/:id`  | Delete schedule |
| GET | `/org/attendance/:sectionId`  | Get attendance for section |
| POST | `/org/attendance/mark`  | Mark attendance (bulk) |
| GET | `/org/attendance/range`  | Get attendance for date range |
### Communication Endpoints
**Chat**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/chat/users`  | Search users for chat |
| POST | `/org/chat/direct`  | Create/get direct chat |
| POST | `/org/chat/group`  | Create group chat |
| GET | `/org/chat/:id`  | Get chat with messages |
| POST | `/org/chat/:id/messages`  | Send message |
| GET | `/org/chats`  | List user's chats |
**Mail**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/mail`  | List mail threads |
| POST | `/org/mail`  | Create mail thread |
| GET | `/org/mail/:id`  | Get mail with messages |
| POST | `/org/mail/:id/messages`  | Reply to mail |
| PATCH | `/org/mail/:id`  | Update mail status |
**Notifications & Announcements**

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| GET | `/org/notifications`  | List user notifications |
| PATCH | `/org/notifications/:id/read`  | Mark as read |
| PATCH | `/org/notifications/read-all`  | Mark all as read |
| GET | `/org/announcements`  | List announcements |
| POST | `/org/announcements`  | Create announcement |
### WebSocket Events
| Event | Direction | Description |
| ----- | ----- | ----- |
| `chat:message`  | Server → Client | New chat message |
| `chat:typing`  | Bidirectional | Typing indicator |
| `chat:read`  | Client → Server | Mark message as read |
| `notification:new`  | Server → Client | New notification |
| `presence:online`  | Server → Client | User online status |
| `presence:offline`  | Server → Client | User offline status |
---

## Security Considerations
### Authentication Security
- **Password Hashing**: Bcrypt with configurable salt rounds
- **JWT Tokens**: 
    - Default expiration: 1 day
    - Remember me: 30 days
    - Signed with secret key from environment

- **Token Payload**: userId, email, role, orgId, orgName, status
### Session Management
- **Multi-Device Support**: One active session per device (deviceId)
- **Session Tracking**: Device fingerprint, browser, OS, IP, location
- **Security Alerts**:
    - New device login notification
    - Country change detection (suspicious activity)

- **Session Revocation**:
    - On password change (all sessions)
    - On organization status change (all org users)
    - Manual revocation (except current session)

- **Auto-Cleanup**: Sessions older than 90 days automatically removed
### Authorization
- **Role-Based Access Control (RBAC)**:
    - Guards at route level (`@Roles()`  decorator)
    - Service-level authorization checks

- **Organization Isolation**:
    - All org-scoped queries filter by organizationId
    - ActiveOrgGuard prevents access to suspended/rejected orgs

- **Role Hierarchy**:SUPER_ADMIN > PLATFORM_ADMIN > ORG_ADMIN > ORG_MANAGER > TEACHER > STUDENT
### Data Protection
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Prevention**: React's built-in sanitization + markdown sanitizer
- **Rate Limiting**: NestJS Throttler module (configurable TTL/limit)
- **CORS**: Configured for specific origins
- **Input Validation**: class-validator DTOs on all endpoints
### File Security
- **Upload Validation**: File type and size restrictions
- **Cloud Storage**: Cloudinary with secure URLs
- **Cache Busting**: avatarUpdatedAt timestamp for profile pictures
- **Audit Trail**: All uploads tracked in File entity
---

## Testing Strategy
### Backend Testing
#### Unit Tests
- **Framework**: Jest
- **Coverage Target**: 80% minimum
- **Focus Areas**:
    - Service layer business logic
    - Guard authorization logic
    - DTO validation
    - Utility functions

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:cov
```
#### Integration Tests
- **Framework**: Jest + Supertest
- **Database**: Test database with Prisma migrations
- **Focus Areas**:
    - API endpoint responses
    - Authentication flows
    - Authorization enforcement
    - Database transactions

```bash
# Run e2e tests
npm run test:e2e
```
#### Test Structure
```
backend/
├── src/
│   └── **/*.spec.ts      # Unit tests (co-located)
└── test/
    ├── jest-e2e.json     # E2E configuration
    └── **/*.e2e-spec.ts  # E2E tests
```
### Frontend Testing
#### Component Testing
- **Framework**: Jest + React Testing Library
- **Focus Areas**:
    - Component rendering
    - User interactions
    - Form validation
    - Context providers

#### Integration Testing
- **Focus Areas**:
    - Page navigation
    - API integration
    - State management
    - Real-time updates

### Test Data
- **Faker.js**: `@faker-js/faker`  for generating test data
- **Seed Scripts**: Database seeding for development/testing
### CI/CD Testing
- **Pre-commit**: Lint checks
- **Pull Request**: Full test suite
- **Main Branch**: Full test suite + coverage report
---

## Rollout Plan
### Phase 1: Development Environment
1. **Prerequisites**:
    - Node.js 20+
    - PostgreSQL 15+
    - Cloudinary account

2. **Backend Setup**:cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, CLOUDINARY_*
npx prisma migrate dev
npm run start:dev
3. **Frontend Setup**:cd frontend
npm install
cp .env.example .env.local
# Configure NEXT_PUBLIC_API_URL
npm run dev
### Phase 2: Staging Environment
1. **Infrastructure**:
    - PostgreSQL managed database
    - Node.js hosting (Railway, Render, AWS ECS)
    - CDN for static assets

2. **Environment Variables**:# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-random-string>
JWT_EXPIRATION=1d
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontend
NEXT_PUBLIC_API_URL=https://api.staging.example.com
3. **Database Migration**:npx prisma migrate deploy
4. **Build & Deploy**:# Backend
npm run build
npm run start:prod

# Frontend
npm run build
npm start
### Phase 3: Production Environment
1. **Infrastructure Requirements**:
    - Load balancer with SSL termination
    - PostgreSQL with connection pooling
    - Redis for session caching (optional)
    - CDN for static assets
    - Monitoring (APM, logging)

2. **Security Checklist**:
    - [ ] SSL/TLS certificates configured
    - [ ] Environment variables secured
    - [ ] Database credentials rotated
    - [ ] Rate limiting configured
    - [ ] CORS origins restricted
    - [ ] Backup strategy implemented

3. **Monitoring Setup**:
    - Application performance monitoring
    - Error tracking (Sentry)
    - Log aggregation
    - Uptime monitoring
    - Database performance metrics

4. **Rollback Plan**:
    - Database migration rollback scripts
    - Previous version container images
    - Feature flags for gradual rollout

### Phase 4: Post-Launch
1. **Performance Optimization**:
    - Database query optimization
    - Caching strategy implementation
    - CDN optimization
    - Image optimization

2. **Scaling Strategy**:
    - Horizontal scaling for API servers
    - Database read replicas
    - WebSocket server clustering

3. **Maintenance Schedule**:
    - Weekly security updates
    - Monthly dependency updates
    - Quarterly performance reviews

---

## Appendix
### A. Libraries and Dependencies
#### Backend Dependencies
| Package | Version | Purpose |
| ----- | ----- | ----- |
| @nestjs/core | ^11.0.1 | NestJS framework core |
| @nestjs/jwt | ^11.0.2 | JWT authentication |
| @nestjs/passport | ^11.0.2 | Passport integration |
| @nestjs/websockets | ^11.1.17 | WebSocket support |
| @nestjs/platform-socket.io | ^11.1.17 | Socket.IO adapter |
| @nestjs/throttler | ^6.5.0 | Rate limiting |
| @nestjs/schedule | ^6.1.1 | Task scheduling |
| @nestjs/config | ^4.0.3 | Configuration management |
| @prisma/client | ^6.4.1 | Database ORM |
| bcrypt | ^6.0.0 | Password hashing |
| class-validator | ^0.14.4 | DTO validation |
| class-transformer | ^0.5.1 | Data transformation |
| cloudinary | ^1.41.3 | Cloud file storage |
| passport-jwt | ^4.0.1 | JWT strategy |
#### Frontend Dependencies
| Package | Version | Purpose |
| ----- | ----- | ----- |
| next | 16.1.6 | React framework |
| react | 19.2.3 | UI library |
| react-hook-form | ^7.71.2 | Form management |
| @hookform/resolvers | ^5.2.2 | Form validation resolvers |
| zod | ^4.3.6 | Schema validation |
| socket.io-client | ^4.8.3 | WebSocket client |
| tailwind-merge | ^3.5.0 | CSS class merging |
| lucide-react | ^0.577.0 | Icon library |
| date-fns | ^4.1.0 | Date formatting |
| marked | ^17.0.4 | Markdown rendering |
| clsx | ^2.1.1 | Conditional classes |
| react-easy-crop | ^5.5.6 | Image cropping |
### B. Environment Variables Reference
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
PORT=3000
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```
### C. Status Enumerations
| Entity | Status Values |
| ----- | ----- |
| Organization | PENDING, APPROVED, REJECTED, SUSPENDED |
| Teacher | ACTIVE, SUSPENDED, ON_LEAVE, DELETED |
| Student | ACTIVE, SUSPENDED, ALUMNI, DELETED |
| Grade | DRAFT, PUBLISHED, FINALIZED |
| Mail | OPEN, IN_PROGRESS, AWAITING_RESPONSE, RESOLVED, CLOSED, NO_REPLY |
| Attendance | PRESENT, ABSENT, LATE, EXCUSED |
---

**Document End**



