# Karviyam Installation & Local Development Guide

Follow these steps to run the Node.js Express + React + MySQL application locally.

## Prerequisites
- **Node.js 18+** & **npm**
- **MySQL 8.0+** (via XAMPP or Standalone MySQL Server)

---

## 1. Database Setup
1. Start MySQL via XAMPP Control Panel or MySQL service.
2. Open phpMyAdmin or MySQL Workbench and run:
   ```sql
   CREATE DATABASE IF NOT EXISTS karviyam_db;
   ```

---

## 2. Backend Setup (Node.js + Express.js)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start Node.js Express server:
   ```bash
   npm start
   ```
   The backend REST API will start on `http://localhost:8080`.

---

## 3. Frontend Setup (React.js + Tailwind CSS)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
   The React application will be live at `http://localhost:5173`.

---

## Default Credentials
- **Admin Control Panel**: `http://localhost:5173/login`
  - **Email**: `admin@karviyam.com`
  - **Password**: `Karviyam#2026!`
- **Customer Registration**: Register any new account on `/register` or login.
