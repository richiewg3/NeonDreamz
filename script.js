/*
 * script.js
 * This file contains all the JavaScript logic for the Neon Portal Website.
 * It handles animations, theme switching, navigation, the music player,
 * and the new AI-powered Data Table Editor functionality.
 */

// ===================================
// --- GLOBAL ELEMENTS & VARIABLES ---
// ===================================

// Navigation Elements
const mainView = document.getElementById('mainView');
const sections = document.querySelectorAll('.section-view');
const backBtn = document.getElementById('backBtn');

// Music Player Elements
const musicModal = document.getElementById('musicModal');
const currentTitleEl = document.getElementById('currentTitle');
const currentArtistEl = document.getElementById('currentArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const songListEl = document.getElementById('songList');

const playlist = [
    { 
        title: "Pretty Rave Girl 2010", 
        artist: "S3RL", 
        url: "https://raw.githubusercontent.com/richiewg3/3DPawsVdeX_Modelz/main/Pretty%20Rave%20Girl%202010%20-%20S3RL.mp3"
    },
    { 
        title: "Daft Punk", 
        artist: "Pentatonix", 
        url: "https://raw.githubusercontent.com/richiewg3/3DPawsVdeX_Modelz/main/Pentatonix_-_Daft_Punk.mp3"
    },
    { 
        title: "7 Rings (Official Video)", 
        artist: "Ariana Grande", 
        url: "https://raw.githubusercontent.com/richiewg3/3DPawsVdeX_Modelz/main/Ariana%20Grande%20-%207%20rings%20(Official%20Video)(1).mp3"
    }
];

let currentSongIndex = 0;
let isPlaying = false;
let isShuffled = false;
let isRepeating = false;
let currentAudio = null;

// Custom Message Modal Elements
const messageModal = document.getElementById('messageModal');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');

// Data Table Editor Elements
const fileInput = document.getElementById('csv-file-input');
const fileNameDisplay = document.getElementById('file-name');
const tableSection = document.getElementById('table-section');
const csvTable = document.getElementById('csv-table');
const aiSection = document.getElementById('ai-section');
const downloadSection = document.getElementById('download-section');
const aiPrompt = document.getElementById('ai-prompt');
const submitAiBtn = document.getElementById('submit-ai-btn');
const downloadBtn = document.getElementById('download-btn');
const loader = document.getElementById('loader');
const clearDataBtn = document.getElementById('clear-data-btn');

let tableData = [];
let tableHeaders = [];

// =============================
// --- ANIMATIONS & THEMES ---
// =============================

// Create floating particles for background animation
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Theme switching functionality
const themeButtons = document.querySelectorAll('.theme-btn');
const body = document.body;

themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        
        // Remove all theme classes and add the selected one
        body.classList.remove('dark-theme', 'light-theme', 'party-theme');
        body.classList.add(theme + '-theme');
        
        // Update the active button style
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ==========================
// --- NAVIGATION LOGIC ---
// ==========================

function showSection(sectionName) {
    // Hide the main view and show the selected section
    mainView.classList.add('hidden');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    backBtn.classList.add('active');
}

function goHome() {
    // Show the main view and hide all sections
    mainView.classList.remove('hidden');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    backBtn.classList.remove('active');
}

// Add event listener to the back button
backBtn.addEventListener('click', goHome);

// ============================
// --- CUSTOM MESSAGE MODAL ---
// ============================
function showModal(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageModal.classList.add('active');
}

function closeModal() {
    messageModal.classList.remove('active');
}

// ============================
// --- MUSIC PLAYER LOGIC ---
// ============================

function openMusicPlayer() {
    musicModal.classList.add('active');
    if (playlist.length > 0 && !currentAudio) {
        loadSong(0);
    }
}

function closeMusicPlayer() {
    musicModal.classList.remove('active');
}

function loadSong(index) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentSongIndex = index;
    const song = playlist[index];
    
    currentTitleEl.textContent = song.title;
    currentArtistEl.textContent = song.artist;
    
    currentAudio = new Audio(song.url);
    currentAudio.volume = volumeSlider.value / 100;
    currentAudio.crossOrigin = "anonymous";
    
    updatePlaylistUI();

    // Audio event listeners
    currentAudio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(currentAudio.duration);
    });

    currentAudio.addEventListener('timeupdate', () => {
        if (currentAudio.duration) {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            progressFill.style.width = progress + '%';
            currentTimeEl.textContent = formatTime(currentAudio.currentTime);
        }
    });

    currentAudio.addEventListener('ended', () => {
        if (isRepeating) {
            currentAudio.currentTime = 0;
            currentAudio.play();
        } else {
            nextSong();
        }
    });

    currentAudio.addEventListener('error', () => {
        currentTitleEl.textContent = 'Playback Error';
        currentArtistEl.textContent = 'Could not load song.';
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        isPlaying = false;
        showModal("Audio Error", "The song file could not be loaded. Please check the URL or try another song.");
    });
}

