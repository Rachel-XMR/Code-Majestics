// Constants
const ST_PETER_SQUARE = [53.4779, -2.2441];
const MAX_RADIUS_MILES = 3;
const RANDOM_OFFSET_METERS = 5000; // 增加偏移距離
const MIN_OFFSET_METERS = 3000; // 增加最小偏移距離

const SOUNDS = {
    monkey: 'https://www.soundjay.com/jungle/monkey-screaming-01.mp3',
    fail: 'https://www.soundjay.com/misc/fail-trombone-01.mp3',
    british_success: 'path/to/british_success.mp3',
    british_fail: 'path/to/british_fail.mp3',
    audio1: 'angry_sound1.mp3',  // New audio file 1
    audio2: 'angry_sound2.mp3',  // New audio file 2
    audio3: 'angry_sound3.mp3',  // New audio file 3
    audio4: 'angry_sound4.mp3',  // New audio file 4
    audio5: 'angry_sound5.mp3',  // New audio file 5
    audio6: 'angry_sound6.mp3',  // New audio file 6
};

const BRITISH_INSULTS = {
    success: [
        "Oh my days! You absolute muppet! Following directions like a lost puppy!",
        "Bless your cotton socks, you've actually done it! Walking straight into my trap!",
        "Darling, you're about as sharp as a chocolate teapot, aren't you?",
        "Well well well, looks like someone's a few sandwiches short of a picnic!",
        "Oh sweetie, you're really not the brightest button in the box, are you?",
        "Congratulations love, you've just proven you'd get lost in a phone box!",
        "Oh honey, you're exactly why we can't have nice things!"
    ],
    failure: [
        "Aww, precious! Too scared to finish the walk? How adorable!",
        "Running away already? Your PE teacher was right about you!",
        "Oh darling, I expected nothing and you still managed to disappoint me!",
        "Bless your heart, can't even finish a simple walk without bottling it!",
        "Well aren't you just a delicate little flower! Too much walking for you?",
        "Oh sweetie, did your legs get tired? Or was it your courage?",
        "Look who's doing what they do best - giving up!"
    ]
};

// Global variables
let map, userMarker, routingControl, destinationMarker;
let isNavigating = false;
let watchId = null;
let currentDestination = null;
let isMuted = false;
let masterVolume = 0.75;
let monkeyVolume = 0.75;
let voiceVolume = 0.75;
let originalDestinationName = '';
let audioElements = [];
let randomAudioInterval;

// Initialize map
map = L.map('map').setView(ST_PETER_SQUARE, 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

L.circle(ST_PETER_SQUARE, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: MAX_RADIUS_MILES * 1609.34
}).addTo(map);

 // Audio control functions
 function updateVolumes() {
    masterVolume = document.getElementById('masterVolume').value / 100;
    monkeyVolume = document.getElementById('monkeyVolume').value / 100;
    voiceVolume = document.getElementById('voiceVolume').value / 100;
    audioElements.forEach(audio => {
        audio.volume = masterVolume;
    });
}

function toggleMute() {
    isMuted = !isMuted;
    document.getElementById('muteButton').textContent = isMuted ? 'Unmute' : 'Mute All';
    audioElements.forEach(audio => {
        audio.muted = isMuted;
    });
    if (isMuted) {
        stopRandomAudioPlayback();
    } else {
        startRandomAudioPlayback();
    }
}

// Initialize volume controls
document.getElementById('masterVolume').addEventListener('input', updateVolumes);
document.getElementById('monkeyVolume').addEventListener('input', updateVolumes);
document.getElementById('voiceVolume').addEventListener('input', updateVolumes);
document.getElementById('muteButton').addEventListener('click', toggleMute);


// Add boundary circle
L.circle(ST_PETER_SQUARE, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: MAX_RADIUS_MILES * 1609.34
}).addTo(map);

// Helper functions
function calculateDistance(point1, point2) {
    return map.distance(point1, point2);
}

function isWithinBounds(lat, lng) {
    const distance = calculateDistance([lat, lng], ST_PETER_SQUARE);
    return distance <= (MAX_RADIUS_MILES * 1609.34);
}

