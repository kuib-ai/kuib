import { describe, it, expect, vi } from 'vitest';
import { DaemonService } from '@kuib/protocol/src/gen/kuib/v1/daemon_pb.js';
import { runAgent } from './orchestrator.js';
import type { LanguageModelV1 } from 'ai';

describe('runAgent orchestrator', () => {
  it('should call executeCommand via daemonClient when model requests it', async () => {
    // 1. Mock the ConnectRPC daemonClient
    const daemonClientMock = {
      executeCommand: vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'mocked output',
        stderr: ''
      }),
      readFile: vi.fn(),
      writeFile: vi.fn(),
    } as any;

    // 2. Mock the LanguageModel to simulate an LLM calling a tool
    const modelMock: LanguageModelV1 = {
      specificationVersion: 'v1',
      provider: 'mock-provider',
      modelId: 'mock-model',
      defaultObjectGenerationMode: 'json',
      async doGenerate(options) {
        return {
          text: 'Sure, executing command.',
          toolCalls: [
            {
              toolCallType: 'function',
              toolCallId: 'call-123',
              toolName: 'executeCommand',
              args: `{"command": "echo hello", "cwd": "/tmp"}`,
            }
          ],
          finishReason: 'tool-calls',
          usage: { promptTokens: 10, completionTokens: 5 },
        };
      },
      async doStream(options) {
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({ type: 'text-delta', textDelta: 'Sure, executing command.' });
              controller.enqueue({
                type: 'tool-call-delta',
                toolCallType: 'function',
                toolCallId: 'call-123',
                toolName: 'executeCommand',
                argsTextDelta: `{"command": "echo hello", "cwd": "/tmp"}`,
              });
              controller.enqueue({
                type: 'finish',
                finishReason: 'tool-calls',
                usage: { promptTokens: 10, completionTokens: 5 },
              });
              controller.close();
            }
          }),
          rawCall: { rawPrompt: null, rawSettings: {} }
        };
      }
    };

    // 3. Run the agent
    // Since runAgent consumes the stream, it will trigger the mock tool call
    await runAgent('Run a command', daemonClientMock, modelMock);

    // 4. Verify the ConnectRPC client was called over the "Mesh"
    expect(daemonClientMock.executeCommand).toHaveBeenCalledTimes(1);
    expect(daemonClientMock.executeCommand).toHaveBeenCalledWith({
      command: 'echo hello',
      cwd: '/tmp',
      env: {}
    });
  });
});
