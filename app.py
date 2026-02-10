from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder="public", static_url_path="")

@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/health")
def health():
    return "ok"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
