import { CaptureIntent } from '../use-cases/capture-intent.js';

export interface CaptureIO {
  getArgs(): string[];
  readStdin(): Promise<string>;
  isStdinTTY(): boolean;
  log(s: string): void;
  error(s: string): void;
  exit(code: number): never;
}

const USAGE_ERROR = 'Error: capture text required\nUsage:\n  arch capture "text"\n  echo "text" | arch capture';

export class CaptureCommand {
  private io: CaptureIO;

  constructor(
    private captureIntent: CaptureIntent,
    io: CaptureIO,
  ) {
    this.io = io;
  }

  async execute(): Promise<void> {
    const args = this.io.getArgs();
    let rawIntent: string;

    if (args.length > 0) {
      rawIntent = args.join(' ');
    } else if (!this.io.isStdinTTY()) {
      rawIntent = (await this.io.readStdin()).trim();
    } else {
      this.io.error(USAGE_ERROR);
      this.io.exit(1);
    }

    if (!rawIntent.trim()) {
      this.io.error(USAGE_ERROR);
      this.io.exit(1);
    }

    const id = await this.captureIntent.execute(rawIntent);
    this.io.log(`${id} captured.`);
  }
}
