import clock from "clock";
import { battery } from "power";
import * as document from "document";
import { preferences } from "user-settings";//settings from settings/index.jsx
import * as util from "../common/utils";
import * as messaging from "messaging";
import { HeartRateSensor } from "heart-rate";
import * as hrv from "./HRVCalc.js";
import {BatteryIndicator} from "./BatteryIndicator";
import { vibration } from "haptics";//vibration
import {display} from "display";//(Used for screen wake)
import { BodyPresenceSensor } from "body-presence";//Motion sensor
//import { HRVCalc } from "./HRVCalc.js"
import * as fs from "fs";//file system


// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <text> element
const clockLabel = document.getElementById("clockLabel");
const batteryValue = document.getElementById("batteryValue")
const heartRateHandle = document.getElementById("heartrateLabel");
const hrvHandle = document.getElementById("hrvDisplay");
const backgroundInstanceHandle = document.getElementById("backgroundInstance");
const backgroundHandle = document.getElementById("clockBackground");
const alertWindowHandle = document.getElementById("alertWindow");
const alertWindowTextHandle = document.getElementById("alertWindowText");

const batchSeconds = 5;
const minimumOutliersBeforeAlert = 5;
const mPBListSize = 30; //50 / batchSeconds; //seconds / batchsize to make window size. in this case 50 second window
const HRVListSize = 30;
const hrm = new HeartRateSensor({frequency: 1});
const body = new BodyPresenceSensor();

let Indicator = new BatteryIndicator();
let alertPattern = "alert"
let lastAlertTime = 0;
let alertTimeInterval = 30000;//30 seconds
let outlierCounter = 0;
let currentOutlierStatus = false;
let previousOutlierStatus = currentOutlierStatus;// Nice (:

let warningMessageText = "You may be experiencing some stress. Please de-stress or reach out to someone";
let timestamp = 0;//Used in mute vibration functionality
let heartRate = 0;
let lastOutlierStatusColor = "";

let myHRV = new hrv.HRVCalc();
let batchCounter = 0;

//move to a function
changeAlertWindowParameters("Current HRV Level indicates stress. Try to take a minute to remain calm.");

var rootView = document.getElementById("root");
rootView.addEventListener("click", (evt) =>
{
  ToggleView();
});

if (BodyPresenceSensor) {bodyPresence();}

if (HeartRateSensor) {  processHeartRate();}
else { console.log("This device does NOT have a HeartRateSensor!");}


// Update the clock <text> element every tick with the current time
clock.ontick = (evt) =>
{
  let today = evt.date;
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h")
  {
    // 12h format
    hours = hours % 12 || 12;
  } else
  {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(today.getMinutes());
  clockLabel.text = `${hours}:${mins}`;
  Indicator.draw();
  batteryValue.text = Math.floor(battery.chargeLevel);
  //sendMessage();
}

//Message socket opens
messaging.peerSocket.onopen = () =>
{
  console.log("App Socket Open");
};


//send data
messaging.peerSocket.addEventListener("open", (evt) => {
  sendMessage();
});

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

function sendMessage() {
  // Sample data
  console.log("In the send message function");
  /*
  let list = [];
  for(let i = 0; i < HRVListSize; i++) {
    list.push(Math.round(myHRV.HRVList[i]));
  }
  */

  const data = {
    timestamp: myHRV.timestampList[0],
    heartrate: myHRV.HRList[0],
    currentHRV: myHRV.HRVList[0],
    isOutlier: myHRV.curOutlierStatus,
  }

  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send(data);
  }
}


//Message socket closes
messaging.peerSocket.onclose = () =>
{
  console.log("App Socket Closed");
};

/**
 * Receiving a message from the companion, message likely originated
 * from settings page.
 * @param {*} evt  --JSON formatted message
 */
messaging.peerSocket.onmessage = evt =>
{
  if (evt.data.key === "normalization" ) // changing the alert treshold
  {
    //The z-score coming in from the settings page
    //let data = (JSON.parse(evt.data.newValue)).values[0].value;
    //myHRV.baseLineZScore = data;
  }
  if (evt.data.key === "alertText" ) // changing the alert message
  {
    let data = JSON.parse(evt.data.newValue).name; // new alert message
    let newText = data;
    if(newText.length > 80) // if the new alert message is too long
    {
      warningMessageText = "Maximum alert length is 80 characters";
      changeAlertWindowParameters(warningMessageText);
      //display the change on the watch after the change
      showAlertWindow();
    }
    else
    {
      warningMessageText = newText;
      //set invalid message when bad input is entered. Set a check inside changeAlertWindowParameters? 347
      changeAlertWindowParameters(warningMessageText);
      //display the change on the watch after the change
      showAlertWindow();
    }
  }
};

function showAlertWindow()
{
  vibration.start("nudge");
  alertWindowHandle.style.opacity = 1;
  display.poke();
  setTimeout(() => {
    alertWindowHandle.style.opacity = 0;
  }, 10000);
}

/**
 * Toggles display of the graph/GUI on the second page
 */
