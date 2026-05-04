# System Activity Diagrams
## EduVerse - Mermaid Flowcharts

---

## 1. User Authentication Flow

```mermaid
flowchart TD
    A[User visits app] --> B{Has account?}
    B -->|No| C[Register Page]
    B -->|Yes| D[Login Page]
    
    C --> E[Enter name email password]
    E --> F[Submit registration]
    F --> G{Validation passed?}
    G -->|No| H[Show error messages]
    H --> E
    G -->|Yes| I[Create account]
    I --> J[Auto-login user]
    J --> K[Redirect to dashboard]
    
    D --> L[Enter credentials]
    L --> M[Submit login]
    M --> N{Credentials valid?}
    N -->|No| O[Show error]
    O --> L
    N -->|Yes| P{Check user role}
    
    P -->|Admin| Q[Redirect to admin dashboard]
    P -->|Org User| K
    P -->|Super Admin| R[Redirect to super admin panel]
    
    K --> S[Load user data]
    S --> T[Initialize theme]
    T --> U[Connect to WebSocket]
    U --> V[Dashboard ready]
```

---

## 2. Chat Messaging Flow

```mermaid
flowchart TD
    A[User opens chat] --> B[Load chat list]
    B --> C[Fetch user chats from API]
    C --> D{Chats exist?}
    D -->|No| E[Show empty state]
    D -->|Yes| F[Display chat list]
    
    F --> G[User selects chat]
    G --> H[Load chat messages]
    H --> I[Subscribe to presence updates]
    I --> J[Subscribe to message events]
    J --> K[Display message history]
    
    K --> L{User action?}
    
    L -->|Send message| M[Type message]
    M --> N[Add attachments?]
    N -->|Yes| O[Upload files]
    O --> P{Upload success?}
    P -->|No| Q[Show upload error]
    Q --> M
    P -->|Yes| R[Files attached]
    N -->|No| R
    R --> S[Send message via WebSocket]
    S --> T[Optimistic UI update]
    T --> U[Wait for server confirmation]
    U --> V{Message confirmed?}
    V -->|Yes| W[Final message state]
    V -->|No| X[Mark as failed]
    X --> Y[Show retry option]
    
    L -->|Long press message| Z[Show context menu]
    Z --> AA{User selects action}
    AA -->|Reply| AB[Set reply reference]
    AB --> M
    AA -->|Copy| AC[Copy to clipboard]
    AA -->|Edit| AD[Enter edit mode]
    AD --> AE[Save changes]
    AA -->|Delete| AF[Confirm delete]
    AF --> AG[Delete message]
    
    L -->|Scroll up| AH[Load older messages]
    AH --> AI[Paginate messages]
    AI --> K
    
    L -->|Switch chat| G
    L -->|Close chat| AJ[Unsubscribe events]
    AJ --> AK[Clear chat state]
```

---

## 3. Mail System Flow

```mermaid
flowchart TD
    A[User opens mail] --> B[Fetch inbox]
    B --> C{Unread mail?}
    C -->|Yes| D[Display unread badge]
    C -->|No| E[Show inbox]
    D --> E
    
    E --> F{User action?}
    
    F -->|Select mail| G[Load mail content]
    G --> H{Mail has attachments?}
    H -->|Yes| I[Show attachment list]
    H -->|No| J[Display content]
    I --> J
    J --> K[Mark as read]
    K --> L[Update unread count]
    
    F -->|Compose mail| M[Open compose modal]
    M --> N[Enter recipient]
    N --> O[Enter subject]
    O --> P[Type message body]
    P --> Q[Add attachments?]
    Q -->|Yes| R[Upload files]
    R --> S[Attach to mail]
    Q -->|No| T[Review mail]
    S --> T
    T --> U[Send mail]
    U --> V{Send successful?}
    V -->|Yes| W[Close modal]
    W --> E
    V -->|No| X[Show error]
    X --> T
    
    F -->|Delete mail| Y[Confirm deletion]
    Y --> Z[Move to trash]
    Z --> AA[Remove from list]
    
    F -->|Refresh| B
```

---

## 4. Theme Settings Flow

