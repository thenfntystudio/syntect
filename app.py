import os

from cs50 import SQL
import sqlite3
from flask import Flask, flash, redirect, render_template, request, session, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import apology, login_required
import base64

# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///syntect.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response



@app.route("/")
@login_required
def index():
    result = db.execute("SELECT credit, dark_mode FROM users WHERE id = :user_id", user_id=session["user_id"])
    user_credit = result[0]["credit"] if result else 0
    dark_mode = result[0]["dark_mode"] if result else False
    return render_template(
        "index.html", user_credit=user_credit, dark_mode=dark_mode,
    )

@app.route('/process', methods=['POST'])
def process():
    # Retrieve user credit
    result = db.execute("SELECT credit FROM users WHERE id = :user_id;", user_id=session["user_id"])
    user_credit = result[0]["credit"] if result else 0

    # Get data from POST request
    data = request.form.get('data')
    results = int(data)

    # Update users credit in the database
    db.execute("UPDATE users SET credit = credit - :results WHERE id = :user_id", results=results, user_id=session["user_id"])

    # Return the rendered template with updated user credits
    return render_template(
        "history.html", user_credit=user_credit
    )




@app.route('/newscan', methods=['POST'])
def new_scan():
    # Handle the file upload and scanning logic here
    #file = request.files['file']
    name = request.form.get('name')
    type = request.form.get('type')
    size = request.form.get('size')

    db.execute("""
        INSERT INTO scans (user_id, name, type, size)
        VALUES (:user_id, :name, :type, :size)
    """, user_id=session["user_id"], name=name, type=type, size=size)

    return "Scan completed successfully"


@app.route("/settings")
@login_required
def settings():
    result = db.execute("SELECT credit FROM users WHERE id = :user_id;", user_id=session["user_id"])
    user_credit = result[0]["credit"] if result else 0

    result_mode = db.execute("SELECT dark_mode FROM users WHERE id = :user_id;", user_id=session["user_id"])
    dark_mode = result_mode[0]["dark_mode"] if result else False

    return render_template(
        "settings.html", user_credit=user_credit, dark_mode=dark_mode,
    )

@app.route('/add_credits', methods=['POST'])
def add_credits():
    # Retrieve user credit
    result = db.execute("SELECT credit FROM users WHERE id = :user_id;", user_id=session["user_id"])
    user_credit = result[0]["credit"] if result else 0

    results = request.form.get('amount', type=int)

     # Update users credit in the database
    db.execute("UPDATE users SET credit = credit + :results WHERE id = :user_id", results=results, user_id=session["user_id"])

    # Return the rendered template with updated user credits
    return render_template(
        "settings.html", user_credit=user_credit
    )


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")



@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    session.clear()

    if request.method == "POST":
        if not request.form.get("username"):
            return apology("must provide username", 400)

        elif not request.form.get("password"):
            return apology("must provide password", 400)

        elif not request.form.get("confirmation"):
            return apology("must confirm password", 400)

        elif request.form.get("password") != request.form.get("confirmation"):
            return apology("passwords do not match", 400)

        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        if len(rows) != 0:
            return apology("username already exists", 400)

        db.execute(
            "INSERT INTO users (username, hash) VALUES(?, ?)",
            request.form.get("username"),
            generate_password_hash(request.form.get("password")),
        )

        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        session["user_id"] = rows[0]["id"]

        return redirect("/")

    else:
        return render_template("register.html")


@app.route("/history")
def history():

    result = db.execute("SELECT credit FROM users WHERE id = :user_id;", user_id=session["user_id"])
    user_credit = result[0]["credit"] if result else 0

    scans = db.execute("""
    SELECT id, name, strftime('%d.%m.%Y', date) AS formatted_date, type, size, score, reported
    FROM scans
    WHERE user_id = :user_id
    ORDER BY date DESC
""", user_id=session["user_id"])

    scans_count = db.execute(
    "SELECT COUNT(*) FROM scans WHERE user_id = :user_id",
    user_id=session["user_id"]
    )

    count = scans_count[0]['COUNT(*)']
    name = 'Image' if count == 1 else 'Images'

    result_mode = db.execute("SELECT dark_mode FROM users WHERE id = :user_id;", user_id=session["user_id"])
    dark_mode = result_mode[0]["dark_mode"] if result else False

    return render_template("history.html", scans=scans, user_credit=user_credit, scans_count=count, name=name, dark_mode=dark_mode,)


@app.route('/update_preference', methods=['POST'])
def update_preference():
    preference = request.form.get('preference')

    # Update the user's preference in the database
    user_id = session.get("user_id")
    db.execute("UPDATE users SET dark_mode = :preference WHERE id = :user_id", preference=preference, user_id=user_id)

    return "Preference updated successfully"


@app.route('/report_scan/<int:scan_id>', methods=['POST'])
def report_scan(scan_id):

    db.execute("UPDATE scans SET reported = 1 WHERE id = :scan_id", scan_id=scan_id)

    return jsonify({'success': True})


@app.route('/unreport_scan/<int:scan_id>', methods=['POST'])
def unreport_scan(scan_id):

    db.execute("UPDATE scans SET reported = 0 WHERE id = :scan_id", scan_id=scan_id)

    return jsonify({'success': True})
