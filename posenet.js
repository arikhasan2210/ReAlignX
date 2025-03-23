let video;
let poseNet;
let poses = [];
let started = false;

let alertSound = new Audio("sounds/alert.mp3");
let alertSound_Staring = new Audio("sounds/break_reminder.mp3");
let alertSound_Falling = new Audio("sounds/fallAlert.mp3");

let stareStartTime = null;
let STARE_THRESHOLD = 5000;
let staringTimeout = null;

let previousEyeYAvg = null;
const EYE_STABILITY_THRESHOLD = 5;

let noPersonStartTime = null;
const NO_PERSON_THRESHOLD = 30000;

let personPresent = true;
let fallAlertTriggered = false;
let alertPlayed = false;

let defaultRightEyePosition = [];
let defaultLeftEyePosition = [];

let badPostureCount = 0; 
let countingBadPosture = false;
let postureCooldown = false; 

function setup() {
  const canvas = createCanvas(600, 400);
  canvas.parent('camera');

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', function(results) {
    poses = results;
  });
}

function start() {
  select('#startbutton').html('stop');
  document.getElementById('startbutton').removeEventListener('click', start);
  document.getElementById('startbutton').addEventListener('click', stop);
  started = true;
  loop();
}

function stop() {
  select('#startbutton').html('start');
  document.getElementById('startbutton').removeEventListener('click', stop);
  document.getElementById('startbutton').addEventListener('click', start);
  removeBlur();
  started = false;
  loop();

  if (staringTimeout !== null) {
    clearTimeout(staringTimeout);
    staringTimeout = null;
  }

  stareStartTime = null;
  previousEyeYAvg = null;
  
  if (countingBadPosture) {
    alert(`You had ${badPostureCount} instances of bad posture.`);
    countingBadPosture = false;
    badPostureCount = 0;
  }
}

function draw() {
  if (started) {
    image(video, 0, 0, width, height);
    drawEyes();
    checkStaring();
    checkPersonPresence();
  }
}

function modelReady() {
  console.log("PoseNet model loaded.");
}

function drawEyes() {
  if (poses.length === 0) return;

  let pose = poses[0].pose;

  let rightEye = pose.keypoints[2].position;
  let leftEye = pose.keypoints[1].position;
  let rightShoulder = pose.keypoints[6].position;
  let leftShoulder = pose.keypoints[5].position;

  if (defaultRightEyePosition.length === 0) {
    defaultRightEyePosition.push(rightEye.y);
  }
  if (defaultLeftEyePosition.length === 0) {
    defaultLeftEyePosition.push(leftEye.y);
  }

  let shoulderDifference = Math.abs(rightShoulder.y - leftShoulder.y);
  let eyeHeightDifference = Math.abs(rightEye.y - leftEye.y);
  let goodPosture = shoulderDifference < 15 && eyeHeightDifference < 10;

  if (!goodPosture && Math.abs(rightEye.y - defaultRightEyePosition[0]) > 25) {
    blurScreen();
    playAlertSound();


    if (countingBadPosture && !postureCooldown) {
      badPostureCount++;
      postureCooldown = true;
      setTimeout(() => postureCooldown = false, 2000);
    }
  } else {
    removeBlur();
  }

  fill(0, 255, 0);
  noStroke();
  ellipse(rightEye.x, rightEye.y, 10, 10);
  ellipse(leftEye.x, leftEye.y, 10, 10);
}

function blurScreen() {
  document.body.style.filter = 'blur(5px)';
  document.body.style.transition = '0.9s';
}

function removeBlur() {
  document.body.style.filter = 'blur(0px)';
}

let alertCoolDown = false;
function playAlertSound() {
  if (!alertCoolDown) {
    alertSound.play();
    alertCoolDown = true;
    setTimeout(() => { alertCoolDown = false; }, 5000);
  }
}

function checkStaring() {
  if (!personPresent || poses.length === 0) {
    stareStartTime = null;
    previousEyeYAvg = null;
    return;
  }

  let pose = poses[0].pose;
  let rightEye = pose.keypoints[2].position;
  let leftEye = pose.keypoints[1].position;
  let eyeYAvg = (rightEye.y + leftEye.y) / 2;

  if (!stareStartTime || previousEyeYAvg === null) {
    stareStartTime = millis();
    previousEyeYAvg = eyeYAvg;
  }

  if (Math.abs(eyeYAvg - previousEyeYAvg) < EYE_STABILITY_THRESHOLD) {
    if (millis() - stareStartTime > STARE_THRESHOLD) {
      alertSound_Staring.play();
      stareStartTime = millis();
    }
  } else {
    stareStartTime = millis();
  }

  previousEyeYAvg = eyeYAvg;
}

function checkPersonPresence() {
  if (poses.length === 0) {
    if (!noPersonStartTime) {
      noPersonStartTime = Date.now();
    }

    if (!fallAlertTriggered) {
      setTimeout(() => {
        personPresent = false;
        fallAlertTriggered = true;
        promptForAmbulance();
      }, NO_PERSON_THRESHOLD);
    }
  } else {
    personPresent = true;
    fallAlertTriggered = false;
    noPersonStartTime = null;
  }
}

function promptForAmbulance() {
  if (alertPlayed) return;
  alertPlayed = true;

  alertSound_Falling.play();
  alertSound_Falling.onended = () => {
    setTimeout(() => {
      startSpeechRecognition();
    }, 2000);
  };
}

function startSpeechRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    if (transcript.includes('yes')) {
      window.location.href = "tel:911";
    } else {
      stopProgram();
    }
  };

  recognition.onerror = function(event) {
    stopProgram();
  };
}

function stopProgram() {
  alertSound_Falling.pause();
  alertSound_Falling.currentTime = 0;
  alertPlayed = false;
  stop();
}

function setStaringTime() {
  let stareTime = Number(prompt("Enter the maximum stare time in seconds:"));
  if (!isNaN(stareTime) && stareTime > 0) {
    if (staringTimeout !== null) {
      clearTimeout(staringTimeout);
    }
    staringTimeout = setTimeout(() => {
      alertSound_Staring.play();
    }, stareTime * 1000);
  }
}


function countBadPosture() {
  countingBadPosture = true;
  badPostureCount = 0;
}

