// app/pose/[poseName]/mediaPipeUtils.js

/**
 * Loads and initializes the MediaPipe Pose instance.
 */
export const initMediaPipe = async (onResults) => {
  const { Pose } = await import('@mediapipe/pose');
  const poseInstance = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });
  
  poseInstance.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  // Dynamically load drawing utils and connections for the callback
  const drawingUtils = await import('@mediapipe/drawing_utils');
  const { POSE_CONNECTIONS } = await import('@mediapipe/pose');
  
  poseInstance.onResults((results) => {
    onResults(results, drawingUtils, POSE_CONNECTIONS);
  });
  
  return poseInstance;
};

/**
 * Requests camera access and starts the MediaPipe camera utility.
 */
export const initCamera = async (videoRef, poseInstance) => {
  const { Camera } = await import('@mediapipe/camera_utils');
  
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    throw new Error('Camera requires HTTPS or localhost. Please use https or run locally.');
  }

  if (videoRef.current) {
    videoRef.current.setAttribute('playsinline', 'true');
    videoRef.current.setAttribute('muted', 'true');
    videoRef.current.muted = true;
    videoRef.current.autoplay = true;
  }
  
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  } catch (e1) {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
  
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
    try { await videoRef.current.play(); } catch {}
  }

  const camera = new Camera(videoRef.current, {
    onFrame: async () => {
      if (videoRef.current) {
         await poseInstance.send({ image: videoRef.current });
      }
    },
    width: 640,
    height: 480,
  });
  
  camera.start();
  return camera;
};

/**
 * Draws the pose landmarks and connectors on the canvas.
 */
export const drawPose = (ctx, results, drawing, POSE_CONNECTIONS) => {
  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if (results.poseLandmarks) {
    try {
      drawing.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#22c55e', lineWidth: 4 });
      drawing.drawLandmarks(ctx, results.poseLandmarks, { color: '#3b82f6', lineWidth: 2 });
    } catch (e) {
      console.error('Error drawing pose:', e);
    }
  }
};

/**
 * Draws the scores and FPS text overlay (HUD).
 */
export const drawHud = (ctx, scores, fps) => {
  let y = 28;
  const entries = [
    ['Full Body', scores.full_body],
    ['Upper Body', scores.upper_body],
    ['Lower Body', scores.lower_body],
  ];

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.font = '16px sans-serif';

  entries.forEach(([label, val]) => {
    const text = `${label}: ${val}%`;
    ctx.fillRect(10, y - 18, ctx.measureText(text).width + 20, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 20, y);
    y += 28;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; // Reset color for next rect
  });
  
  // Draw FPS
  const fpsText = `FPS: ${fps}`;
  ctx.fillRect(10, y - 18, ctx.measureText(fpsText).width + 20, 24);
  ctx.fillStyle = '#fff';
  ctx.fillText(fpsText, 20, y);
  
  ctx.restore();
};