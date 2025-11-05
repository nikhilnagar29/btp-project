// app/compare/[poseName]/poseConstants.js

export const ANGLE_DEFINITIONS = {
  hip_1: [12, 24, 26], hip_2: [12, 24, 23], hip_3: [23, 24, 26], hip_4: [11, 23, 25],
  hip_5: [11, 23, 24], hip_6: [24, 23, 25], knee_1: [24, 26, 28], knee_2: [23, 25, 27],
  ankle_1: [26, 28, 30], ankle_2: [26, 30, 32], ankle_3: [25, 27, 29], ankle_4: [25, 29, 31],
  ankle_5: [26, ['mid', 24, 23], 25], ankle_6: [30, ['mid', 24, 23], 29],
  arm_shoulder_1: [12, 14, 16], arm_shoulder_2: [12, 14, 18], arm_shoulder_3: [11, 13, 15], arm_shoulder_4: [11, 13, 17],
  shoulder_1: [14, 12, 11], shoulder_2: [14, 12, 24], shoulder_3: [0, 12, 24],
  shoulder_4: [['mid', 10, 9], 12, 24], shoulder_5: [13, 11, 12], shoulder_6: [13, 11, 23],
  shoulder_7: [0, 11, 23], shoulder_8: [['mid', 10, 9], 11, 23], neck_1: [0, ['mid', 11, 12], ['mid', 23, 24]],
  neck_2: [['mid', 10, 9], ['mid', 11, 12], ['mid', 23, 24]],
};

export const SCORE_GROUPS = {
  full_body: Object.keys(ANGLE_DEFINITIONS),
  upper_body: ['arm_shoulder_1','arm_shoulder_2','arm_shoulder_3','arm_shoulder_4','shoulder_1','shoulder_2','shoulder_3','shoulder_4','shoulder_5','shoulder_6','shoulder_7','shoulder_8','neck_1','neck_2'],
  lower_body: ['hip_1','hip_2','hip_3','hip_4','hip_5','hip_6','knee_1','knee_2','ankle_1','ankle_2','ankle_3','ankle_4','ankle_5','ankle_6'],
};

export const ANGLE_TO_TIP_MAP = {
  // Lower Body
  hip_1: { tip: 'Adjust Left Hip', landmarkIndex: 24 },
  hip_2: { tip: 'Adjust Left Hip', landmarkIndex: 24 },
  hip_3: { tip: 'Adjust Hips', landmarkIndex: 24 },
  hip_4: { tip: 'Adjust Right Hip', landmarkIndex: 23 },
  hip_5: { tip: 'Adjust Right Hip', landmarkIndex: 23 },
  hip_6: { tip: 'Adjust Hips', landmarkIndex: 23 },
  knee_1: { tip: 'Adjust Left Knee', landmarkIndex: 26 },
  knee_2: { tip: 'Adjust Right Knee', landmarkIndex: 25 },
  ankle_1: { tip: 'Adjust Left Ankle', landmarkIndex: 28 },
  ankle_2: { tip: 'Adjust Left Ankle', landmarkIndex: 30 },
  ankle_3: { tip: 'Adjust Right Ankle', landmarkIndex: 27 },
  ankle_4: { tip: 'Adjust Right Ankle', landmarkIndex: 29 },
  ankle_5: { tip: 'Adjust Ankles', landmarkIndex: 26 },
  ankle_6: { tip: 'Adjust Ankles', landmarkIndex: 30 },

  // Upper Body
  arm_shoulder_1: { tip: 'Adjust Left Elbow', landmarkIndex: 14 },
  arm_shoulder_2: { tip: 'Adjust Left Wrist', landmarkIndex: 14 },
  arm_shoulder_3: { tip: 'Adjust Right Elbow', landmarkIndex: 13 },
  arm_shoulder_4: { tip: 'Adjust Right Wrist', landmarkIndex: 13 },
  shoulder_1: { tip: 'Adjust Shoulders', landmarkIndex: 12 },
  shoulder_2: { tip: 'Adjust Left Shoulder', landmarkIndex: 12 },
  shoulder_3: { tip: 'Adjust Left Shoulder', landmarkIndex: 12 },
  shoulder_4: { tip: 'Adjust Left Shoulder', landmarkIndex: 12 },
  shoulder_5: { tip: 'Adjust Shoulders', landmarkIndex: 11 },
  shoulder_6: { tip: 'Adjust Right Shoulder', landmarkIndex: 11 },
  shoulder_7: { tip: 'Adjust Right Shoulder', landmarkIndex: 11 },
  shoulder_8: { tip: 'Adjust Right Shoulder', landmarkIndex: 11 },
  neck_1: { tip: 'Adjust Neck', landmarkIndex: 0 },
  neck_2: { tip: 'Adjust Neck', landmarkIndex: 0 },
};