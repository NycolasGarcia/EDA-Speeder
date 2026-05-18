from flask import Flask, render_template
import webview

from routes import upload_bp, df_bp, files_bp, nulls_bp
from services import data_manager

app = Flask(__name__, static_folder='./static', template_folder='./templates')

app.register_blueprint(upload_bp)
app.register_blueprint(df_bp)
app.register_blueprint(files_bp)
app.register_blueprint(nulls_bp)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    webview.create_window('EDA Speeder', app)
    webview.start()
