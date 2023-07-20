
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
var mixer;

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
      drone.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.color.setHex(0xffffff, 1);

        }
      });
      scene.add(drone);

        // Create an AnimationMixer instance and set it to the drone
        mixer = new THREE.AnimationMixer(drone);

        // Get all animations from the glTF model
        gltf.animations.forEach((clip) => {
            // Create an AnimationAction for each animation and play it
            mixer.clipAction(clip).play();
        });
      
      console.log(drone);


    },
    undefined,
    function(error) {
      console.error(error);
    });

var scan_two;
var scan_three;
loader.load(
    '/models/scan.gltf',
    function(gltf) {
      var scan = gltf.scene;
      scan.position.y = 0;
      scan.position.x = -20;
      scan.position.z = 20;
      scan.rotation.y = Math.PI/2;
      scene.add(scan);
      //change color of scan to grey
      scan.traverse(function(child) {
        if (child.isMesh) {
          child.material.color.setHex(0xaaaaaa, 0.5);
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
      );

      scan_two = scan.clone();
      scan_two.position.set(10, 0, 30); 
      scene.add(scan_two);
      console.log(scan);

      scan_three = scan.clone();
      scan_three.position.set(-18, 0, 60);
      scan_three.scale.set(0.7, 0.7, 0.7);
      scene.add(scan_three);
        

    },
    undefined,
    function(error) {
      console.error(error);
    });


  var light = new THREE.AmbientLight(0x888888,1);
  var pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
  pointLight.position.set(10, 20, 10);
  scene.add(light, pointLight);
  
  scene.background = new THREE.Color(0xffffff);
  scene.add(new THREE.GridHelper(1000, 100, 0x000000, 0x000000));
  scene.add(new THREE.AxesHelper(1000));
  scene.fog = new THREE.Fog(0xffffff, 50, 100);
  
  camera.position.set(0, 0, 10);
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();


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

var cameraoffset = new THREE.Vector3(10, 10, 10);
var cameraLerpFactor = 0.05; // control the speed of interpolation (0.05 is a good starting value)


var gasInput = document.getElementById('gas-input');
gasInput.addEventListener('input', function() {
  drone.position.z = parseFloat(this.value);
});

// Adding altitude control
var altitudeInput = document.getElementById('altitude-input');
altitudeInput.addEventListener('input', function() {
  drone.position.y = parseFloat(this.value); // assuming y-axis is for vertical position
});

var clock = new THREE.Clock();

var animate = function() {
  requestAnimationFrame(animate);

  camera.lookAt(drone.position);
  var deltaTime = clock.getDelta();
  if (mixer) {
    mixer.update(deltaTime*drone.position.y*5);
  }


  var targetPosition = new THREE.Vector3();
  targetPosition.copy(drone.position).add(cameraoffset);

  // Interpolate camera position towards the target position
  camera.position.lerp(targetPosition, cameraLerpFactor);

  renderer.render(scene, camera);
  updateInfo();
};

animate();
