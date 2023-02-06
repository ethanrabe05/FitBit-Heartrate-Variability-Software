import * as messaging from "messaging";

messaging.peerSocket.addEventListener("open", (evt) => {
  sendMessage();
});

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

function sendMessage() {
  // Sample data
  const data = {
    isSleep: false,
    hr: 
  }

  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send(data);
  }
}
