import os
from flask import Blueprint, request, jsonify
from services.data_manager import data_manager

files_bp = Blueprint('files', __name__)

UPLOAD_FOLDER = 'uploads'


@files_bp.route('/files', methods=['GET'])
def list_files():
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    files = []
    for name in sorted(os.listdir(UPLOAD_FOLDER)):
        path = os.path.join(UPLOAD_FOLDER, name)
        if os.path.isfile(path):
            files.append({"name": name, "size": os.path.getsize(path)})
    return jsonify({"files": files})


@files_bp.route('/files/rename', methods=['POST'])
def rename_file():
    data     = request.json
    old_name = os.path.basename(data.get('old_name', ''))
    new_name = os.path.basename(data.get('new_name', ''))

    if not old_name or not new_name:
        return jsonify({"error": "Nome inválido"}), 400

    old_path = os.path.join(UPLOAD_FOLDER, old_name)
    new_path = os.path.join(UPLOAD_FOLDER, new_name)

    if not os.path.isfile(old_path):
        return jsonify({"error": "Arquivo não encontrado"}), 404

    os.rename(old_path, new_path)
    return jsonify({"ok": True})


@files_bp.route('/files/<path:filename>', methods=['DELETE'])
def delete_file(filename):
    filename = os.path.basename(filename)
    path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.isfile(path):
        return jsonify({"error": "Arquivo não encontrado"}), 404

    os.remove(path)
    return jsonify({"ok": True})


@files_bp.route('/files/<path:filename>/load', methods=['POST'])
def load_file(filename):
    filename = os.path.basename(filename)
    path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.isfile(path):
        return jsonify({"error": "Arquivo não encontrado"}), 404

    data_manager.load_file(path)
    return jsonify({"tables": data_manager.get_tables()})
