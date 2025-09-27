export interface SpeakingCheckpoint {
  id: string;
  exerciseId: string;
  recordedAt: string;
  durationMs: number;
  blob: Blob;
}