function togglePlayPause() {
    if (!currentAudio) return;
    
    if (isPlaying) {
        currentAudio.pause();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        currentAudio.play().then(() => {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }).catch(e => {
            console.error('Play error:', e);
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            showModal("Play Error", "Could not play the audio. Please check your browser permissions.");
        });
    }
    isPlaying = !isPlaying;
}

function nextSong() {
    let nextIndex;
    if (isShuffled) {
        nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
        nextIndex = (currentSongIndex + 1) % playlist.length;
    }
    loadSong(nextIndex);
    if (isPlaying) {
        setTimeout(() => togglePlayPause(), 50);
    }
}

function previousSong() {
    let prevIndex;
    if (isShuffled) {
        prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
        prevIndex = currentSongIndex === 0 ? playlist.length - 1 : currentSongIndex - 1;
    }
    loadSong(prevIndex);
    if (isPlaying) {
        setTimeout(() => togglePlayPause(), 50);
    }
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
}

function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('active', isRepeating);
}

function changeVolume() {
    if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100;
    }
}

function seekTo(event) {
    if (currentAudio && currentAudio.duration) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const clickTime = (clickX / width) * currentAudio.duration;
        currentAudio.currentTime = clickTime;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePlaylistUI() {
    songListEl.innerHTML = '';
    
    playlist.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        if (index === currentSongIndex) {
            songItem.classList.add('active');
        }
        songItem.innerHTML = `
            <div class="song-item-info">
                <div class="song-item-title">${song.title}</div>
                <div class="song-item-artist">${song.artist}</div>
            </div>
        `;
        songItem.addEventListener('click', () => {
            loadSong(index);
            if (!isPlaying) {
                setTimeout(() => togglePlayPause(), 50);
            }
        });
        songListEl.appendChild(songItem);
    });
}

musicModal.addEventListener('click', (e) => {
    if (e.target === musicModal) {
        closeMusicPlayer();
    }
});

// ===================================
// --- DATA TABLE EDITOR LOGIC ---
// ===================================

// --- EVENT LISTENERS ---
fileInput.addEventListener('change', handleFileUpload);
submitAiBtn.addEventListener('click', handleAiRequest);
downloadBtn.addEventListener('click', handleDownload);
clearDataBtn.addEventListener('click', resetApp);

// --- CORE FUNCTIONS ---

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    fileNameDisplay.textContent = `File: ${file.name}`;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            tableHeaders = results.meta.fields;
            tableData = results.data;
            renderTable();
            showDataTableSections();
        },
        error: (error) => {
            console.error('Error parsing CSV:', error);
            showModal('Parsing Error', 'Failed to parse CSV file. Please check the file format.');
            resetApp();
        }
    });
}

