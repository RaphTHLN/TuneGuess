import React from 'react';
import './App.css'; // Garde l'import du CSS général
import SpotifyConnectButton from './components/SpotifyConnectButton'; // Importe ton bouton

function App() {
  return (
    <div className="App">
      <h1>TuneGuess</h1> {/* Titre simple en attendant le composant Logo */}
      <p>Connecte-toi avec Spotify pour commencer à deviner les musiques.</p>
      <SpotifyConnectButton />
    </div>
  );
}

export default App;