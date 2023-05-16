import net from 'node:net';

interface SocketOptions {
  secureTransport: 'off' | 'on' | 'starttls';
}

interface SocketAddress {
  /** The hostname to connect to. Example: `vercel.com`. */
  hostname: string;
  /** The port number to connect to. Example: `5432`. */
  port: number;
}

function connect(
  address: SocketAddress | string,
  options?: SocketOptions,
): Socket {
  return new Socket('', options);
}

class Socket {
  readable: ReadableStream;
  writable: WritableStream;
  closed: Promise<void>;
  constructor(hostPort: string, options?: SocketOptions) {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
    this.closed = new Promise(() => {});
  }
  async close(): Promise<void> {}
  startTls(): Socket {
    return new Socket('');
  }
}
