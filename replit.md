# My College Finance - Savings Goal Calculator

## Overview
My College Finance is a full-stack web application designed to empower college students and young adults in managing their savings goals. It offers an intuitive platform for goal calculation, progress visualization, and financial guidance. The application aims to foster healthy financial habits through interactive goal setting and tracking, providing a responsive design with both light and dark themes. The app provides direct access to all features without requiring authentication - users can create, track, and export savings goals immediately.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Responsive design (mobile-first), light/dark mode, ARIA-compliant components, custom owl logo with college finance branding, interactive elements (sliders, progress bars, animations).

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database (serverless)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with structured error handling
- **Storage**: DatabaseStorage class for persistent data.

### Technical Implementations & Feature Specifications
- **Authentication-Free Access**: ✅ **COMPLETE** - All authentication features have been removed. Users can access the calculator directly without login, guest mode, or any authentication barriers. The app uses in-memory storage with a default user context for all operations.
- **Savings Goal Management**: Users can create, edit, and delete savings goals with persistent storage. Goals include type, target amount, current savings, target date, monthly capacity, and status.
- **Progress Visualization**: Circular progress indicators and milestone tracking for savings goals.
- **Reporting**: ✅ **UPDATED** - PDF export for savings plan reports (always uses light theme colors regardless of user's current theme) and CSV data export for compatibility with tools like Excel.
- **Settings Menu**: ✅ **COMPLETE** - Redesigned as a slide-in sidebar panel (using Sheet component) that appears from the right side of the screen. Features sidebar navigation with Appearance, Data, and Help tabs. Includes all previous menu items and modals (Tutorial, FAQ, Release Notes, Contact Support) with authentication-related items removed. Panel width optimized at 540px for desktop with responsive mobile support.
- **UI Improvements & Reality Check Enhancement**: ✅ **COMPLETE (6-Step Enhancement Plan)** - Enhanced "Savings Tracker Dashboard" with individual goal management, prominent "Create New Savings Goal" button, redesigned footer with My College Finance logo, updated header, auto-populating goal names based on category selection, improved input validation with user feedback, fixed Ctrl+A behavior for input fields, enhanced monthly capacity slider with precise amount controls, improved "Save as Goal" button with visual state indicators, enhanced date picker accessibility, better toast notifications, consistent color schemes for light/dark modes, always-visible Reality Check summary cards that update in real-time, behavioral psychology features with 21-day habit formation plans, dynamic expense categories based on lifestyle patterns, positive reframing options, personalized habit tracking with "Day 1 of 21" progress indicators, and dynamic success rate analytics for different spending categories.
- **Mobile Optimization**: Comprehensive mobile-first responsive design with optimized touch targets, stacked layouts, full-width buttons, improved spacing and padding, enhanced authentication modal with larger input fields (h-12), better visual hierarchy, security indicators, and improved feature badge layouts that stack vertically on mobile.

### System Design Choices
- **Data Models**: Savings Goals stored with a default user context.
- **Database Schema**: PostgreSQL with Drizzle ORM for data persistence.
- **Data Flow**: Client-side (user interaction, real-time calculations, TanStack Query for API calls), Server-side (Express routes for CRUD, Zod validation, Drizzle ORM for database).
- **Configuration Management**: Environment variables for database URLs, theme persistence in localStorage, responsive design breakpoints.
- **PDF Generation**: Consistent light theme colors for all PDF exports regardless of user's current light/dark mode setting.

## External Dependencies

### Data & Services
- **Neon Database**: Serverless PostgreSQL database provider for goal storage.

### Core Libraries
- **React**: Frontend UI library.
- **Radix UI**: Frontend component primitives for accessible design.
- **Tailwind CSS**: For styling and theming.
- **TanStack React Query**: For server state management in the frontend.
- **React Hook Form**: For form handling.
- **Zod**: For schema validation (shared between frontend and backend).
- **Express.js**: Backend web framework.
- **Drizzle ORM**: For database interactions with PostgreSQL.
- **connect-pg-simple**: For PostgreSQL-backed session management.
- **jsPDF**: For generating PDF reports.

### Utilities & Development Tools
- **date-fns**: For date manipulation.
- **clsx**: For conditionally joining CSS class names.
- **lucide-react**: For icons.
- **Vite**: Frontend build tool.
- **esbuild**: Backend bundling.
- **TypeScript**: For type safety across the stack.
- **Drizzle Kit**: For database schema migrations.