import net from 'node:net';

interface SocketOptions {}

class Socket {
  readable: ReadableStream;
  writable: WritableStream;
  closed: Promise<void>;
  constructor(hostPort: string, options: SocketOptions) {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
    this.closed = new Promise(() => {});
  }
  async close(): Promise<void> {}
  startTls(): Socket {
    return new Socket('', {});
  }
}
