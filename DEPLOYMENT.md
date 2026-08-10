# Karviyam Production Deployment & Docker Guide

This guide describes how to deploy the Karviyam Full Stack E-Commerce Platform to staging or production environments using Docker Compose.

## Container Architecture
- `mysql-db`: MySQL 8.0 Database container.
- `karviyam-backend`: Java 21 Spring Boot 3.x REST API service.
- `karviyam-frontend`: Nginx web server hosting built React SPA.

---

## One-Command Deployment

Run Docker Compose from project root:
```bash
docker-compose up --build -d
```

The system will start:
- Frontend Web UI: `http://localhost` (Port 80)
- Backend REST API: `http://localhost:8080`
- MySQL Database: `localhost:3306`
