var express = require("express");
var bodyParser = require("body-parser");
var Pusher = require("pusher");
var cors = require("cors");

var express = require("express");
var bodyParser = require("body-parser");

var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var pusher = new Pusher({
  appId: "527681",
  key: "23919cee3b1111731271",
  secret: "2f8af21b174ac69b928f",
  cluster: "eu"
});

var username = "";

app.post("/register", function(req, res) {
  username = req.body.username || "Player";
  res.json({ username });
});

app.post("/pusher/auth", function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name.replace(/\s/g, "");
  var presenceData = {
    user_id: username
  };
  var auth = pusher.authenticate(socketId, channel, presenceData);
  res.send(auth);
});

var port = 5000;
app.listen(port);
