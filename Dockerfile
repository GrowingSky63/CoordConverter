# Use uma imagem base apropriada (por exemplo, Python 3.9 slim)
FROM python:3.9-slim

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie o arquivo de requisitos e instale as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie todo o código para o diretório de trabalho
COPY . .

# Exponha a porta se necessário (por exemplo, 5000)
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["python", "app.py"]
