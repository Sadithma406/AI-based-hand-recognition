import * as imports from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";


const mainContainer = document.getElementById("main-container");
const endContainer = document.getElementById("end-container");
const questionContainer = document.getElementById("questions-video");
const homeContainer = document.getElementById("home-container");
const question = document.getElementById("question");
const answer1 = document.getElementById("answer1");
const answer2 = document.getElementById("answer2");
const answer3 = document.getElementById("answer3");
const answer4 = document.getElementById("answer4");
const timer = document.getElementById("timer");
const score = document.getElementById("score");
const restart = document.getElementById("restartButton");

const video = document.getElementById("webcam");
const canvas = document.getElementById("output_canvas");
const ctx = canvas.getContext("2d");
const enableBtn = document.getElementById("webcamButton");
const drawUtils = new imports.DrawingUtils(ctx);

let index = 0;
let timeLeft = 5;
let timerInterval = null;
let fingerCount = 0;
let correctCount = 0;
let handLandmarker;

let data = [];
async function getQuestions(){
  try {
    const response = await fetch("data.j  son").then(res => res.json());
    data = response;
    showQuestion(0);
  } catch (error) {
    console.error("Error fetching questions: ", error);
  }
}
async function loadModel() {
  try {
    const vision = await imports.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await imports.HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: "hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
    enableBtn.disabled = false;
  } catch (error) {
    console.log("Error loading the model: ", error);
  }
}
enableBtn.addEventListener("click", async () => {
  try {
    homeContainer.style.display = "none";
    questionContainer.style.display = "block";
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    enableBtn.disabled = true;
    startQuizTimer();
  } catch (error) {
    console.log("Error starting camera: ", error);
  }
});

video.addEventListener("play", predictLoop);
function predictLoop() {
  if (handLandmarker) {
    const detections = handLandmarker.detectForVideo(video, performance.now());
    console.log(detections)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let frameFilter = 0;
    if (detections.landmarks && detections.landmarks.length > 0) {
      for (const landmarks of detections.landmarks) {
        frameFilter += upFingers(landmarks);
        drawUtils.drawLandmarks(landmarks, { color: "blue", radius: 5 });
        drawUtils.drawConnectors(landmarks, imports.HandLandmarker.HAND_CONNECTIONS, { color: "green", lineWidth: 2 });
      }
    }
    fingerCount = frameFilter;
  }
  requestAnimationFrame(predictLoop);
}
function upFingers(landmarks) {
  const fingers = [
    { tip: 8, mid: 6 },
    { tip: 12, mid: 10 },
    { tip: 16, mid: 14 },
    { tip: 20, mid: 18 }
  ]
  let count = 0;
  for (const finger of fingers) {
    if (landmarks[finger.tip].y < landmarks[finger.mid].y) {
      count ++;
    }
  }
  return count;
}
function startQuizTimer() {
  showQuestion(index);
  if (timer) {
    timer.innerHTML = timeLeft;
  }

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) {
      if (String(fingerCount) === String(data[index].correct)) {
        correctCount++;
      }
      fingerCount = 0;
      index++;
      if (index >= data.length) {
        clearInterval(timerInterval);
        endQuiz();
        return;
      }
      timeLeft = 5;
      showQuestion(index);
    }
    if (timer) {
      timer.innerHTML = timeLeft;
    }
  }, 1000);
}

function showQuestion(index) {
  if (data[index]) {
    const item = data[index];
    question.innerHTML = item.question;
    answer1.innerHTML = item.answers[0];
    answer2.innerHTML = item.answers[1];
    answer3.innerHTML = item.answers[2];
    answer4.innerHTML = item.answers[3];
  }
}
function endQuiz() {
  mainContainer.style.display = "none";
  score.innerHTML = `Your score: ${correctCount} / ${data.length}`;
  endContainer.style.display = "block";
}
restart.addEventListener("click", () => {
  window.location.reload();
})

enableBtn.disabled = true;
getQuestions();
loadModel();  