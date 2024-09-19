# Use uma imagem base apropriada (por exemplo, Python 3.9 slim)
FROM python:3.9-slim

# Defina o diretório de trabalho dentro do container
WORKDIR /app

ARG GOOGLE_MAPS_JAVASCRIPT_KEY

ENV GOOGLE_MAPS_JAVASCRIPT_KEY=$GOOGLE_MAPS_JAVASCRIPT_KEY

# Copie o arquivo de requisitos e instale as dependências
COPY requirements.txt .
RUN python -m venv venv
RUN venv/bin/activate
RUN pip install --no-cache-dir -r requirements.txt

# Copie todo o código para o diretório de trabalho
COPY . .

# Exponha a porta se necessário (por exemplo, 8080)
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["python", "app.py"]
