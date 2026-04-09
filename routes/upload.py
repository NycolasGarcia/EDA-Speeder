from flask import Blueprint, request, jsonify
from services.data_manager import data_manager
import os

upload_bp = Blueprint('upload', __name__)

UPLOAD_FOLDER = 'uploads'


# Recebe um arquivo do frontend e inicializa o DataManager
# Recebe: arquivo via multipart/form-data
# Retorna: lista de tabelas disponíveis
@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('file')

    # 🔹 Validação básica
    if not file:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    # 🔹 Garante que a pasta existe
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # 🔹 Salva arquivo
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    # 🔹 Carrega no DataManager
    data_manager.load_file(path)

    # 🔹 Usa método do manager (não acessa raw_data direto)
    tables = data_manager.get_tables()

    return jsonify({
        "tables": tables
    })