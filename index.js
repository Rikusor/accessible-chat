// Setup basic express server
var express = require('express');
var app = express();
var io = require('socket.io')(server);
var path = require('path');
var portList = process.env.PORT || 8080;

// Define the port to run on
app.set('port', portList);

app.use(express.static(path.join(__dirname, 'public')));

// Listen for requests
var server = app.listen(app.get('port'), function() {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  var port = server.address().port;
});

var sentences = [
  'Accessibility is not a barrier to innovation.',
  'Don’t use color as the only visual means of conveying information.',
  'Ensure sufficient contrast between text and its background.',
  'Provide visual focus indication for keyboard focus.',
  'Be careful with forms.',
  'Don’t make people hover to find things.',
  'Provide informative, unique page titles',
  'Use headings to convey meaning and structure',
  'Make link text meaningful',
  'Keep content clear and concise',
  'Write alternative text that provides the information or function of the image',
  'Choose a content management system that supports accessibility',
  'Use headings correctly to organize the structure of your content',
  'Design your forms for accessibility',
  'Use tables for tabular data, not for layout',
  'Ensure that all content can be accessed with the keyboard alone in a logical way',
  'Use ARIA roles and landmarks',
  'Make dynamic content accessible',
  'Screen reader users can use heading structure to navigate content.'
],

//the number of sentences in the array
maxSentences = sentences.length;

//get and return a random sentences from array
function getRandomSentence() {
    //calculate a random index
    var index = Math.floor(Math.random() * (maxSentences - 1));
    //return the random sentence
    return sentences[index];
}

// Chatroom
var botInterval;
var numUsers = 0;
var connections = 0;

io.on('connection', function (socket) {


  if(connections === 0) {
    
    connections++;

    botInterval = setInterval(function sendBotMessage() {
      var botMessage = getRandomSentence();

      socket.broadcast.emit('new message', {
        username: 'Chat bot',
        message: botMessage
      });
    }, 10000);

  }


  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });


  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

});

