require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
.use(cookieParser());

const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email user-read-recently-played user-top-read user-modify-playback-state user-read-playback-state streaming';
    // Ligne corrigée ci-dessous
    res.redirect('https://accounts.spotify.com/api/token' +
        querystring.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: state
        }));
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        const authOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        };

        try {
            const spotifyAuthEndpoint = 'https://accounts.spotify.com/api/token';
            const response = await fetch(spotifyAuthEndpoint, authOptions);
            const data = await response.json();

            if (response.ok) {
                const access_token = data.access_token;
                const refresh_token = data.refresh_token;
                const expires_in = data.expires_in;

                console.log('Tokens Spotify reçus avec succès !');
                console.log('Access Token: Loaded');
                console.log('Refresh Token: Loaded');
                console.log('Expires In: ' + expires_in);

                res.redirect(`http://localhost:3000/?access_token=${access_token}&refresh_token=${refresh_token}`);
            } else {
                console.error('Erreur lors de la réception des tokens de Spotify:', data);
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        } catch (error) {
            console.error('Erreur lors de la requête des tokens:', error);
            res.status(500).send('Erreur interne du serveur lors de la requête des tokens.');
        }
    }
});

app.get('/api/user-profile', async (req, res) => {
    const accessToken = req.query.access_token || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        return res.status(400).send('No access token provided.');
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.ok) {
            const profileData = await response.json();
            res.json(profileData);
        } else {
            const errorData = await response.json();
            console.error('Erreur API Spotify (user-profile):', errorData);
            res.status(response.status).json(errorData);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur Spotify:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/refresh_token', async (req, res) => {
    const refresh_token = req.query.refresh_token;

    if (!refresh_token) {
        return res.status(400).send('No refresh token provided.');
    }

    const authOptions = {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    };

    try {
        const spotifyAuthEndpoint = 'https://accounts.spotify.com/api/token';
        const response = await fetch(spotifyAuthEndpoint, authOptions);
        const data = await response.json();

        if (response.ok) {
            const access_token = data.access_token;
            console.log('Access Token rafraîchi avec succès (backend)!');
            res.json({ access_token: access_token });
        } else {
            console.error('Échec du rafraîchissement du token (backend):', data);
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Erreur réseau lors du rafraîchissement du token (backend):', error);
        res.status(500).send('Internal Server Error during token refresh.');
    }
});

app.get('/api/recently-played', async (req, res) => {
    const accessToken = req.query.access_token || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        return res.status(400).send('No access token provided.');
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            const errorData = await response.json();
            console.error('Erreur API Spotify (recently-played):', errorData);
            res.status(response.status).json(errorData);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des morceaux récemment écoutés Spotify:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Serveur TuneGuess écoutant sur le port ${port}`);
});