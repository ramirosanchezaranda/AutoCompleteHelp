import * as vscode from 'vscode';
import * as core from '../core/client';
export { NoAIError, listModels } from '../core/client';
export type { StreamHandlers } from '../core/client';

/**
 * Cliente de los LLM para la extensión: el de core, con la cancelación del
 * IDE (CancellationToken) convertida en AbortSignal.
 */
export interface CompletionRequest extends Omit<core.CompletionRequest, 'signal'> {
  token?: vscode.CancellationToken;
}

function withSignal<T>(req: CompletionRequest, run: (r: core.CompletionRequest) => Promise<T>): Promise<T> {
  const { token, ...rest } = req;
  if (!token) {
    return run(rest);
  }
  const controller = new AbortController();
  const sub = token.onCancellationRequested(() => controller.abort());
  return run({ ...rest, signal: controller.signal }).finally(() => sub.dispose());
}

export function complete(req: CompletionRequest): Promise<string> {
  return withSignal(req, core.complete);
}

export function streamComplete(req: CompletionRequest, handlers: core.StreamHandlers = {}): Promise<string> {
  return withSignal(req, (r) => core.streamComplete(r, handlers));
}
