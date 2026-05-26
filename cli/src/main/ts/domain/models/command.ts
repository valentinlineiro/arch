export interface Command {
  execute(args: string[]): Promise<number>;
}

export class CommandExit {
  constructor(public code: number) {}
}

export interface IO {
  getArgs: () => string[];
  log: (s: string) => void;
  error: (s: string) => void;
  exit: (code: number) => never;
}

export function ioExit(code: number): never {
  throw new CommandExit(code);
}
