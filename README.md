# Daily Task Manager — Login & Registration Edition

Stack: React + Vite, Spring Boot, Spring Security, JWT, MySQL.

## Features
- Self-service registration and login
- Passwords hashed with BCrypt (never stored as plain text)
- JWT-protected task API
- Each account can only view and manage its own tasks
- Create, edit, delete, complete/reopen, filter, search tasks
- MySQL persistence

## Requirements
- Java 21+
- Maven 3.9+
- Node.js 20+
- MySQL 8+

## 1. Database
In MySQL:
```sql
CREATE DATABASE IF NOT EXISTS daily_task_manager;
```

## 2. Backend configuration
Edit `backend/src/main/resources/application.properties`.
Set `spring.datasource.username` and `spring.datasource.password` to your local MySQL credentials.
Change `app.jwt.secret` to a random secret of at least 32 characters before sharing/deploying this project.
Do not commit real passwords or JWT secrets to a public repository.

## 3. Start backend
Terminal 1:
```powershell
cd backend
mvn spring-boot:run
```
API runs at `http://localhost:8080`.

## 4. Start frontend
Terminal 2:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL, usually `http://localhost:5173`.

## API overview
- `POST /api/auth/register` — `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login` — `{ "email": "...", "password": "..." }`
- Authenticated task endpoints: `/api/tasks`

Registration is public. All task endpoints require `Authorization: Bearer <token>`.
A user's tasks are scoped to the authenticated account on the server.

## Existing database note
If you already used the previous version, Hibernate will add the user table and task owner column. Existing tasks have no owner and will not appear for newly registered accounts. Back up data first if it matters; for a classroom demo, you can clear the old test tasks after backing them up.
