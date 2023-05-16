/*
 * Entry point for the companion app
 */
import { inbox } from "file-transfer"
import * as messaging from "messaging";
import { settingsStorage } from "settings";

/*
const websocket = new WebSocket("0.0.0.0.2221");
websocket.addEventListener("open", onOpen);
websocket.addEventListener("close", onClose);
websocket.addEventListener("message", onMessage);
websocket.addEventListener("error", onError);
*/
function onOpen(evt) {
   console.log("CONNECTED");
   websocket.send(message);
}

function onClose(evt) {
   console.log("DISCONNECTED");
}

function onMessage(evt) {
   console.log(`MESSAGE: ${evt.data}`);
}

messaging.peerSocket.addEventListener("message", (evt) => {
  console.error(JSON.stringify(evt.data));
});

function onError(evt) {
   console.error(`ERROR: ${evt.data}`);
}

// Message socket opens
messaging.peerSocket.onopen = () => 
{
  console.log("Companion Socket Open");
  restoreSettings();
};

// Message socket closes
messaging.peerSocket.onclose = () => 
{
  console.log("Companion Socket Closed");
};


// Called when the settings change from the device
settingsStorage.onchange = evt => 
{
  let data = 
  {
    key: evt.key,
    newValue: evt.newValue
  };
  sendVal(data);
};

/**
 * Restore any previously saved settings and send to the device
 * 
 */ 
function restoreSettings() 
{
  for (let index = 0; index < settingsStorage.length; index++) 
  {
    let key = settingsStorage.key(index);
    if (key) 
    {
      let data = 
      {
        key: key,
        newValue: settingsStorage.getItem(key)
      };
      sendVal(data);
    }
  }
}

/**
 * Takes data from the local Companion JavaScript environment and sends it to the watch.
 * @param {BufferedArray??} data 
 */
function sendVal(data) 
{
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) 
    messaging.peerSocket.send(data);
    
  // inbox.addEventListener("newfile", processAllFiles);
  // processAllFiles();
}
