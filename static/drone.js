
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

ws.onmessage =
    function(event) {
  var data = JSON.parse(event.data);
  var roll = scale(data.roll, -127, 127, -Math.PI, Math.PI);
  var pitch = scale(data.pitch, -127, 127, -Math.PI, Math.PI);
  var yaw = scale(data.yaw, -127, 127, -Math.PI, Math.PI);
  var throttle = scale(data.throttle, -127, 127, -6, 32);

  drone.rotation.x = pitch;
  drone.rotation.y = yaw;
  drone.rotation.z = roll * -1;
  drone.position.y = throttle * -1;
}


function scale(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

var animate = function() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();
