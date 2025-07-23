import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import SpotifyConnectButton from './components/SpotifyConnectButton';

interface UserProfile {
  display_name: string;
  id: string;
}

interface Artist {
  name: string;
}

interface Album {
  images: { url: string }[];
}

interface RecentlyPlayedTrack {
  track: {
    id: string;
    name: string;
    artists: Artist[];
    album: Album;
    preview_url: string | null; 
    external_urls: { spotify: string };
  };
  played_at: string;
}

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [randomTrack, setRandomTrack] = useState<RecentlyPlayedTrack | null>(null);

  const handleLogout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUserProfile(null);
    setRandomTrack(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAccessToken = params.get('access_token');
    const urlRefreshToken = params.get('refresh_token');

    let currentAccessToken = localStorage.getItem('access_token');
    let currentRefreshToken = localStorage.getItem('refresh_token');

    let tokensHandled = false;

    if (urlAccessToken && urlRefreshToken) {
      setAccessToken(urlAccessToken);
      setRefreshToken(urlRefreshToken);
      localStorage.setItem('access_token', urlAccessToken);
      localStorage.setItem('refresh_token', urlRefreshToken);
      tokensHandled = true;
    } else {
      if (currentAccessToken) {
        setAccessToken(currentAccessToken);
      }
      if (currentRefreshToken) {
        setRefreshToken(currentRefreshToken);
      }
    }

    if (tokensHandled && (urlAccessToken || urlRefreshToken)) {
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('URL nettoyée.');
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/user-profile`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (response.ok) {
            const profileData = await response.json();
            setUserProfile(profileData);
          } else {
            console.error('Erreur lors de la récupération du profil:', response.status);
            if (response.status === 401) {
              console.warn('Access Token expiré ou invalide. Tentative de rafraîchissement...');
            } else {
                handleLogout();
            }
          }
        } catch (error) {
          console.error('Erreur réseau ou autre lors de la récupération du profil:', error);
          handleLogout();
        }
      };

      fetchUserProfile();
    } else {
        setUserProfile(null);
    }
  }, [accessToken, handleLogout]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (refreshToken) {
        const refreshAccessToken = async () => {
            try {
                console.log('Tentative de rafraîchissement du token...');
                const response = await fetch(`http://localhost:5000/api/refresh_token?refresh_token=${refreshToken}`);

                if (response.ok) {
                    const data = await response.json();
                    setAccessToken(data.access_token);
                    localStorage.setItem('access_token', data.access_token);
                    console.log('Access Token rafraîchi avec succès !');
                } else {
                    console.error('Échec du rafraîchissement de l\'Access Token:', response.status);
                    handleLogout();
                }
            } catch (error) {
                console.error('Erreur réseau lors du rafraîchissement du token:', error);
                handleLogout();
            }
        };

        intervalId = setInterval(refreshAccessToken, 3000 * 1000); // 50 minutes

    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Intervalle de rafraîchissement arrêté.');
      }
    };
  }, [refreshToken, handleLogout]);

  useEffect(() => {
    if (accessToken && userProfile) {
      const fetchRecentlyPlayed = async () => {
        try {
          console.log('Tentative de récupération des morceaux récemment écoutés...');
          const response = await fetch(`http://localhost:5000/api/recently-played`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const playedTracks: RecentlyPlayedTrack[] = data.items;

            if (playedTracks && playedTracks.length > 0) {
                const playableTracks = playedTracks.filter(item => item.track.preview_url);

                if (playableTracks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * playableTracks.length);
                    const selectedTrack = playableTracks[randomIndex];
                    setRandomTrack(selectedTrack);
                    console.log('Morceau aléatoire sélectionné :', selectedTrack.track.name, 'par', selectedTrack.track.artists.map(a => a.name).join(', '));
                } else {
                    console.warn('Aucun morceau récemment écouté avec un extrait audio disponible.');
                    setRandomTrack(null);
                }
            } else {
                console.warn('Aucun morceau récemment écouté trouvé.');
                setRandomTrack(null);
            }
          } else {
            console.error('Erreur lors de la récupération des morceaux récemment écoutés:', response.status);
          }
        } catch (error) {
          console.error('Erreur réseau ou autre lors de la récupération des morceaux récemment écoutés:', error);
        }
      };

      fetchRecentlyPlayed();
    } else {
        setRandomTrack(null);
    }
  }, [accessToken, userProfile]);

  return (
    <div className="App">
      <h1>TuneGuess</h1>
      {accessToken ? (
        <div>
          <p>Connecté avec Spotify !</p>
          {userProfile ? (
            <p>Bienvenue, {userProfile.display_name} ({userProfile.id}) !</p>
          ) : (
            <p>Chargement de votre profil Spotify...</p>
          )}
          <button onClick={handleLogout}>Déconnexion</button>

          <h2>Morceau aléatoire de votre historique d'écoute :</h2>
          {randomTrack ? (
            <div>
              <p><strong>Titre :</strong> {randomTrack.track.name}</p>
              <p><strong>Artiste(s) :</strong> {randomTrack.track.artists.map(artist => artist.name).join(', ')}</p>
              <p><strong>Écouté le :</strong> {new Date(randomTrack.played_at).toLocaleString()}</p>
              {randomTrack.track.album.images.length > 0 && (
                <img
                  src={randomTrack.track.album.images[0].url}
                  alt={`Jaquette de l'album ${randomTrack.track.album.images[0].url}`}
                  style={{ width: '150px', height: '150px', marginTop: '10px' }}
                />
              )}
              {randomTrack.track.preview_url ? (
                <audio controls src={randomTrack.track.preview_url} style={{ display: 'block', marginTop: '10px' }}>
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
              ) : (
                <p>Aucun extrait audio disponible pour ce titre.</p>
              )}
              <p><a href={randomTrack.track.external_urls.spotify} target="_blank" rel="noopener noreferrer">Écouter sur Spotify</a></p>
            </div>
          ) : (
            <p>Chargement d'un morceau aléatoire ou aucun morceau récent trouvé avec extrait audio.</p>
          )}
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