```mermaid
flowchart TD
    A[User opens settings] --> B[Load settings page]
    B --> C[Fetch current theme]
    C --> D[Display theme options]
    
    D --> E{User changes theme?}
    
    E -->|Change mode| F[Select Light Dark System]
    F --> G[Apply theme preview]
    G --> H[Update CSS variables]
    H --> I[Store in localStorage]
    
    E -->|Change primary color| J[Select accent color]
    J --> K[Update primary color]
    K --> L[Compute secondary color]
    L --> M[Apply color preview]
    M --> N[Update CSS properties]
    
    E -->|Save changes| O[Submit to API]
    O --> P{Save successful?}
    P -->|Yes| Q[Show success toast]
    P -->|No| R[Show error toast]
    R --> D
    
    E -->|Cancel| S[Revert changes]
    S --> D
```

---

## 5. Dashboard Navigation Flow

```mermaid
flowchart TD
    A[User logged in] --> B[Load dashboard layout]
    B --> C[Initialize sidebar]
    C --> D{Sidebar state}
    D -->|Expanded| E[Show full sidebar]
    D -->|Collapsed| F[Show icons only]
    
    E --> G[Render navigation links]
    F --> G
    
    G --> H[Check user role]
    H --> I{Role based links}
    
    I -->|Admin| J[Show admin links]
    I -->|User| K[Show user links]
    I -->|Super Admin| L[Show super admin links]
    
    J --> M[Render bottom section]
    K --> M
    L --> M
    
    M --> N{Bottom section collapsed?}
    N -->|Yes| O[Show toggle button with badge]
    N -->|No| P[Show full bottom links]
    
    N --> Q[User clicks navigation]
    Q --> R[Navigate to route]
    R --> S[Load page content]
    S --> T[Update active link state]
    T --> U[Page ready]
    
    Q -->|Toggle sidebar| V[Toggle expanded state]
    V --> W[Animate transition]
    W --> D
    
    Q -->|Toggle bottom section| X[Toggle collapse state]
    X --> Y[Animate section]
    Y --> N
```

---

## 6. Admin User Management Flow

```mermaid
flowchart TD
    A[Admin opens users] --> B[Load user list]
    B --> C[Fetch users from API]
    C --> D[Display user table]
    
    D --> E{Admin action?}
    
    E -->|Search| F[Enter search term]
    F --> G[Filter user list]
    G --> D
    
    E -->|Filter| H[Select filter criteria]
    H --> I[Apply filter]
    I --> D
    
    E -->|Create user| J[Open create modal]
    J --> K[Enter user details]
    K --> L[Select role]
    L --> M[Submit create]
    M --> N{Validation passed?}
    N -->|No| O[Show errors]
    O --> K
    N -->|Yes| P[Create user]
    P --> Q[Refresh user list]
    Q --> D
    
    E -->|Edit user| R[Select user]
    R --> S[Open edit modal]
    S --> T[Update details]
    T --> U[Save changes]
    U --> V{Save successful?}
    V -->|Yes| W[Update user list]
    V -->|No| X[Show error]
    X --> T
    W --> D
    
    E -->|Delete user| Y[Select user]
    Y --> Z[Confirm deletion]
    Z --> AA{Confirmed?}
    AA -->|No| D
    AA -->|Yes| AB[Delete user]
    AB --> AC[Remove from list]
    AC --> D
    
    E -->|Change role| AD[Select user]
    AD --> AE[Select new role]
    AE --> AF[Update role]
    AF --> AG[Notify user]
    AG --> D
```

---

## 7. File Upload Flow (Chat Attachment)

```mermaid
flowchart TD
    A[User in chat] --> B[Click attachment button]
    B --> C[Open file picker]
    C --> D[User selects files]
    D --> E{Files selected?}
    E -->|No| A
    E -->|Yes| F[Validate files]
    
    F --> G{Valid?}
    G -->|No| H[Show validation error]
    H --> B
    
    G -->|Yes| I[Preview attachments]
    I --> J{User confirms?}
    J -->|No| K[Remove attachments]
    K --> B
    
    J -->|Yes| L[Start upload]
    L --> M[Show progress indicator]
    M --> N[Upload chunk by chunk]
    N --> O{Upload complete?}
    
    O -->|Error| P[Show upload error]
    P --> Q{Retry?}
    Q -->|Yes| L
    Q -->|No| K
    
    O -->|Success| R[Files uploaded]
    R --> S[Attach to message]
    S --> T[Enable send button]
    T --> U[User sends message]
    U --> V[Include attachments in message]
    V --> W[Message sent]
```

---

## 8. Real-time Presence Flow

