import pandas as pd


class DataManager:
    def __init__(self):
        self.raw_data = None        # ExcelFile ou DataFrame bruto
        self.base_df = None         # Tabela completa (todas as colunas)
        self.df = None              # DataFrame de trabalho (colunas selecionadas)
        self.has_changes = False
        self._current_table = None
        self._header_row = 0
        self._file_path = None

    def load_file(self, file_path):
        self._file_path = file_path

        if file_path.endswith('.csv'):
            self.raw_data = pd.read_csv(file_path)
        elif file_path.endswith('.xlsx'):
            self.raw_data = pd.ExcelFile(file_path, engine='openpyxl')
        elif file_path.endswith('.xls'):
            self.raw_data = pd.ExcelFile(file_path, engine='xlrd')
        elif file_path.endswith('.ods'):
            self.raw_data = pd.ExcelFile(file_path, engine='odf')
        elif file_path.endswith('.json'):
            self.raw_data = pd.read_json(file_path)
        else:
            raise ValueError("Formato de arquivo não suportado")

        self.base_df = None
        self.df = None
        self.has_changes = False
        self._current_table = None
        self._header_row = 0

    def get_tables(self):
        if isinstance(self.raw_data, pd.ExcelFile):
            return self.raw_data.sheet_names
        return ['default']

    def get_columns(self, table=None, header_row=0):
        self._ensure_base_df(table, header_row)
        return list(self.base_df.columns)

    # Garante que base_df está carregado para a tabela/header_row pedidos.
    # Só relê o disco quando tabela ou header_row mudam — troca de colunas não relê.
    def _ensure_base_df(self, table=None, header_row=0):
        needs_reload = (
            self._current_table != table
            or self._header_row != header_row
            or self.base_df is None
        )
        if not needs_reload:
            return

        if isinstance(self.raw_data, pd.ExcelFile):
            self.base_df = self.raw_data.parse(table, header=header_row)
        elif self._file_path and self._file_path.endswith('.csv'):
            self.base_df = pd.read_csv(self._file_path, header=header_row)
        elif self._file_path and self._file_path.endswith('.json'):
            self.base_df = pd.read_json(self._file_path)
        else:
            self.base_df = self.raw_data.copy()

        self._current_table = table
        self._header_row = header_row

    def create_dataframe(self, table=None, columns=None, header_row=0):
        self._ensure_base_df(table, header_row)

        if columns:
            self.df = self.base_df[columns].copy()
        else:
            self.df = self.base_df.copy()

        self.has_changes = False
        return self.df

    # ── Métodos de serviço ─────────────────────────────────────────────────────

    def get_metrics(self):
        df = self.df
        rows, cols = df.shape
        total_cells = rows * cols

        nulls_total = int(df.isnull().sum().sum())
        nulls_pct = round(nulls_total / total_cells * 100, 2) if total_cells else 0

        dup_total = int(df.duplicated().sum())
        dup_pct = round(dup_total / rows * 100, 2) if rows else 0

        return {
            "rows": rows, "cols": cols,
            "nulls_total": nulls_total, "nulls_pct": nulls_pct,
            "dup_total": dup_total, "dup_pct": dup_pct,
        }

    def get_preview(self, n=5, tail=False):
        df = self.df.tail(n) if tail else self.df.head(n)
        return df.fillna('').astype(str).to_dict(orient='records')

    def get_dtypes(self):
        result = []
        for col in self.df.columns:
            series = self.df[col].dropna()
            example = str(series.iloc[0]) if not series.empty else '-'
            result.append({
                "column": col,
                "type": str(self.df[col].dtype),
                "example": example,
            })
        return result

    def get_nulls_detail(self):
        rows = len(self.df)
        result = []
        for col in self.df.columns:
            count = int(self.df[col].isnull().sum())
            if count > 0:
                result.append({
                    "column": col,
                    "count": count,
                    "pct": round(count / rows * 100, 2) if rows else 0,
                })
        return result

    def get_dups_detail(self, n=10):
        dup_mask = self.df.duplicated(keep=False)
        dup_df = self.df[dup_mask]
        return {
            "columns": list(self.df.columns),
            "rows": dup_df.head(n).fillna('').astype(str).to_dict(orient='records'),
        }

    def cast_column(self, column, dtype):
        try:
            if dtype == 'datetime64':
                self.df[column] = pd.to_datetime(self.df[column], errors='coerce')
            else:
                self.df[column] = self.df[column].astype(dtype)
            self.has_changes = True
            return str(self.df[column].dtype)
        except Exception as e:
            raise ValueError(str(e))

    # ── Controle de estado ─────────────────────────────────────────────────────

    def mark_changed(self):
        self.has_changes = True

    def reset(self):
        self.df = None
        self.has_changes = False


data_manager = DataManager()
