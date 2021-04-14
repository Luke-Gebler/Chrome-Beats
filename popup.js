let startBtn = document.getElementById("start");
let canvas = document.getElementById("canvasCtx");
let canvasCtx = canvas.getContext("2d");

var noteSpeed = 5;
var notes = [];
var recentNotes = 0;

var col1 = "#ffff00";
var col2 = "#0000ff";
var col3 = "#ff0000";
var col4 = "#00ff00";

var darkCol1 = '#4d4d00';
var darkCol2 = '#00004d';
var darkCol3 = '#4d0000';
var darkCol4 = '#004d00';

var widthCol1 = 5;
var widthCol2 = 5;
var widthCol3 = 5;
var widthCol4 = 5;

var key1 = "z";
var key2 = "x";
var key3 = ".";
var key4 = "/";

var streak = 0;

const WIDTH = 400;
const HEIGHT = 575;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const radius = 40;
const padding = 5;
const btnSpaceX = canvas.width / 4;
const btnStartX = canvas.width / 8;
const btnY = canvas.height - radius - padding;

class Note {
  constructor(col, y) {
    this.y = y
    this.col = col;
  }
}

document.addEventListener("keydown", function(e) {
  switch(e.code) {
    case "KeyZ":
      checkNotes(0);
      switchWidth(0, true);
      break;
    case "KeyX":
      checkNotes(1);
      switchWidth(1, true);
      break;
    case "Period":
      checkNotes(2);
      switchWidth(2, true);
      break;
    case "Slash":
      checkNotes(3);
      switchWidth(3, true);
      break;
    default:
      break;
  }
})

document.addEventListener("keyup", function(e) {
  switch(e.code) {
    case "KeyZ":
      switchWidth(0, false);
      break;
    case "KeyX":
      switchWidth(1, false);
      break;
    case "Period":
      switchWidth(2, false);
      break;
    case "Slash":
      switchWidth(3, false);
      break;
    default:
      break;
  }
})

//let stopBtn = document.getElementById("stop");

let options = {
  audio: true,
  video: false,
};

canvasCtx.font = "30px Arial";
var ctx = new AudioContext({ latencyHint: "playback" });
var analyser = ctx.createAnalyser();
window.onload = function () {
  captureAudio();
};


function captureAudio() {
  console.log("Capturing audio");
  chrome.tabCapture.capture(options, function (stream) {
    var output = ctx.createMediaStreamSource(stream);
    //output.connect(ctx.destination);

    output.connect(analyser);

    //console.log(analyser.getByteFrequencyData());

    window.audio = document.createElement("audio");
    window.audio.srcObject = stream;
    window.audio.play();
    
    var lastCheck = 0;
    loop();
    function loop() {
      setTimeout(() => {
        var dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let nonZeros = numNonZeros(dataArray);
        let change = nonZeros - lastCheck;
        lastCheck = nonZeros;
        if(change > 20) {
          createNewNote();
        }
        loop();
      }, 10)
    }

    function createNewNote() {
      console.log("making note");
      colnum = getRandomInt(4);
      let tooClose = false;
      notes.forEach(function(e) {
        if (e.col == colnum) {
          if (e.y < 50) {
            tooClose = true;
          }
        }
      })
      if(!tooClose) {
        makeNote(colnum, 0);
      }
    }
  });
}

makeNote(0, 800);
moveNotes();

function makeNote(col, y) {
  var newNote = new Note(col, y);
  notes.push(newNote)
}

function moveNotes() {
  // recentNotes -= 1;
  // if (recentNotes <= 0) {
  //   if(getRandomInt(100) > 97) {
  //     notes.push(new Note(getRandomInt(4), -radius));
  //     recentNotes = 20;
  //   }
  // }
  update();
}

function update() {
  
  setTimeout(() => {
      clearCanvas();
      drawButtons();
      drawStreak();
      drawNotes();
      moveNotes();
  }, noteSpeed);
}

function drawNotes() {
  let remNotes = [];
  notes.forEach(function(e, i) {
      e.y += 5;
      if(i != 0 && e.y > 625) {
        remNotes.push(i);
      } else {
        canvasCtx.lineWidth = 5;
        let noteX = btnStartX + btnSpaceX * e.col;
        canvasCtx.beginPath();
        canvasCtx.moveTo(noteX + radius, e.y);
        canvasCtx.arc(noteX, e.y, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = colColor(e.col, false);;
        canvasCtx.strokeStyle = colColor(e.col, true);;
        canvasCtx.closePath();
        canvasCtx.fill();
        canvasCtx.stroke();
      }
  })
  remNotes.forEach(function(e, i) {
    if(i != 0) {
      notes.splice(e, 1);
      streak = 0;
    }
  })
}

function drawStreak() {
  canvasCtx.fillStyle = "red";
  canvasCtx.fillText("Streak: " + streak, WIDTH / 2 - 50, HEIGHT / 8);
}


function drawButtons() {

  for (var i = 0; i < 4; i++) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(btnStartX + btnSpaceX * i + radius, btnY);
    canvasCtx.arc(btnStartX + btnSpaceX * i, btnY, radius, 0, 2 * Math.PI);
    canvasCtx.fillStyle = colColor(i, false);
    canvasCtx.strokeStyle = colColor(i, true);
    canvasCtx.lineWidth = getColWidth(i);
    canvasCtx.closePath();
    canvasCtx.fill();
    canvasCtx.stroke();
    canvasCtx.fillStyle = 'black';
    canvasCtx.lineWidth = 5;
  }
  for (var i = 0; i < 4; i++) {
    canvasCtx.fillText(btnText(i), btnStartX + btnSpaceX * i - 8, btnY + 8);
  }
}