function ToggleView()
{
  var view1 = document.getElementById("main");
  var view2 = document.getElementById("graph");
  // Toggle main and graph
  if (view1.style.display === "inline") {
    view1.style.display = "none";
    view2.style.display = "inline";
  } else {
    view1.style.display = "inline";
    view2.style.display = "none";
  }
}

/**
 * Starts the event listener for body presence.
 * Ensures that the heart rate sensor is shut off when the body is not present.
 * And turned back on when it is present.
 */
function bodyPresence()
{
  body.addEventListener("reading", () =>
  {
    if (!body.present)
    {
      stopHeartRateSensor();
    }
    else
    {
      startHeartRateSensor();
    }
  });
  body.start();
}

/**
 * Starts the heart rate sensor
 * Posts "Calculating" message to the screen.
 */
function startHeartRateSensor()
{
  hrm.start();
  calculatingHRVMessage();
}

/**
 * Called when the sensor doesn't detect motion.
 * Stops the Heart Rate sensor and updates the
 * status message to show an off-wrist event
 */
function stopHeartRateSensor()
{
  hrm.stop();
  //Ensures the text doesn't run off the page
  changeHRVLabelParameters("#A0522D", 35);  //sienna color
  hrvHandle.text = "Off Wrist";
}

/**
 * The entry/Driver function for the application to run.
 */
function processHeartRate()
{
  hrm.addEventListener("reading", () =>
  {
    //console.log(hrm.heartRate);
    //This timestamp is the most recent reading from the batch
    timestamp = hrm.timestamp;

    //run through the batch array and average it so we have a single value

    heartRate = hrm.heartRate;
    myHRV.processHRV(heartRate, timestamp);

    sendMessage();
    /*
    batchCounter++;
    if(batchCounter >= HRVListSize) {
      sendMessage();
      batchCounter = 0;
    }
    */

    heartRateHandle.text = heartRate.toFixed(0);

    previousOutlierStatus = currentOutlierStatus;
    currentOutlierStatus = myHRV.getLastOutlierStatus();

    //Check for green outlier zone, & no outlier in the past two readings
    if (previousOutlierStatus === false && currentOutlierStatus === false )
    {
      if(!(lastOutlierStatusColor === "green"))
      {
        greenOutlier();
      }
    }//current outlier count >= minimum outlier count
    else if (outlierCounter >= minimumOutliersBeforeAlert )
    {
      redOutlier();
    }//outlier count < minimum outlier count
    else if (currentOutlierStatus)
    {
      yellowOutlier();
    }
    else
    {
      ridingLineOutlier();
    }

    if (myHRV.getLatestHRV() === 0)
    {
      calculatingHRVMessage();

      // //Watch was reset. Pull from the running variables file for old config data.
      // if(fs.existsSync(runningVarsFileName))
      // {
      //   let fileContents = fs.readFileSync(runningVarsFileName, "json");
      //   if(fileContents != null)
      //     myHRV.setRunningValues(fileContents);
      // }
    }
    else
    {//HRV is calculated
      calculatedHRVMessage();//Update the UI
      // //Update running variable file
      // let varsInJson = myHRV.getRunningValues();
      // fs.writeFileSync(runningVarsFileName, JSON.stringify(varsInJson), "json");
    }
  });
}

/**
 * Status message for Calculating stage.
 * Starts when the heart rate sensor is on
 * but HRV has not yet been calculated.
 */
function calculatingHRVMessage()
{
  changeHRVLabelParameters("#008000", 35);
  hrvHandle.text = "Calculating";
}

/**
 * Displays the HRV to the screen when HRV finally comes in.
 */
function calculatedHRVMessage()
{
  changeHRVLabelParameters(hrvHandle.style.fill, 60);
  try {
    hrvHandle.text = (myHRV.getLatestHRV()).toFixed(0);
  }
  catch(err) {

  }
}

/**
 * Normal zone
 * Green outlier GUI status change.
 */
function greenOutlier()
{
  lastOutlierStatusColor = "green";
  backgroundInstanceHandle.animate("disable");
  changeBackgroundParameters("#000000");
  changeHRVLabelParameters("#008000");
  outlierCounter = 0;
  lastAlertTime = 0;
  alertWindowHandle.style.opacity = 0;
  alertPattern = "alert";//Reset to annoying alert
}

/**
 * Transition from normal to first outlier
 * Yellow outlier GUI status change.
 */
function yellowOutlier()
{
  lastOutlierStatusColor = "yellow";
  outlierCounter++;
  changeHRVLabelParameters("#FFFF00");
}

/**
 * Transition from Outlier to Non-Outlier
 * Orange outlier GUI status change.
 */
function ridingLineOutlier()
{
  lastOutlierStatusColor = "orange";
  changeHRVLabelParameters("#FFFF00");
  outlierCounter = 0;
}

/**
 * Controls all functionality for when in the red outlier stage
 * Red flashing screen, HRV color changes, and Status message.
 */
