import * as imports from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("webcam");
const canvas = document.getElementById("output_canvas");
const ctx = canvas.getContext("2d");
const enableBtn = document.getElementById("webcamButton");
const drawUtils = new imports.DrawingUtils(ctx);

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
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream;
  enableBtn.disabled = true;
})
video.addEventListener("play", predictLoop);
function predictLoop() {
  const detections = handLandmarker.detectForVideo(video, performance.now());
  console.log(detections)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (detections.landmarks) {
    for (const landmarks of detections.landmarks) {
      drawUtils.drawLandmarks(landmarks, { color: "blue", radius: 5 });
      drawUtils.drawConnectors(landmarks, imports.HandLandmarker.HAND_CONNECTIONS, { color: "green", lineWidth: 2 });
    }

  }
  requestAnimationFrame(predictLoop)
}
enableBtn.disabled = true;
loadModel();