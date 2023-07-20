
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
var mixer_two;

// gltf loader with draco decoder
var drone_two;
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
      drone_two = drone.clone();
      drone_two.position.set(10, 0, 0);
      scene.add(drone_two);
      
      scene.add(drone);

        // Create an AnimationMixer instance and set it to the drone
        mixer = new THREE.AnimationMixer(drone);
        mixer_two = new THREE.AnimationMixer(drone_two);

        // Get all animations from the glTF model
        gltf.animations.forEach((clip) => {
            // Create an AnimationAction for each animation and play it
            mixer.clipAction(clip).play();
            mixer_two.clipAction(clip).play();
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
  
  camera.position.set(0, 5, -10);
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();



var controlSignal = 0;
var controlSignalx = 0;
var controlSignalz = 0;

//ws.onmessage =
//    function(event) {
//  var data = JSON.parse(event.data);
//  var roll = scale(data.roll, -127, 127, -Math.PI, Math.PI);
//  var signalx = scale(data.roll, -127, 127, -3, 3);
//  var pitch = scale(data.pitch, -127, 127, -Math.PI, Math.PI);
//  var signalz = scale(data.pitch, -127, 127, -3, 3);
//  var yaw = scale(data.yaw, -127, 127, -Math.PI, Math.PI);
//  desiredAltitude = scale(data.throttle, -127, 127, -3, 3);
//
//  if (desiredAltitude <= 0) {
//    desiredAltitude += 3;
//  } else {
//    desiredAltitude -= 3;
//  }
//
//  if (signalx <= 0) {
//    signalx += 3;
//  } else {
//    signalx -= 3;
//  }
//
//  if (signalz <= 0) {
//    signalz += 3;
//  } else {
//    signalz -= 3;
//  }
//
//
//  controlSignal += desiredAltitude * 0.1;
//
//  controlSignalx += signalx * -0.1;
//  controlSignalz += signalz * -0.1;
//
//  drone.rotation.x = pitch;
//  drone.rotation.y = yaw;
//  drone.rotation.z = roll * -1;
//
//  drone.position.y = controlSignal * -1;
//  drone.position.x = controlSignalx * -1;
//  drone.position.z = controlSignalz * -1;
//}
//
//
// import the fs module at the beginning of your file

// read the JSON file every second
var controlIndex = 0; // Keep track of which control we're on
var targetPosition = new THREE.Vector3(); // Declare it outside the interval to avoid re-declarations
var lerpFactor = 0.05;  // Adjust this value as needed for smoothness
var interpolatedControls;  // Will hold the interpolated controls

// Function to interpolate control data
function interpolateData(data, steps) {
  const interpolatedData = [];

  for (let i = 0; i < data.length - 1; i++) {
    const start = data[i];
    const end = data[i + 1];

    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const interpolatedControl = {
        roll: start.roll + t * (end.roll - start.roll),
        pitch: start.pitch + t * (end.pitch - start.pitch),
        yaw: start.yaw + t * (end.yaw - start.yaw),
        throttle: start.throttle + t * (end.throttle - start.throttle)
      };

      interpolatedData.push(interpolatedControl);
    }
  }

  return interpolatedData;
}

// Fetch the controls and interpolate them
fetch('/controls.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(controlsArray => {
    interpolatedControls = interpolateData(controlsArray, 10);
  })
  .catch(error => {
    console.error('Failed to fetch file:', error);
  });

// Inside the setInterval function
setInterval(() => {
  if (!drone || !interpolatedControls) return; // Don't update if drone model has not loaded yet or controls are not ready yet
  
  if (controlIndex >= interpolatedControls.length) return;


  // Use the current control and then move to the next one
  const controls = interpolatedControls[controlIndex];
  controlIndex = (controlIndex + 1) % interpolatedControls.length;
  controlIndex++; // This stops the controls from looping
  console.log(controlIndex);


  var roll = scale(controls.roll, -127, 127, -Math.PI, Math.PI);
  var signalx = scale(controls.roll, -127, 127, -3, 3);
  var pitch = scale(controls.pitch, -127, 127, -Math.PI, Math.PI);
  var signalz = scale(controls.pitch, -127, 127, -3, 3);
  var yaw = scale(controls.yaw, -127, 127, -Math.PI, Math.PI);
  var throttle = scale(controls.throttle, -127, 127, -3, 3);
  var targetRotation = new THREE.Euler(pitch, yaw, roll * -1, 'YXZ');
  targetPosition.set(signalx * -1, throttle * 1, signalz * -1);

  // Apply the controls by lerping each component separately
  drone_two.rotation.x += (targetRotation.x - drone_two.rotation.x) * lerpFactor;
  drone_two.rotation.y += (targetRotation.y - drone_two.rotation.y) * lerpFactor;
  drone_two.rotation.z += (targetRotation.z - drone_two.rotation.z) * lerpFactor;
  console.log(drone_two.rotation.x, drone_two.rotation.y, drone_two.rotation.z);

  drone_two.position.lerp(targetPosition, lerpFactor); // You can still use lerp for position
}, 100);
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

var cameraoffset = new THREE.Vector3(0, 10, -10);
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
    mixer_two.update(deltaTime*drone_two.position.y*5);
  }


  var targetPosition = new THREE.Vector3();
  targetPosition.copy(drone.position).add(cameraoffset);

  // Interpolate camera position towards the target position
  camera.position.lerp(targetPosition, cameraLerpFactor);

  renderer.render(scene, camera);
  updateInfo();
};

animate();
