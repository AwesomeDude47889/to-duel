# ToDuel - Personal Task Management Application

## Overview

ToDuel is a full-stack web application built with React/TypeScript frontend and Express.js backend. It's a personal task management system that allows users to create, edit, delete, and track tasks with Firebase Google Authentication and real-time database synchronization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit OpenID Connect (OIDC) with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL

### Project Structure
```
/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── migrations/      # Database migrations
```

## Key Components

### Database Schema (Firebase Realtime Database)
- **User Profiles**: Stores user profile information with XP, level, streak data
- **Tasks**: User tasks with title, completion status, XP tracking, and step system
- **Friends**: Friend relationships with status and metadata
- **Friend Requests**: Pending friend requests with sender/receiver information
- **Duels**: Duel challenges with progress tracking and winner determination
- **Duel Tasks**: Tasks created specifically for duel competition

### Authentication System
- **Provider**: Firebase Google Authentication (redirect-based sign-in with popup fallback)
- **User Management**: Automatic user profile creation/update via Firebase
- **Real-time**: Firebase Auth state management with automatic persistence
- **Single Sign-On**: Google-only authentication for simplified user experience
- **Deployment Status**: Authentication working on deployment after adding domain to Firebase authorized domains (redirect URI auto-handled by Firebase)

### Modern UI Design System (Updated: July 14, 2025)
- **Typography**: Google Fonts integration (Poppins for headings, Inter for body text)
- **Theme System**: CSS variables for seamless light/dark mode switching with localStorage persistence
- **Design Language**: Mobile-first responsive layout with modern spacing and rounded corners
- **Component Architecture**: Modular reusable components (ThemeToggle, XPProgressBar, TaskCard)
- **Animation System**: CSS animations for smooth interactions (slide-in, scale-in, hover effects)
- **Color System**: Semantic color variables supporting both light and dark themes

### API Endpoints
- `GET /api/auth/user` - Get current authenticated user
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update existing task
- `DELETE /api/tasks/:id` - Delete task

### UI Components
- **Landing Page**: Authentication portal with Google Sign-In button
- **Home Page**: Modern main interface with XP progress bar, theme toggle, and enhanced filtering
- **Task Cards**: Interactive cards with priority badges, completion states, and hover animations
- **XP Progress Bar**: Animated level progression display with dynamic fill and shimmer effects
- **Theme Toggle**: Dark/light mode switcher with smooth transitions
- **Task Modal**: Create/edit task dialog with theme-aware styling
- **Delete Modal**: Confirmation dialog with modern design consistency
- **shadcn/ui**: Comprehensive component library enhanced with custom theme system

## Data Flow

1. **Authentication Flow**:
   - User clicks "Continue with Google" → Firebase popup opens
   - Google authentication → user data automatically managed by Firebase
   - Real-time auth state updates via Firebase listeners
   - User redirected to home page with task access

2. **Task Management Flow**:
   - Frontend makes authenticated API calls
   - Backend validates user session
   - Database operations performed via Drizzle ORM
   - Real-time UI updates via React Query cache invalidation

3. **State Management**:
   - Server state managed by TanStack Query
   - UI state managed by React hooks
   - Form state handled by React Hook Form

## External Dependencies

### Database
- **Neon**: Serverless PostgreSQL database provider
- **Connection**: WebSocket-based connection for serverless compatibility

