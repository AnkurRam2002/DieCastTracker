# DieCastTracker

A modern, full-stack web application designed for Hot Wheels and die-cast car collectors. DieCastTracker helps you organize your collection, track pre-orders, manage categories, and visualize your collection statistics with ease.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 / Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, clsx, tailwind-merge
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Chart.js / react-chartjs-2
- **Routing**: React Router v7

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Logging**: Morgan

## ✨ Features

- **Relational Categorization**: Organize your collection by Brands, Series, and Subseries using structured relational models.
- **Detailed Model Tracking**: Keep track of model metadata, numbers, and custom details.
- **Pre-order Management**: Track pending orders, payment statuses, and estimated times of arrival.
- **Analytics Dashboard**: Interactive charts and statistics to visualize the growth and distribution of your collection.
- **User Scoping**: Multi-tenant data handling with user-scoped uniqueness constraints ensuring secure, private collections.
- **Modern UI/UX**: Sleek, responsive, and animated user interface built with Tailwind and Framer Motion.

## 📁 Project Structure

```
DieCastTracker/
├── frontend/               # React Vite Frontend App
│   ├── src/                # Components, Pages, Context, etc.
│   └── package.json        # Frontend Dependencies
├── models/                 # Mongoose Database Models (Brands, Series, etc.)
├── routes/                 # Express API Routes
├── services/               # Business Logic and Database Interactions
├── middleware/             # Custom Express Middleware (Auth, Logging)
├── server.js               # Express Application Entry Point
├── package.json            # Backend Dependencies
└── .env                    # Environment Configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB instance (local or MongoDB Atlas)

### 1. Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnkurRam2002/DieCastTracker.git
   cd DieCastTracker
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the example environment file and configure it with your database and standard keys.
   ```bash
   cp .env.example .env
   ```
   *Make sure to set your MongoDB Connection URI (`MONGO_URI` or `DATABASE_URL`) and JWT secret.*

4. **Start the backend server:**
   ```bash
   # Development mode with nodemon
   npm run dev
   # OR production mode
   npm start
   ```

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to view the application.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page and submit pull requests.

## 📝 License

This project is created for die-cast collectors worldwide.
