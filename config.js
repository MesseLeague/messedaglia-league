// =================================================================
// CONFIGURAZIONE DEL SITO
// Si compila una volta, quando il sito viene pubblicato (vedi LEGGIMI.md).
// Finché i campi sono vuoti, "Accedi" apre solo un'anteprima finta.
// =================================================================
window.ML_CONFIG = {
  // Google Cloud Console → API e servizi → Credenziali → ID client OAuth (tipo "Applicazione web")
  GOOGLE_CLIENT_ID: '',
  // URL dell'app web Apps Script (iscrizioni/Code.gs), finisce con /exec
  API_URL: '',
  // Solo gli account di questo dominio possono accedere
  DOMINIO: 'messedaglia.edu.it',
};
