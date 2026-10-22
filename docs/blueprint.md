# **App Name**: PNB eBank Prototype

## Core Features:

- Login Authentication: Time-based greeting and MPIN input for authentication.
- Dashboard Overview: Savings account balance display with visibility toggle and quick actions navigation.
- Fund Transfer: Multi-step fund transfer flow including beneficiary selection, amount input, and confirmation.
- Account Statement: Date range selection for transactions and multi-page PDF statement generation and download.
- AI Chat Support: AI chat agent with tools for user verification and transaction details retrieval.
- Admin Control: Admin panel for data management, including account details, transactions, and payees editing. Tool for importing and exporting app state as JSON.
- PDF Extraction: Tool for extracting and adding transactions to the application’s state using Genkit flow. Uses reasoning to decide what part of transaction history to update based on user inputs.

## Style Guidelines:

- Primary color: Vibrant red (#E53935) to reflect energy and reliability, reminiscent of financial institutions, but modernized.
- Background color: Off-white (#FCFCFC) providing a clean and spacious feel.
- Accent color: White (#FFFFFF) to provide clear contrast on elements like cards and text.
- Headlines/Titles: 'Poppins' (sans-serif) for a contemporary, precise feel. Note: currently only Google Fonts are supported.
- Body/Descriptions: 'PT Sans' (sans-serif) to balance modernity with readability. Note: currently only Google Fonts are supported.
- Lucide React icons: Use minimalist icons for a clean and consistent user interface.
- Centered layout with max-w-md class for a mobile-like experience. Use of Card components for structured content.