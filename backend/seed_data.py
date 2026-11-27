from datetime import datetime, timezone
import random
import numpy as np
from database import Base, engine, SessionLocal, ensure_schema_columns
from models import StudentRecord

ALL_SKILLS = [
    "Python", "Java", "C++", "React", "Node.js", "SQL",
    "Machine Learning", "AWS", "Docker", "Data Structures",
    "Power BI", "System Design"
]

BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH"]
CLASS_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
SECTIONS = ["A", "B", "C"]
YEARS = [2022, 2023, 2024, 2025, 2026]
GENDERS = ["Male", "Female", "Other"]

COMPANIES_BY_TIER = {
    "Tier-1 Product": [
        ("Amazon", 24.0, 42.0),
        ("Microsoft", 22.0, 40.0),
        ("Google", 28.0, 42.0),
        ("Atlassian", 25.0, 38.0),
        ("Zoho", 10.0, 18.0),
        ("Adobe", 18.0, 32.0),
    ],
    "Tier-2 Service": [
        ("TCS", 3.5, 7.5),
        ("Infosys", 3.6, 8.0),
        ("Accenture", 4.5, 9.5),
        ("Cognizant", 4.0, 8.5),
        ("Deloitte", 6.5, 11.5),
        ("Wipro", 3.5, 7.0),
    ],
    "Core": [
        ("Bosch", 5.5, 11.0),
        ("L&T", 5.0, 9.5),
        ("Siemens", 6.0, 12.0),
        ("Tata Motors", 5.5, 10.0),
        ("Qualcomm", 14.0, 24.0),
    ],
}

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Diya", "Ananya", "Saanvi", "Aadhya", "Kiara", "Myra",
    "Pari", "Riya", "Navya", "Meera", "Rohan", "Karthik", "Nikhil", "Siddharth",
    "Pranav", "Sneha", "Pooja", "Neha", "Kavya", "Shruti", "Varun", "Tanvi"
]
LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Gupta", "Kumar",
    "Singh", "Joshi", "Kulkarni", "Desai", "Mehta", "Rao", "Chopra", "Bhat"
]


def _class_for_batch(year: int) -> str:
    if year <= 2024:
        return "4th Year"
    if year == 2025:
        return "4th Year"
    return "4th Year"


