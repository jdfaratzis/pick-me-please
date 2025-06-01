// Import required modules
const express = require('express');
const dotenv = require('dotenv');
const { getSpotifyToken } = require('./spotifyService');
const fetch = require('node-fetch'); // Required for making requests to Spotify API

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());
// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Define a simple root route for testing
app.get('/', (req, res) => {
    res.send('Projected Reality Backend is running!');
});

// Define the port
const PORT = process.env.PORT || 3001;

// API Endpoint: GET /api/search
app.get('/api/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        const token = await getSpotifyToken();
        const spotifySearchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`;

        const response = await fetch(spotifySearchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Spotify Search API error: ${response.status} - ${errorBody}`);
            return res.status(response.status).json({ message: `Error searching Spotify: ${response.statusText}` });
        }

        const data = await response.json();

        if (!data.tracks || !data.tracks.items) {
            console.error('Unexpected response structure from Spotify API:', data);
            return res.status(500).json({ message: 'Error processing Spotify search results.' });
        }

        const tracks = data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name), // Array of artist names
            albumName: track.album.name,
            albumArtworkUrl: track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null,
        }));

        res.json(tracks);

    } catch (error) {
        console.error('Error in /api/search endpoint:', error);
        if (error.message === 'Spotify client ID or secret not configured.') {
             return res.status(500).json({ message: 'Spotify API credentials not configured on server.' });
        }
        res.status(500).json({ message: 'Internal server error while searching songs.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
