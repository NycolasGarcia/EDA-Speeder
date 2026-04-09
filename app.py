# Lib imports
from flask import Flask, render_template
import webview

# App Imports
from routes import upload_bp, df_bp
from services import data_manager

app = Flask(__name__, static_folder='./static', template_folder='./templates')

# Blueprints
app.register_blueprint(upload_bp)
app.register_blueprint(df_bp)

@app.route("/")
def index():
    return render_template('final-index.html')


if __name__ == '__main__':
    webview.create_window('EDA Speeder', app)
    webview.start()