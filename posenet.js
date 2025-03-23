let video;
let poseNet;
let poses = [];
var started = false;
let alertSound = new Audio("sounds/alert.mp3");
let alertSound1 = new Audio("sounds/break_reminder.mp3");
// let alertSound2 = new Audio("fallAlert.mp3");
let stareTimer;
const maxStareTime = 5000;

let moveTimer;
const moveCheckTime = 5000;
// let fallTimer;
// const fallTime = 35000;
// let fallAlertActive = false;

// SET UP AND CREATE A CANVAS
function setup() {
  // Create the canvas
  const canvas = createCanvas(600, 400); // or use to make fullscreen canvas window.innerWidth, window.innerHeight, but you should to change the formula in changeFontSize()
  canvas.parent('camera');

  // Video capture from webcam
  video = createCapture(VIDEO);
  video.size(width, height);
  
  if (video == true) {console.log('true');}

  // Create a new poseNet method with a single detection
  // MODEL SECTION: poseNet
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
      poses = results;
  });
  
  // Hide the video element, and just show the canvas
  video.hide();
}

// This function turns on AI
function start() {
  // changes the button to stop 
  select('#startbutton').html('stop')
  // add removeEventListener to avoid listening to multiple events
  document.getElementById('startbutton').removeEventListener('click', start);
  document.getElementById('startbutton').addEventListener('click', stop);
  started = true;
  // alertIsActive = true;
  startStareTimer();  
  loop();
}

// This function stops the experiment
function stop() {
  select('#startbutton').html('start')
  document.getElementById('startbutton').removeEventListener('click', stop);
  document.getElementById('startbutton').addEventListener('click', start);
  removeBlur();
  started = false;
  loop();
  stopStareTimer();
}

function draw() {
  if(started){
    //We use white picture as background. You can comment this line and see what will happen. It's cool glitch effect.
    // image(whitePicture, 0, 0, width, height);
    image(video, 0, 0, width, height);

    drawEyes();
  }
}

// play alert when 
let alertCoolDown = false; // Global variable to track cooldown
function playAlertSound() {
  if (!alertCoolDown){
    alertSound.play();
    alertCoolDown = true;
    setTimeout(() => { alertCoolDown = false; }, 5000); // 5s cooldown
  }
}

function modelReady(){
  // select('#text').html('Hmm... What is it? It’s time to move! AI has turned on. You can insert your text here.')
}

var rightEye, leftEye, rightShoulder, leftShoulder, rightWrist, leftWrist, rightKnee,
    leftKnee, rightAnkle, leftAnkle, distanceEye, defaultRightEyePosition = [],
    defaultLeftEyePosition = [];
// A function to draw ellipses over the detected keypoints
// loop through each detected pose.
// and xtracts keypoints like eyes, shoulders, wrists, knees, and ankles.
function drawEyes()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      rightEye = pose.keypoints[2].position;
      leftEye = pose.keypoints[1].position;
      rightShoulder = pose.keypoints[6].position;
      leftShoulder = pose.keypoints[5].position;
      rightWrist = pose.keypoints[10].position;
      leftWrist = pose.keypoints[9].position;
      rightKnee = pose.keypoints[14].position;
      leftKnee = pose.keypoints[13].position;
      rightAnkle = pose.keypoints[16].position;
      leftAnkle = pose.keypoints[15].position;
      
      //Position of eyes when a human opens experiment page. Start position.
      while(defaultRightEyePosition.length < 1) {
        defaultRightEyePosition.push(rightEye.y);
      }
      
      while(defaultLeftEyePosition.length < 1) {
        defaultLeftEyePosition.push(leftEye.y);
      }

      let shoulderDifference = Math.abs(rightShoulder.y - leftShoulder.y);
      let eyeHeightDifference = Math.abs(rightEye.y - leftEye.y);
      let goodPosture = shoulderDifference < 15 && eyeHeightDifference < 10;

      //Math.abs converts a negative number to a positive one
      if (!goodPosture && Math.abs(rightEye.y - defaultRightEyePosition[0]) > 25) {
        blurScreen();
        playAlertSound();
        startMoveTimer();
        // startFallTimer();
      }
      
      if (Math.abs(rightEye.y - defaultRightEyePosition[0]) < 25) {
        removeBlur();
        // resetFallTimer();
      }
      
      // Only draw an eye is the pose probability is bigger than 0.2
      if (keypoint.score > 0.9 ) {
        fill(0, 255, 0);  
        noStroke();
        ellipse(rightEye.x, rightEye.y, 10, 10);
        ellipse(leftEye.x, leftEye.y, 10, 10);
        console.log(Math.abs(rightEye.y - defaultRightEyePosition[0]));
      }
    }
  }
}

let alertIsActive = false;
function startStareTimer() {
  stareTimer = setTimeout(() => {
    if (!alertIsActive) {
      alertSound1.play();
      alertIsActive = true;
    }
  }, maxStareTime);
}


// function startFallTimer() {
//   fallAlertActive = true;

//   fallTimer = setTimeout(() => {
//     if (fallAlertActive) {
//       alertSound2.play();
//     }
//   }, fallTime);
// }

// function resetFallTimer() {
//   clearTimeout(fallTimer);
//   fallAlertActive = false;
// }

function resetStareTimer() {
  clearTimeout(stareTimer);
  startStareTimer();
}

function startMoveTimer() {
  moveTimer = setTimeout(() => {
    resetStareTimer();
  }, moveCheckTime);
}

function stopStareTimer() {
  clearTimeout(stareTimer);
  alertisActive = false;
}


function blurScreen() { 
  document.body.style.filter = 'blur(5px)';
  document.body.style.transition= '0.9s';
}

function removeBlur() {
  document.body.style.filter = 'blur(0px)';
}