function btnText(i) {
  switch(i) {
    case 0:
      return key1;
    case 1:
      return key2;
    case 2:
      return key3;
    default:
      return key4;
  }
}

function checkNotes(col) {
  let flag = false;
  let removeY = 0;
  let removeIndex = 0;
  notes.forEach(function(e, i) { 
    if (e.col == col) {
      if(e.y >= 500) {
        if(e.y > removeY) {
          removeIndex = i;
          removeY = e.y;
        }
        flag = true;
      }
    }
  })
  if(flag) {
    notes.splice(removeIndex, 1);
    streak += 1;
  } else {
    streak = 0;
  }
}

function clearCanvas() {
  canvasCtx.beginPath();
  canvasCtx.fillStyle = "black";
  canvasCtx.rect(0, 0, WIDTH, HEIGHT);
  canvasCtx.closePath();
  canvasCtx.fill();
  let padding = 5;
  for (var i = 0; i < 5; i++) {
    let varPadding = 5;
    if(i == 4) { varPadding = 8; }
    canvasCtx.beginPath();
    canvasCtx.fillStyle = "gray";
    canvasCtx.moveTo(padding, 0);
    canvasCtx.rect(padding + i * btnSpaceX - varPadding, 0, 2, 600);
    canvasCtx.closePath();
    canvasCtx.fill();
  }
}

/*
function draw() {
  canvasCtx.fillStyle = "white";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.lineWidth = 5;
  canvasCtx.strokeStyle = "rgb(0,0,0)";
  canvasCtx.beginPath();

  var bufferLength = analyser.frequencyBinCount;
  var sliceWidth = (WIDTH * 1.0) / bufferLength;
  var x = 0;

  //var dataArray = new Float32Array(analyser.frequencyBinCount);
  var dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  for (var i = 0; i < bufferLength; i++) {
    var curVal = dataArray[i];
    if (curVal > 100) {
      canvasCtx.fillStyle = "green";
    } else if (curVal > 75) {
      canvasCtx.fillStyle = "red";
    } else if (curVal > 50) {
      canvasCtx.fillStyle = "yellow";
    } else if (curVal > 25) {
      canvasCtx.fillStyle = "orange";
    } else {
      canvasCtx.fillStyle = "black";
    }
    var x = i;
    var y = 0;

    canvasCtx.fillRect(x, y, 1, HEIGHT);
  }

  canvasCtx.moveTo(canvas.width, canvas.height / 2);
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}
*/

function numNonZeros(array) {
  var x = 0;
  array.forEach(function(e, i) {
    if(array[i] != 0) { x++; }
  })
  return x;
}

function colColor(col, dark) {
  switch(col) {
    case 1:
      if(!dark) { return col1; }
      else { return darkCol1; }
    case 2:
      if(!dark) { return col2; }
      else { return darkCol2; }
    case 3:
      if(!dark) { return col3; }
      else { return darkCol3; }
    default:
      if(!dark) { return col4; }
      else { return darkCol4; }
  }
}


function changeColColor(col, color) {
  switch(col) {
    case 1:
      col1 = color;
    case 2:
      col2 = color;
    case 3:
      col3 = color;
    default:
      col4 = color;
  }
}

function getColWidth(col) {
  switch(col) {
    case 0:
      return widthCol1;
    case 1:
      return widthCol2;
    case 2:
      return widthCol3;
    default:
      return widthCol4;
  }
}

function switchWidth(col, down) {
  if(down) {
    switch(col) {
      case 0:
        widthCol1 = 10;
        return;
      case 1:
        widthCol2 = 10;
        return;
      case 2:
        widthCol3 = 10;
        return;
      default:
        widthCol4 = 10;
        return;
    }
  } else {
    switch(col) {
      case 0:
        widthCol1 = 5;
        return;
      case 1:
        widthCol2 = 5;
        return;
      case 2:
        widthCol3 = 5;
        return;
      default:
        widthCol4 = 5;
        return;
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/** WAVE LOGIC:
 * 
 * let wave = -1;
 * let up = true;
 *
 * 
 * if (up) {
      if(wave < 3) {
        wave += 1;
      } else {
        wave -= 1;
        up = !up;
      }
    } else {
      if(wave > 0) {
        wave -= 1;
      } else {
        wave += 1;
        up = !up;
      }
    }
 * 

 * notes.push(new Note(wave, -radius));
 * 
 */