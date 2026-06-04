
# JNTU-GV Payments System

## Overview
This is the official payment system for JNTU-GV, handling various fee types including examination, PhD, certificates, and more.
The application consists of a React frontend and a Node.js/Express backend.

## Tech Stack
- **Frontend**: React, TanStack Query, Tailwind CSS, Zod, Axios.
- **Backend**: Node.js, Express, Sequelize (MySQL), Zod, Helmet.
- **Validation**: Zod (Shared schema logic across both stacks).

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database

### Installation

1. **Clone Repository (if not already done)**
2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

### Configuration
Create `.env` files in both `frontend` and `backend` directories.
See `.env.example` (if available) for required variables like `DB_HOST`, `DB_USER`, `DB_PASS`, `SBI_MERCHANT_ID`, etc.

### Running Development Servers

1. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on `http://localhost:5173`.

2. **Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Runs on `http://localhost:4000` (default).

## API Documentation
Detailed API documentation for payment initiation endpoints can be found in [API_DOCS.md](./API_DOCS.md).

## Project Structure
- `frontend/src/hooks`: TanStack Query hooks.
- `frontend/src/schemas`: Zod validation schemas.
- `backend/src/controllers`: Request handlers.
- `backend/src/validators`: Request validation logic.
- `backend/src/services`: Business logic and database interactions.

## Payment Flow
1. **Initiation**: User fills form -> Frontend validates with Zod -> Calls POST `/api/payment/initiate`.
2. **Bank Redirection**: Backend returns payment gateway URL + encrypted parameters. Frontend redirects user.
3. **Processing**: User completes payment on SBI portal.
4. **Callback**: SBI server calls Backend webhook (`/api/payment/callback`) to update status.
5. **Return**: User is redirected back to Frontend (`/payment/return`) to see status.

## Deployment
This project uses GitHub Actions for continuous deployment. Any code pushed to the `main` branch will automatically be deployed to the production server at `185.199.52.99`.

### GitHub Secrets Required
To enable the auto-deployment, ensure the following secret is configured in your GitHub repository settings (`Settings > Secrets and variables > Actions`):
- `SSH_PRIVATE_KEY`: The SSH private key for `root` access to the production server.

## Contact
For issues, please contact the JNTU-GV IT department.