### Authentication
- **Firebase Google Auth**: Google OAuth 2.0 authentication via Firebase
- **Required Environment Variables**:
  - `VITE_FIREBASE_API_KEY`: Firebase project API key
  - `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
  - `VITE_FIREBASE_APP_ID`: Firebase app ID
  - Firebase automatically handles OAuth flows and token management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Query**: Server state management

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like behavior
- **Database**: Neon development database

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles to `dist/index.js`
- **Static Files**: Express serves built frontend files
- **Database**: Production Neon database with migrations

### Build Commands
- `npm run dev`: Start development servers
- `npm run build`: Build both frontend and backend
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

### Environment Setup
- Database auto-provisioned via Replit
- Environment variables managed through Replit secrets
- HTTPS required for OIDC authentication in production

## Recent Changes (July 15, 2025)

### Comprehensive Bug Sweep and Logic Fixes (Latest Update)
- **CRITICAL FIX**: XP leakage where duel tasks incorrectly awarded +20 XP to users
- **FIXED**: isDuelTask flag properly set during duel task creation for accurate XP tracking
- **FIXED**: False error messages on successful duel acceptance by filtering out success notifications
- **ENHANCED**: Duel task completion notifications now show appropriate "Duel Task Completed! ⚔️" message
- **IMPROVED**: XP calculation logic to properly exclude duel tasks from regular XP rewards
- **UPDATED**: Task creation, FirebaseFriendsManager, and completion logic for consistent duel task handling
- **FIXED**: getXPForCompletion function to check both isDuelTask flag and duelId for comprehensive duel task detection
- **ENHANCED**: UpdateTaskData and CreateTaskData interfaces to include isDuelTask field
- **IMPROVED**: TaskCard component to properly identify duel tasks using isDuelTask field

### Professional UI Polish and Bug Fixes
- **FIXED**: Missing Target icon import in FriendsTab component causing duel challenge crashes
- **ENHANCED**: Friends tab with gradient headers, modern card designs, and improved spacing
- **ENHANCED**: Tab navigation with rounded designs and better visual hierarchy
- **ENHANCED**: Task tab with gradient headers and consistent design language
- **ENHANCED**: Card designs with gradient backgrounds, shadows, and hover effects
- **FIXED**: Dialog accessibility warnings by adding proper DialogDescription components
- **IMPROVED**: Overall responsive design with centered layouts and professional spacing

### Automatic Challenge Cleanup System Implementation (Latest Update)
- **NEW**: Automatic deletion of completed duels 5 seconds after completion for clean data management
- **NEW**: Automatic deletion of forfeited duels 5 seconds after forfeit action
- **NEW**: Immediate deletion of declined/rejected duel challenges (no storage of rejected duels)
- **NEW**: Comprehensive duel history preservation for both winners and losers with XP tracking
- **ENHANCED**: Winner determination with proper XP distribution and history logging
- **ENHANCED**: Forfeit system with dual history entries (forfeit record + winner record)
- **ENHANCED**: Task completion detection for automatic duel resolution and cleanup

### Multiple Active Duels System Implementation 
- **NEW**: Comprehensive multiple active duels system allowing simultaneous participation
- **NEW**: Forfeit functionality with winner-takes-all XP mechanics (double XP to opponent)
- **NEW**: Enhanced hover interactions for duel cards with contextual action buttons
- **NEW**: XP stake validation before creating duels (prevents insufficient XP challenges)
- **NEW**: Automatic XP deduction system - challenger stakes XP on creation, challenged stakes on acceptance
- **NEW**: Winner determination logic with tie handling and stake return mechanics
- **NEW**: Comprehensive duel history tracking with result/method/XP change logging
- **NEW**: Enhanced toast notifications with descriptive feedback and emojis
- **NEW**: Real-time duel task creation in main task list with "Duel with [Friend]:" prefix
- **NEW**: Proof submission system integrated with Firebase for duel task verification
- **ENHANCED**: FirebaseFriendsManager with forfeit, XP validation, and winner determination
- **ENHANCED**: FriendsTab with hover actions (Accept, Decline, Forfeit, View Tasks)
- **ENHANCED**: Duel progress tracking with visual progress bars and countdown timers

### Friend System and Dueling Implementation
- **NEW**: Comprehensive friend system with search, requests, and management
- **NEW**: Friend search by email functionality with user validation
- **NEW**: Friend request system with accept/reject functionality
- **NEW**: Asynchronous dueling system with task-based competition
- **NEW**: Duel creation with customizable task count, XP stakes, and deadlines
- **NEW**: Real-time duel progress tracking and winner determination
- **NEW**: Dedicated friends tab with tabbed interface (Friends, Requests, Duels)
- **NEW**: DuelTasksTab for managing active duel tasks
- **ENHANCED**: Firebase database structure for social features
- **ENHANCED**: User profile system to support friend relationships
- **ENHANCED**: Navigation system with 3-tab layout (Dashboard, Tasks, Friends)

### Bug Fixes and Notification System Improvements
- **FIXED**: Toast notification system with improved timing (5 seconds auto-dismiss vs previous 1000 seconds)
- **FIXED**: Toast display limit increased from 1 to 3 for better user feedback
- **ENHANCED**: Notification messages with emojis and more descriptive text
- **ADDED**: Level-up notifications with celebration messages
- **ADDED**: Step completion notifications for bonus XP guidance
- **IMPROVED**: Error handling with specific user-friendly messages
- **ENHANCED**: Toast styling with modern design, rounded corners, and backdrop blur
- **FIXED**: Input validation for task creation and updates
- **IMPROVED**: Task completion logic with proper uncomplete functionality
- **ENHANCED**: Firebase error handling with better user feedback

### Daily Streak System Implementation
- **NEW**: Implemented comprehensive daily streak tracking system
- **Firebase Integration**: Tracks `lastCompletedDate` and `streak` count in user profile
- **Smart Logic**: Increments streak for consecutive days, maintains for same-day completions, resets when missing days
- **Visual Display**: Dedicated streak bar under XP progress with fire emoji 🔥 and encouraging message
- **Real-time Updates**: Automatic streak calculation and Firebase synchronization on task completion

### Tabbed Navigation System Implementation
- **NEW**: Implemented tabbed navigation with separate "Dashboard" and "Tasks" sections
- **Dashboard Tab**: Features XP progress bar, task overview statistics, and welcome message
- **Tasks Tab**: Contains task management interface with filtering, creation, editing, and deletion
- **Responsive Design**: Optimized for both PC and mobile with consistent spacing and touch targets
- **Cross-Platform Compatibility**: Enhanced responsive behavior for desktop and mobile devices

### Professional Spacing and Layout Improvements
- **ENHANCED**: Header spacing with more compact and professional layout
- **IMPROVED**: Tab navigation proportions and visual hierarchy
- **REFINED**: Dashboard layout with consistent 6-unit spacing system
- **OPTIMIZED**: Task list spacing for better mobile experience
- **ADJUSTED**: Floating action button to appropriate size (16x16 vs previous 20x20)
- **POLISHED**: XP progress bar and task card styling
- **ENHANCED**: Overall visual hierarchy with improved padding and margins

### Complete UI Overhaul
- Implemented comprehensive modern design system with CSS variables for theme support
- Added Google Fonts integration (Poppins + Inter) for improved typography
- Created modular component architecture with ThemeContext, XPProgressBar, TaskCard, and ThemeToggle
- Enhanced all components with dark mode support and smooth animations
- Redesigned task cards with priority badges, completion states, and interactive hover effects
- Added animated XP progress bar with shimmer effects and level progression tracking
- Updated all modals (task creation/editing, deletion) with consistent modern styling
- Implemented mobile-first responsive design with improved spacing and visual hierarchy

### Enhanced Mobile App Polish
- Increased spacing throughout interface (professional mobile feel)
- Enhanced touch targets with appropriately sized buttons
- Improved typography with better font weights and larger headings
- Added professional shadow system with enhanced depth and hover effects
- Implemented scale animations and smooth transitions for interactive elements

### Technical Improvements
- CSS variables system for seamless light/dark mode switching
- LocalStorage persistence for theme preferences
- Animation system with CSS keyframes for smooth interactions
- Enhanced accessibility with proper color contrast in both themes
- Improved component modularity and maintainability
- Responsive grid layouts and flexible component architecture
- Enhanced error handling and validation throughout the application

The application now features a professional tabbed interface with comprehensive cross-platform support, modern design patterns, enhanced user experience, and robust notification system for both desktop and mobile users.