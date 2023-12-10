# WebBaseDroneSimulation

Controller Information

C button changes camera to droneCamera
M button changes camera to droneCameraTwo which is looking the bomb
V button allows to you change camera vision with controller
B button relase the bomb
# Three.js Drone Simulation

This repository contains a Three.js project that simulates a 3D drone environment. It leverages modern web technologies to create a realistic and interactive drone simulation. The project is an excellent demonstration of Three.js capabilities in rendering 3D graphics in a web browser.

## Features

- Realistic 3D drone model
- Interactive controls for drone navigation
- Dynamic environment with adjustable sky, lighting, and terrain
- Real-time rendering with Three.js

## Getting Started

To run this project locally, follow these steps:

1. Clone the repository to your local machine.
2. Ensure you have Node.js installed.
3. Install the dependencies: `npm install node-hid ws express express-ws`
4. Start the server: `node server.js`
5. Open your web browser and navigate to `http://localhost:8080/`.

## Code Overview

The main components of the code include:

- **Drone Model Loading**: Using GLTFLoader to load the 3D drone model.
- **Environment Setup**: Creating a dynamic sky, sun positioning, and realistic terrain.
- **Drone Controls**: Handling drone movement based on WebSocket data.
- **Rendering Loop**: Continuously rendering the scene with updated drone positions and environment settings.


![Screenshot 2023-12-10 222911](https://github.com/civanahmetyasin/WebBaseDroneSimulation/assets/69795597/8d44d699-b774-4e23-b3f5-eb09acfcb3a8)



Info: Bomb animation play speed changes with dron's y location.
