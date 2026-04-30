# 🛠️ FabStock - Inventory Management System

FabStock is a specialized inventory management system designed for University FabLabs, featuring real-time stock tracking, project component management, and automated barcode generation.

## 🚀 Quick Start (Docker)

The easiest way to get the project running is using Docker.

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd gestion-inventaire-fablab
   ```

2. **Launch with Docker Compose:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)

**Note:** On the first run, Docker will automatically:
- Install PHP dependencies (Composer).
- Generate the Laravel application key.
- Create the SQLite database (`backend/database/database.sqlite`).
- Run database migrations.

---

## 🛠️ Manual Setup (Without Docker)

If you prefer to run the services locally on your machine.

### Prerequisites
- **Backend:** PHP 8.4+, Composer, SQLite3.
- **Frontend:** Node.js 20+ (LTS recommended), npm or yarn.

### 1. Backend Setup (Laravel)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Initialize database:**
   ```bash
   # Create empty sqlite file
   touch database/database.sqlite
   
   # Run migrations
   php artisan migrate
   ```

5. **Start the server:**
   ```bash
   php artisan serve --port=8000
   ```

### 2. Frontend Setup (Next.js)

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend  # or next-shadcn-admin-dashboard depending on folder name
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
   Ensure `NEXT_PUBLIC_BACKEND_API_URL` points to `http://localhost:8000/api`.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 📄 Documentation & Credits

- Built with **Next.js 16**, **Tailwind CSS 4**, and **Laravel 11/12**.
- Uses **SQLite** for lightweight, zero-config data storage.
- Designed specifically for **ESSA Tlemcen FabLab**.
