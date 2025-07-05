import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const sceneContainer = document.getElementById('scene-container');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a1a1a); // Match body background
sceneContainer.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- CAMERA CONTROLS & POSITION ---
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 15, 20); // Initial camera position
controls.target.set(0, 0, 0);
controls.enableDamping = true; // Smooth camera movement
controls.update();

// --- KEYBOARD MODEL ---
const keyMap = {}; // To easily access key meshes by their code
const KEY_WIDTH = 1.5;
const KEY_HEIGHT = 0.5;
const KEY_DEPTH = 1.5;
const KEY_SPACING = 0.2;

// Standard QWERTY Layout Data
const qwertyLayout = [
    // ... (Layout data defined below)
    { code: 'Backquote', char: '`', x: -11.2, z: 0 },
    { code: 'Digit1', char: '1', x: -9.6, z: 0 },
    // ... Add all other keys here for a full keyboard
    // For brevity, we'll define a few rows. You can expand this.
    // Row 1
    ...('`1234567890-='.split('').map((char, i) => ({ code: `Key${char.toUpperCase()}`.replace('Key`', 'Backquote').replace('Key1', 'Digit1').replace('Key2', 'Digit2').replace('Key3', 'Digit3').replace('Key4', 'Digit4').replace('Key5', 'Digit5').replace('Key6', 'Digit6').replace('Key7', 'Digit7').replace('Key8', 'Digit8').replace('Key9', 'Digit9').replace('Key0', 'Digit0').replace('Key-', 'Minus').replace('Key=', 'Equal'), char, x: -11.2 + i * (KEY_WIDTH + KEY_SPACING), z: 0 }))),
    { code: 'Backspace', char: 'Backspace', x: -11.2 + 13 * (KEY_WIDTH + KEY_SPACING) + KEY_WIDTH/2, z: 0, width: 2.5 },
    // Row 2
    { code: 'Tab', char: 'Tab', x: -11.9, z: 2, width: 2.5 },
    ...('qwertyuiop[]\\'.split('').map((char, i) => ({ code: `Key${char.toUpperCase()}`, char, x: -9.4 + i * (KEY_WIDTH + KEY_SPACING), z: 2 }))),
    // Row 3
    { code: 'CapsLock', char: 'Caps Lock', x: -12.3, z: 4, width: 3.3 },
    ...('asdfghjkl;\''.split('').map((char, i) => ({ code: `Key${char.toUpperCase()}`, char, x: -8.8 + i * (KEY_WIDTH + KEY_SPACING), z: 4 }))),
    { code: 'Enter', char: 'Enter', x: -8.8 + 11 * (KEY_WIDTH + KEY_SPACING) + KEY_WIDTH/2, z: 4, width: 2.5 },
    // Row 4
    { code: 'ShiftLeft', char: 'Shift', x: -12.7, z: 6, width: 4.1 },
    ...('zxcvbnm,./'.split('').map((char, i) => ({ code: `Key${char.toUpperCase()}`, char, x: -8.4 + i * (KEY_WIDTH + KEY_SPACING), z: 6 }))),
    { code: 'ShiftRight', char: 'Shift', x: -8.4 + 10 * (KEY_WIDTH + KEY_SPACING) + KEY_WIDTH, z: 6, width: 4.1 },
    // Row 5
    { code: 'Space', char: 'Space', x: 0, z: 8, width: 10 }
];

// Materials for keys
const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const keyCorrectMaterial = new THREE.MeshStandardMaterial({ color: 0x5cb85c, emissive: 0x3c983c });
const keyIncorrectMaterial = new THREE.MeshStandardMaterial({ color: 0xd9534f, emissive: 0xa9332f });

// Function to create the keyboard
function createKeyboard() {
    qwertyLayout.forEach(keyInfo => {
        const width = (keyInfo.width || 1) * KEY_WIDTH;
        const geometry = new THREE.BoxGeometry(width, KEY_HEIGHT, KEY_DEPTH);
        const keyMesh = new THREE.Mesh(geometry, keyMaterial.clone());

        keyMesh.position.set(keyInfo.x, 0, keyInfo.z);
        scene.add(keyMesh);
        
        // Store the mesh for easy access later
        keyMap[keyInfo.code] = keyMesh;
    });
}


// --- TYPING TEST LOGIC ---
const textDisplay = document.getElementById('text-display');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const resetBtn = document.getElementById('reset-btn');

const sampleText = "The quick brown fox jumps over the lazy dog. A journey of a thousand miles begins with a single step. To be or not to be, that is the question.";

let currentIndex = 0;
let errors = 0;
let totalTyped = 0;
let startTime = null;

function setupTypingTest() {
    currentIndex = 0;
    errors = 0;
    totalTyped = 0;
    startTime = null;
    wpmDisplay.textContent = 'WPM: 0';
    accuracyDisplay.textContent = 'Accuracy: 100%';
    
    textDisplay.innerHTML = sampleText.split('').map(char => `<span>${char}</span>`).join('');
    document.querySelector('#text-display span').classList.add('current');
}

// --- EVENT HANDLING ---
function handleKeyDown(event) {
    event.preventDefault(); // Prevents default browser actions (e.g., space scrolling)
    
    if (currentIndex >= sampleText.length) return; // Test is finished

    if (startTime === null) {
        startTime = new Date();
    }

    const keyMesh = keyMap[event.code];
    const expectedChar = sampleText[currentIndex];
    const typedChar = event.key;
    const isCorrect = (expectedChar === typedChar) || (event.code === 'Space' && expectedChar === ' ');

    if (keyMesh) {
        // Animate key press (depression)
        gsap.to(keyMesh.position, { y: -KEY_HEIGHT / 2, duration: 0.1 });

        // Visual feedback for correct/incorrect key presses
        if (isCorrect) {
            keyMesh.material = keyCorrectMaterial;
        } else {
            keyMesh.material = keyIncorrectMaterial;
        }
    }
    
    // Update text display
    const spans = textDisplay.querySelectorAll('span');
    const currentSpan = spans[currentIndex];
    
    currentSpan.classList.remove('current');
    if (isCorrect) {
        currentSpan.classList.add('correct');
    } else {
        currentSpan.classList.add('incorrect');
        errors++;
    }

    currentIndex++;
    totalTyped++;

    if (currentIndex < sampleText.length) {
        spans[currentIndex].classList.add('current');
    }
    
    updateStats();
}

function handleKeyUp(event) {
    const keyMesh = keyMap[event.code];
    if (keyMesh) {
        // Animate key release
        gsap.to(keyMesh.position, { y: 0, duration: 0.1 });
        // Reset color
        keyMesh.material = keyMaterial;
    }
}

function updateStats() {
    if (!startTime) return;

    const elapsedTime = (new Date() - startTime) / 1000 / 60; // in minutes
    const wpm = Math.round((currentIndex / 5) / elapsedTime) || 0;
    const accuracy = Math.round(((totalTyped - errors) / totalTyped) * 100) || 100;

    wpmDisplay.textContent = `WPM: ${wpm}`;
    accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;
}


// --- INITIALIZATION and RENDER LOOP ---
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
resetBtn.addEventListener('click', setupTypingTest);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Only required if controls.enableDamping = true
    renderer.render(scene, camera);
}

// Start everything
createKeyboard();
setupTypingTest();
animate();