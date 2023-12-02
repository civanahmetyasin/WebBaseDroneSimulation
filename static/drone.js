
// npm install node-hid ws express express-ws
// node server.js
// http://localhost:8080/
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/DRACOLoader.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/RGBELoader.js';
import { Sky } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Sky.js';
var ws = new WebSocket('ws://localhost:8080');

var scene = new THREE.Scene();
// Setup Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 5;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.5;

// Set up the sun position
const sun = new THREE.Vector3();

function updateSunPosition() {
    const theta = Math.PI * (0.45 - 0.5);
    const phi = 2 * Math.PI * (0.25 - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
}

updateSunPosition();
var camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var mixer;

// gltf loader with draco decoder
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/models/cloud_layers_2k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
});

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
          //child.material.color.setHex(0xffffff, 1);
        }
      });

      scene.add(drone);
      mixer = new THREE.AnimationMixer(drone);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    },
    undefined,
    function(error) {
      console.error(error);
    });


function scale(value, inMin, inMid, inMax, outMin, outMid, outMax) {
  if (value <= inMid) {
    return (value - inMin) * (outMid - outMin) / (inMid - inMin) + outMin;
  } else {
    return ((value - inMid) * (outMax - outMid) / (inMax - inMid) + outMid);
  }
}

var scan_two;
var scan_three;
var last_yaw = 0;
var camera_yaw = 0;
var camera_pitch = 0;
var euler = new THREE.Euler(0, 0, 0, 'YXZ');  // 'YXZ' dönüş sırasını belirler
var quaternion = new THREE.Quaternion();
var pitch = 0;
var desiredAltitude = 0;

// Geçmiş hız değerlerini saklamak için değişkenler
var lastPitchSpeed = 0;
var lastRollSpeed = 0;
var lastThrottleSpeed = 0;

