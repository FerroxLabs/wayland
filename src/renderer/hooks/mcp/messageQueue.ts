/**
 * Global message queue manager (singleton pattern)
 *
 * Purpose: Ensure all MCP-related messages are displayed sequentially to prevent overlap when triggered simultaneously
 *
 * Use cases:
 * - When rapidly toggling multiple MCP tool configuration switches
 * - When batch testing MCP connections
 * - When performing multiple sync/remove operations simultaneously
 */
class MessageQueue {
  private static instance: MessageQueue;
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private readonly delay = 100; // 100ms delay between messages to ensure Arco Design has enough time to render
  private readonly maxQueueSize = 50; // Maximum queue size to prevent memory overflow

  private constructor() {}

  /**
   * Get the global singleton instance
   */
  static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  /**
   * Add a message to the queue and trigger processing
   * @param showMessageFn Function to display the message
   */
  async add(showMessageFn: () => void): Promise<void> {
    // Check queue length, discard new message if limit exceeded (not old ones)
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`Message queue size exceeded ${this.maxQueueSize}, dropping new message`);
      return;
    }
    this.queue.push(showMessageFn);
    if (!this.isProcessing) {
      await this.process();
    }
  }

  /**
   * Process all messages in the queue sequentially
   */
  private async process(): Promise<void> {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        fn();
        // Add delay to allow Arco Design time to complete animations and layout calculations
        await new Promise((resolve) => setTimeout(resolve, this.delay));
      }
    }
    this.isProcessing = false;
  }
}

/**
 * Global message queue instance
 *
 * Used in all MCP-related hooks to ensure messages don't overlap when displayed
 */
export const globalMessageQueue = MessageQueue.getInstance();
