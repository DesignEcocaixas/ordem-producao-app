import pandas as pd
import mysql.connector
import re
import sys
import os

def converter_data_excel(valor):
    if valor is None or pd.isna(valor):
        return None
    try:
        data = pd.to_datetime(valor, dayfirst=True, errors="coerce")
        if pd.isna(data):
            return None
        return data.date()
    except:
        return None

# ===============================
# VALIDAÇÃO DO ARQUIVO RECEBIDO
# ===============================

if len(sys.argv) < 2:
    print("Erro: caminho da planilha não informado")
    sys.exit(1)

arquivo_excel = sys.argv[1]

if not os.path.exists(arquivo_excel):
    print("Erro: arquivo não encontrado:", arquivo_excel)
    sys.exit(1)

# ===============================
# CONEXÃO COM BANCO
# ===============================

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="1234",
    database="ordem_producao"
)

cursor = conn.cursor()

def log(tipo, msg, linha=None):
    cursor.execute(
        "INSERT INTO logs_importacao (tipo, mensagem, linha_ref) VALUES (%s,%s,%s)",
        (tipo, msg, str(linha))
    )
    conn.commit()

# ===============================
# REGEX DEFINITIVOS
# ===============================

TAMANHO_REGEX = (
    r"\b("
    r"N(?:2\d|3\d|4[0-5])|"
    r"45|"
    r"0[1-4]|0|"
    r"PP[1-3]?|"
    r"GG|"
    r"[PMG]|"
    r"C[1-6]?|"
    r"G[1-6]|"
    r"A[1-6]|"
    r"L[1-2]|"
    r"\d+\s*MM|"
    r"\d+\s*CM"
    r")\b"
)

MODELO_CX_REGEX = rf"CX\s+(.*?)\s+{TAMANHO_REGEX}"

def extrair_modelo_fallback(descricao):
    lixo = ["CX", "LISA", "PERSONALIZADA", "BRANCA", "PARDA", "COR", "CORES"]
    texto = descricao
    for palavra in lixo:
        texto = re.sub(rf"\b{palavra}\b", "", texto)
    texto = re.sub(TAMANHO_REGEX, "", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()

# ===============================
# LEITURA DA PLANILHA
# ===============================

df_raw = pd.read_excel(arquivo_excel, header=None)

header_row = None
for i, row in df_raw.iterrows():
    if "Cliente (Nome Fantasia)" in row.values:
        header_row = i
        break

if header_row is None:
    print("Erro: cabeçalho não encontrado na planilha")
    sys.exit(1)

df = pd.read_excel(arquivo_excel, header=header_row)
df.columns = df.columns.str.strip()

print("COLUNAS DA PLANILHA:")
print(df.columns.tolist())

# ===============================
# PROCESSAMENTO DAS LINHAS
# ===============================

for _, row in df.iterrows():
    try:
        descricao = str(row.get("Descrição do Produto", "")).upper()
        qtd = row.get("Quantidade")

        if not descricao or pd.isna(qtd):
            continue

        # ===============================
        # PREVISÃO DE FATURAMENTO
        # ===============================
        previsao_raw = None
        for col in df.columns:
            if "previsão" in col.lower() and "faturamento" in col.lower():
                previsao_raw = row.get(col)
                break

        previsao = converter_data_excel(previsao_raw)

        # ===============================
        # FLAGS
        # ===============================
        is_lisa = "LISA" in descricao

        obs = row.get("Observações do Item do Pedido")
        is_personalizada = (
            "PERSONALIZADA" in descricao
            or "PERSONALIZAÇÃO" in descricao
            or (obs and str(obs).strip().upper() != "N/D")
        )

        # ===============================
        # TAMANHO / MODELO
        # ===============================
        tamanho_match = re.search(TAMANHO_REGEX, descricao)
        tamanho = tamanho_match.group(1) if tamanho_match else None

        modelo_match = re.search(MODELO_CX_REGEX, descricao)
        if modelo_match:
            modelo = modelo_match.group(1).strip()
        else:
            modelo = extrair_modelo_fallback(descricao)

        vendedor = row.get("Vendedor")

        # ===============================
        # ROTATIVA
        # ===============================
        if is_lisa or is_personalizada:
            cursor.execute(
                """
                INSERT INTO pedidos_rotativa
                (cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento)
                VALUES (%s,%s,%s,%s,%s,%s)
                """,
                (
                    row["Cliente (Nome Fantasia)"],
                    vendedor,
                    modelo,
                    tamanho,
                    int(qtd),
                    previsao
                )
            )


        print("DEBUG FLEXO")
        print("DESCRICAO:", descricao)
        print("OBS:", row.get("Observações do Item do Pedido"))
        print("IS_PERSONALIZADA:", is_personalizada)
        print("-" * 40)


        # ===============================
        # FLEXOGRÁFICA
        # ===============================
        if is_personalizada:
            material = (
                "branco" if "BRANCA" in descricao
                else "pardo" if "PARDA" in descricao
                else None
            )

            cores_match = re.search(r"(\d)\s*COR", descricao)
            cores = int(cores_match.group(1)) if cores_match else None

            status = (
                "Personalização definida"
                if obs and obs != "N/D"
                else "Sem personalização"
            )

            cursor.execute(
                """
                INSERT INTO pedidos_flexografica
                (cliente, vendedor, modelo, tamanho, material,
                 qtd_cores, cor_personalizacao, quantidade,
                 status_pedido, previsao_faturamento)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    row["Cliente (Nome Fantasia)"],
                    vendedor,
                    modelo,
                    tamanho,
                    material,
                    cores,
                    obs,
                    int(qtd),
                    status,
                    previsao
                )
            )

        conn.commit()

    except Exception as e:
        log("ERRO", str(e), row.to_dict())

print("Importação finalizada com sucesso")
