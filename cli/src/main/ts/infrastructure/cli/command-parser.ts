export interface ParsedCommand {
  name: string;
  args: string[];
}

export function parseCommand(argv: string[]): ParsedCommand {
  return { name: argv[0] ?? '', args: argv.slice(1) };
}
