const fetch = require('node-fetch');
const dotenv =require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiryTime = 0; // Stores the timestamp (in seconds) when the token expires

const getSpotifyToken = async () => {
    // Check if token exists and is not expired (with a small buffer, e.g., 60 seconds)
    if (cachedToken && Date.now() / 1000 < tokenExpiryTime - 60) {
        // console.log('Returning cached Spotify token.');
        return cachedToken;
    }

    // console.log('Fetching new Spotify token...');
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        console.error('Spotify client ID or secret not configured in .env file.');
        throw new Error('Spotify client ID or secret not configured.');
    }

    const spotifyApiUrl = 'https://accounts.spotify.com/api/token';
    const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    try {
        const response = await fetch(spotifyApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Spotify token API error: ${response.status} - ${errorBody}`);
            throw new Error(`Failed to fetch Spotify token: ${response.status}`);
        }

        const data = await response.json();
        cachedToken = data.access_token;
        // Spotify typically returns expires_in in seconds.
        // Store the actual expiry timestamp.
        tokenExpiryTime = (Date.now() / 1000) + data.expires_in;
        // console.log('New Spotify token fetched and cached.');
        return cachedToken;

    } catch (error) {
        console.error('Error fetching Spotify token:', error);
        // Invalidate cache on error to force retry next time
        cachedToken = null;
        tokenExpiryTime = 0;
        throw error; // Re-throw the error to be handled by the caller
    }
};

module.exports = { getSpotifyToken };
