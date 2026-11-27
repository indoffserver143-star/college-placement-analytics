# Interactive College Placement & Skills Analytics Dashboard

A full-stack, ML-powered placement intelligence platform built with **FastAPI**, **Scikit-Learn**, **SQLAlchemy (SQLite)**, **React (Vite)**, **Tailwind CSS**, and **Recharts**.

## Run with 1 Single Command

From the project root (`Source/`), run any of:

```bash
python run.py
```
or
```bash
npm start
```

This automatically verifies dependencies, seeds 500 synthetic student placement records (2022–2026), trains the Random Forest ML models (`placement_classifier.joblib` & `ctc_regressor.joblib`), and starts both:
- **Frontend Dashboard:** http://localhost:5173
- **Backend API & Swagger Docs:** http://127.0.0.1:8000/docs

## Demo Login Credentials
- **Placement Officer (Admin):** `admin` / `admin123` (or click the one-click button)
- **Final-Year Student:** `student` / `student123` (or click the one-click button)

