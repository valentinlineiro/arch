export type FeedbackVerdict = 'accurate' | 'partial' | 'off' | null;

export interface FeedbackDetail {
  wrongFiles: boolean;
  missingFiles: boolean;
  wrongAdrs: boolean;
  tooMuchNoise: boolean;
  confidenceMisleading: boolean;
}

export interface FeedbackSignal {
  taskId: string;
  timestamp: string;
  verdict: FeedbackVerdict;
  details: FeedbackDetail;
}
