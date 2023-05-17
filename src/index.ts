import net from 'node:net';
import type { ReadableStream, WritableStream } from 'node:stream/web';

interface SocketOptions {
  /** 
   * Specifies whether or not to use TLS when creating the TCP socket.
   * `off` — Do not use TLS.
   * `on` — Use TLS.
   * `starttls` — Do not use TLS initially, but allow the socket to be upgraded to use TLS by calling startTls().
   */
  secureTransport: 'off' | 'on' | 'starttls';
  /**
   * Defines whether the writable side of the TCP socket will automatically close on end-of-file (EOF).
   * When set to false, the writable side of the TCP socket will automatically close on EOF.
   * When set to true, the writable side of the TCP socket will remain open on EOF.
   * This option is similar to that offered by the Node.js net module and allows interoperability with code which utilizes it.
   */
  allowHalfOpen: boolean;
}

interface SocketAddress {
  /** The hostname to connect to. Example: `vercel.com`. */
  hostname: string;
  /** The port number to connect to. Example: `5432`. */
  port: number;
}

export function connect(
  address: SocketAddress | string,
  options?: SocketOptions,
): Socket {
  if (typeof address === 'string') {
    const url = new URL(address);
    // eslint-disable-next-line no-param-reassign
    address = {
      hostname: url.hostname,
      port: parseInt(url.port)
    }
  }
  return new Socket(address, options);
}

export class Socket {

  socket: net.Socket;
  readable: ReadableStream;
  writable: WritableStream;
  closed: Promise<void>;

  private closedResolved = false;
  private closedRejected = false;
  private closedResolve!: () => void;
  private closedReject!: (reason?: any) => void;

  constructor(address: SocketAddress, options: SocketOptions = { secureTransport: "off", allowHalfOpen: true }) {

    this.closed = new Promise((resolve, reject) => {
      this.closedResolve = (): void => {
        this.closedResolved = true;
        resolve();
      };
      this.closedReject = (): void => {
        this.closedRejected = true;
        reject();
      }
    });

    this.socket = new net.Socket({
      allowHalfOpen: options.allowHalfOpen
    })

    this.socket.on('close', (hadError) => {
      if (!hadError && !this.closedFulfilled && !this.closedResolved) {
        this.closedResolve();
      }
    })

    this.socket.on('error', (err) => {
      if (!this.closedFulfilled && !this.closedRejected) {
        this.closedReject(err);
      }
    })

    // types are wrong. fixed based on docs https://nodejs.org/dist/latest-v19.x/docs/api/stream.html#streamduplextowebstreamduplex
    const { readable, writable } = net.Socket.Duplex.toWeb(this.socket) as unknown as { readable: ReadableStream, writable: WritableStream};
    this.readable = readable;
    this.writable = writable;

    this.socket.connect(address)

  }
  get closedFulfilled (): boolean {
    return this.closedResolved || this.closedRejected
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async close(): Promise<void> {
    this.socket.destroy();
    this.closedResolve();
  }
  // TODO
  // startTls(): Socket {
  // }
}
