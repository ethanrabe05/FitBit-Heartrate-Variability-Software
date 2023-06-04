/*
 * Entry point for the companion app
 */
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



messaging.peerSocket.addEventListener("message", (evt) => {
  console.log(JSON.stringify(evt.data));
  storedata(JSON.stringify(evt.data)).then((value) => {
    console.log(value);
  }); //WIP
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
      }
      console.log(data)
      storedata(data);
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

/*
 * Takes data that has been recieved from the watch and tranfers it
 * to a webserver via http POST.
 */
async function storedata(data) {
  console.log(data)

  var myJSONObject = {
    "hr": data.hr,
    "hrv": data.hrv,
    "outlierStatus": data.outlierStatus
  };
  var request = {
    method: "POST",
    //json: false,   // <--Very important!!!
    body: myJSONObject
  }

  fetch("http://18.191.122.236/downloads.php", request)
      .then(function(response) {
        console.log('fetch fulfilled: fileName=${fileName}; ok=${response.ok}; status=${response.status}; sText=${response.statusText}');
      })
}


//SMTP mailing option
/*
function sendMail() {
  smtpProtocol = mailer.createTransport({
    service: "Gmail",
    auth: {
      user: "hrvnotificationmailer@gmail.com",
      pass: "HRVM@!ler"
    }
  });

  var mailoption = {
    from: "hrvnotificationmailer@gmail.com",
    to: "ethanrabe05@gmail.com",
    subject: "Test Mail",
    html: 'Good Morning!'
  }

  smtpProtocol.sendMail(mailoption, function(err, response){
    if(err) {
      console.log(err);
    }
    console.log('Message Sent' + response.message);
    smtpProtocol.close();
  });
}
 */



