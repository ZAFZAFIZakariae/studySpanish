export type Plugin<T extends unknown[] = [], U = unknown> = (...args: T) => U;

type Parser = {
  parse: (value: string) => { children: Array<{ type: string; [key: string]: unknown }> };
};

type UnifiedInstance = {
  use: (..._plugins: unknown[]) => Parser;
};

export function unified(): UnifiedInstance {
  return {
    use: () => ({
      parse: (value: string) => ({ children: [{ type: 'text', value }] }),
    }),
  };
}

export default unified;
