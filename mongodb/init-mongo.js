// Script di inizializzazione MongoDB (Eseguito solo al primo avvio del container)
// Crea un database e un utente con permessi limitati alla sola applicazione OCR.

db = db.getSiblingDB('ocr_vault');

// Creazione utente applicativo (Non-Root)
db.createUser({
  user: 'ocr_user',
  pwd: 'app_password_vault',
  roles: [
    {
      role: 'readWrite',
      db: 'ocr_vault',
    },
  ],
});

// Opzionale: Creazione collezione con indice di ricerca per user_id di Postgres
db.createCollection('invoices');
db.invoices.createIndex({ "user_id": 1 });

print('Inizializzazione MongoDB [ocr_vault] completata con successo!');
