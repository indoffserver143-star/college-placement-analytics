import asyncio
from datetime import datetime, timezone
import io
import json
import os
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import Base, engine, ensure_schema_columns, get_db
from models import (
    LoginRequest,
    LoginResponse,
    StudentPredictRequest,
    StudentPredictResponse,
    StudentRecord,
    StudentRecordCreate,
)
from seed_data import seed_database, ALL_SKILLS
from ml_pipeline import load_artifacts, predict_student_profile, train_models


# ==========================================
# REAL-TIME SSE BROADCASTER
# ==========================================
class EventBroadcaster:
    def __init__(self):
        self.subscribers: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self.subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self.subscribers:
            self.subscribers.remove(q)

    async def broadcast(self, event_type: str, payload: dict):
        message = json.dumps({"type": event_type, **payload})
        dead = []
        for q in self.subscribers:
            try:
                q.put_nowait(message)
            except Exception:
                dead.append(q)
        for q in dead:
            self.unsubscribe(q)


broadcaster = EventBroadcaster()


async def _notify_realtime(action: str, detail: str = ""):
    await broadcaster.broadcast(
        "data_updated",
        {
            "action": action,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


def _retrain_and_notify_sync():
    try:
        train_models()
    except Exception:
        pass


app = FastAPI(
    title="Interactive College Placement & Skills Analytics API",
    version="2.0.0",
    description="Real-time Backend REST API for Placement Analytics, ML Prediction, Student Self-Service, and Admin Data Management.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Ensure DB schema, migrations, initial 500-record seed, and trained ML models exist on startup."""
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    seed_database(500, force=False)
    load_artifacts()


@app.get("/api/events")
async def sse_events():
    """Server-Sent Events stream for real-time dashboard, admin, and student updates."""
    queue = broadcaster.subscribe()

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _serialize_record(r: StudentRecord) -> dict:
    return {
        "id": r.id,
        "student_id": r.student_id,
        "name": r.name,
        "batch_year": r.batch_year,
        "branch": r.branch,
        "class_year": r.class_year,
        "section": r.section,
        "gender": r.gender,
        "email": r.email,
        "phone": r.phone,
        "cgpa": r.cgpa,
        "tenth_percent": r.tenth_percent,
        "twelfth_percent": r.twelfth_percent,
        "active_backlogs": r.active_backlogs,
        "internships_count": r.internships_count,
        "projects_count": r.projects_count,
        "coding_score": r.coding_score,
        "skills": r.skills,
        "placement_status": bool(r.placement_status),
        "company_name": r.company_name,
        "company_tier": r.company_tier,
        "ctc_lpa": r.ctc_lpa,
        "updated_at": r.updated_at,
    }


# ==========================================
# 1. AUTHENTICATION ROUTER
# ==========================================
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

DEMO_USERS = {
    "admin": {"password": "admin123", "role": "admin", "name": "Placement Officer (Admin)"},
    "student": {"password": "student123", "role": "student", "name": "Final-Year Student"},
}


@auth_router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    username = payload.username.strip().lower()
    user = DEMO_USERS.get(username)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid demo credentials.")

    return LoginResponse(
        access_token=f"demo-token-{user['role']}",
        role=user["role"],
        name=user["name"],
        username=username,
    )


# ==========================================
# 2. ADMIN DATA MANAGEMENT ROUTER
# ==========================================
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

REQUIRED_CSV_COLUMNS = [
    "student_id", "name", "batch_year", "branch", "gender",
    "cgpa", "tenth_percent", "twelfth_percent", "active_backlogs",
    "internships_count", "projects_count", "coding_score", "skills",
    "placement_status", "company_name", "company_tier", "ctc_lpa",
]


@admin_router.get("/sample-csv")
def download_sample_csv():
    sample_df = pd.DataFrame([
        {
            "student_id": "STU2026CS9001",
            "name": "Ananya Sharma",
            "batch_year": 2026,
            "branch": "CSE",
            "class_year": "4th Year",
            "section": "A",
            "gender": "Female",
            "email": "ananya.sharma@college.edu",
            "phone": "+91 9876543210",
            "cgpa": 8.95,
            "tenth_percent": 92.4,
            "twelfth_percent": 90.0,
            "active_backlogs": 0,
            "internships_count": 2,
            "projects_count": 4,
            "coding_score": 88.5,
            "skills": "Python, React, SQL, Data Structures, AWS",
            "placement_status": True,
            "company_name": "Amazon",
            "company_tier": "Tier-1 Product",
            "ctc_lpa": 28.5,
        },
        {
            "student_id": "STU2026EC9002",
            "name": "Rohan Verma",
            "batch_year": 2026,
            "branch": "ECE",
            "class_year": "4th Year",
            "section": "B",
            "gender": "Male",
            "email": "rohan.verma@college.edu",
            "phone": "+91 9876501234",
            "cgpa": 7.45,
            "tenth_percent": 81.0,
            "twelfth_percent": 79.5,
            "active_backlogs": 0,
            "internships_count": 1,
            "projects_count": 3,
            "coding_score": 68.0,
            "skills": "C++, Python, SQL",
            "placement_status": True,
            "company_name": "Infosys",
            "company_tier": "Tier-2 Service",
            "ctc_lpa": 5.5,
        },
    ])
    stream = io.StringIO()
    sample_df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=placement_sample_template.csv"},
    )


@admin_router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}")

    df.columns = [c.strip().lower() for c in df.columns]
    missing_cols = [c for c in REQUIRED_CSV_COLUMNS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_cols)}",
        )

    df["active_backlogs"] = pd.to_numeric(df["active_backlogs"], errors="coerce").fillna(0)
    df["internships_count"] = pd.to_numeric(df["internships_count"], errors="coerce").fillna(0)
    df["projects_count"] = pd.to_numeric(df["projects_count"], errors="coerce").fillna(1)
    df["company_name"] = df["company_name"].fillna("None").astype(str)
    df["company_tier"] = df["company_tier"].fillna("None").astype(str)
    df["ctc_lpa"] = pd.to_numeric(df["ctc_lpa"], errors="coerce").fillna(0.0)
    df["skills"] = df["skills"].fillna("Python").astype(str)
    if "class_year" not in df.columns:
        df["class_year"] = "4th Year"
    else:
        df["class_year"] = df["class_year"].fillna("4th Year").astype(str)
    if "section" not in df.columns:
        df["section"] = "A"
    else:
        df["section"] = df["section"].fillna("A").astype(str)
    if "email" not in df.columns:
        df["email"] = ""
    else:
        df["email"] = df["email"].fillna("").astype(str)
    if "phone" not in df.columns:
        df["phone"] = ""
    else:
        df["phone"] = df["phone"].fillna("").astype(str)

    imported_count = 0
    rejected_rows = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            student_id = str(row["student_id"]).strip().upper()
            name = str(row["name"]).strip()
            branch = str(row["branch"]).strip().upper()
            class_year = str(row["class_year"]).strip() or "4th Year"
            section = str(row["section"]).strip().upper() or "A"
            gender = str(row["gender"]).strip()

            if not student_id or student_id == "NAN" or not name or name == "nan":
                raise ValueError("Missing student_id or name")

            batch_year = int(row["batch_year"])
            cgpa = float(row["cgpa"])
            tenth_percent = float(row["tenth_percent"])
            twelfth_percent = float(row["twelfth_percent"])
            coding_score = float(row["coding_score"])

            if not (0.0 <= cgpa <= 10.0):
                raise ValueError("CGPA must be between 0.0 and 10.0")
            if not (0.0 <= coding_score <= 100.0):
                raise ValueError("Coding score must be between 0 and 100")

            raw_status = str(row["placement_status"]).strip().lower()
            placed = raw_status in ("true", "1", "yes", "placed")

            ctc_lpa = float(row["ctc_lpa"]) if placed else 0.0
            company_name = str(row["company_name"]).strip() if placed else "None"
            company_tier = str(row["company_tier"]).strip() if placed else "None"

            existing = db.query(StudentRecord).filter(StudentRecord.student_id == student_id).first()
            if existing:
                existing.name = name
                existing.batch_year = batch_year
                existing.branch = branch
                existing.class_year = class_year
                existing.section = section
                existing.gender = gender
                existing.email = str(row["email"]).strip()
                existing.phone = str(row["phone"]).strip()
                existing.cgpa = cgpa
                existing.tenth_percent = tenth_percent
                existing.twelfth_percent = twelfth_percent
                existing.active_backlogs = int(row["active_backlogs"])
                existing.internships_count = int(row["internships_count"])
                existing.projects_count = int(row["projects_count"])
                existing.coding_score = coding_score
                existing.skills = str(row["skills"]).strip()
                existing.placement_status = placed
                existing.company_name = company_name
                existing.company_tier = company_tier
                existing.ctc_lpa = ctc_lpa
                existing.updated_at = now_iso
            else:
                db.add(
                    StudentRecord(
                        student_id=student_id,
                        name=name,
                        batch_year=batch_year,
                        branch=branch,
                        class_year=class_year,
                        section=section,
                        gender=gender,
                        email=str(row["email"]).strip(),
                        phone=str(row["phone"]).strip(),
                        cgpa=cgpa,
                        tenth_percent=tenth_percent,
                        twelfth_percent=twelfth_percent,
                        active_backlogs=int(row["active_backlogs"]),
                        internships_count=int(row["internships_count"]),
                        projects_count=int(row["projects_count"]),
                        coding_score=coding_score,
                        skills=str(row["skills"]).strip(),
                        placement_status=placed,
                        company_name=company_name,
                        company_tier=company_tier,
                        ctc_lpa=ctc_lpa,
                        updated_at=now_iso,
                    )
                )
            imported_count += 1
        except Exception as err:
            rejected_rows.append({"row": row_num, "student_id": str(row.get("student_id", "N/A")), "reason": str(err)})

    db.commit()

    retrain_metrics = train_models() if imported_count > 0 else None
    if imported_count > 0:
        await _notify_realtime("csv_upload", f"Imported {imported_count} records")

    return {
        "imported_count": imported_count,
        "rejected_count": len(rejected_rows),
        "rejected_rows": rejected_rows[:25],
        "retrain_metrics": retrain_metrics,
    }


