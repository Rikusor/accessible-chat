# Accessible chat

Accessible chat example using NodeJs, Socket.IO and Express. Which's logic can be applied to any dynamic chat.

## Testing the chat
### Locally 
```
$ git clone git@github.com:Riku-E/accessible-chat.git
$ cd accessible-chat
$ npm install
$ node index.js
```
### On the web
I have this example running on free dyno at Heroku. Might be slow from time to time if the dyno is sleeping upon connection / down if I reach the maximum up time for the free dyno.
https://accessible-chat.herokuapp.com/

## Problem
You might've heard about amazing role called _"log"_ and attribute _aria-atomic_. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_log_role is a really nice example of how to use it.

In perfect world, this example would be just what you need for chat application. It would alert users using assistive technologies about new messages and ingore the old ones.
```html
<div id="chatArea" role="log">
  <ul id="chatRegion" aria-live="polite" aria-atomic="false">
    <li>Please choose a user name to begin using AJAX Chat.</li>
  </ul>
  <ul id="userListRegion" aria-live="off" aria-relevant="additions removals text">
  </ul>
</div>
```

Unfortunately this does not work, everytime you append elements to elements with role _log_ Assistive Technologies will read everything out loud for you. Meaning long chat history, would always be read out loud to the users from the beggining of time.

This is not suitable solution.

## Solution
I started to test and look into possible solutions to fix this issue. What I came up with, is that I do not try to use these fancy, poorly supported tags, yet.

My HTML mark-up for chat history wrapper is very simple and straight forward;
```html
<div id="chat-history" aria-label="Chat history">
    <ul class="messages">
    </ul>
</div>
```
Each message creates HTML such as;
```html
<li aria-live="polite" class="message">
  <span aria-hidden="true" class="username">Chat bot:</span>
  <span aria-hidden="true" class="message-body">Make link text meaningful</span>
  <!-- This is only appended after 250ms timeout -->
  <span class="is-vishidden">Chat bot: Make link text meaningful</span>
</li>
```
Why do I have 3 spans, you might ask. I could have done this with 1 span of course. I wanted to demonstrate situation where you want to highlight some elements on the history for example here I highlight the names with random colors.

To avoid screenreaders reading one element at the time I create element with only text for screenreaders and hide the visual elements from them.

On the JavaScript side, I first append the visual structure to the chat history without the _is-vishidden_ element. Then I timeout 250ms to put the screenreader append function to the bottom of the stack. Also the timeout gives screenreaders time to recognize the new _polite_ live region on the website.
```js
addMessageElement($messageDiv, options);
setTimeout(function() {
  $messageDiv.append($screenReader);
}, 250);
```

### About me
Hi my name is Riku and I have heart set on creating accessible solutions. I love to solve accessibility issues of complex designs & functionalities. **Accessibility is not a barrier to innovation.**

More about me at https://www.linkedin.com/in/rikuetelaniemi