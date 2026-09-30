from flask import Flask, render_template, request, jsonify, abort
import uuid

app = Flask(__name__)

# Temporary storage for letters
letters = {}


# -----------------------------
# HOME PAGE
# -----------------------------
@app.route("/")
def index():
    return render_template("home.html")


# -----------------------------
# CREATE LETTER PAGE
# -----------------------------
@app.route("/create")
def create():
    return render_template("create_letter.html")


# -----------------------------
# SAVE LETTER
# -----------------------------
@app.route("/save-letter", methods=["POST"])
def save_letter():

    data = request.get_json()

    letter_id = str(uuid.uuid4())

    letters[letter_id] = data

    share_link = request.host_url + "letter/" + letter_id

    return jsonify({
        "success": True,
        "link": share_link
    })


# -----------------------------
# VIEW SHARED LETTER
# -----------------------------
@app.route("/letter/<letter_id>")
def view_letter(letter_id):

    letter = letters.get(letter_id)

    if not letter:
        abort(404)

    return render_template(
        "shared_letter.html",
        letter=letter
    )


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)