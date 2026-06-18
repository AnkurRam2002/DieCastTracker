# The Collector's Registry

This is my personal passion project—a modern, full-stack web application I built to solve a problem I face every day: keeping track of my ever-growing collection of Hot Wheels, action figures, and collectible toys. Before this, I constantly lost track of what I already owned, what I had on pre-order, and how much I was spending. I built The Collector's Registry for my own daily use to seamlessly organize my inventory, manage categories, track my pre-orders, and visualize my collection's statistics all in one beautiful place.

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

## ✨ Detailed Features

### 📊 Interactive Dashboard & Analytics
- **Visual Insights**: Dynamic charts displaying collection distributions by Brand, Series, and overall items.
- **Progress Tracking**: Real-time progress bars for financial commitments like Pre-order payments.
- **Quick Statistics**: High-level overview cards summarizing Total Items, Missing Numbers, and Total Pre-orders.

### 📦 Comprehensive Item Management
- **Detailed Tracking**: Add items with deep metadata, including Brand, Series, Sub-series, Item Numbers, and Custom Notes.
- **Dynamic Registry Tabs**: User-customizable tabbed navigation based on preferred brands (e.g., Hot Wheels, Matchbox, Lego).
- **Advanced Filtering & Sorting**: Quickly search and filter your inventory by various fields and relational categories.

### 🏢 Relational Categorization Engine
- **Brands, Series & Subseries**: A robust hierarchical system mapping items directly to specific Series and Brands.
- **Validation Constraints**: Built-in backend and frontend validation prevents duplicate categories within user-scoped boundaries.
- **Tab Preferences**: Users can toggle which Brands appear on their main navigation bar dynamically.

### 🛒 Pre-order & Financial Tracking
- **Order Lifecycle**: Track pending pre-orders, estimated arrival times (ETA), and payment statuses.
- **Cost Management**: Record full prices versus deposits paid to calculate remaining balances automatically.
- **Inventory Integration**: Pre-orders transition seamlessly into your main collection upon arrival.

### 🔒 Secure User Authentication
- **Multi-Tenant Architecture**: Each user's collection, brands, and settings are fully sandboxed.
- **Robust Security**: JWT-based authentication and robust password hashing (bcryptjs) keep collections private.

### 🎨 Premium Modern UI/UX
- **Sleek Aesthetic**: Built with Tailwind CSS v4, featuring a responsive, modern interface.
- **Micro-Animations**: Framer Motion powers smooth page transitions, hover effects, and dynamic list renderings.

## 📁 Project Structure

```
collectors-registry/
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

This project is created for collectors worldwide.
