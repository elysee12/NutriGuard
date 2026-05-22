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
1. **Root Directory**: `backend`
2. **Build Command**: `npm install && npx prisma generate && npm run build`
3. **Start Command**: `npm run start:prod`
4. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
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

## Prediction System Setup
The backend calls `predict.py` using a Python process. Render's standard environment includes Python 3. To ensure the model works:
1. The backend environment must have `pandas` and `scikit-learn` installed.
2. On Render, you can use a **Render Blueprint** or a **Docker** setup if you need complex dependencies, but for this setup, the `PredictionService` is configured to look for Python in the environment.
3. Ensure `requirements.txt` in the root is used to install Python dependencies if your environment supports it, or install them via the build command:
   `pip install -r ../requirements.txt && npm install && npx prisma generate && npm run build`
