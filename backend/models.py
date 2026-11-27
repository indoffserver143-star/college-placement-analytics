from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Boolean, Column, Float, Integer, String
from pydantic import BaseModel, Field
from database import Base


class StudentRecord(Base):
    """SQLAlchemy ORM model for student academic & placement records."""
    __tablename__ = "student_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    batch_year = Column(Integer, index=True, nullable=False)
    branch = Column(String, index=True, nullable=False)
    class_year = Column(String, index=True, default="4th Year", nullable=False)
    section = Column(String, index=True, default="A", nullable=False)
    gender = Column(String, nullable=False)
    email = Column(String, default="", nullable=False)
    phone = Column(String, default="", nullable=False)
    cgpa = Column(Float, nullable=False)
    tenth_percent = Column(Float, nullable=False)
    twelfth_percent = Column(Float, nullable=False)
    active_backlogs = Column(Integer, default=0, nullable=False)
    internships_count = Column(Integer, default=0, nullable=False)
    projects_count = Column(Integer, default=1, nullable=False)
    coding_score = Column(Float, nullable=False)
    skills = Column(String, nullable=False)  # Comma-separated list
    placement_status = Column(Boolean, default=False, nullable=False)
    company_name = Column(String, default="None", nullable=False)
    company_tier = Column(String, default="None", index=True, nullable=False)
    ctc_lpa = Column(Float, default=0.0, nullable=False)
    updated_at = Column(
        String,
        default=lambda: datetime.now(timezone.utc).isoformat(),
        nullable=False,
    )


# --- Pydantic Schemas ---

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    role: str
    name: str
    username: str


class StudentRecordCreate(BaseModel):
    student_id: str = Field(..., min_length=2)
    name: str = Field(..., min_length=2)
    batch_year: int = Field(..., ge=2018, le=2032)
    branch: str = Field(..., min_length=2)
    class_year: str = Field(..., min_length=2)
    section: str = Field(..., min_length=1)
    gender: str = "Male"
    email: str = ""
    phone: str = ""
    cgpa: float = Field(..., ge=0.0, le=10.0)
    tenth_percent: float = Field(..., ge=0.0, le=100.0)
    twelfth_percent: float = Field(..., ge=0.0, le=100.0)
    active_backlogs: int = Field(0, ge=0, le=15)
    internships_count: int = Field(0, ge=0, le=15)
    projects_count: int = Field(1, ge=0, le=30)
    coding_score: float = Field(..., ge=0.0, le=100.0)
    skills: str = Field(..., min_length=1)
    placement_status: bool = False
    company_name: str = "None"
    company_tier: str = "None"
    ctc_lpa: float = Field(0.0, ge=0.0, le=100.0)


class StudentPredictRequest(BaseModel):
    cgpa: float = Field(..., ge=0.0, le=10.0)
    backlogs: int = Field(..., ge=0, le=10)
    internships: int = Field(..., ge=0, le=10)
    projects: int = Field(..., ge=0, le=20)
    coding_score: float = Field(..., ge=0.0, le=100.0)
    branch: str
    skills: List[str]
    target_tier: str = "Tier-1 Product"


class SkillImpactItem(BaseModel):
    skill: str
    frequency_pct: float
    simulated_probability_boost: float
    simulated_ctc_boost: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    value: str


class StudentPredictResponse(BaseModel):
    placement_probability: float
    predicted_status: str
    predicted_ctc_lpa: float
    predicted_ctc_range: List[float]
    skill_match_pct: float
    matched_skills: List[str]
    missing_recommended_skills: List[SkillImpactItem]
    feature_importances: List[FeatureImportanceItem]


class StudentRecordOut(BaseModel):
    id: int
    student_id: str
    name: str
    batch_year: int
    branch: str
    class_year: str
    section: str
    gender: str
    email: str
    phone: str
    cgpa: float
    tenth_percent: float
    twelfth_percent: float
    active_backlogs: int
    internships_count: int
    projects_count: int
    coding_score: float
    skills: str
    placement_status: bool
    company_name: str
    company_tier: str
    ctc_lpa: float
    updated_at: str

    class Config:
        from_attributes = True
