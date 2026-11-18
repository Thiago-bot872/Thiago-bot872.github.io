#SQLite
import sqlite3

# Conectar ao banco (cria se não existir)
conn = sqlite3.connect('banco.db')
cursor = conn.cursor()

# Criar tabela usuarios
try:
    cursor.execute('''CREATE TABLE usuarios(
                    id INTEGER PRIMARY KEY,
                    nome TEXT NOT NULL,
                    idade INTEGER)''')
except EXCEPTION as erro:
    pass

# Criar tabela produtos
try:
    cursor.execute('''CREATE TABLE produtos(
                    id INTEGER PRIMARY KEY,
                    nome TEXT NOT NULL,
                    codigo INTEGER,
                    valor REAL)''')


except EXCEPTION as erro:
    pass

# Inserir dados de usuário
cursor.execute("INSERT INTO usuarios (nome, idade) VALUES (?, ?)",
              ("joão", 25))
# Inserir dados de produto
cursor.execute("INSERT INTO produtos (nome, codigo, valor) VALUES (?, ?, ?)",
              ("Cadeira", 12345, 187.99))

# Salvar e fechar
conn.commit()
conn.close()