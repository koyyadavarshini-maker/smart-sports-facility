
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).with_name("sports.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS students (
                roll_no TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT,
                year TEXT
            );

            CREATE TABLE IF NOT EXISTS equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                total INTEGER NOT NULL,
                available INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roll_no TEXT NOT NULL,
                student_name TEXT NOT NULL,
                equipment_name TEXT NOT NULL,
                issue_time TEXT NOT NULL,
                return_time TEXT,
                status TEXT NOT NULL
            );
        """)

        students = [
            ("24eg106b01", "Varshini", "Artificial Intelligence", "3rd Year"),
            ("24eg106b02", "Rahul", "Computer Science", "1st Year"),
            ("24eg106b03", "Priya", "EEE", "4th Year"),
            ("24eg106b04", "Ajay", "ECE", "2nd Year"),
            ("23eg105a03", "Pranay", "AIML", "4th Year"),
        ]

        for student in students:
            db.execute("""
                INSERT OR IGNORE INTO students
                VALUES (?, ?, ?, ?)
            """, student)

        equipment = [
            ("Badminton Racket", 10),
            ("Shuttlecock Set", 15),
            ("Basketball", 8),
            ("Football", 8),
            ("Chess Set", 6),
            ("Carrom Board", 5),
            ("Volleyball", 4),
        ]

        for name, total in equipment:
            db.execute("""
                INSERT OR IGNORE INTO equipment
                (name, total, available)
                VALUES (?, ?, ?)
            """, (name, total, total))


@app.get("/")
def home():
    return jsonify({
        "message": "SportSpace backend is running",
        "status": "success"
    })


@app.get("/api/students")
def get_students():
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM students ORDER BY roll_no"
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.get("/api/students/<roll_no>")
def find_student(roll_no):
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM students WHERE roll_no = ?",
            (roll_no,)
        ).fetchone()

    if row is None:
        return jsonify({"error": "Student not found"}), 404

    return jsonify(dict(row))


@app.get("/api/equipment")
def get_equipment():
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM equipment ORDER BY name"
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/issue")
def issue_equipment():
    data = request.get_json(silent=True) or {}
    roll_no = str(data.get("roll_no", "")).strip()
    equipment_name = str(data.get("equipment_name", "")).strip()

    if not roll_no or not equipment_name:
        return jsonify({
            "error": "roll_no and equipment_name are required"
        }), 400

    with get_db() as db:
        student = db.execute(
            "SELECT * FROM students WHERE roll_no = ?",
            (roll_no,)
        ).fetchone()

        item = db.execute(
            "SELECT * FROM equipment WHERE name = ?",
            (equipment_name,)
        ).fetchone()

        if student is None:
            return jsonify({"error": "Student not found"}), 404

        if item is None:
            return jsonify({"error": "Equipment not found"}), 404

        if item["available"] <= 0:
            return jsonify({
                "error": "No equipment available"
            }), 409

        issue_time = datetime.now().astimezone().isoformat(
            timespec="seconds"
        )

        db.execute(
            "UPDATE equipment SET available = available - 1 WHERE id = ?",
            (item["id"],)
        )

        cursor = db.execute("""
            INSERT INTO records
            (roll_no, student_name, equipment_name,
             issue_time, status)
            VALUES (?, ?, ?, ?, 'Issued')
        """, (
            student["roll_no"], student["name"],
            equipment_name, issue_time
        ))

        record_id = cursor.lastrowid

    return jsonify({
        "message": "Equipment issued successfully",
        "record_id": record_id,
        "student": student["name"],
        "equipment": equipment_name,
        "issue_time": issue_time,
        "status": "Issued"
    }), 201


@app.post("/api/return/<int:record_id>")
def return_equipment(record_id):
    with get_db() as db:
        record = db.execute(
            "SELECT * FROM records WHERE id = ?",
            (record_id,)
        ).fetchone()

        if record is None:
            return jsonify({"error": "Record not found"}), 404

        if record["status"] == "Returned":
            return jsonify({
                "error": "Equipment has already been returned"
            }), 409

        item = db.execute(
            "SELECT * FROM equipment WHERE name = ?",
            (record["equipment_name"],)
        ).fetchone()

        if item is None:
            return jsonify({"error": "Equipment not found"}), 404

        return_time = datetime.now().astimezone().isoformat(
            timespec="seconds"
        )

        db.execute("""
            UPDATE records
            SET status = 'Returned', return_time = ?
            WHERE id = ?
        """, (return_time, record_id))

        db.execute("""
            UPDATE equipment
            SET available = available + 1
            WHERE id = ?
        """, (item["id"],))

    return jsonify({
        "message": "Equipment returned successfully",
        "record_id": record_id,
        "return_time": return_time,
        "status": "Returned"
    })


@app.get("/api/records")
def get_records():
    with get_db() as db:
        rows = db.execute("""
            SELECT * FROM records ORDER BY id DESC
        """).fetchall()
    return jsonify([dict(row) for row in rows])


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
