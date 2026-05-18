from flask import Blueprint, request, jsonify
from services.data_manager import data_manager
from services.logger import app_logger

nulls_bp = Blueprint('nulls', __name__)


def _null_response():
    return {
        "ok": True,
        "metrics":      data_manager.get_metrics(),
        "nulls_detail": data_manager.get_nulls_detail(),
        "dtypes":       data_manager.get_dtypes(),
    }


@nulls_bp.route('/nulls/column-stats', methods=['POST'])
def null_column_stats():
    column = (request.json or {}).get('column')
    if not column:
        return jsonify({"error": "Coluna não informada"}), 400
    try:
        return jsonify(data_manager.get_column_null_stats(column))
    except Exception as e:
        app_logger.error(f"/nulls/column-stats — coluna '{column}': {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@nulls_bp.route('/nulls/impute', methods=['POST'])
def null_impute():
    data   = request.json or {}
    column = data.get('column')
    value  = data.get('value')
    if not column or value is None or str(value).strip() == '':
        return jsonify({"error": "Coluna ou valor não informado"}), 400
    try:
        data_manager.impute_column(column, str(value).strip())
        return jsonify(_null_response())
    except Exception as e:
        app_logger.error(f"/nulls/impute — coluna '{column}', valor '{value}': {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@nulls_bp.route('/nulls/drop-rows', methods=['POST'])
def null_drop_rows():
    column = (request.json or {}).get('column')
    if not column:
        return jsonify({"error": "Coluna não informada"}), 400
    try:
        data_manager.drop_null_rows(column)
        return jsonify(_null_response())
    except Exception as e:
        app_logger.error(f"/nulls/drop-rows — coluna '{column}': {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@nulls_bp.route('/nulls/drop-column', methods=['POST'])
def null_drop_column():
    column = (request.json or {}).get('column')
    if not column:
        return jsonify({"error": "Coluna não informada"}), 400
    try:
        data_manager.drop_column(column)
        return jsonify(_null_response())
    except Exception as e:
        app_logger.error(f"/nulls/drop-column — coluna '{column}': {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
