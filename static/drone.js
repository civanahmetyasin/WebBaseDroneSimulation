
// npm install node-hid ws express express-ws
// node server.js
// http://localhost:8080/

var ws = new WebSocket('ws://localhost:8080');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshNormalMaterial();
var drone = new THREE.Mesh(geometry, material);

scene.add(drone);


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

var animate = function() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();
