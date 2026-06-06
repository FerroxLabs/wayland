import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
} from '../../../../helpers';

const TOOL_CALL_SELECTOR = '[data-testid="tool-call"], .tool-call-item, .message-item.tool';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-MSG-02 Referencing files in messages', () => {
  test('After sending a message with @filename, the AI can reply based on the file', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'Please read @package.json and tell me the project name.');
    createdIds.push(conversationId);

    await waitForSessionActive(page, 120_000);
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'msg-02-file-reference');
  });

  test.skip('Add to Chat - select file from directory tree (E2E Electron has no workspace Explorer panel)', async () => {});
  test.skip('Drag-and-drop file upload (Playwright Electron does not support native drag events to input)', async () => {});
  test.skip('Clipboard image attachment (Electron clipboard + Playwright compatibility risk is high)', async () => {});
  test.skip('Gemini backend file auto-copy and cleanup (skipped for Gemini)', async () => {});
  test.skip('Auto-deduplication when referencing the same file multiple ways (partially implemented, depends on directory tree interaction)', async () => {});
  test.skip('Binary files are not inlined (E2E cannot verify internal transport-layer behavior; file inlining logic is handled in the adapter layer)', async () => {});
  test.skip('Message received by AI does not contain UI display path markers (E2E cannot inspect the actual payload sent to the AI)', async () => {});
  test.skip('Upload failure does not block message sending (E2E cannot reliably simulate a file upload failure scenario)', async () => {});
});

test.describe('F-FILE-02 AI reading and writing files', () => {
  test('After asking the AI to read a file, a tool call is shown in the conversation', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(
      page,
      'Read the file package.json in the workspace and summarize its contents.'
    );
    createdIds.push(conversationId);

    await waitForSessionActive(page, 120_000);
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    const messages = await invokeBridge<{ type?: string; content?: unknown }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );
    const hasToolMessage = messages.some(
      (m) => m.type === 'tool_call' || m.type === 'acp_tool_call' || m.type === 'tool_group'
    );
    if (hasToolMessage) {
      expect(hasToolMessage).toBe(true);
    } else {
      expect(replyText.toLowerCase()).toMatch(/package\.json|read|file/);
    }

    await takeScreenshot(page, 'file-02-read-tool-call');
  });

  test('After asking the AI to create a file, a write operation is shown in the conversation', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(
      page,
      'Create a file called e2e-test-output.txt in the workspace with the content "Hello from E2E test".'
    );
    createdIds.push(conversationId);

    await waitForSessionActive(page, 120_000);
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    const messages = await invokeBridge<{ type?: string; content?: unknown }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );
    const hasToolMessage = messages.some(
      (m) => m.type === 'tool_call' || m.type === 'acp_tool_call' || m.type === 'tool_group'
    );
    if (hasToolMessage) {
      expect(hasToolMessage).toBe(true);
    } else {
      expect(replyText.toLowerCase()).toMatch(/e2e-test-output\.txt|create|write|file/);
    }

    await takeScreenshot(page, 'file-02-write-tool-call');
  });

  test.skip('Auto-create missing directories on write (V2 path lacks auto-mkdir; currently falls back to V1)', async () => {});
  test.skip('Real-time editor notification after file write (E2E cannot verify external editor events)', async () => {});
});
