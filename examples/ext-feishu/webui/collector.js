/**
 * ext-feishu WebUI data collection example (not integrated by default)
 * Exports Express-style handler functions by convention:
 * - POST /ext-feishu/collect  records an event
 * - GET  /ext-feishu/stats    returns a summary
 */

const state = {
  events: [],
  counters: {},
};

function addEvent(event) {
  const type = event && event.type ? String(event.type) : 'unknown';
  state.events.push({
    ...event,
    type,
    at: Date.now(),
  });
  state.counters[type] = (state.counters[type] || 0) + 1;

  // Limit memory usage by keeping only the most recent 1000 entries
  if (state.events.length > 1000) {
    state.events.splice(0, state.events.length - 1000);
  }
}

module.exports = async function extFeishuCollector(req, res) {
  if (req.method === 'POST') {
    addEvent(req.body || {});
    return res.json({ ok: true, total: state.events.length });
  }

  return res.json({
    ok: true,
    total: state.events.length,
    counters: state.counters,
    latest: state.events.slice(-20),
  });
};