function getRandomDestination(lat, lng, minRadius, maxRadius) {
    const minRadiusInDegrees = minRadius / 111300;
    const maxRadiusInDegrees = maxRadius / 111300;
    const angle = Math.random() * Math.PI * 2;
    const distance = minRadiusInDegrees + Math.random() * (maxRadiusInDegrees - minRadiusInDegrees);
    const dx = distance * Math.cos(angle);
    const dy = distance * Math.sin(angle);
    return [
        lat + dy,
        lng + dx / Math.cos(lat * Math.PI / 180)
    ];
}


function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}


function playSound(type) {
    if (isMuted) return;
    
    const audio = new Audio(SOUNDS[type]);
    audio.volume = type.includes('monkey') ? 
                  masterVolume * monkeyVolume : 
                  masterVolume * voiceVolume;
    audioElements.push(audio);
    audio.play().catch(err => console.log('Sound play failed:', err));
}

function playRandomAudio() {
    // Randomly choose one of the three audio files
    const audioFiles = [SOUNDS.audio1, SOUNDS.audio2, SOUNDS.audio3, SOUNDS.audio4, SOUNDS.audio5, SOUNDS.audio6];
    const randomAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];

    const audio = new Audio(randomAudio);
    audio.volume = masterVolume;
    audioElements.push(audio);
    audio.play().catch(err => console.log('Error playing audio:', err));
}

function startRandomAudioPlayback() {
    playRandomAudio();
    randomAudioInterval = setInterval(playRandomAudio, 6000);
}

function stopRandomAudioPlayback() {
    clearInterval(randomAudioInterval);
    audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    audioElements = [];
}

function playBritishInsult(isSuccess) {
    if (isMuted) return;

    const insults = isSuccess ? BRITISH_INSULTS.success : BRITISH_INSULTS.failure;
    const insult = insults[Math.floor(Math.random() * insults.length)];
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Text-to-speech with enhanced parameters
    const utterance = new SpeechSynthesisUtterance(insult);
    
    // Get available voices and select a female British voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('en-GB') && voice.name.includes('Female')
    ) || voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Female')
    );

    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    // Enhanced speech parameters
    utterance.lang = 'en-GB';
    utterance.volume = masterVolume * voiceVolume;
    utterance.rate = 1.0;
    utterance.pitch = 1.3;
    
    if (isSuccess) {
        utterance.rate = 1.1;
        utterance.pitch = 1.4;
    } else {
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
    }

    utterance.onboundary = function(event) {
        if (event.name === 'word') {
            utterance.pitch = 1.3 + (Math.random() * 0.2 - 0.1);
        }
    };

    window.speechSynthesis.speak(utterance);

    return insult;
}

function showOverlay(isSuccess) {
    if (isSuccess) {
        playSound('monkey');
    } else {
        playSound('fail');
    }

    const insult = playBritishInsult(isSuccess);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div>
            <h2>${isSuccess ? 'BLOODY HELL!' : 'YOU MUPPET!'}</h2>
            <p>${insult}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                Try Again, ${isSuccess ? 'You Daft Plonker' : 'You Wet Lettuce'}!
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}


