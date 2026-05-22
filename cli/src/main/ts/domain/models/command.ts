export interface Command {
  execute(args: string[]): Promise<void>;
}
