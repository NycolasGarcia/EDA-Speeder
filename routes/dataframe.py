from flask import Blueprint, request, jsonify
from services.data_manager import data_manager

df_bp = Blueprint('dataframe', __name__)


# Cria o DataFrame com base na seleção do usuário
# Recebe: JSON com "table" e "columns"
# Retorna: métricas básicas + preview do DF
@df_bp.route('/create-df', methods=['POST'])
def create_df():
    data = request.json

    table = data.get('table')
    columns = data.get('columns')

    # 🔹 Verifica se haverá reset de alterações
    reset_warning = data_manager.has_changes

    # 🔹 Cria DF usando o DataManager (fonte única de verdade)
    df = data_manager.create_dataframe(table, columns)

    # 🔹 Métricas básicas
    rows, cols = df.shape

    total_cells = rows * cols

    nulls_total = int(df.isnull().sum().sum())
    nulls_pct = (nulls_total / total_cells * 100) if total_cells else 0

    dup_total = int(df.duplicated().sum())
    dup_pct = (dup_total / rows * 100) if rows else 0

    return jsonify({
        "reset_warning": reset_warning,
        "metrics": {
            "rows": rows,
            "cols": cols,
            "nulls_total": nulls_total,
            "nulls_pct": round(nulls_pct, 2),
            "dup_total": dup_total,
            "dup_pct": round(dup_pct, 2)
        },
        "preview": df.head(5).to_dict(orient='records')
    })


# Retorna colunas da tabela selecionada
# Recebe: JSON com "table"
# Retorna: lista de colunas
@df_bp.route('/get-columns', methods=['POST'])
def get_columns():
    data = request.json
    table = data.get('table')

    # 🔹 Usa DataManager ao invés de acessar pandas direto
    columns = data_manager.get_columns(table)

    return jsonify({
        "columns": columns
    })