def seed_database(num_records: int = 500, force: bool = False) -> int:
    """Generate and insert realistic synthetic placement records."""
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    db = SessionLocal()
    try:
        existing = db.query(StudentRecord).count()
        if existing > 0 and not force:
            # Backfill any legacy rows that lack class_year/section/email
            legacy = db.query(StudentRecord).filter(
                (StudentRecord.email == "") | (StudentRecord.class_year == "")
            ).all()
            for r in legacy:
                if not r.class_year:
                    r.class_year = "4th Year"
                if not r.section:
                    r.section = "A"
                if not r.email:
                    slug = r.name.lower().replace(" ", ".")
                    r.email = f"{slug}.{r.student_id.lower()}@college.edu"
                if not r.phone:
                    r.phone = f"+91 98{abs(hash(r.student_id)) % 100000000:08d}"
                if not r.updated_at:
                    r.updated_at = datetime.now(timezone.utc).isoformat()
            if legacy:
                db.commit()
            return existing

        if force and existing > 0:
            db.query(StudentRecord).delete()
            db.commit()

        rng = random.Random(42)
        np_rng = np.random.default_rng(42)

        records = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for idx in range(1, num_records + 1):
            year = rng.choice(YEARS)
            branch = rng.choices(BRANCHES, weights=[0.32, 0.22, 0.20, 0.13, 0.13])[0]
            class_year = rng.choices(CLASS_YEARS, weights=[0.05, 0.10, 0.25, 0.60])[0] if year == 2026 else "4th Year"
            section = rng.choice(SECTIONS)
            gender = rng.choices(GENDERS, weights=[0.58, 0.40, 0.02])[0]
            first = rng.choice(FIRST_NAMES)
            last = rng.choice(LAST_NAMES)
            name = f"{first} {last}"
            student_id = f"STU{year}{branch[:2]}{idx:04d}"
            email = f"{first.lower()}.{last.lower()}.{idx}@college.edu"
            phone = f"+91 {rng.randint(7000000000, 9999999999)}"

            year_bonus = (year - 2022) * 0.08
            branch_bonus = 0.35 if branch in ("CSE", "IT") else (0.1 if branch == "ECE" else -0.15)

            cgpa = float(np.clip(np_rng.normal(7.6 + branch_bonus * 0.5, 0.95), 5.5, 9.95))
            cgpa = round(cgpa, 2)
            tenth_percent = round(float(np.clip(np_rng.normal(82.0 + (cgpa - 7.5) * 4, 7.5), 60.0, 99.0)), 1)
            twelfth_percent = round(float(np.clip(np_rng.normal(80.0 + (cgpa - 7.5) * 4.5, 8.0), 58.0, 99.0)), 1)

            if cgpa >= 8.0:
                active_backlogs = rng.choices([0, 1], weights=[0.95, 0.05])[0]
            elif cgpa >= 6.8:
                active_backlogs = rng.choices([0, 1, 2], weights=[0.75, 0.20, 0.05])[0]
            else:
                active_backlogs = rng.choices([0, 1, 2, 3], weights=[0.40, 0.30, 0.20, 0.10])[0]

            internships_count = rng.choices([0, 1, 2, 3], weights=[0.30, 0.40, 0.22, 0.08])[0]
            projects_count = rng.choices([1, 2, 3, 4, 5, 6], weights=[0.12, 0.25, 0.28, 0.20, 0.10, 0.05])[0]

            base_coding = 45 + (cgpa - 6.0) * 10 + internships_count * 6 + (10 if branch in ("CSE", "IT") else 0)
            coding_score = round(float(np.clip(np_rng.normal(base_coding, 12.0), 15.0, 99.0)), 1)

            num_skills = rng.randint(3, 7)
            skill_weights = []
            for sk in ALL_SKILLS:
                w = 1.0
                if branch in ("CSE", "IT") and sk in ("Python", "Data Structures", "React", "Node.js", "System Design", "AWS", "Docker", "Machine Learning"):
                    w = 2.4
                elif branch in ("ECE", "EEE") and sk in ("C++", "Python", "SQL", "Data Structures"):
                    w = 1.8
                elif branch == "MECH" and sk in ("Python", "Power BI", "SQL"):
                    w = 1.6
                if coding_score > 75 and sk in ("System Design", "Docker", "AWS", "Machine Learning", "Data Structures"):
                    w *= 1.5
                skill_weights.append(w)

            chosen_skills = []
            pool = list(ALL_SKILLS)
            weights = list(skill_weights)
            for _ in range(num_skills):
                pick = rng.choices(pool, weights=weights, k=1)[0]
                chosen_skills.append(pick)
                i = pool.index(pick)
                pool.pop(i)
                weights.pop(i)

            readiness = (
                (cgpa - 6.0) * 0.9
                + (coding_score - 50) * 0.045
                + internships_count * 0.55
                + projects_count * 0.20
                - active_backlogs * 1.45
                + year_bonus
                + branch_bonus
                + (0.5 if "Data Structures" in chosen_skills else 0.0)
                + (0.4 if "System Design" in chosen_skills else 0.0)
            )
            prob = 1.0 / (1.0 + np.exp(-readiness))
            placed = rng.random() < prob

            if placed:
                tier1_score = (cgpa - 7.5) * 0.8 + (coding_score - 70) * 0.06 + internships_count * 0.4
                if branch in ("CSE", "IT", "ECE") and tier1_score > 0.6 and rng.random() < 0.65:
                    tier = "Tier-1 Product"
                elif branch in ("ECE", "EEE", "MECH") and rng.random() < 0.45:
                    tier = "Core"
                else:
                    tier = "Tier-2 Service"

                comp, low_ctc, high_ctc = rng.choice(COMPANIES_BY_TIER[tier])
                strength = np.clip((cgpa - 6.0) / 4.0 * 0.4 + (coding_score / 100.0) * 0.4 + (internships_count / 3.0) * 0.2, 0.0, 1.0)
                ctc = low_ctc + (high_ctc - low_ctc) * (0.3 + 0.7 * strength) + np_rng.normal(0, 1.0)
                ctc = round(float(np.clip(ctc, 3.5, 42.0)), 2)
            else:
                tier = "None"
                comp = "None"
                ctc = 0.0

            records.append(
                StudentRecord(
                    student_id=student_id,
                    name=name,
                    batch_year=year,
                    branch=branch,
                    class_year=class_year,
                    section=section,
                    gender=gender,
                    email=email,
                    phone=phone,
                    cgpa=cgpa,
                    tenth_percent=tenth_percent,
                    twelfth_percent=twelfth_percent,
                    active_backlogs=active_backlogs,
                    internships_count=internships_count,
                    projects_count=projects_count,
                    coding_score=coding_score,
                    skills=", ".join(chosen_skills),
                    placement_status=placed,
                    company_name=comp,
                    company_tier=tier,
                    ctc_lpa=ctc,
                    updated_at=now_iso,
                )
            )

        db.bulk_save_objects(records)
        db.commit()
        return len(records)
    finally:
        db.close()


if __name__ == "__main__":
    count = seed_database(500, force=True)
    print(f"Seeded {count} student placement records into the database.")
