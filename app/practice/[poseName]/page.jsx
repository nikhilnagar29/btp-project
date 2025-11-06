'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// These imports are correct based on your new file structure
import { fetchFullPoseData, parseCsvData, calculateScores } from './poseUtils';
import { ANGLE_TO_TIP_MAP } from './poseConstants';
import { initMediaPipe, initCamera, drawPose, drawHud } from './mediaPipeUtils';

// Your components are imported correctly
import LoadingOverlay from '../../components/LoadingOverlay';
import ScoreRing from '../../components/ScoreRing';
import WarningBar from '../../components/WarningBar';
import LiveTipBox from '../../components/LiveTipBox';

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();

  const [pose, setPose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCameraStarting, setIsCameraStarting] = useState(true);
  const [scores, setScores] = useState({ full_body: 0, upper_body: 0, lower_body: 0 });
  const [feedbackList, setFeedbackList] = useState([]);
  const [displayFeedback, setDisplayFeedback] = useState('Hold pose to get feedback.');
  const [warning, setWarning] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraRef = useRef(null);
  const referenceDataRef = useRef([]);
  const highlightLandmarksRef = useRef([]);
  const feedbackIndexRef = useRef(0);
  const feedbackTimerRef = useRef(null);
  const lastCheckRef = useRef(0);
  const prevTimeRef = useRef(0);
  const noPoseCountRef = useRef(0);

  // Load pose + CSV (No changes here)
  useEffect(() => {
    const load = async () => {
      try {
        const poseName = decodeURIComponent(params?.poseName);
        const data = await fetchFullPoseData(poseName);
        setPose(data);
        const parsed = await parseCsvData(data.csvData);
        referenceDataRef.current = parsed.filter(r => Object.keys(r).length > 0);
      } catch (e) {
        setError(e?.message || 'Failed to load pose');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.poseName]);

  // Start camera immediately (No changes here)
  useEffect(() => {
    if (!pose || !referenceDataRef.current?.length) return;
    const start = async () => {
      try {
        poseInstanceRef.current = await initMediaPipe(onPoseResults);
        cameraRef.current = await initCamera(videoRef, poseInstanceRef.current);
        setFeedbackList(['Hold your pose to get real-time feedback.']);
      } catch (err) {
        console.error('Camera error', err);
        setWarning('Camera permission denied or unavailable');
      } finally {
        setIsCameraStarting(false);
      }
    };
    start();

    return () => {
      try { cameraRef.current?.stop?.(); } catch {}
      cameraRef.current = null;
      try { poseInstanceRef.current?.close?.(); } catch {}
      poseInstanceRef.current = null;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      clearInterval(feedbackTimerRef.current);
    };
  }, [pose]);

  // Cycle live tips (No changes here)
  useEffect(() => {
    clearInterval(feedbackTimerRef.current);
    feedbackIndexRef.current = 0;
    if (feedbackList.length > 0) {
      setDisplayFeedback(feedbackList[0]);
      if (feedbackList.length > 1) {
        feedbackTimerRef.current = setInterval(() => {
          feedbackIndexRef.current = (feedbackIndexRef.current + 1) % feedbackList.length;
          setDisplayFeedback(feedbackList[feedbackIndexRef.current]);
        }, 2000);
      }
    } else if (scores.full_body > 95) {
      setDisplayFeedback('Excellent Form! Hold it.');
    } else {
      setDisplayFeedback('Hold your pose to get feedback.');
    }
    return () => clearInterval(feedbackTimerRef.current);
  }, [feedbackList, scores.full_body]);

  // Pose results (No changes here)
  const onPoseResults = (results, drawing, POSE_CONNECTIONS) => {
    const canvasEl = canvasRef.current;
    const ctx = canvasEl?.getContext('2d');
    const videoEl = videoRef.current;
    if (!canvasEl || !ctx || !videoEl || !videoEl.videoWidth) return;

    // This logic is fine, it sets the canvas to the video's received size
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    
    let currentHighlights = highlightLandmarksRef.current;

    if (results?.poseLandmarks) {
      noPoseCountRef.current = 0;
      if (warning) setWarning(null); // Clear warning if pose is found

      const now = performance.now();
      const CHECK_INTERVAL = 250;
      if (now - lastCheckRef.current > CHECK_INTERVAL) {
        lastCheckRef.current = now;
        const { scores: newScores, worstAngles } = calculateScores(
          results.poseLandmarks,
          referenceDataRef.current
        );
        setScores(newScores);
        const newFeedback = worstAngles.map(a => ANGLE_TO_TIP_MAP[a].tip);
        setFeedbackList(newFeedback);
        const newHighlights = worstAngles.map(a => ANGLE_TO_TIP_MAP[a].landmarkIndex);
        highlightLandmarksRef.current = newHighlights;
        currentHighlights = newHighlights;
      }
    } else {
      noPoseCountRef.current += 1;
       // Show warning if pose is not detected for ~0.5 seconds (250ms * 2)
      if (noPoseCountRef.current > 2) {
         setWarning('Move back — full body not detected');
      }
    }

    drawPose(ctx, results, drawing, POSE_CONNECTIONS, currentHighlights);

    const t = performance.now() / 1000;
    const fps = 1 / Math.max(1e-3, t - prevTimeRef.current);
    prevTimeRef.current = t;
    drawHud(ctx, Math.round(fps));
  };

  // --- Loading/Error states (No changes here) ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-pink-700 font-medium">Loading practice…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg text-gray-700">{error}</p>
        <Link
          href={`/pose/${params?.poseName}`}
          className="inline-flex bg-pink-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-pink-700"
        >
          Back to pose
        </Link>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/pose/${params?.poseName}`} className="text-pink-600 hover:text-pink-700">
            ← {pose?.name || 'Back'}
          </Link>
          <span className="ml-auto inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-pink-700 shadow">
            Coach Mode
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8 items-start">
          {/* Left: Video (3/4) */}
          <div className="lg:col-span-5">
            {/* --- THIS IS THE MAIN FIX ---
              1.  We use `aspect-video` (16:9) to force a professional shape on all screens.
              2.  `w-full` makes it responsive.
              3.  The `video` and `canvas` inside must fill this container.
            */}
            <div className="relative w-full rounded-2xl shadow-2xl overflow-hidden bg-black border border-white/10">
            {/* Video element is NOT absolute. It will size naturally based on the stream. */}
            <video 
              ref={videoRef} 
              className="w-full h-auto"  /* Key change here */
              playsInline 
              muted 
            />
            {/* Canvas is absolute, stretching to fill the parent container (which is sized by the video). */}
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none" 
            />
            
            {/* Overlays are still absolute, covering the container */}
            <LoadingOverlay show={isCameraStarting} label="Starting camera — please allow access" />
            {warning && <WarningBar>{warning}</WarningBar>}

            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-pink-700">
              COACH
            </div>
          </div>
            
          </div>

          {/* Right: Analysis (1/4) (No changes here, this part is good) */}
          <aside className="lg:col-span-2 space-y-6">
            <LiveTipBox tip={displayFeedback} />

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <ScoreRing value={Math.round(scores.full_body)} label="Overall" />
                <div className="flex-1 grid grid-row-2 gap-3">
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-700">Upper body</div>
                    <div className="text-2xl font-bold text-pink-600">{scores.upper_body}%</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-700">Lower body</div>
                    <div className="text-2xl font-bold text-pink-600">{scores.lower_body}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Session</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => router.replace(`/pose/${params?.poseName}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-pink-200 text-pink-700 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50"
                >
                  Stop
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}