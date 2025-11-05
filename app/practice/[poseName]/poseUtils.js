// app/pose/[poseName]/poseUtils.js
import Papa from 'papaparse';
import { ANGLE_DEFINITIONS, SCORE_GROUPS , ANGLE_TO_TIP_MAP } from './poseConstants';

/**
 * Fetches the full pose data (metadata + csvData) from the API.
 */
export const fetchFullPoseData = async (poseName) => {
  const res = await fetch(`/api/poses/${encodeURIComponent(poseName)}/full`);
  if (!res.ok) throw new Error('Full pose data not found');
  return res.json();
};

/**
 * Parses the CSV data string from the database.
 */
export const parseCsvData = (csvString) => new Promise((resolve, reject) => {
  Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors?.length) return reject(results.errors[0]);
      resolve(results.data);
    },
    error: (err) => reject(err),
  });
});


/**
 * Calculates the cosine similarity between two vectors.
 */
export const cosineSimilarity = (A, B) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < A.length; i++) {
    const a = A[i] ?? 0; const b = B[i] ?? 0;
    dot += a * b; normA += a * a; normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Gets a 2D point from landmarks, handling midpoint calculations.
 */
const getPoint = (landmarks, def) => {
  if (Array.isArray(def) && def[0] === 'mid') {
    const i1 = def[1]; const i2 = def[2];
    const p1 = landmarks[i1]; const p2 = landmarks[i2];
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  } else {
    const p = landmarks[def];
    return { x: p.x, y: p.y };
  }
};

/**
 * Calculates the angle between three 2D points.
 */
const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

/**
 * Calculates all pose scores based on current landmarks.
 * NOW RETURNS AN ARRAY of the top 3 worst angles.
 */
export const calculateScores = (landmarks, referenceData) => {
  const currentAngles = {};
  for (const [k, def] of Object.entries(ANGLE_DEFINITIONS)) {
    try {
      const a = getPoint(landmarks, def[0]);
      const b = getPoint(landmarks, def[1]);
      const c = getPoint(landmarks, def[2]);
      currentAngles[k] = calculateAngle(a, b, c);
    } catch {
      currentAngles[k] = -180; // Error value
    }
  }

  const newScores = { full_body: 0, upper_body: 0, lower_body: 0 };
  let worstAngles = []; // This will be an array

  for (const [group, angleNames] of Object.entries(SCORE_GROUPS)) {
    const refMatrix = referenceData.map(row => angleNames.map(n => Number(row[n] ?? 0)));
    const currVec = angleNames.map(n => Number(currentAngles[n] ?? 0));
    
    let maxCos = 0;
    let bestMatchIndex = 0; // Keep track of the best match

    for (let i = 0; i < refMatrix.length; i++) {
      const cs = cosineSimilarity(refMatrix[i], currVec);
      if (cs > maxCos) {
        maxCos = cs;
        bestMatchIndex = i; // Store the index of the best match
      }
    }
    
    const oldPct = maxCos * 100;
    const pct = Math.max(0, (oldPct - 90) * 10);
    newScores[group] = Math.round(pct);

    // --- MODIFIED LOGIC: Find all errors, not just one ---
    if (group === 'full_body' && refMatrix.length > 0) {
      const bestMatchVector = refMatrix[bestMatchIndex];
      const errors = [];
      for (let i = 0; i < angleNames.length; i++) {
        const angleName = angleNames[i];
        if (ANGLE_TO_TIP_MAP[angleName]) { // Check if we have a tip for this
          const error = Math.abs(currVec[i] - bestMatchVector[i]);
          
          if (error > 15) { // Error threshold of 15 degrees
            errors.push({ name: angleName, error: error });
          }
        }
      }
      // Sort by the biggest error first
      errors.sort((a, b) => b.error - a.error);
      // Get the names of the top 3 errors
      worstAngles = errors.slice(0, 3).map(e => e.name);
    }
  }
  
  // Return both scores and the array of worst angles
  return { scores: newScores, worstAngles: worstAngles };
};