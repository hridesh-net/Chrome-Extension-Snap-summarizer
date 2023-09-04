'use strict';

import './popup.css';

let summary;
const elem = document.getElementById("summary") 

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.content) {
    console.log("Received content for tab ", message);
    summary = message;
    elem.innerHTML += message;
  }
});
console.log(summary)