var drone_at_ground_last_x = 0;
var drone_at_ground_last_z = 0;
// add texture
var texture = new THREE.TextureLoader().load('/models/ground.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.castShadow = false;
texture.repeat.set(5, 5);

loader.load('/models/mount.glb', function(gltf) {
  var mount = gltf.scene;
  mount.position.y = 5;
  mount.position.x = -120;
  mount.position.z = 0;
  mount.scale.set(50,50,50);
  mount.traverse(function(child) {
    if (child.isMesh) {
      child.material.map = texture;
      child.castShadow = false;
      child.receiveShadow = false;
      child.material.color.setHex(0xffffff, 1);
      child.material.side = THREE.DoubleSide;
  
    }

  });

  scene.add(mount);


},
undefined,

function(error) {
  console.error(error);
}
);
loader.load(
    '/models/scan.gltf',
    function(gltf) {
      var scan = gltf.scene;
      scan.position.y = 0;
      scan.position.x = -20;
      scan.position.z = 20;
      scan.rotation.y = Math.PI/2;
      //scene.add(scan);

      scan.traverse(function(child) {
        if (child.isMesh) {
          child.material.color.setHex(0xaaaaaa, 0.5);
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scan_two = scan.clone();
      scan_two.position.set(10, 0, 30); 
      //scene.add(scan_two);

      scan_three = scan.clone();
      scan_three.position.set(-18, 0, 60);
      scan_three.scale.set(0.7, 0.7, 0.7);
      //scene.add(scan_three);
        

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
  //scene.add(new THREE.GridHelper(1000, 100, 0x000000, 0x000000));
  scene.add(new THREE.AxesHelper(1000));
 
  scene.fog = new THREE.Fog(0xCCBDC5, 30, 120);
 
  camera.position.set(0, 5, -10);
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  var bombDropped = false;
  var bombAnimation = false;


  var joystickVertical = document.querySelector('#joystick-vertical');
  var joystickHorizontal = document.querySelector('#joystick-horizontal');
  ws.onmessage =
      function(event) {
    var data = JSON.parse(event.data);
    // abs


    if (data.pitch < 0) {
      data.pitch += 256;
    }
    if (data.roll < 0) {
      data.roll += 256;
    }
    if (data.yaw < 0) {
      data.yaw += 256;
    }
    if (data.throttle < 0) {
      data.throttle += 256;
    }

    // Ölçeklendirme işlemleri
    var roll = scale(data.roll, 241, 134, 19, Math.PI / 4, 0, -Math.PI / 4);
    pitch = scale(data.pitch, 17, 134, 243, Math.PI / 4, 0, -Math.PI / 4);
    var yaw = scale(data.yaw, 19, 134, 244, Math.PI, 0, -Math.PI);
    desiredAltitude = scale(data.throttle, 20, 134, 244, 1, 0, -1);

    // Yaw değerini last_yaw'a ekleyerek güncelle
    last_yaw += yaw * 0.01;

    // Yatay hareket hesaplama
    if (last_yaw > Math.PI) {
      last_yaw -= 2 * Math.PI;
    }
    if (last_yaw < -Math.PI) {
      last_yaw += 2 * Math.PI;
    }


    euler.set(pitch, last_yaw, roll);
    quaternion.setFromEuler(euler);
    drone.quaternion.copy(quaternion);

    var forward = new THREE.Vector3(0, 0, 1);
    var right = new THREE.Vector3(-1, 0, 0);
    var up = new THREE.Vector3(0, 1, 0);

    forward.applyQuaternion(quaternion);
    right.applyQuaternion(quaternion);
    up.applyQuaternion(quaternion);


    var pitchSpeed = lastPitchSpeed * 0.99 + pitch * 0.01;
    var rollSpeed = lastRollSpeed * 0.99 + roll * 0.01;
    var throttleSpeed = lastThrottleSpeed * 0.8 + desiredAltitude * 0.2;

    // Güncellenmiş hız değerleriyle drone pozisyonunu güncelle
    drone.position.add(forward.multiplyScalar(pitchSpeed));
    drone.position.add(right.multiplyScalar(rollSpeed));
    drone.position.add(up.multiplyScalar(throttleSpeed));

    lastPitchSpeed = pitchSpeed;
    lastRollSpeed = rollSpeed;
    lastThrottleSpeed = throttleSpeed;

    if (drone.position.y < 0) {
      drone.position.y = 0;
      drone.position.x = drone_at_ground_last_x;
      drone.position.z = drone_at_ground_last_z;

      drone.rotation.x = 0;
      drone.rotation.z = 0;

      drone.traverse(function(child) {
        if (child.isMesh) {
          child.material.color.setHex(0xff0000, 1);
        }
      });
    } else {
      drone_at_ground_last_x = drone.position.x;
      drone_at_ground_last_z = drone.position.z;

      drone.traverse(function(child) {
        if (child.isMesh) {
          child.material.color.setHex(0xffffff, 1);
        }
      });
    }


    var scaledRoll = scale(roll, Math.PI / 4, 0, -Math.PI / 4, 97, 60, -2);
    var scaledPitch = scale(pitch, Math.PI / 4, 0, -Math.PI / 4, 20, 60, 101);

    var scaledYaw = scale(yaw, Math.PI, 0, -Math.PI, 0, 60, 120);
    var scaledThrottle = scale(desiredAltitude, 1, 0, -1, 0, 60, 120);

    joystickHorizontal.style.left = `${scaledRoll}px`;
    joystickHorizontal.style.top = `${scaledPitch}px`;

    joystickVertical.style.left = `${scaledYaw}px`;
    joystickVertical.style.top = `${scaledThrottle}px`;

    if (data.leftSwitch == -1) {
      bombDropped = true;
      bombAnimation = true;
    }


    if (data.leftSwitch == 0) {
      bombDropped = false;
      bombAnimation = false;
    }

    if (data.gear > 10 && data.gear < 20) {
      droneView = true;
      bottomView = false;
      fix_camera = false;
    } else if (data.gear > 20 && data.gear < 50) {
      bottomView = true;
      droneView = false;
      fix_camera = false;
    } else if (data.gear > 50 && data.gear < 70) {
      droneView = false;
      bottomView = false;
      fix_camera = true;
    } else if (data.gear > 70 && data.gear < 90) {
      fix_camera = true;
      droneView = false;
      bottomView = false;
    } else if (data.gear > 90 && data.gear < 110) {
      fix_camera = false;
      droneView = false;
      bottomView = false;
    }
  }

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



  var speed = 0;
  var lastPosition = new THREE.Vector3();

  function updateInfo() {
    var speedElement = document.getElementById('speed');
    var positionElement = document.getElementById('position');

    // Calculate the speed as the distance travelled since last frame
    var distance = drone.position.distanceTo(lastPosition);
    speed = distance / (1 / 60);  // Assuming animate is running at 60 FPS
    lastPosition.copy(drone.position);

    speedElement.innerText = 'Speed: ' + speed.toFixed(2);
    positionElement.innerText = 'Position: (' + drone.position.x.toFixed(2) +
        ', ' + drone.position.y.toFixed(2) + ', ' +
        drone.position.z.toFixed(2) + ')';
  }

var cameraoffset = new THREE.Vector3(10, 10, -10);
var cameraLerpFactor = 0.005; // control the speed of interpolation (0.05 is a good starting value)


// .joystick

var clock = new THREE.Clock();

var droneCamera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000);
droneCamera.position.set(0, 2, -5); // Position the droneCamera at the back of the drone

var droneCameraTwo = droneCamera.clone();


var droneView = false;  // By default, the view is set to the main camera
var bottomView = false;  // View from the bottom of the drone
var fix_camera = false;  // View from the bottom of the drone

window.addEventListener('keydown', function(event) {
  // If key pressed is 'C' or 'c'
  if (event.key === 'C' || event.key === 'c') {
    droneView = !droneView;  // Toggle the drone view
    bottomView = false;  // If drone view is active, bottom view must be deactivated
  }
  // If key pressed is 'M' or 'm'
  else if (event.key === 'M' || event.key === 'm') {
    bottomView = !bottomView;  // Toggle the bottom view
    droneView = false;  // If bottom view is active, drone view must be deactivated
  }
});

var droneCameracontrol = { pitch: 0, yaw: 0 };  // Control object to store pitch and yaw values

window.addEventListener('keydown', function(event) {
  if (event.key === 'V' || event.key === 'v') {
    // If drone view is active, update the droneCamera's rotation based on the control values
    if (droneView) {
      droneCamera.rotation.x += droneCameracontrol.pitch;  // Rotate around the x-axis
      droneCamera.rotation.y += droneCameracontrol.yaw;  // Rotate around the y-axis
    }
  } 
});

var bomb;
var mixerbomb;
loader.load(
    '/models/bomb2.glb',
    function(gltf) {
      bomb = gltf.scene;
      bomb.scale.set(0.1,0.1,0.1);
      bomb.position.set(0, -0.2, 0); //initial position at the origin
      scene.add(bomb);

          // Create an AnimationMixer instance and set it to the drone
          mixerbomb = new THREE.AnimationMixer(bomb);
  
          // Get all animations from the glTF model
          gltf.animations.forEach((clip) => {
              // Create an AnimationAction for each animation and play it
              mixerbomb.clipAction(clip).play();
          });

    },
    undefined,
    function(error) {
      console.error(error);
    });



window.addEventListener('keydown', function(event) {
  // If key pressed is 'B' or 'b'
  if (event.key === 'B' || event.key === 'b') {
    bombDropped = true;
    bombAnimation = true;
  }
});


// Inside the animate function
var animate = function() {
  requestAnimationFrame(animate);


  var activeCamera;
  if (droneView) {
    activeCamera = droneCamera;
  } else if (bottomView) {
    activeCamera = droneCameraTwo;
  } else {
    activeCamera = camera;
  }

  if (droneView) {
    // Kameranın drone ile aynı konumda olmasını sağla
    droneCamera.position.copy(drone.position);

    // Kameranın rotasyonunu ayarla
    var cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    var cameraQuaternion = new THREE.Quaternion();

    // Kameranın yönünü, özellikle pitch ve yaw açılarını kullanarak ayarla
    // Burada, drone'un yaw açısını ve isteğe bağlı olarak pitch açısını
    // kullanabilirsiniz Roll genellikle gimbal kameralarda stabilize edilir ve
    // değiştirilmez
    camera_yaw = last_yaw + Math.PI;
    cameraEuler.set(
        0, camera_yaw,
        0);  // Sadece yaw açısını kullanarak kamera rotasyonu
    cameraQuaternion.setFromEuler(cameraEuler);

    // Kameranın quaternionunu ayarla
    droneCamera.quaternion.copy(cameraQuaternion);

    // Kamera için ek ayarlamalar
    // Örneğin, kamerayı biraz geri ve yukarı taşıyarak drone'u görüş alanında
    // tutabilirsiniz
    droneCamera.position.add(
        new THREE.Vector3(0, -0.3, 0.8).applyQuaternion(drone.quaternion));

  } else if (bottomView) {
    droneCameraTwo.position.copy(drone.position);
    droneCameraTwo.position.y -= 0.2;  // Position camera above the drone
    droneCameraTwo.position.z -= 0.2;  // Position camera at the back of the
    // Kameranın rotasyonunu ayarla
    var cameraEulerBomb = new THREE.Euler(0, 0, 0, 'YXZ');
    var cameraQuaternionBomb = new THREE.Quaternion();

    camera_yaw = last_yaw + Math.PI;
    camera_pitch = -Math.PI / 2;
    cameraEulerBomb.set(
        camera_pitch, camera_yaw,
        0);  // Sadece yaw açısını kullanarak kamera rotasyonu
    cameraQuaternionBomb.setFromEuler(cameraEulerBomb);

    // Kameranın quaternionunu ayarla
    droneCameraTwo.quaternion.copy(cameraQuaternionBomb);
  } else if (fix_camera) {
    camera.position.set(0, 5, -10);
    camera.lookAt(drone.position);
  } else {
    camera.lookAt(drone.position);
  }

  var deltaTime = clock.getDelta();
  if (mixer) {
    mixer.update(scale(desiredAltitude, -1, 0, 1, 0, 0.5, 5));
  }

  var targetPosition = new THREE.Vector3();
  targetPosition.copy(drone.position).add(cameraoffset);

  // Interpolate camera position towards the target position
  if (!droneView) {
    camera.position.lerp(targetPosition, cameraLerpFactor);
  }

  if (!bombDropped) {
    bomb.position.copy(drone.position);
    bomb.position.y -= 0.4;
    bomb.position.z -= 0.1;
    bomb.quaternion.copy(drone.quaternion);
  }

  if (bombDropped) {
    bomb.position.y -= 0.1;  // Change this value to control the speed of the bomb
    if (bomb.position.y <= 0) {
      bomb.position.y = 0;
    }
  }

  if (bomb.position.y == 0 && bombAnimation) {
    mixerbomb.update(deltaTime * drone.position.y * 0.5);
  } else {
    mixerbomb.update(0);
  }

  renderer.render(scene, activeCamera);
  updateInfo();
};

animate();