```mermaid
flowchart TD
    A[App starts] --> B[Connect to WebSocket]
    B --> C{Connection successful?}
    C -->|No| D[Retry connection]
    D --> B
    
    C -->|Yes| E[Subscribe to presence]
    E --> F[Emit user online]
    F --> G[Listen for presence updates]
    
    G --> H{Received update}
    H -->|User online| I[Update online status]
    I --> J[Show online indicator]
    
    H -->|User offline| K[Update offline status]
    K --> L[Show last seen time]
    
    H -->|Typing started| M[Show typing indicator]
    M --> N[Animate dots]
    
    H -->|Typing stopped| O[Hide typing indicator]
    
    H -->|User disconnect| P[Handle disconnect]
    P --> Q{Reconnect?}
    Q -->|Yes| R[Reconnect]
    R --> B
    Q -->|No| S[Go offline]
    
    T[User closes app] --> U[Emit offline]
    U --> V[Update last seen]
    V --> W[Disconnect WebSocket]
```

---

## 9. Notification System Flow

```mermaid
flowchart TD
    A[Event occurs] --> B{Event type?}
    
    B -->|New message| C[Create message notification]
    B -->|New mail| D[Create mail notification]
    B -->|System alert| E[Create system notification]
    
    C --> F[Determine recipients]
    D --> F
    E --> F
    
    F --> G{User online?}
    G -->|Yes| H[Send via WebSocket]
    H --> I[Show toast notification]
    I --> J[Update badge count]
    
    G -->|No| K[Queue notification]
    K --> L[Send push notification]
    L --> M[Store for later]
    
    N[User clicks notification] --> O{Notification type?}
    O -->|Message| P[Navigate to chat]
    O -->|Mail| Q[Navigate to mail]
    O -->|System| R[Navigate to relevant page]
    
    S[User dismisses] --> T[Clear notification]
    T --> U[Update badge count]
```

---

## 10. Settings Update Flow

```mermaid
flowchart TD
    A[User opens settings] --> B[Load current settings]
    B --> C[Display settings form]
    
    C --> D{User edits}
    D -->|Personal info| E[Update name email]
    D -->|Password| F[Enter old password]
    F --> G[Enter new password]
    G --> H[Confirm new password]
    
    D -->|Theme| I[Change color mode]
    I --> J[Preview theme]
    
    D -->|Organization| K[Update org details]
    K --> L[Upload logo?]
    L -->|Yes| M[Upload new logo]
    L -->|No| N[Review changes]
    M --> N
    
    E --> N
    H --> O{Passwords match?}
    O -->|No| P[Show mismatch error]
    P --> G
    O -->|Yes| N
    J --> N
    
    N --> Q[Click save]
    Q --> R[Validate all fields]
    R --> S{Valid?}
    S -->|No| T[Show validation errors]
    T --> D
    
    S -->|Yes| U[Submit to API]
    U --> V{Save successful?}
    V -->|Yes| W[Show success message]
    W --> X[Apply changes immediately]
    
    V -->|No| Y[Show error message]
    Y --> Z{Retry?}
    Z -->|Yes| U
    Z -->|No| D
```

---

## How to Use These Diagrams

1. **Mermaid Live Editor**: Paste any diagram code into https://mermaid.live
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **GitHub/GitLab**: Mermaid is natively supported in markdown files
4. **Documentation**: Include in README.md or Wiki pages

---

## Main Activities Summary

| Activity | Description | Key Files |
|----------|-------------|-----------|
| **Authentication** | Login, register, role-based routing | `login/page.tsx`, `register/page.tsx` |
| **Chat Messaging** | Real-time messaging with attachments | `ChatLayout.tsx`, `ChatMessage.tsx` |
| **Mail System** | Inbox, compose, read mail | `mail/page.tsx`, `NewMailModal.tsx` |
| **Theme Settings** | Light/dark mode, color customization | `ThemeContext.tsx`, `settings/page.tsx` |
| **Dashboard Navigation** | Sidebar, layout, responsive behavior | `DashboardLayout.tsx`, `Navbar.tsx` |
| **Admin Management** | User CRUD, role management | Admin page components |
| **File Upload** | Attachment handling in chat/mail | Upload components |
| **Real-time Presence** | Online status, typing indicators | `EventsGateway`, presence subscriptions |
| **Notifications** | Toast messages, badges | Notification components |
| **Settings Management** | User/org settings updates | `settings/page.tsx` |
