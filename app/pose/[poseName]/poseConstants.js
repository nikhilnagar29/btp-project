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