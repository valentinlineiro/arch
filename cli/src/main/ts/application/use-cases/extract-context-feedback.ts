import type { FeedbackSignal, FeedbackDetail, FeedbackVerdict } from '../../domain/models/feedback-signal.js';

const FEEDBACK_SECTION_MARKER = '### Context Feedback';

export class ExtractContextFeedback {
  extract(taskId: string, content: string): FeedbackSignal | null {
    const sectionStart = content.indexOf(FEEDBACK_SECTION_MARKER);
    if (sectionStart === -1) return null;

    const sectionEnd = content.indexOf('\n##', sectionStart + 1);
    const section = sectionEnd === -1
      ? content.slice(sectionStart)
      : content.slice(sectionStart, sectionEnd);

    const verdict = this.extractVerdict(section);
    if (verdict === null) return null;

    return {
      taskId,
      timestamp: new Date().toISOString(),
      verdict,
      details: this.extractDetails(section),
    };
  }

  private extractVerdict(section: string): FeedbackVerdict {
    if (/- \[x\] accurate/.test(section)) return 'accurate';
    if (/- \[x\] partial/.test(section)) return 'partial';
    if (/- \[x\] off/.test(section)) return 'off';
    return null;
  }

  private extractDetails(section: string): FeedbackDetail {
    return {
      wrongFiles: /- \[x\] wrong files/.test(section),
      missingFiles: /- \[x\] missing files/.test(section),
      wrongAdrs: /- \[x\] wrong ADRs/.test(section),
      tooMuchNoise: /- \[x\] too much noise/.test(section),
      confidenceMisleading: /- \[x\] confidence misleading/.test(section),
    };
  }
}
