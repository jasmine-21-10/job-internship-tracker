from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import json
import os

app = Flask(__name__)
CORS(app)


# ==============================
# Load Job Dataset
# ==============================

df = pd.read_csv("postings.csv")

# Replace missing values
df = df.fillna("")


# ==============================
# Home - Dashboard
# ==============================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


# ==============================
# Jobs API
# ==============================

@app.route("/api/jobs")
def get_jobs():

    columns = [
        "job_id",
        "company_name",
        "title",
        "location",
        "formatted_work_type",
        "formatted_experience_level",
        "remote_allowed",
        "job_posting_url",
        "application_url"
    ]

    jobs = df[columns].head(100)

    return jsonify(jobs.to_dict(orient="records"))


# ==============================
# Applications API
# ==============================

APPLICATION_FILE = "applications.json"


@app.route("/api/applications", methods=["GET"])
def get_applications():

    if not os.path.exists(APPLICATION_FILE):
        return jsonify([])

    with open(APPLICATION_FILE, "r") as file:
        applications = json.load(file)

    return jsonify(applications)


# ==============================
# Add Application
# ==============================

@app.route("/api/applications", methods=["POST"])
def add_application():

    data = request.get_json()

    company = data.get("company", "")
    role = data.get("role", "")
    location = data.get("location", "")
    status = data.get("status", "Applied")
    date = data.get("date", "")

    if company == "" or role == "":
        return jsonify({
            "error": "Company Name and Job Role are required."
        }), 400

    if os.path.exists(APPLICATION_FILE):

        with open(APPLICATION_FILE, "r") as file:
            applications = json.load(file)

    else:
        applications = []

    new_application = {
        "company": company,
        "role": role,
        "location": location,
        "status": status,
        "date": date
    }

    applications.append(new_application)

    with open(APPLICATION_FILE, "w") as file:
        json.dump(applications, file, indent=4)

    return jsonify({
        "message": "Application saved successfully!",
        "application": new_application
    }), 201


# ==============================
# Update Application
# ==============================

@app.route("/api/applications/<int:index>", methods=["PUT"])
def update_application(index):

    if not os.path.exists(APPLICATION_FILE):
        return jsonify({"error": "No applications found."}), 404

    with open(APPLICATION_FILE, "r") as file:
        applications = json.load(file)

    if index < 0 or index >= len(applications):
        return jsonify({"error": "Application not found."}), 404

    data = request.get_json()

    applications[index] = {
        "company": data.get("company", ""),
        "role": data.get("role", ""),
        "location": data.get("location", ""),
        "status": data.get("status", "Applied"),
        "date": data.get("date", "")
    }

    with open(APPLICATION_FILE, "w") as file:
        json.dump(applications, file, indent=4)

    return jsonify({
        "message": "Application updated successfully!",
        "application": applications[index]
    })


# ==============================
# Delete Application
# ==============================

@app.route("/api/applications/<int:index>", methods=["DELETE"])
def delete_application(index):

    if not os.path.exists(APPLICATION_FILE):
        return jsonify({"error": "No applications found."}), 404

    with open(APPLICATION_FILE, "r") as file:
        applications = json.load(file)

    if index < 0 or index >= len(applications):
        return jsonify({"error": "Application not found."}), 404

    deleted_application = applications.pop(index)

    with open(APPLICATION_FILE, "w") as file:
        json.dump(applications, file, indent=4)

    return jsonify({
        "message": "Application deleted successfully!",
        "application": deleted_application
    })


# ==============================
# Run Flask
# ==============================

if __name__ == "__main__":
    app.run(debug=True, port=5000)
