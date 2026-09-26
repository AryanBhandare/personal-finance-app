# Personal Finance App

## Overview

The **Personal Finance App** is a full-featured solution for managing personal finances, designed to offer the core functionalities of a traditional banking app. Users can track expenses, manage budgets, monitor savings goals, and generate financial reports—all within a sleek, intuitive interface.

## Features

- **Transaction Management**: Easily add, edit, and categorize transactions.
- **Budgeting**: Set up and manage budgets by category to control spending.
- **Expense Tracking**: Monitor expenses and get insights into spending habits.
- **Savings Goals**: Define and track your savings goals.
- **Authentication**: Secure login and user management with Supabase.
- **Financial Reports**: View detailed reports to analyze income and spending trends.

## Built With

- **Frontend**:
  - **Next.js**: React framework for server-side rendering and static site generation.
  - **TypeScript**: Strict typing for robust and maintainable code.
  - **Tailwind CSS**: Utility-first CSS framework for styling.
- **Backend**:
  - **Supabase**: Provides authentication, database management, and API for handling user data, transactions, and budgets.
- **Database**: PostgreSQL (via Supabase)

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm or Yarn
- Supabase Account

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/theMystic1/personal-finance-app.git
cd personal-finance-app
```

2. **Install dependencies**

```bash
npm install
# or if you use yarn
yarn install
```

3. **Configure Supabase**  
   Create a project on Supabase and get your API keys. Add them to an `.env.local` file in your project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

4. **Run the development server**

```bash
npm run dev
```

5. **Build for production**

```bash
npm run build
```

6. **Run the production build**

```bash
npm start
```

## How to Use

1. **Register/Login**: Create an account using Supabase's authentication or log in with existing credentials.
2. **Manage Budgets**: Create budgets by category, such as "Rent," "Groceries," and "Entertainment."
3. **Track Expenses**: Add transactions manually or import them to monitor spending across categories.
4. **Monitor Savings**: Set up savings goals and track progress toward financial milestones.
5. **Generate Reports**: View detailed reports and graphs that give insight into income and expenditure patterns.

## Deployment

This app can be deployed to platforms like **Vercel** or **Netlify**.

1. **Deploy to Vercel**
   - Connect the repository to Vercel.
   - Add your environment variables (Supabase keys) in the Vercel dashboard.
   - Deploy your app.

## Contributing

Feel free to contribute by forking the repository, working on features or bug fixes, and submitting a pull request. Make sure to follow the guidelines.

## License

This project is open-source and available under the [MIT License](LICENSE).
