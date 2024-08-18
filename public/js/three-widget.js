import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 200, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Set renderer and effect size
const widgetWidth = window.innerWidth;
const widgetHeight = 200;  // Fixed height for the widget
renderer.setSize(widgetWidth, widgetHeight);

const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true });
effect.setSize(widgetWidth, widgetHeight);
effect.domElement.style.color = 'white';
effect.domElement.style.backgroundColor = 'black';

// Append the effect's DOM element to the three-container div
const container = document.getElementById('three-container');
container.appendChild(effect.domElement);

// Create a cube
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add point light
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Position camera
camera.position.z = 4;

const controls = new OrbitControls(camera, effect.domElement);
controls.enableZoom = false;  // Disable zooming for this small widget

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls.update();
    effect.render(scene, camera);
}

animate();

// Update sizes on window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    camera.aspect = newWidth / widgetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, widgetHeight);
    effect.setSize(newWidth, widgetHeight);
});