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
  
  // --- THIS IS THE NEW, DIFFERENT METHOD ---
  // We explicitly wait for the model files (.wasm, .data) to load
  // BEFORE we return the instance. This prevents the camera from
  // trying to send frames to a model that isn't ready, which
  // causes the 'TypeError' and 'Aborted' errors on startup.
  await poseInstance.initialize();
  // --- END OF NEW METHOD ---

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

  // --- THIS FLAG IS STILL REQUIRED ---
  // This flag prevents the *other* race condition, where the camera
  // sends a new frame (onFrame) before the previous frame (send)
  // has finished processing.
  let isSendingFrame = false;

  const camera = new Camera(videoRef.current, {
    onFrame: () => { // 1. REMOVED 'async'
      // 2. Check if busy or if the instance isn't ready
      if (!videoRef.current || isSendingFrame || !poseInstance) { 
        return;
      }
      
      isSendingFrame = true; // 3. Set flag to "busy"
      
      // We use .then() instead of .finally() for broader compatibility
      poseInstance.send({ image: videoRef.current })
        .then(() => {
          isSendingFrame = false; // 4. Unset flag when done
        })
        .catch((err) => {
          console.error("Error sending frame to MediaPipe", err);
          isSendingFrame = false; // 4. Also unset flag on error
        });
    },
    width: 640,
    height: 480,
  });
  
  camera.start();
  return camera;
};

/**
 * Draws the pose landmarks and connectors on the canvas.
 * (This function is unchanged from your version)
 */
export const drawPose = (ctx, results, drawing, POSE_CONNECTIONS, highlightLandmarks = []) => {
  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Flip the canvas horizontally for a "mirror" view
  ctx.scale(-1, 1);
  ctx.translate(-ctx.canvas.width, 0);
  ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if (results.poseLandmarks) {
    try {
      // Draw standard skeleton
      drawing.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#22c55e', lineWidth: 4 });
      drawing.drawLandmarks(ctx, results.poseLandmarks, { color: '#3b82f6', lineWidth: 2 });

      // --- UPDATED: Loop through landmarks to highlight ---
      if (highlightLandmarks && highlightLandmarks.length > 0) {
        for (const landmarkIndex of highlightLandmarks) {
          if (results.poseLandmarks[landmarkIndex] && results.poseLandmarks[landmarkIndex].visibility > 0.5) {
            const landmark = results.poseLandmarks[landmarkIndex];
            const x = landmark.x * ctx.canvas.width;
            const y = landmark.y * ctx.canvas.height;
            
            // Draw a filled red circle with a white border
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI); // 10px radius circle
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Semi-transparent red
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF'; // White border
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    } catch (e) {
      console.error('Error drawing pose:', e);
    }
  }
  // Restore the context to normal (un-flipped)
  ctx.restore();
};

/**
 * Draws just the FPS text overlay (HUD).
 */
export const drawHud = (ctx, fps) => {
  const fpsText = `FPS: ${fps}`;
  // We draw the HUD *after* restoring the context, so it's not mirrored
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.font = '16px sans-serif';
  ctx.fillRect(10, 10, ctx.measureText(fpsText).width + 20, 24); // Position at top-left
  ctx.fillStyle = '#fff';
  ctx.fillText(fpsText, 20, 28);
};