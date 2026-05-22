# NutriGuard - Stunting Prevention Platform

NutriGuard is an ML-powered platform designed to help healthcare workers in Rwanda identify and prevent childhood stunting through data-driven assessments.

## Project Structure

- `/frontend`: React + Vite application (deployed to Render)
- `/backend`: NestJS API application (deployed to Render)
- `predict.py`: Python script for ML predictions
- `nutriguard_model.pkl`: Trained Random Forest model
- `requirements.txt`: Python dependencies for the prediction system

## Deployment Instructions (Render)

### Backend Deployment
1. **Root Directory**: `backend` (or root, but instructions below assume root)
2. **Build Command**: 
   `npm install --prefix backend && node backend/node_modules/prisma/build/index.js generate --schema=backend/prisma/schema.prisma && pip install -r requirements.txt && npm run build --prefix backend`
3. **Start Command**: `npm run start:prod --prefix backend`
4. **Environment Variables**:
   - `DATABASE_URL`: Your MySQL connection string
   - `JWT_SECRET`: A secure random string
   - `PYTHON_PATH`: `python3`
   - `PYTHON_SCRIPT_PATH`: `../predict.py`
   - `SMTP_USER` / `SMTP_PASS`: For email notifications

### Frontend Deployment
1. **Root Directory**: `frontend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: (Static site or `serve -s dist`)
4. **Environment Variables**:
   - `VITE_API_URL`: `https://nutriguard-z5yq.onrender.com`

## Troubleshooting Prisma P1012 Error
If you see an error about `url` not being supported in schema files, it means Render is using Prisma 7. I have pinned the project to **Prisma 6.4.1** in `backend/package.json` to prevent this. Ensure your build command uses the local prisma binary as shown above:
`node backend/node_modules/prisma/build/index.js generate --schema=backend/prisma/schema.prisma`
