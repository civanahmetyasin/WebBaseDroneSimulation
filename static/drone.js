
// npm install node-hid ws express express-ws
// node server.js
// http://localhost:8080/
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/DRACOLoader.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
var ws = new WebSocket('ws://localhost:8080');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// gltf loader with draco decoder
var loader = new GLTFLoader();
loader.setDRACOLoader(new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'));
var drone;
loader.load(
    '/models/Drone.glb',
    function(gltf) {
      drone = gltf.scene;
      drone.position.y = 0;
      drone.position.x = 0;
      drone.position.z = 0;
      drone.scale.set(5,5,5);
      console.log(drone);
      scene.add(drone);
    },
    undefined,
    function(error) {
      console.error(error);
    });

var light = new THREE.AmbientLight(0xffffff, 5);
scene.add(light);



camera.position.z = 5;

var controlSignal = 0;
var controlSignalx = 0;
var controlSignalz = 0;

ws.onmessage =
    function(event) {
  var data = JSON.parse(event.data);
  var roll = scale(data.roll, -127, 127, -Math.PI, Math.PI);
  var signalx = scale(data.roll, -127, 127, -3, 3);
  var pitch = scale(data.pitch, -127, 127, -Math.PI, Math.PI);
  var signalz = scale(data.pitch, -127, 127, -3, 3);
  var yaw = scale(data.yaw, -127, 127, -Math.PI, Math.PI);
  desiredAltitude = scale(data.throttle, -127, 127, -3, 3);

  if (desiredAltitude <= 0) {
    desiredAltitude += 3;
  } else {
    desiredAltitude -= 3;
  }

  if (signalx <= 0) {
    signalx += 3;
  } else {
    signalx -= 3;
  }

  if (signalz <= 0) {
    signalz += 3;
  } else {
    signalz -= 3;
  }


  controlSignal += desiredAltitude * 0.1;

  controlSignalx += signalx * -0.1;
  controlSignalz += signalz * -0.1;

  drone.rotation.x = pitch;
  drone.rotation.y = yaw;
  drone.rotation.z = roll * -1;

  drone.position.y = controlSignal * -1;
  drone.position.x = controlSignalx * -1;
  drone.position.z = controlSignalz * -1;
}


function scale(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

var speed = 0;
var lastPosition = new THREE.Vector3();

function updateInfo() {
  var speedElement = document.getElementById('speed');
  var positionElement = document.getElementById('position');
  
  // Calculate the speed as the distance travelled since last frame
  var distance = drone.position.distanceTo(lastPosition);
  speed = distance / (1/60); // Assuming animate is running at 60 FPS
  lastPosition.copy(drone.position);

  speedElement.innerText = 'Speed: ' + speed.toFixed(2);
  positionElement.innerText = 'Position: (' + drone.position.x.toFixed(2) + ', ' 
                                         + drone.position.y.toFixed(2) + ', ' 
                                         + drone.position.z.toFixed(2) + ')';
}

var animate = function() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateInfo();
};

animate();
