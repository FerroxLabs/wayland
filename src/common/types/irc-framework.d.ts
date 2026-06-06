/**
 * Minimal type shim for irc-framework (no upstream @types package).
 * Only the surface used by IrcPlugin is typed; everything else is `unknown`.
 */
declare module 'irc-framework' {
  import { EventEmitter } from 'node:events';

  interface IrcClientOptions {
    host: string;
    port: number;
    tls?: boolean;
    nick?: string;
    username?: string;
    gecos?: string;
    password?: string;
    auto_reconnect?: boolean;
    account?: { account: string; password: string };
    [key: string]: unknown;
  }

  class Client extends EventEmitter {
    user: { nick: string };
    connected: boolean;
    connect(options?: IrcClientOptions): void;
    quit(message?: string): void;
    join(channel: string, key?: string): void;
    say(target: string, message: string): void;
  }

  const _default: { Client: typeof Client };
  export default _default;
}