@admin_router.post("/records")
async def create_record(
    payload: StudentRecordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    sid = payload.student_id.strip().upper()
    existing = db.query(StudentRecord).filter(StudentRecord.student_id == sid).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Student ID '{sid}' already exists. Use Edit instead.")

    placed = bool(payload.placement_status)
    now_iso = datetime.now(timezone.utc).isoformat()
    record = StudentRecord(
        student_id=sid,
        name=payload.name.strip(),
        batch_year=payload.batch_year,
        branch=payload.branch.strip().upper(),
        class_year=payload.class_year.strip(),
        section=payload.section.strip().upper(),
        gender=payload.gender.strip(),
        email=payload.email.strip(),
        phone=payload.phone.strip(),
        cgpa=round(payload.cgpa, 2),
        tenth_percent=round(payload.tenth_percent, 1),
        twelfth_percent=round(payload.twelfth_percent, 1),
        active_backlogs=payload.active_backlogs,
        internships_count=payload.internships_count,
        projects_count=payload.projects_count,
        coding_score=round(payload.coding_score, 1),
        skills=payload.skills.strip(),
        placement_status=placed,
        company_name=payload.company_name.strip() if placed else "None",
        company_tier=payload.company_tier.strip() if placed else "None",
        ctc_lpa=round(payload.ctc_lpa, 2) if placed else 0.0,
        updated_at=now_iso,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(_retrain_and_notify_sync)
    await _notify_realtime("record_created", f"Added {sid} ({record.branch} - {record.class_year} Sec {record.section})")
    return _serialize_record(record)


@admin_router.put("/records/{student_id}")
async def update_record(
    student_id: str,
    payload: StudentRecordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    sid = student_id.strip().upper()
    record = db.query(StudentRecord).filter(StudentRecord.student_id == sid).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Student ID '{sid}' not found.")

    placed = bool(payload.placement_status)
    record.name = payload.name.strip()
    record.batch_year = payload.batch_year
    record.branch = payload.branch.strip().upper()
    record.class_year = payload.class_year.strip()
    record.section = payload.section.strip().upper()
    record.gender = payload.gender.strip()
    record.email = payload.email.strip()
    record.phone = payload.phone.strip()
    record.cgpa = round(payload.cgpa, 2)
    record.tenth_percent = round(payload.tenth_percent, 1)
    record.twelfth_percent = round(payload.twelfth_percent, 1)
    record.active_backlogs = payload.active_backlogs
    record.internships_count = payload.internships_count
    record.projects_count = payload.projects_count
    record.coding_score = round(payload.coding_score, 1)
    record.skills = payload.skills.strip()
    record.placement_status = placed
    record.company_name = payload.company_name.strip() if placed else "None"
    record.company_tier = payload.company_tier.strip() if placed else "None"
    record.ctc_lpa = round(payload.ctc_lpa, 2) if placed else 0.0
    record.updated_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(record)

    background_tasks.add_task(_retrain_and_notify_sync)
    await _notify_realtime("record_updated", f"Updated {sid}")
    return _serialize_record(record)


@admin_router.delete("/records/{student_id}")
async def delete_record(
    student_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    sid = student_id.strip().upper()
    record = db.query(StudentRecord).filter(StudentRecord.student_id == sid).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Student ID '{sid}' not found.")

    db.delete(record)
    db.commit()

    background_tasks.add_task(_retrain_and_notify_sync)
    await _notify_realtime("record_deleted", f"Deleted {sid}")
    return {"status": "deleted", "student_id": sid}


@admin_router.get("/records")
def list_records(
    search: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    class_year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(StudentRecord)
    if branch and branch != "All":
        query = query.filter(StudentRecord.branch == branch)
    if class_year and class_year != "All":
        query = query.filter(StudentRecord.class_year == class_year)
    if section and section != "All":
        query = query.filter(StudentRecord.section == section)
    if year and year != 0:
        query = query.filter(StudentRecord.batch_year == year)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                StudentRecord.student_id.ilike(term),
                StudentRecord.name.ilike(term),
                StudentRecord.company_name.ilike(term),
                StudentRecord.skills.ilike(term),
                StudentRecord.email.ilike(term),
            )
        )

    total = query.count()
    items = (
        query.order_by(StudentRecord.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [_serialize_record(r) for r in items],
    }


@admin_router.post("/retrain")
async def trigger_retrain():
    metrics = train_models()
    await _notify_realtime("models_retrained", "ML models retrained")
    return {"status": "success", "metrics": metrics}


# ==========================================
# 3. ANALYTICS ROUTER
# ==========================================
analytics_router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _get_filtered_df(
    db: Session,
    year: Optional[int] = None,
    branch: Optional[str] = None,
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    tier: Optional[str] = None,
) -> pd.DataFrame:
    query = db.query(StudentRecord)
    if year and year != 0:
        query = query.filter(StudentRecord.batch_year == year)
    if branch and branch != "All":
        query = query.filter(StudentRecord.branch == branch)
    if class_year and class_year != "All":
        query = query.filter(StudentRecord.class_year == class_year)
    if section and section != "All":
        query = query.filter(StudentRecord.section == section)
    if tier and tier != "All":
        query = query.filter(StudentRecord.company_tier == tier)

    rows = query.all()
    if not rows:
        return pd.DataFrame(
            columns=[
                "student_id", "name", "batch_year", "branch", "class_year", "section", "gender",
                "cgpa", "active_backlogs", "internships_count", "projects_count",
                "coding_score", "skills", "placement_status", "company_name",
                "company_tier", "ctc_lpa",
            ]
        )

    return pd.DataFrame([
        {
            "student_id": r.student_id,
            "name": r.name,
            "batch_year": r.batch_year,
            "branch": r.branch,
            "class_year": r.class_year,
            "section": r.section,
            "gender": r.gender,
            "cgpa": r.cgpa,
            "active_backlogs": r.active_backlogs,
            "internships_count": r.internships_count,
            "projects_count": r.projects_count,
            "coding_score": r.coding_score,
            "skills": r.skills,
            "placement_status": bool(r.placement_status),
            "company_name": r.company_name,
            "company_tier": r.company_tier,
            "ctc_lpa": r.ctc_lpa,
        }
        for r in rows
    ])


@analytics_router.get("/overview")
def analytics_overview(
    year: Optional[int] = Query(None),
    branch: Optional[str] = Query(None),
    class_year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    df = _get_filtered_df(db, year, branch, class_year, section, tier)
    total_eligible = int(len(df))
    last_updated = datetime.now(timezone.utc).isoformat()
    if total_eligible == 0:
        return {
            "total_eligible": 0,
            "total_placed": 0,
            "placement_rate": 0.0,
            "avg_ctc": 0.0,
            "median_ctc": 0.0,
            "highest_ctc": 0.0,
            "top_recruiter": "N/A",
            "last_updated": last_updated,
        }

    placed_df = df[df["placement_status"] == True]
    total_placed = int(len(placed_df))
    placement_rate = round((total_placed / total_eligible) * 100.0, 1)

    if total_placed > 0:
        avg_ctc = round(float(placed_df["ctc_lpa"].mean()), 2)
        median_ctc = round(float(placed_df["ctc_lpa"].median()), 2)
        highest_ctc = round(float(placed_df["ctc_lpa"].max()), 2)
        comp_counts = placed_df[placed_df["company_name"] != "None"]["company_name"].value_counts()
        top_recruiter = str(comp_counts.index[0]) if not comp_counts.empty else "N/A"
    else:
        avg_ctc = 0.0
        median_ctc = 0.0
        highest_ctc = 0.0
        top_recruiter = "N/A"

    return {
        "total_eligible": total_eligible,
        "total_placed": total_placed,
        "placement_rate": placement_rate,
        "avg_ctc": avg_ctc,
        "median_ctc": median_ctc,
        "highest_ctc": highest_ctc,
        "top_recruiter": top_recruiter,
        "last_updated": last_updated,
    }


@analytics_router.get("/charts")
def analytics_charts(
    year: Optional[int] = Query(None),
    branch: Optional[str] = Query(None),
    class_year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    df = _get_filtered_df(db, year, branch, class_year, section, tier)
    if df.empty:
        return {
            "branch_stats": [],
            "yearly_trends": [],
            "cgpa_vs_ctc": [],
            "top_skills": [],
            "tier_distribution": [],
        }

    branch_stats = []
    for b, grp in df.groupby("branch"):
        placed_grp = grp[grp["placement_status"] == True]
        rate = round((len(placed_grp) / len(grp)) * 100.0, 1)
        avg_ctc = round(float(placed_grp["ctc_lpa"].mean()), 2) if len(placed_grp) > 0 else 0.0
        branch_stats.append({
            "branch": b,
            "placement_rate": rate,
            "avg_ctc": avg_ctc,
            "total": int(len(grp)),
            "placed": int(len(placed_grp)),
        })
    branch_stats.sort(key=lambda x: x["placement_rate"], reverse=True)

    yearly_trends = []
    for y, grp in df.groupby("batch_year"):
        placed_grp = grp[grp["placement_status"] == True]
        rate = round((len(placed_grp) / len(grp)) * 100.0, 1)
        avg_ctc = round(float(placed_grp["ctc_lpa"].mean()), 2) if len(placed_grp) > 0 else 0.0
        yearly_trends.append({
            "year": int(y),
            "placement_rate": rate,
            "avg_ctc": avg_ctc,
            "placed_count": int(len(placed_grp)),
        })
    yearly_trends.sort(key=lambda x: x["year"])

    placed_df = df[df["placement_status"] == True]
    cgpa_vs_ctc = [
        {
            "cgpa": round(float(r["cgpa"]), 2),
            "ctc_lpa": round(float(r["ctc_lpa"]), 2),
            "tier": r["company_tier"],
            "company": r["company_name"],
            "branch": r["branch"],
        }
        for _, r in placed_df.head(250).iterrows()
    ]

    skill_records = []
    for sk in ALL_SKILLS:
        mask = placed_df["skills"].str.contains(sk, case=False, na=False, regex=False)
        matched = placed_df[mask]
        if len(matched) > 0:
            skill_records.append({
                "skill": sk,
                "count": int(len(matched)),
                "avg_ctc": round(float(matched["ctc_lpa"].mean()), 2),
            })
    skill_records.sort(key=lambda x: x["count"], reverse=True)
    top_skills = skill_records[:12]

    tier_counts = placed_df[placed_df["company_tier"] != "None"]["company_tier"].value_counts()
    tier_distribution = [
        {"name": str(t), "value": int(c)}
        for t, c in tier_counts.items()
    ]

    return {
        "branch_stats": branch_stats,
        "yearly_trends": yearly_trends,
        "cgpa_vs_ctc": cgpa_vs_ctc,
        "top_skills": top_skills,
        "tier_distribution": tier_distribution,
    }


# ==========================================
# 4. STUDENT SELF-SERVICE & PREDICTOR ROUTER
# ==========================================
student_router = APIRouter(prefix="/api/student", tags=["Student Portal"])


@student_router.get("/directory")
def student_directory(
    q: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    class_year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Allow students to quickly find their record by ID, name, department, class, or section."""
    query = db.query(StudentRecord)
    if branch and branch != "All":
        query = query.filter(StudentRecord.branch == branch)
    if class_year and class_year != "All":
        query = query.filter(StudentRecord.class_year == class_year)
    if section and section != "All":
        query = query.filter(StudentRecord.section == section)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                StudentRecord.student_id.ilike(term),
                StudentRecord.name.ilike(term),
            )
        )
    items = query.order_by(StudentRecord.id.desc()).limit(limit).all()
    return [
        {
            "student_id": r.student_id,
            "name": r.name,
            "branch": r.branch,
            "class_year": r.class_year,
            "section": r.section,
            "batch_year": r.batch_year,
            "cgpa": r.cgpa,
            "placement_status": bool(r.placement_status),
        }
        for r in items
    ]


@student_router.get("/lookup/{student_id}")
def lookup_student(student_id: str, db: Session = Depends(get_db)):
    """Return full real-time student record, ML readiness insights, and department/class/section benchmarks."""
    sid = student_id.strip().upper()
    record = db.query(StudentRecord).filter(StudentRecord.student_id == sid).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"No student found with ID '{sid}'.")

    skills_list = [s.strip() for s in record.skills.split(",") if s.strip()]
    target_tier = record.company_tier if record.company_tier in ("Tier-1 Product", "Tier-2 Service", "Core") else "Tier-1 Product"

    ml_insights = predict_student_profile(
        cgpa=record.cgpa,
        backlogs=record.active_backlogs,
        internships=record.internships_count,
        projects=record.projects_count,
        coding_score=record.coding_score,
        branch=record.branch,
        skills=skills_list,
        target_tier=target_tier,
    )

    branch_peers = db.query(StudentRecord).filter(StudentRecord.branch == record.branch).all()
    section_peers = [
        p for p in branch_peers
        if p.class_year == record.class_year and p.section == record.section
    ]

    def _stats(peers):
        if not peers:
            return {"count": 0, "avg_cgpa": 0.0, "avg_coding": 0.0, "placement_rate": 0.0}
        placed = sum(1 for p in peers if p.placement_status)
        return {
            "count": len(peers),
            "avg_cgpa": round(sum(p.cgpa for p in peers) / len(peers), 2),
            "avg_coding": round(sum(p.coding_score for p in peers) / len(peers), 1),
            "placement_rate": round((placed / len(peers)) * 100.0, 1),
        }

    return {
        "student": _serialize_record(record),
        "ml_insights": ml_insights,
        "peer_benchmarks": {
            "department": _stats(branch_peers),
            "class_section": _stats(section_peers),
        },
    }


@student_router.post("/predict", response_model=StudentPredictResponse)
def predict_student(payload: StudentPredictRequest):
    return predict_student_profile(
        cgpa=payload.cgpa,
        backlogs=payload.backlogs,
        internships=payload.internships,
        projects=payload.projects,
        coding_score=payload.coding_score,
        branch=payload.branch,
        skills=payload.skills,
        target_tier=payload.target_tier,
    )


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(analytics_router)
app.include_router(student_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# Serve built React frontend (for Render / single-service production deployment)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def serve_spa(full_path: str):
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
