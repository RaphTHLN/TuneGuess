const express = require('express');
const cors = require('cors');
const axios = require('axios'); // <<< Vérifie cette ligne
require('dotenv').config(); // <<< Vérifie cette ligne et sa position en haut

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware pour permettre les requêtes cross-origin
app.use(cors());

// --- ROUTES BACKEND ---

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur TuneGuess en marche !');
});

// NOUVELLE ROUTE : Le callback de Spotify après l'authentification
app.get('/callback', async (req, res) => {
  // AJOUTE CE LOG ICI POUR VÉRIFIER QUE LA ROUTE EST ATTEINTE
  console.log('*** REQUETE RECUE SUR /CALLBACK ***');

  const code = req.query.code || null;
  const state = req.query.state || null;

  if (code === null) {
    console.error('Code d\'autorisation Spotify manquant.');
    return res.redirect('http://localhost:3000/?error=access_denied');
  }

  // Vérifie si les variables d'environnement sont chargées (gardons ces logs pour le débug)
  console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? 'Loaded' : 'NOT LOADED');
  console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'Loaded' : 'NOT LOADED');
  console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);


  // CORRECTION CRUCIALE : L'URL DOIT ÊTRE HTTPS et l'endpoint correct
  const spotifyAuthEndpoint = 'https://accounts.spotify.com/api/token'; // <<< C'est CELLE-LÀ la bonne URL !
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  // Vérification des variables d'env dans le log
  if (!clientId || !clientSecret || !redirectUri) {
      console.error('ERREUR: Variables d\'environnement Spotify manquantes !');
      return res.redirect('http://localhost:3000/?error=env_vars_missing');
  }

  try {
    const response = await axios({
      method: 'post',
      url: spotifyAuthEndpoint,
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
    });

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('Tokens Spotify reçus avec succès !');
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    console.log('Expires In:', expires_in);

    res.redirect(`http://localhost:3000/?access_token=${access_token}&refresh_token=${refresh_token}`);

  } catch (error) {
    console.error('Erreur lors de l\'échange du code Spotify:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur Spotify:', error.response.data);
    }
    res.redirect('http://localhost:3000/?error=spotify_token_exchange_failed');
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur TuneGuess écoutant sur le port ${PORT}`);
});