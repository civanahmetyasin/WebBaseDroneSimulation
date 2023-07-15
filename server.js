var HID = require('node-hid')
var WebSocket = require('ws')
var express = require('express')
var app = express()
var expressWs = require('express-ws')(app)

app.use(express.static('static'))

app.ws('/', function(ws, req) {
  var devices = HID.devices()
  devices.forEach(function(device) {
    if (device.vendorId === 1539  && device.productId === 6675) {
      var hidDevice = new HID.HID(device.path)

      hidDevice.on('data', function(data) {
        var roll = data.readInt8(0)
        var pitch = data.readInt8(1)
        var yaw = data.readInt8(5)
        var throttle = data.readInt8(2)
        console.log(roll, pitch, yaw, throttle)
        //console.log(data)

        ws.send(JSON.stringify({ roll: roll, pitch: pitch, yaw: yaw, throttle: throttle }))
      })

      hidDevice.on('error', function(error) {
        console.log(error)
      })
    }
  })
})

// Yeni GET yönlendirmesi
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.listen(8080)
