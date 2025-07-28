🧭 Budgetizer App Overview
Budgetizer is a personal budgeting web app built with React, Zustand, Chakra UI, and Recharts, designed to help users (like my son!) plan and track their monthly finances in a clear, interactive, and customizable way.

🧱 Core Features

1. Budget Planner
   Plan your monthly finances:

Add one or more income sources (hourly or salary-based)

Calculate estimated taxes (federal, state, Social Security, Medicare)

Enter and manage monthly expenses (rent, bills, savings, etc.)

Visual breakdown via pie charts

Supports multiple "scenarios" (e.g. Main, College, Summer Job) for quick switching

2. Budget Tracker (In Development)
   Track actual income and spending:

Input actual amounts spent for each category

Compare planned vs. actual budget

Visual dashboard with summary stats and monthly view

Persistent monthly data for historical review

3. Accounts Integration (Planned via Plaid API)
   Link real-world bank accounts (e.g. UW Credit Union):

Sync balance and transactions

View categorized spending by date or vendor

Match real spending with budget tracker data

Secure and user-controlled authentication

🔄 Data Persistence
Uses Zustand + localStorage for fast and persistent client-side data

Will support future cloud syncing (AWS or Firebase planned)

📅 Planned Feature Roadmap
Multiple income sources with auto tax estimation

Scenario support for different financial situations

Persistent storage using Zustand middleware

Expense pie chart breakdown

Basic savings toggle with auto-calculation

Budget Tracker dashboard (plan vs. actual)

Add/Edit/Delete tracked months

Account syncing via Plaid (secure API-based flow)

Settings menu for "Reset All Data"

Mobile-first optimization

🚀 Tech Stack
Tech Purpose
React UI library
Vite Dev/build tool
Zustand Global state management
Chakra UI Component styling & layout
Recharts Data visualization (e.g. pie chart)
Plaid API (Planned) Bank account sync

🧠 Future Goals
Add AI-based spending advice using OpenAI API

Gamify savings (progress bar + rewards)

Build native PWA or mobile app version

Attributions:
Wallet icon: Arkinasi @ Flaticon - <a href="https://www.flaticon.com/free-icons/business-and-finance" title="business and finance icons">Business and finance icons created by Arkinasi - Flaticon</a>

Auth system enhancments:
Feature Priority Notes
🔁 Refresh Tokens Low–Med Not needed unless sessions must last > 1hr+
🧪 Password reset flow Med Add “forgot password” with OTP/email later
📬 Email verification Low Useful for future SaaS-like functionality
🔒 Role-based route guards Med If you want /admin pages
🗂️ AuthContext alternative Low Zustand already handles this nicely
🚫 Global 401 handler Med Auto-logout if /me fails on protected fetch
🔄 Sync login between tabs Low Broadcast logout across open windows
