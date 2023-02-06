import {me as companion} from  "companion";
import * as messaging from "messaging";

if (!companion.permissions.granted("run_background")) {
  console.warn("Background permissions not enabled.");
}

const MINUTE = 60000;
const SLEEP_INTERVAL = 10 * MINUTE;
boolean isSleep = false;

if(isSleep)
  companion.wakeInterval = SLEEP_INTERVAL;
else
  companion.wakeInterval = .5 * MINUTE;
companion.addEventListener("wakeinterval", doThis);

// Upon waking companion, query the fitbit for relevant data
if (companion.launchReasons.wokenUp) {
  messaging.peerSocket.addEventListener("open", (evt) => {
    console.log("Ready to send or receive messages");
  });
  //print the error message if connection fails. Put device back to sleep
  messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
    break;
  });
  
  //Once connection is achieved, check if user is sleeping. If yes, put companion back to sleep.
  //Companion should be put back to sleep for longer, as to conserve battery life in both fitbit and mobile device
  messaging.peerSocket.addEventListener("message", (evt) => {
    String[] data = evt.data;
  });
  
  
  //set sleep boolean
  if(data[0] == true)
    isSleep = true;
  else
    isSleep = false;
  
  /*
  data[0]: bool: sleeping
  data[1]: int: heart rate
  data[2]: 
  */
  
  
  
}
