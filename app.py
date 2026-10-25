
import os
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__, static_folder=None)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/dashboard")
def dashboard():
    return send_from_directory(".", "dashboard.html")


@app.route("/<path:filename>")
def files(filename):
    if filename in ("style.css", "script.js", "dashboard.html"):
        return send_from_directory(".", filename)
    return jsonify({"error": "File not found"}), 404


@app.route("/api/solve", methods=["POST"])
def solve():
    if not client:
        return jsonify({
            "error": "Gemini API key missing. Check your .env file."
        }), 500
    data = request.get_json(silent=True) or {}
    problem = data.get("problem", "").strip()
    category = data.get("category", "General sustainability")

    if not problem:
        return jsonify({"error": "Please enter a sustainability problem."}), 400

    prompt = f"""
    You are EcoSphere AI, a helpful sustainability assistant.
    Category: {category}
    User's problem: {problem}

    Give practical, environmentally responsible solutions.
    Use simple language, clear steps, and explain the expected benefits.
    Do not invent statistics.
    """

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        return jsonify({"answer": response.text})
    except Exception as e:
        app.logger.exception("Gemini request failed")
        return jsonify({
            "error": "AI request failed. Check your API key, model access, and internet connection."
        }), 500

@app.route("/api/report", methods=["POST"])
def generate_ai_report():
    if not client:
        return jsonify({
            "error": "Gemini API key missing. Check your .env file."
        }), 500

    data = request.get_json(silent=True) or {}

    try:
        units = float(data.get("units", 0))

        if not 0 < units <= 1000000:
            return jsonify({
                "error": "Enter electricity usage greater than 0 and no more than 1,000,000 kWh."
            }), 400

        emissions = units * 0.7
        target = emissions * 0.8

        prompt = f"""
        You are EcoSphere AI, a sustainability assistant.

        Create a personalized electricity sustainability report.
        Electricity usage: {units:.2f} kWh.
        Estimated carbon emissions: {emissions:.2f} kg CO2.
        20% reduction target: {target:.2f} kg CO2.

        Give 4 practical recommendations suited to this usage.
        Use simple English and explain briefly how each helps.
        Do not invent statistics or claim the estimates are exact.
        Return only the report recommendations, not different
        electricity or emissions values.
        """

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        return jsonify({
            "units": units,
            "emissions": round(emissions, 2),
            "target": round(target, 2),
            "recommendations": response.text
        })

    except (TypeError, ValueError):
        return jsonify({
            "error": "Please enter a valid electricity usage value."
        }), 400
    except Exception:
        app.logger.exception("AI report generation failed")
        return jsonify({
            "error": "AI report generation failed. Please try again."
        }), 500

if __name__ == "__main__":
    print("REGISTERED ROUTES:")
    print(app.url_map)
    app.run(host="0.0.0.0", port=5000, debug=True)