// Main functions
function searchDestination() {
    const input = document.getElementById('destination-input').value;
    const status = document.getElementById('status');
    status.innerHTML = 'Searching...';
    originalDestinationName = capitalizeWords(input);

    const placeAliases = {
        'salford quay': 'Salford Quays',
        'media city': 'MediaCityUK',
        'piccadilly': 'Manchester Piccadilly',
        'northern quarter': 'Northern Quarter Manchester',
        'uni': 'University of Manchester',
        'town hall': 'Manchester Town Hall',
        'arndale': 'Manchester Arndale',
        'deansgate': 'Deansgate Manchester',
        'oxford road': 'Oxford Road Manchester',
        'victoria': 'Manchester Victoria',
        'trafford': 'Trafford Centre',
        'etihad': 'Etihad Stadium Manchester',
        'old trafford': 'Old Trafford Stadium'
    };

    const cleanInput = input.toLowerCase().trim();
    const searchTerm = placeAliases[cleanInput] || cleanInput;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchTerm}, Manchester, UK&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const result = data[0];
                const originalPoint = [parseFloat(result.lat), parseFloat(result.lon)];

                if (!isWithinBounds(originalPoint[0], originalPoint[1])) {
                    status.innerHTML = 'This destination is too far. Please choose a location within 3 miles of Manchester city centre.';
                    return;
                }

                const randomPoint = getRandomDestination(originalPoint[0], originalPoint[1], MIN_OFFSET_METERS, RANDOM_OFFSET_METERS);
                currentDestination = randomPoint;

                if (destinationMarker) map.removeLayer(destinationMarker);
                if (routingControl) map.removeControl(routingControl);

                destinationMarker = L.marker(randomPoint, {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color:#007bff;color:white;padding:5px;border-radius:5px;">${originalDestinationName}</div>`,
                        iconSize: [100, 40],
                        iconAnchor: [50, 20]
                    })
                }).addTo(map);

                if (userMarker) {
                    updateRoute(userMarker.getLatLng(), randomPoint);
                }

                const bounds = L.latLngBounds(
                    userMarker ? [userMarker.getLatLng()] : [],
                    [randomPoint]
                );
                map.fitBounds(bounds, { padding: [50, 50] });

                status.innerHTML = 'Route set! Click "Start Navigation" to begin.';
                startRandomAudioPlayback(); // Start playing random audio
            } else {
                status.innerHTML = 'Location not found. Please try again.';
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            status.innerHTML = 'Search failed. Please try again.';
        });
}

function updateRoute(start, end) {
    if (routingControl) {
        map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(start),
            L.latLng(end)
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'foot',
            timeout: 30000
        }),
        lineOptions: {
            styles: [{color: 'blue', opacity: 0.6, weight: 4}]
        },
        showAlternatives: false,
        addWaypoints: false,
        show: false,
        routeWhileDragging: false,
        fitSelectedRoutes: false
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        const container = routingControl.getContainer();
        const instructions = container.querySelector('.leaflet-routing-container');
        if (instructions) {
            instructions.style.display = 'none';
        }
    });
}

function checkDestinationReached(userLat, userLng) {
    if (!currentDestination || !isNavigating) return;
    
    const distance = calculateDistance([userLat, userLng], currentDestination);
    if (distance < 20) { // Within 20 meters of destination
        isNavigating = false;
        showOverlay(true);
    }
}

function updateLocation(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    if (!userMarker) {
        userMarker = L.marker([userLat, userLng]).addTo(map);
    } else {
        userMarker.setLatLng([userLat, userLng]);
    }

    document.getElementById('location-status').innerHTML = 'Location updated';

    if (isNavigating && currentDestination) {
        updateRoute([userLat, userLng], currentDestination);
        const distance = calculateDistance([userLat, userLng], currentDestination);
        document.getElementById('distance-info').innerHTML = 
            `Distance to destination: ${Math.round(distance)}m`;
            
        checkDestinationReached(userLat, userLng);
    }
}

function startNavigation() {
    if (!currentDestination) {
        alert('Please set a destination first');
        return;
    }

    isNavigating = true;
    document.getElementById('start-nav').style.display = 'none';
    document.getElementById('stop-nav').style.display = 'inline';

    if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
            updateLocation,
            (error) => {
                document.getElementById('location-status').innerHTML = 
                    'Location error: ' + error.message;
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

function stopNavigation() {
    if (isNavigating) {
        isNavigating = false;
        showOverlay(false);
    }
    document.getElementById('start-nav').style.display = 'inline';
    document.getElementById('stop-nav').style.display = 'none';
    if (watchId) navigator.geolocation.clearWatch(watchId);
}


function isWithinBounds(lat, lng) {
    const distance = calculateDistance([lat, lng], ST_PETER_SQUARE);
    return distance <= (MAX_RADIUS_MILES * 1609.34);
}

// Initialize location tracking
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(updateLocation);
}

let voiceInitialized = false;
window.speechSynthesis.onvoiceschanged = function() {
    if (!voiceInitialized) {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
        voiceInitialized = true;
    }
};