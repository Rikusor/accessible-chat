$(function() {

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 800; // ms
  var COLORS = [
    '#006060', '#20603C', '#345A5E', '#003636',
    '#205D86', '#34385E', '#00202A', '#3D2F5B',
    '#4F5A65', '#634806', '#802200', '#550000'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.username-input'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.input-message'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var botEnabled = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      // Tell the server your username
      socket.emit('add user', username);
    } else {
      $('#screen-reader-events').text('Invalid user name, joining failed.');
      resetScreenReaderEvent();
    }
  }

  function resetScreenReaderEvent() {
    // Reset text after screenreaders noticed assertive new text (They will read the text until end)
    setTimeout(function resetEvent(){
      $('#screen-reader-events').text('');
    }, 250);
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li aria-live="polite">').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {

    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};

    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var time = new Date();
    var displayedTime = time.getHours() + ":" + time.getMinutes();

    var $usernameDiv = $('<span>').attr({
      'aria-hidden': 'true',
      class: 'username'
    }).html(data.username +' <time datetime="'+displayedTime+'">' + displayedTime + '</time>:')
      .css('color', getUsernameColor(data.username));

    var $messageBodyDiv = $('<span aria-hidden="true" class="message-body">')
      .text(data.message);

    var $screenReader = $('<span class="is-vishidden">'+data.username+' at '+displayedTime+': ' + data.message + '</span>')

    var typingClass = data.typing ? 'typing' : '';

    var ariaLive = 'polite';
    if( data.username === username ) {
      ariaLive = 'off';

      $('#screen-reader-events').text('Message sent!');

      resetScreenReaderEvent();
    }

    var $messageDiv = $('<li aria-live="' + ariaLive + '" class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);

    setTimeout(function() {
      $messageDiv.append($screenReader);
    }, 250);

  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    var chatHistory = document.getElementById("chat-history");
        chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events
  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  $('#message-input-form').on('submit', function(event) {
    event.preventDefault();
    var e = jQuery.Event('keydown');
        e.which = 13;
        e.keyCode = 13;
    $window.trigger(e);
  });

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    
    var message = '';

    if (data.numUsers === 1) {
      message += "You're the only participant. You will be receiving messages from a bot for demoing purposes.";
      botEnabled = true;
    } else {
      message += "There are " + data.numUsers + " participants. Occasionally a bot will send messages to chat, for demoing purposes.";
      botEnabled = false;
    }

    $('#participant-amount').text(message);
    setTimeout(function() {
      $('#welcome-message').focus();
    }, 250);

  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
  });

});
