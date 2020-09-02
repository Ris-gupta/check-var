var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
mongoose.promise = Promise;
var dbUrl = process.env.DB_URL
  

var Message = mongoose.model("Message", {
  name: String,
  message: String,
});

app.get("/messages", (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  });
});
app.post("/messages", async (req, res) => {
  try {
    var message = new Message(req.body);
    var savedMessage = await message.save();
    var censored = await Message.findOne({ message: "badword" });

    if (censored) {
      await Message.deleteOne({ _id: censored.id }, (err) => {
        console.log("we removed word");
      });
    } else {
      io.emit("message", req.body);
      res.sendStatus(200);
    }
  } catch (error) {
    res.status(500);
    return console.error(error)
  } finally {
      console.log('message post point was called')
  }
});

mongoose.connect(dbUrl, { useNewUrlParser: true }, (err) => {
  console.log("data base connected", err);
});
http.listen(process.env.PORT, () => {
  console.log("listening", process.env.PORT);
  console.log(dbUrl)
});
