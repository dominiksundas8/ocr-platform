FROM node:20-alpine

# Imposta la directory di lavoro nel container Linux
WORKDIR /app

# Copiamo prima solo package.json e package-lock.json per far girare 'npm install' in cache prima del codice
COPY package*.json ./

# Installiamo tutte le dipendenze
RUN npm install

# Proprio come in Python, il resto della copia avviene tramite i volumi in docker-compose, 
# non c'è bisogno del 'COPY . .' per l'ambiente di Development
