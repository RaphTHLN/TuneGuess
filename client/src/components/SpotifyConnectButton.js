import React from 'react';
import './SpotifyConnectButton.css';

const SpotifyConnectButton = () => {
  const handleLogin = () => {
    const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
    const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
    const RESPONSE_TYPE = 'code';
    const SCOPES = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'streaming'
    ].join(' ');

    window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
  };

  return (
    <button className="spotify-connect-button" onClick={handleLogin}>
      Se connecter avec Spotify
    </button>
  );
};

export default SpotifyConnectButton;