# Gestion Inventaire Fablab

This is a modern, comprehensive inventory management platform designed specifically for Fablabs. It consists of a **Next.js** dashboard (frontend) and a **Laravel** API (backend), using SQLite for an easy-to-use, embedded database solution.

## 🚀 Project Structure

- `next-shadcn-admin-dashboard/`: The frontend, built with Next.js, Shadcn UI, and Tailwind CSS.
- `backend/`: The backend API, built with Laravel 11.
- `DOCKER_SETUP.md`: Detailed instructions for running the project using Docker.
- `TEST_CREDENTIALS.md`: Contains test credentials for logging into the dashboard.

## 📦 How to Start the Project

The easiest way to run the full stack (Frontend + Backend) is by using Docker.

### Method 1: Using Docker (Recommended)

**Prerequisites:**
- Docker Engine
- Docker Compose

**Start the Application:**
1. Open a terminal in the root directory.
2. Run the following command:
   ```bash
   docker compose up --build
   ```
3. The platform will be available at:
   - **Frontend (Dashboard):** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000/api](http://localhost:8000/api)

*(For detailed local network access and docker commands, check [DOCKER_SETUP.md](./DOCKER_SETUP.md))*

### Method 2: Running Manually (Local Development)

If you prefer to run the components independently without Docker, follow these steps:

#### 1. Start the Backend (Laravel)

**Prerequisites:** PHP 8.2+, Composer

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
composer install

# 3. Set up your environment file
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Create database and run migrations & seeders
touch database/database.sqlite
php artisan migrate:fresh --seed

# 6. Start the Laravel development server
php artisan serve
```
*The backend API will be running at [http://localhost:8000](http://localhost:8000).*

#### 2. Start the Frontend (Next.js)

**Prerequisites:** Node.js (v18+), npm/pnpm/yarn

```bash
# 1. Navigate to the frontend directory (open a new terminal tab/window)
cd next-shadcn-admin-dashboard

# 2. Install dependencies
npm install

# 3. Create or check environment variables (if required, point API to http://localhost:8000/api)
# cp .env.example .env.local

# 4. Start the Next.js development server
npm run dev
```
*The frontend will be running at [http://localhost:3000](http://localhost:3000).*

## 🔐 Logging In

After starting the project, the Next.js frontend might require you to log in to access the dashboard.
Please refer to the `TEST_CREDENTIALS.md` file for test accounts to sign in as admin or general user.
