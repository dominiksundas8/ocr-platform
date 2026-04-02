# Utilizziamo un'immagine base slim di Python per avere un container leggero
FROM python:3.11-slim

# Variabili d'ambiente molto utili in Python:
# 1. Non scrivere i file .pyc (bytecode compilato) su disco
ENV PYTHONDONTWRITEBYTECODE=1
# 2. Impedisce il buffer dei log (così vedi subito print() e console.log nel terminale Docker)
ENV PYTHONUNBUFFERED=1

# Creiamo e ci posizioniamo nella cartella principale /app nel container
WORKDIR /app

# Aggiorniamo pip di default
RUN pip install --upgrade pip

# Copiamo solo il manifest delle dipendenze per ora
COPY requirements.txt .

# Installiamo dipendenze di sistema minime per diagnostica (ping)
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

# Installiamo i pacchetti necessari al server
RUN pip install --no-cache-dir -r requirements.txt

# ATTENZIONE: non serve 'COPY . .' qui sotto! 
# Questo perché tramite docker-compose.yml 
# stiamo già "montando" (condividendo) tutta la cartella `backend` locale dentro a `/app`,
# così non serve ricreare l'immagine Docker per ogni singola modifica al codice.
