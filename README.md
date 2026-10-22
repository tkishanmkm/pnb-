# PNB eBank Prototype

This is a high-fidelity, interactive mobile banking application prototype named "PNB eBank Prototype". The application is built using Next.js with the App Router and is designed to be fully functional, showcasing a comprehensive design system, multiple user flows, and integrated AI features.

## Core Technology Stack

- **Framework**: Next.js with App Router for modern, performant web applications.
- **Language**: TypeScript for type safety and improved developer experience.
- **UI Library**: React for building interactive user interfaces.
- **Styling**: Tailwind CSS for a utility-first CSS framework.
- **Component Library**: ShadCN UI, providing a set of reusable and accessible components.
- **Icons**: `lucide-react` for a consistent and clean icon set.
- **AI Integration**: Google's Genkit for generative AI functionality, powering features like the AI Chat Agent and PDF transaction extraction.
- **State Management**: A global state solution using React Context and the `useReducer` hook, with state persisted to `localStorage`. The core logic resides in `src/hooks/use-app-store.tsx`.
- **PDF Generation**: `jspdf` and `jspdf-autotable` are used for generating downloadable PDF account statements.

## Application Architecture & Routing

The application follows a simple and stable routing structure, optimized for a mobile banking experience.

- **Login as Root**: The application's root (`/`) serves as the Login Page.
- **Unified Layout**: A single root layout at `src/app/layout.tsx` conditionally renders the main `AppHeader` and `BottomNav` components based on authentication status and the current route. These UI elements are hidden on the public-facing login page.
- **Authenticated Routes**: All pages requiring user authentication have clear, top-level routes:
  - `/dashboard`: The main landing page after login.
  - `/all-accounts`: A view of all user accounts.
  - `/account-statement`: Form to select a date range for viewing transactions.
  - `/statement`: Displays the filtered transaction list.
  - `/fund-transfer/*`: A multi-step flow for transferring funds.
  - `/agent-live-chat`: An AI-powered chat agent for customer support.
  - `/settings`: An admin control panel for managing mock application data.

## Design System & UI/UX

- **Color Palette**:
  - **Primary (Vibrant Red)**: `hsl(3.1 79.3% 53.3%)` - A modern, energetic red for key interactive elements.
  - **Background (Off-White)**: `hsl(240 10% 98%)` - A clean, light background for the main app container.
  - **Card/Accent (White)**: `hsl(0 0% 100%)` - Pure white for cards and content areas to ensure clarity and contrast.
- **Typography**:
  - **Headlines/Titles**: **Poppins** (Google Font) - A modern, geometric sans-serif for a clean and professional look.
  - **Body/Descriptions**: **PT Sans** (Google Font) - A highly readable sans-serif that complements Poppins.
- **Layout**:
  - The main application is centered with a `max-w-md` constraint to simulate a mobile-first experience on all screen sizes.
  - `Card` components from ShadCN UI are used extensively to structure content and create a visually organized hierarchy.
- **Splash Screen**: A splash screen is displayed for 2 seconds on initial load, showing the PNB logo and a loading indicator while the application state is initialized from `localStorage`.

## Key Features

### 1. Login & Authentication
- Time-based greeting (e.g., "Good Morning").
- Secure 4-digit MPIN input for authentication.
- "Trouble Signing In?" feature that reveals the correct PIN for demonstration purposes.
- An auto-playing carousel of promotional banners.

### 2. Dashboard
- Displays the user's primary savings account balance with a visibility toggle.
- "Quick Actions" grid for easy access to core features like sending money, viewing statements, and more.
- An "Our Services" section for secondary features.

### 3. Fund Transfer
- A multi-step flow guides the user through transferring funds:
  1.  **Beneficiary Selection**: Choose a recipient from a saved list.
  2.  **Amount & Remarks**: Specify the transfer amount and a note.
  3.  **Confirmation**: A multi-step confirmation process involving a summary, TPIN, and a simulated OTP.
  4.  **Success**: A final confirmation screen with a downloadable transaction receipt.

### 4. Account Statements
- Select a custom date range to view transaction history.
- View a detailed list of transactions for the selected period.
- Download a multi-page PDF of the statement, complete with a professional header, using `jspdf`.

### 5. AI Chat Agent
- A full-featured, AI-powered chat interface for customer support.
- Utilizes Genkit flows with integrated tools to:
  - **Verify User**: Securely verify the user's identity using their MPIN before discussing sensitive information.
  - **Get Transaction Details**: Look up specific transactions from the application's state.
  - **Delete Chat History**: Clear the conversation history upon user request.

### 6. Admin Control Panel
- A comprehensive, tabbed interface for managing all mock data within the application.
- **CRUD Operations**: Full control over account details, transactions, and payees.
- **Asset Management**: Upload and manage images for logos, banners, and avatars (stored in-app as Base64).
- **Data Management**:
  - Import and export the entire application state as a JSON file.
  - Reset the application state to its default mock data.
- **AI-Powered PDF Extraction**: Upload a PDF bank statement, and a Genkit flow automatically extracts and integrates the transactions into the application's state.
