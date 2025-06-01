// DOM Elements
const songSearchInput = document.getElementById('songSearch');
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
songSearchInput.parentNode.appendChild(searchResults);

const requestForm = document.getElementById('requestForm');
const statusLabel = document.querySelector('.status-label');
const submitBtn = document.getElementById('submitBtn');
const subscribeBtn = document.getElementById('subscribeBtn');

// Search Spotify
async function searchSpotify(query) {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Spotify search failed:', error);
        return [];
    }
}

// Display search results
function displaySearchResults(tracks) {
    searchResults.innerHTML = '';
    tracks.forEach(track => {
        const result = document.createElement('div');
        result.className = 'search-result';
        // Updated to include album name
        result.innerHTML = `
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
                <div class="track-album">${track.album && track.album.name ? track.album.name : 'N/A'}</div>
            </div>
        `;
        result.addEventListener('click', () => selectTrack(track));
        searchResults.appendChild(result);
    });
}

// Select a track
function selectTrack(track) {
    songSearchInput.value = track.name; // Just the track name
    songSearchInput.dataset.spotifyId = track.id;
    songSearchInput.dataset.spotifyArtist = track.artists.length > 0 ? track.artists[0].name : '';
    songSearchInput.dataset.spotifyAlbum = track.album && track.album.name ? track.album.name : '';
    songSearchInput.dataset.spotifyArtworkUrl = track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : '';
    searchResults.innerHTML = ''; // Clear results after selection
}

// Handle song search input
let searchTimeout;
songSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value;

    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }

    searchTimeout = setTimeout(async () => {
        const tracks = await searchSpotify(query);
        displaySearchResults(tracks);
    }, 300);
});

// Handle form submission
requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Updated formData to send detailed track information
    const formData = {
        songTitle: songSearchInput.value, // This is now just the title
        songArtist: songSearchInput.dataset.spotifyArtist || '',
        songAlbum: songSearchInput.dataset.spotifyAlbum || '',
        spotifyId: songSearchInput.dataset.spotifyId || '',
        spotifyArtworkUrl: songSearchInput.dataset.spotifyArtworkUrl || '',
        tiktokUsername: document.getElementById('tiktokUsername').value,
        genreRemix: document.getElementById('genreRemix').value,
        otherNotes: document.getElementById('otherNotes').value,
        priorityCode: document.getElementById('priorityCode').value
    };

    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Request submitted successfully!');
            requestForm.reset();
            // Clear dataset attributes
            songSearchInput.value = ''; // Also clear the input value
            songSearchInput.dataset.spotifyId = '';
            songSearchInput.dataset.spotifyArtist = '';
            songSearchInput.dataset.spotifyAlbum = '';
            songSearchInput.dataset.spotifyArtworkUrl = '';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to submit request');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to submit request. Please try again.');
    }
});

// Handle subscribe button
subscribeBtn.addEventListener('click', () => {
    window.location.href = 'https://www.tiktok.com/@projectedreality/live';
});

// Check request status
async function checkRequestStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        updateStatusLabel(data.acceptingRequests);
    } catch (error) {
        console.error('Failed to check status:', error);
    }
}

function updateStatusLabel(acceptingRequests) {
    if (acceptingRequests) {
        statusLabel.textContent = 'NOW ACCEPTING REQUESTS';
        statusLabel.className = 'status-label accepting';
        submitBtn.disabled = false; // Enable submit button
    } else {
        statusLabel.textContent = 'REQUESTS CURRENTLY ON HOLD';
        statusLabel.className = 'status-label on-hold';
        submitBtn.disabled = true; // Disable submit button
    }
}

// Check status periodically
checkRequestStatus();
setInterval(checkRequestStatus, 30000); // Check every 30 seconds
