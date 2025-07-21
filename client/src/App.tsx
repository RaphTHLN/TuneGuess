import React, { useEffect, useState } from 'react'; // Ajoute useState
import './App.css';
import SpotifyConnectButton from './components/SpotifyConnectButton';

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash; 
    const params = new URLSearchParams(window.location.search); 

    let token = params.get('access_token');
    let refresh = params.get('refresh_token');

    if (token || refresh) {
      window.history.pushState({}, '', window.location.pathname);
    }

    if (token) {
      setAccessToken(token);
      localStorage.setItem('access_token', token);
    }
    if (refresh) {
      setRefreshToken(refresh);
      localStorage.setItem('refresh_token', refresh);
    }

    if (!token && localStorage.getItem('access_token')) {
        setAccessToken(localStorage.getItem('access_token'));
    }
    if (!refresh && localStorage.getItem('refresh_token')) {
        setRefreshToken(localStorage.getItem('refresh_token'));
    }

  }, []); 
  return (
    <div className="App">
      <h1>TuneGuess</h1>
      {accessToken ? (
        <div>
          <p>Connecté avec Spotify !</p>
          {/* On peut afficher des infos ici ou rediriger vers la page du jeu */}
          <p>Votre Access Token est chargé.</p>
          {/* Pourrait afficher un bouton pour lancer le jeu */}
        </div>
      ) : (
        <div>
          <p>Connecte-toi avec Spotify pour commencer à deviner les musiques.</p>
          <SpotifyConnectButton />
        </div>
      )}
    </div>
  );
}

export default App;