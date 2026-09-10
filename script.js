import * as imports from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
import data from "./data.json";

const mainContainer = document.getElementById("main-container");
const endContainer = document.getElementById("end-container");
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
let handLandmarker;

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
    if (detections.landmarks && detections.landmarks.length > 0) {
      for (const landmarks of detections.landmarks) {
        drawUtils.drawLandmarks(landmarks, { color: "blue", radius: 5 });
        drawUtils.drawConnectors(landmarks, imports.HandLandmarker.HAND_CONNECTIONS, { color: "green", lineWidth: 2 });
      }
    }
  }
  requestAnimationFrame(predictLoop);
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
  endContainer.style.display = "block";
}
restart.addEventListener("click", () => {
  window.location.reload();
})

enableBtn.disabled = true;
showQuestion(0);
loadModel();  