function redOutlier()
{
  lastOutlierStatusColor = "red";
  if(outlierCounter == minimumOutliersBeforeAlert)
  {
    vibration.start(alertPattern);
    setTimeout(() =>  {vibration.stop()}, 3000);//Vibrate for 3 seconds
    lastAlertTime = timestamp;
    alertPattern = "nudge";
  }//The below code ensures that we only use haptics no more frequent than every alertTimeInterval seconds.
  else if (timestamp - lastAlertTime > alertTimeInterval)//Stops annoyance vibrations
  {
    lastAlertTime = timestamp;
    vibration.start(alertPattern);
  }

  alertWindowHandle.style.opacity = 1;//Change opacit to make status screen visible
  display.poke();//Wake up the screen

  //Flashes the screen (set to second intervals)
  changeHRVLabelParameters("#8B0000");
  changeBackgroundParameters("#FF4500");
  backgroundInstanceHandle.animate("enable");
  setTimeout(() => {
    backgroundInstanceHandle.animate("enable");
  }, 1000);
  setTimeout(() => {
    backgroundInstanceHandle.animate("enable");
  }, 2000);
  setTimeout(() => {
    backgroundInstanceHandle.animate("enable");
  }, 3000);
  setTimeout(() => {
    backgroundInstanceHandle.animate("enable");
  }, 4000);

  outlierCounter++;
}

/**
 * Changes HRVHandle's parameters
 * @param {string} color REQUIRED pass in hex parameters
 * @param {int} fontSize
 * @param {string} text
 */
function changeHRVLabelParameters(color, fontSize = 0, text = "")
{
  if(color === "")
  {
    return;
  }

  if(!(hrvHandle.style.fill === color))
  {
    hrvHandle.style.fill = color;
  }

  if(!(fontSize == 0))
  {
    hrvHandle.style.fontSize = fontSize;
  }

  if(!(text === ""))
  {
    hrvHandle.text = text;
  }
}

/**
 *
 * Changes Background Handle's parameters
 * @param {string} color REQUIRED pass in hex parameters
 * @param {int} fontSize
 * @param {string} text
 */
function changeBackgroundParameters(color, fontSize = 0, text = "")
{
  if(color === "")
  {
    return;
  }
  if(!(backgroundHandle.style.fill === color))
  {
    backgroundHandle.style.fill = color;
  }
  if(!(fontSize == 0))
  {
    backgroundHandle.style.fontSize = fontSize;
  }
  if(!(text === ""))
  {
    backgroundHandle.text = text;
  }
}

/**
 * Changes Alert Window's parameters
 * @param {string} text change the text displayed
 * @param {string} color pass in hex parameters
 * @param {int} fontSize
 */
function changeAlertWindowParameters(text = "", color = "", fontSize = 0)
{
  if(!(color === "") && !(alertWindowTextHandle.style.fill === color))
  {
    alertWindowTextHandle.style.fill = color;
  }
  if(!(fontSize == 0))
  {
    alertWindowTextHandle.style.fontSize = fontSize;
  }
  if(!(text === ""))
  {
    alertWindowTextHandle.text = text;
  }
}

const numPoints = 60; // number of last running HRV values
const graphWidth = 330; // screen size (TODO: use API to get it)
const graphHeight = 300;
var hrvData = []; // Moving window - keeps the last numPoints hrv values
var hrvDataColor = []; // keep lastOutlierStatusColor for each data point
// Graph has 3 lines that are labeled with calculated min, max and average HRV
var labelMin = document.getElementById("labelMin");
var labelMid = document.getElementById("labelMid");
var labelMax = document.getElementById("labelMax");
/*
// Update graph every second
setInterval(updateGraph, 1000);
function updateGraph()
{
  if(myHRV.getLatestHRV() == 0){
    return;
  }
  // Display only whole numbers
  var data = Math.round( myHRV.getLatestHRV());
  if (hrvData.length >= numPoints) {
    hrvData.shift(); // removes first hrv data if we reach the limit of numPoints
    hrvDataColor.shift();
  }
  hrvData.push(data); // stores the last hrv value at the end of the array
  hrvDataColor.push(lastOutlierStatusColor);

  // Calculate min, max and average values of the visible data points only
  var minValue = data-1;
  var maxValue = data+1;
  hrvData.forEach(element => {
    if (element > maxValue)
      maxValue = element;
    if (element < minValue)
      minValue = element;
  });
  var midValue = (minValue + maxValue) / 2;
  // Set labels to siplay the current min, max and average
  labelMin.text = minValue;
  labelMid.text = Math.round(midValue);
  labelMax.text = maxValue;

  const startOffset = 30; // Leaver 30 pixels space for the labels
  const xstep = (graphWidth-startOffset) / numPoints; // increment for x-coordinate

  var lastX = 0;
  var lastY = 0;
  // Update all lines to reflect the hrvData points
  for (let index = 0; index < hrvData.length; index++)
  {
    // vertically points are translated to stretch between min and max
    var y = 15+graphHeight*(maxValue-hrvData[index])/(maxValue-minValue);
    var x = startOffset + index*xstep;
    if (index > 0) {
      var line = document.getElementById(index);
      if (!(hrvDataColor[index] === ""))
        line.style.fill = hrvDataColor[index];
      line.x1 = lastX;
      line.y1 = lastY;
      line.x2 = x;
      line.y2 = y;
    }
    lastX = x;
    lastY = y;
  }
}
*/