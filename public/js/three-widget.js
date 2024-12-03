import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

let cube;

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(41, window.innerWidth / 300, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Set renderer and effect size
const widgetWidth = window.innerWidth;
const widgetHeight = 300;  // Fixed height for the widget
renderer.setSize(widgetWidth, widgetHeight);

const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true });
effect.setSize(widgetWidth, widgetHeight);
effect.domElement.style.color = 'var(--text-color)';
effect.domElement.style.backgroundColor = 'var(--bg-color)';

const container = document.getElementById('three-container');
container.appendChild(effect.domElement);

const objectType = 'cube';

if (objectType === 'cube') {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
} else if (objectType === 'gears') {
    // insert gears here (wip)

}

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
controls.enableZoom = false;  
controls.enablePan = false;
controls.enableDamping = true;
// controls.enableRotate = false;

function animate() {
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 60 );
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
