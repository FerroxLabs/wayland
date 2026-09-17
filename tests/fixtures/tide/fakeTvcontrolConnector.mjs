// Stand-in for the TVControl MCP connector, spoken to over stdio by the TC-TIDE collector.
// A daily chart whose TC-TIDE panel renders for every symbol except FAKE_UNREADABLE.
// FAKE_SLOW symbols (and every unreadable one) take FAKE_SLOW_MS to answer the panel read,
// the way a real table wait does, so a pass budget can be exhausted deterministically.
import readline from 'node:readline';

const list = (name) => new Set((process.env[name] || '').split(',').filter(Boolean));
const unreadable = list('FAKE_UNREADABLE');
const slow = list('FAKE_SLOW');
const SLOW_MS = Number(process.env.FAKE_SLOW_MS || 0);
let symbol = 'NASDAQ:START';
let resolution = '60';

const reply = (id, value) =>
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(value) }] } })}\n`
  );
const bars = (count) =>
  Array.from({ length: count }, (_, i) => ({ time: 1780000000 + i * 86400, close: 50 + symbol.length + i }));

const tools = {
  chart_get_state: () => ({ success: true, symbol, resolution, chart_id: 'fake-chart' }),
  chart_set_symbol: (args) => ((symbol = args.symbol), { success: true }),
  chart_set_timeframe: (args) => ((resolution = args.timeframe === '1D' ? 'D' : args.timeframe), { success: true }),
  data_get_ohlcv: (args) => ({ success: true, bars: bars(args.count || 2) }),
  data_get_pine_tables: () =>
    unreadable.has(symbol)
      ? { success: true, studies: [] }
      : {
          success: true,
          studies: [
            {
              tables: [
                {
                  cells: [
                    ['TIDE', `${symbol.split(':').pop()} · 1D`, ''],
                    ['Action', 'WAIT', ''],
                  ],
                },
              ],
            },
          ],
        },
};

readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  if (message.method === 'initialize') return reply(message.id, { protocolVersion: '2024-11-05' });
  if (message.method !== 'tools/call') return;
  const { name, arguments: args = {} } = message.params;
  if (name === 'data_get_pine_tables' && (slow.has(symbol) || unreadable.has(symbol))) {
    await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
  }
  const tool = tools[name];
  reply(message.id, tool ? tool(args) : { success: false, error: `no tool ${name}` });
});
