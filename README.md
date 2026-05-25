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
   - `PYTHON_PATH`: `python3` (DO NOT use Windows paths like .venv/Scripts/python.exe)
   - `PYTHON_SCRIPT_PATH`: `../predict.py`
   - `SMTP_USER` / `SMTP_PASS`: For email notifications

### Frontend Deployment
1. **Root Directory**: `frontend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: (Static site or `serve -s dist`)
4. **Environment Variables**:
   - `VITE_API_URL`: `https://nutriguard-z5yq.onrender.com` (use `http://localhost:5173` for local development)

## Troubleshooting "Failed to start ML process"
If you see an error about `ENOENT` or a path containing `.venv/Scripts/python.exe` on Render:
1. Go to your Render Dashboard -> Backend Service -> Settings -> Environment Variables.
2. Ensure `PYTHON_PATH` is set to `python3` (or delete it to use the system default).
3. Ensure `PYTHON_SCRIPT_PATH` is set to `../predict.py`.
4. Make sure your Build Command installs the Python requirements as shown above.
