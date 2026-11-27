import { VIDEO_DANCES } from './video-dances.js';

// Pose library: segment angles (see pose.js for the convention). Unspecified segments inherit from `rest`.
export const POSES = {
  rest: { torso: 0, uaL: -10, faL: -8, uaR: 10, faR: 8, thL: -4, shL: -2, thR: 4, shR: 2 },
  armsUp: { uaL: -150, faL: -155, uaR: 150, faR: 155 },
  tPose: { uaL: -90, faL: -90, uaR: 90, faR: 90 },
  star: { uaL: -135, faL: -135, uaR: 135, faR: 135, thL: -22, shL: -22, thR: 22, shR: 22 },
  waveR1: { uaR: 100, faR: 165 },
  waveR2: { uaR: 100, faR: -150 },
  waveL1: { uaL: -100, faL: -165 },
  waveL2: { uaL: -100, faL: 150 },
  clapUp: { uaL: -150, faL: 155, uaR: 150, faR: -155 },
  muscles: { uaL: -90, faL: 180, uaR: 90, faR: 180 },
  airplaneL: { uaL: -55, faL: -55, uaR: 125, faR: 125, torso: 8 },
  airplaneR: { uaL: -125, faL: -125, uaR: 55, faR: 55, torso: -8 },
  squat: { uaL: -90, faL: -90, uaR: 90, faR: 90, thL: -50, shL: 15, thR: 50, shR: -15 },
  robotL: { uaL: -90, faL: 0, uaR: 90, faR: 180 },
  robotR: { uaL: -90, faL: 180, uaR: 90, faR: 0 },
  stepL: { thL: -28, shL: -28, uaL: -45, faL: -45, uaR: 45, faR: 45 },
  stepR: { thR: 28, shR: 28, uaL: -45, faL: -45, uaR: 45, faR: 45 },
  leanL: { torso: 15, uaL: -150, faL: -140, uaR: 165, faR: -165 },
  leanR: { torso: -15, uaL: -165, faL: 165, uaR: 150, faR: 140 },
  reachUp: { uaL: -175, faL: -178, uaR: 175, faR: 178 },
  reachL: { uaL: -175, faL: -178 },
  reachR: { uaR: 175, faR: 178 },
  wArms: { uaL: -45, faL: -170, uaR: 45, faR: 170 },
  heart: { uaL: -20, faL: 100, uaR: 20, faR: -100 },
  openArms: { uaL: -45, faL: -45, uaR: 45, faR: 45 },
  legOutL: { thL: -35, shL: -35, uaL: -90, faL: -90, uaR: 90, faR: 90 },
  legOutR: { thR: 35, shR: 35, uaL: -90, faL: -90, uaR: 90, faR: 90 },
};

export const ROUTINES = [
  {
    id: 'happy-wave', title: 'Happy Wave', subtitle: 'Wave, clap and shine like a star', bpm: 100, color: '#ff9f43',
    moves: [
      { pose: 'rest', beats: 2 },
      { pose: 'armsUp', beats: 2, label: 'Arms up!' },
      { pose: 'star', beats: 2, label: 'Star!' },
      { pose: 'waveR1', beats: 1, label: 'Wave!' }, { pose: 'waveR2', beats: 1 },
      { pose: 'waveR1', beats: 1 }, { pose: 'waveR2', beats: 1 },
      { pose: 'waveL1', beats: 1, label: 'Other hand!' }, { pose: 'waveL2', beats: 1 },
      { pose: 'waveL1', beats: 1 }, { pose: 'waveL2', beats: 1 },
      { pose: 'tPose', beats: 2, label: 'Arms out!' },
      { pose: 'clapUp', beats: 2, label: 'Clap up high!' },
      { pose: 'star', beats: 2, label: 'Star!' },
      { pose: 'muscles', beats: 2, label: 'Super strong!' },
      { pose: 'armsUp', beats: 2, label: 'Hooray!' },
      { pose: 'rest', beats: 2 },
    ],
  },
  // For teens: wake the body up after long hours of sitting.
  {
    id: 'desk-break', title: 'Desk Break', subtitle: 'Wake up your body after hours of sitting', bpm: 96, color: '#ff6b6b',
    moves: [
      { pose: 'rest', beats: 2 },
      { pose: 'reachUp', beats: 2, label: 'Stretch up tall' },
      { pose: 'reachL', beats: 2, label: 'Climb left' },
      { pose: 'reachR', beats: 2, label: 'Climb right' },
      { pose: 'reachL', beats: 2, label: 'Left' },
      { pose: 'reachR', beats: 2, label: 'Right' },
      { pose: 'wArms', beats: 2, label: 'Squeeze shoulders back' },
      { pose: 'reachUp', beats: 2, label: 'Press up' },
      { pose: 'wArms', beats: 2, label: 'Squeeze' },
      { pose: 'reachUp', beats: 2, label: 'Press up' },
      { pose: 'leanL', beats: 2, label: 'Side bend' },
      { pose: 'leanR', beats: 2, label: 'Other side' },
      { pose: 'squat', beats: 2, label: 'Squat' },
      { pose: 'rest', beats: 2 },
      { pose: 'squat', beats: 2, label: 'Squat again' },
      { pose: 'rest', beats: 2 },
      { pose: 'legOutL', beats: 2, label: 'Leg out' },
      { pose: 'legOutR', beats: 2, label: 'Other leg' },
      { pose: 'star', beats: 1, label: 'Jumping jacks!' }, { pose: 'rest', beats: 1 },
      { pose: 'star', beats: 1 }, { pose: 'rest', beats: 1 },
      { pose: 'star', beats: 1 }, { pose: 'rest', beats: 1 },
      { pose: 'armsUp', beats: 2, label: 'Finish strong!' },
      { pose: 'rest', beats: 2 },
    ],
  },
  // Dances extracted from the EDGE videos with MediaPipe; they come with their own music (see stepsync/tools/).
  ...VIDEO_DANCES,
];

// Music clips for the video dances (extracted from videos/ into stepsync/music/), looped for the whole dance.
// Other routines play the synthesized StepSync beat.
export const MUSIC = [
  { id: 'happy', title: 'Happy Dance', src: 'music/happy_dance.m4a' },
  { id: 'calm', title: 'Calm Dance', src: 'music/calm_dance.m4a' },
];
