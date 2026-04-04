export type DeepImmutable<T> = T extends (infer R)[]
  ? DeepImmutableArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepImmutableObject<T>
  : T;

interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> {}

type DeepImmutableObject<T> = {
  readonly [P in keyof T]: DeepImmutable<T[P]>;
};

export interface ToolContext {
  workDir: string;
  taskId: string;
  mode: 'ask' | 'craft' | 'plan';
  abortSignal?: AbortSignal;
}

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Tool<Input = any, Output = any, Progress = any> {
  name: string;
  description: string;
  inputSchema: any;
  maxResultSizeChars: number;

  call(
    input: Input,
    context: ToolContext,
    onProgress?: (progress: Progress) => void
  ): Promise<ToolResult<Output>>;

  mapToAPI(output: Output): any;
  renderUI(output: Output): any;

  checkPermissions(input: Input, mode: ToolContext['mode']): boolean;
  isConcurrencySafe(input: Input): boolean;
  isDestructive(input: Input): boolean;
}
