# My College Finance - Savings Goal Calculator

## Overview
My College Finance is a full-stack web application designed to empower college students and young adults in managing their savings goals. It offers an intuitive platform for goal calculation, progress visualization, and financial guidance. The application aims to foster healthy financial habits through interactive goal setting and tracking, providing a responsive design with both light and dark themes. Key capabilities include comprehensive goal tracking, multi-method authentication, and seamless integration with external platforms for enhanced user experience and data management.

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
- **Multi-Method Authentication**: Supports email, phone, and username login, password recovery with 6-digit verification codes, username recovery, real-time availability checking, password strength validation, account lockout protection, and rate limiting.
- **Security Management**: Comprehensive four-way security updates (password, username, phone, email), token-based verification, and secure password hashing with bcrypt.
- **User Authentication & Data Isolation**: Comprehensive login/register functionality, session management with PostgreSQL storage, authenticated API routes enforcing data ownership, guest mode with temporary, isolated sessions.
- **Savings Goal Management**: Users can create, edit, and delete savings goals with persistent storage. Goals include type, target amount, current savings, target date, monthly capacity, and status.
- **Progress Visualization**: Circular progress indicators and milestone tracking for savings goals.
- **Reporting**: PDF export for savings plan reports and CSV data export for compatibility with tools like Excel.
- **UI Improvements**: Enhanced "Savings Tracker Dashboard" with individual goal management, prominent "Create New Savings Goal" button, redesigned footer with My College Finance logo, updated header, auto-populating goal names based on category selection, improved input validation with user feedback, fixed Ctrl+A behavior for input fields, enhanced monthly capacity slider with precise amount controls, improved "Save as Goal" button with visual state indicators, enhanced date picker accessibility, better toast notifications, and consistent color schemes for light/dark modes.

### System Design Choices
- **Data Models**: Users (with Wix ID for integration), Savings Goals, and Verification Codes.
- **Database Schema**: PostgreSQL with foreign key constraints ensuring data integrity and user isolation; includes `wixUserId` for Wix integration.
- **Data Flow**: Client-side (user interaction, real-time calculations, TanStack Query for API calls), Server-side (Express routes for CRUD, Zod validation, Drizzle ORM for database).
- **Configuration Management**: Environment variables for database URLs, theme persistence in localStorage, responsive design breakpoints.

## External Dependencies

### Data & Services
- **Wix Data API**: ✅ Successfully integrated - automated user account synchronization between Wix website and application using external database adaptor with payload-based authentication.
- **Google Sheets**: Real-time database synchronization for user data and savings goals, enabling live progress tracking and analytics.
- **SendGrid Email**: For automated email notifications, including signup alerts and scheduled monthly reports.
- **Neon Database**: Serverless PostgreSQL database provider.

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