function renderTable() {
    csvTable.innerHTML = '';
    const allCurrentHeaders = new Set();
    tableData.forEach(row => Object.keys(row).forEach(header => allCurrentHeaders.add(header)));
    tableHeaders = Array.from(allCurrentHeaders);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    tableHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.className = 'sticky top-0 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    csvTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        tableHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] !== undefined ? row[header] : '';
            td.className = 'px-4 py-3 whitespace-nowrap text-sm';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    csvTable.appendChild(tbody);
}

function showDataTableSections() {
    tableSection.classList.remove('hidden');
    aiSection.classList.remove('hidden');
    downloadSection.classList.remove('hidden');
    clearDataBtn.classList.remove('hidden');
}

function resetApp() {
    tableData = [];
    tableHeaders = [];
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    csvTable.innerHTML = '';
    aiPrompt.value = '';
    tableSection.classList.add('hidden');
    aiSection.classList.add('hidden');
    downloadSection.classList.add('hidden');
    clearDataBtn.classList.add('hidden');
}

async function handleAiRequest() {
    const userPrompt = aiPrompt.value.trim();
    if (!userPrompt) {
        showModal('Input Required', 'Please enter a command for the AI.');
        return;
    }
    toggleLoading(true);

    const systemPrompt = `You are an intelligent data editing assistant. Your task is to modify the provided JSON dataset based on the user's instruction. You must return ONLY the updated dataset in a valid JSON array-of-objects format. Do not add any commentary, explanations, markdown formatting, or any text outside of the JSON structure.`;
    const fullUserPrompt = `User instruction: "${userPrompt}"\n\nInput Dataset:\n${JSON.stringify(tableData, null, 2)}`;
    
    try {
        // !!! SECURITY WARNING !!!
        // Hardcoding an API key in client-side code is a major security
        // risk. It exposes your key to anyone who views the page source.
        // This has been done at the user's explicit request for private use
        // and against strong recommendations for public-facing sites.
        const openRouterApiKey = "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";
        
        const apiUrl = `https://openrouter.ai/api/v1/chat/completions`;
        
        const payload = {
            model: "anthropic/claude-3.5-sonnet",
            messages: [
                { "role": "system", "content": systemPrompt },
                { "role": "user", "content": fullUserPrompt }
            ]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterApiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetail = await response.json();
            throw new Error(`API request failed: ${errorDetail?.error?.message || response.statusText}`);
        }

        const result = await response.json();
        let updatedDataText = result.choices?.[0]?.message?.content;
        if (!updatedDataText) throw new Error("AI response was empty or malformed.");

        const jsonMatch = updatedDataText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");
        
        const updatedData = JSON.parse(jsonMatch[0]);

        if (Array.isArray(updatedData)) {
            tableData = updatedData;
            renderTable();
            aiPrompt.value = '';
        } else {
            throw new Error("AI did not return a valid data array structure.");
        }
    } catch (error) {
        console.error('Error with AI request:', error);
        showModal('AI Request Error', `An error occurred. Details: ${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

function handleDownload() {
    if (tableData.length === 0) {
        showModal('Download Error', 'No data to download.');
        return;
    }
    const csvContent = Papa.unparse(tableData, {
        header: true,
        columns: tableHeaders
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'updated_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function toggleLoading(isLoading) {
    const elementsToDisable = [submitAiBtn, fileInput, clearDataBtn];
    if (isLoading) {
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        elementsToDisable.forEach(el => el.disabled = true);
        submitAiBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
        elementsToDisable.forEach(el => el.disabled = false);
        submitAiBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Code Notepad Functions
function copyCodeToClipboard() {
    // This is now just a placeholder for the single-file version.
    // The user will copy from the separate files now.
    showModal('Copy Feature', 'This feature is for the single-file version. Please copy the code from each of the separate documents provided.');
}

function displayCodePreview() {
    // This is also now a placeholder.
}

// ===========================
// --- INITIALIZATION ---
// ===========================
window.addEventListener('load', () => {
    createParticles();
    updatePlaylistUI();
});
