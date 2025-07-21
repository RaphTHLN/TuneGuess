import React from 'react';
import './SpotifyConnectButton.css';

const SpotifyConnectButton: React.FC = () => {
    const handleLogin = () => {
        const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI; // must be http://localhost:5000/callback
        const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
        const RESPONSE_TYPE = 'code';
        const SCOPES = [
            'user-read-private',
            'user-read-email',
            'user-top-read', //playlists & artists
            'user-read-playback-state', //now playing
            'user-modify-playback-state', // control reading
            'playlist-read-private', // read user playlists
            'streaming', //sdk
        ].join(' ');

        window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
    };

    return(
        <button className="spotify-connect-button" onClick={handleLogin}>
            Se connecter avec Spotify
        </button>
    );
};

export default SpotifyConnectButton