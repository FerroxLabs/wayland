/**
 * ext-Feishu Channel example (not integrated by default)
 * - Demonstrates the core ideas behind Feishu Channels: event deduplication, message send/receive, and basic metrics collection
 * - The SDK is intentionally not imported so this example can be read standalone
 */

const EVENT_TTL_MS = 5 * 60 * 1000;

class ExtFeishuChannelPlugin {
  constructor(config) {
    this.config = config || {};
    this.running = false;
    this.activeUsers = new Set();
    this.processedEvents = new Map();
    this.metrics = {
      received: 0,
      sent: 0,
      deduped: 0,
      lastEventAt: 0,
    };
  }

  async start() {
    this.running = true;
    return { ok: true, plugin: 'ext-feishu' };
  }

  async stop() {
    this.running = false;
    return { ok: true };
  }

  isRunning() {
    return this.running;
  }

  getActiveUserCount() {
    return this.activeUsers.size;
  }

  getBotInfo() {
    return { displayName: 'ext-Feishu Bot (Example)' };
  }

  async sendMessage(chatId, message) {
    if (!this.running) throw new Error('ext-feishu plugin is not running');
    this.metrics.sent += 1;
    this.metrics.lastEventAt = Date.now();
    return `ext-feishu-msg-${Date.now()}`;
  }

  async editMessage(chatId, messageId, message) {
    if (!this.running) throw new Error('ext-feishu plugin is not running');
    this.metrics.lastEventAt = Date.now();
  }

  /**
   * Simulates receiving an inbound event (for examples/testing)
   */
  async ingestIncomingEvent(event) {
    const eventId = event && event.eventId ? String(event.eventId) : '';
    if (!eventId) return { ok: false, reason: 'missing-event-id' };

    this.cleanupExpiredEvents();

    if (this.processedEvents.has(eventId)) {
      this.metrics.deduped += 1;
      return { ok: true, deduped: true };
    }

    this.processedEvents.set(eventId, Date.now());
    this.metrics.received += 1;
    this.metrics.lastEventAt = Date.now();

    const userId = event && event.userId ? String(event.userId) : '';
    if (userId) this.activeUsers.add(userId);

    return { ok: true, deduped: false };
  }

  getCollectedData() {
    return {
      ...this.metrics,
      activeUsers: this.activeUsers.size,
      cacheSize: this.processedEvents.size,
    };
  }

  cleanupExpiredEvents() {
    const now = Date.now();
    for (const [eventId, ts] of this.processedEvents.entries()) {
      if (now - ts > EVENT_TTL_MS) {
        this.processedEvents.delete(eventId);
      }
    }
  }
}

module.exports = ExtFeishuChannelPlugin;
