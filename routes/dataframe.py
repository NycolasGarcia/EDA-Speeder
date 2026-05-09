from flask import Blueprint, request, jsonify
from services.data_manager import data_manager

df_bp = Blueprint('dataframe', __name__)


@df_bp.route('/create-df', methods=['POST'])
def create_df():
    data = request.json
    table      = data.get('table')
    columns    = data.get('columns')
    header_row = int(data.get('header_row', 0))

    reset_warning = data_manager.has_changes
    data_manager.create_dataframe(table, columns, header_row)

    return jsonify({
        "reset_warning": reset_warning,
        "metrics":      data_manager.get_metrics(),
        "preview":      data_manager.get_preview(),
        "dtypes":       data_manager.get_dtypes(),
        "nulls_detail": data_manager.get_nulls_detail(),
        "dups_detail":  data_manager.get_dups_detail(),
    })


@df_bp.route('/get-columns', methods=['POST'])
def get_columns():
    data = request.json
    table      = data.get('table')
    header_row = int(data.get('header_row', 0))
    columns = data_manager.get_columns(table, header_row)
    return jsonify({"columns": columns})


@df_bp.route('/get-preview', methods=['POST'])
def get_preview():
    if data_manager.df is None:
        return jsonify({"preview": []})
    data = request.json
    n    = max(1, min(int(data.get('n', 5)), 1000))
    tail = bool(data.get('tail', False))
    return jsonify({"preview": data_manager.get_preview(n, tail)})


@df_bp.route('/cast-column', methods=['POST'])
def cast_column():
    data   = request.json
    column = data.get('column')
    dtype  = data.get('dtype')
    try:
        new_dtype = data_manager.cast_column(column, dtype)
        return jsonify({"ok": True, "new_dtype": new_dtype})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
