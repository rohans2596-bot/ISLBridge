import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import DATABASE_URL, DATA_DIR
from app.database.models import Base, Sign

db_path_str = (DATA_DIR / 'islbridge.db').resolve().as_posix()
sqlite_url = f"sqlite:///{db_path_str}"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        try:
            db.close()
        except Exception:
            pass

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed default ISL signs if empty
    db = SessionLocal()
    try:
        count = db.query(Sign).count()
        if count == 0:
            initial_signs = [
                ("HELLO", "Hello / Greeting", "static", "Open palm wave / flat hand salute to temple"),
                ("THANK YOU", "Thank You", "static", "Flat hand fingertips at chin moving forward"),
                ("PLEASE", "Please", "static", "Flat open palm gently touching chest"),
                ("YES", "Yes", "static", "Closed fist nodding up and down"),
                ("NO", "No", "static", "Index and middle fingers snapping to thumb"),
                ("GOOD", "Good", "static", "Thumb pointing upwards with closed fist"),
                ("BAD", "Bad", "static", "Thumb pointing downwards with closed fist"),
                ("HELP", "Help", "static", "Closed fist (thumbs up) resting on flat palm"),
                ("SORRY", "Sorry", "static", "Closed fist circular rub over center of chest"),
                ("WELCOME", "Welcome", "static", "Both hands open palms up sweeping inward"),
                ("GOOD MORNING", "Good Morning", "static", "Good (thumb up) + sun rising gesture"),
                ("GOOD NIGHT", "Good Night", "static", "Good (thumb up) + hand draping over wrist"),
                ("WATER", "Water", "static", "W sign (three fingers up) tapping chin"),
                ("FOOD", "Food / Eat", "static", "All fingertips bunched together touching mouth"),
                ("HOME", "Home", "static", "Both hands forming triangle roof with fingertips"),
                ("SCHOOL", "School", "static", "Flat palms clapping gently horizontally"),
                ("COLLEGE", "College", "static", "Flat right hand sliding over left palm and lifting"),
                ("HOSPITAL", "Hospital", "static", "H gesture drawing a cross on upper arm"),
                ("DOCTOR", "Doctor", "static", "Right fingers feeling pulse on left wrist"),
                ("FRIEND", "Friend", "static", "Index fingers interlocked in a hook"),
                ("FAMILY", "Family", "static", "F handshapes circling and touching pinkies"),
                ("NAME", "Name", "static", "Index and middle fingers of both hands tapping perpendicularly"),
                ("WHAT", "What", "static", "Both hands open palms facing up shaking gently side-to-side"),
                ("WHERE", "Where", "static", "Index finger pointing up and waving left and right"),
                ("WHEN", "When", "static", "Right index finger circling left index finger tip"),
                ("WHY", "Why", "static", "Hand touching forehead and pulling away into Y shape"),
                ("HOW", "How", "static", "Curved hands palms down turning over to palms up"),
                ("STOP", "Stop", "static", "Open palm pushed vertically forward"),
                ("COME", "Come", "static", "Open hand beckoning inward towards chest"),
                ("GO", "Go", "static", "Index fingers pointing away forward"),
                ("WAIT", "Wait", "static", "Both hands open palms up fingers wiggling gently"),
                ("EMERGENCY", "Emergency", "static", "E handshape shaking urgently side to side"),
            ]
            for name, display, gtype, desc in initial_signs:
                sign = Sign(
                    name=name,
                    display_name=display,
                    language="en",
                    gesture_type=gtype,
                    description=desc,
                    is_active=True,
                    samples_count=50
                )
                db.add(sign)
    finally:
        try:
            db.close()
        except Exception:
            pass
