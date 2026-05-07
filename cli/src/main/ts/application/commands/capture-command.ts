import { CaptureIntent } from '../use-cases/capture-intent.js';

export class CaptureCommand {
  constructor(private captureIntent: CaptureIntent) {}

  async execute(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('arch capture requires an intent string');
      process.exit(1);
    }
    const rawIntent = args.join(' ');
    const id = await this.captureIntent.execute(rawIntent);
    console.log(`${id} captured.`);
  }
}
