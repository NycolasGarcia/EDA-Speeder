# Gerencia o estado dos dados no app (arquivo bruto + DataFrame ativo)
# Recebe: caminhos de arquivos, seleção de tabela/colunas
# Retorna: DataFrame pronto para uso nas análises

import pandas as pd


class DataManager:
    def __init__(self):
        # 🔹 Dados brutos (podem ser DF ou ExcelFile)
        self.raw_data = None

        # 🔹 DataFrame ativo (usado no app)
        self.df = None

        # 🔹 Flag para controle de reset (easy-fix, etc)
        self.has_changes = False

    # Carrega o arquivo original e define raw_data
    # Recebe: caminho do arquivo
    # Retorna: None (atualiza estado interno)
    def load_file(self, file_path):
        if file_path.endswith('.csv'):
            self.raw_data = pd.read_csv(file_path)

        elif file_path.endswith('.xlsx'):
            self.raw_data = pd.ExcelFile(file_path)

        elif file_path.endswith('.json'):
            self.raw_data = pd.read_json(file_path)

        else:
            raise ValueError("Formato de arquivo não suportado")

        # 🔹 Sempre reseta estado ao carregar novo arquivo
        self.reset()

    # Cria o DataFrame com base na tabela e colunas selecionadas
    # Recebe: nome da tabela (opcional), lista de colunas (opcional)
    # Retorna: DataFrame criado
    def create_dataframe(self, table=None, columns=None):
        # 🔹 Extrai base
        if isinstance(self.raw_data, pd.ExcelFile):
            df = self.raw_data.parse(table)
        else:
            df = self.raw_data.copy()

        # 🔹 Filtra colunas se houver seleção
        if columns:
            df = df[columns]

        self.df = df
        self.has_changes = False

        return df

    # Retorna lista de tabelas disponíveis
    # Recebe: nada
    # Retorna: lista de nomes
    def get_tables(self):
        if isinstance(self.raw_data, pd.ExcelFile):
            return self.raw_data.sheet_names

        return ['default']

    # Retorna colunas da tabela selecionada
    # Recebe: nome da tabela (opcional)
    # Retorna: lista de colunas
    def get_columns(self, table=None):
        if isinstance(self.raw_data, pd.ExcelFile):
            df = self.raw_data.parse(table)
        else:
            df = self.raw_data

        return list(df.columns)

    # Marca que o DF sofreu alteração (usado nos easy-fix)
    # Recebe: nada
    # Retorna: None
    def mark_changed(self):
        self.has_changes = True

    # Reseta o DataFrame ativo
    # Recebe: nada
    # Retorna: None
    def reset(self):
        self.df = None
        self.has_changes = False


# 🔹 Instância única (estado global do app)
data_manager = DataManager()

