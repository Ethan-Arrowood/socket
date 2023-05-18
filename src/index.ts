import net from 'node:net';
import tls from 'node:tls';
import type { ReadableStream, WritableStream } from 'node:stream/web';

export interface SocketOptions {
  /**
   * Specifies whether or not to use TLS when creating the TCP socket.
   * `off` — Do not use TLS.
   * `on` — Use TLS.
   * `starttls` — Do not use TLS initially, but allow the socket to be upgraded to use TLS by calling startTls().
   */
  secureTransport?: 'off' | 'on' | 'starttls';
  /**
   * Defines whether the writable side of the TCP socket will automatically close on end-of-file (EOF).
   * When set to false, the writable side of the TCP socket will automatically close on EOF.
   * When set to true, the writable side of the TCP socket will remain open on EOF.
   * This option is similar to that offered by the Node.js net module and allows interoperability with code which utilizes it.
   */
  allowHalfOpen?: boolean;
}

export interface SocketAddress {
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
      port: parseInt(url.port),
    };
  }
  return new Socket(address, options);
}

export class Socket {
  readable: ReadableStream;
  writable: WritableStream;
  closed: Promise<void>;

  private socket: net.Socket | tls.TLSSocket;
  private allowHalfOpen: boolean;
  private secureTransport: SocketOptions['secureTransport'];
  private closedResolved = false;
  private closedRejected = false;
  private closedResolve!: () => void;
  private closedReject!: (reason?: any) => void;
  private startTlsCalled = false;

  constructor(
    addressOrSocket: SocketAddress | Socket,
    options?: SocketOptions,
  ) {
    this.secureTransport = options?.secureTransport ?? 'off';
    this.allowHalfOpen = options?.allowHalfOpen ?? true;

    this.closed = new Promise((resolve, reject) => {
      this.closedResolve = (): void => {
        this.closedResolved = true;
        resolve();
      };
      this.closedReject = (): void => {
        this.closedRejected = true;
        reject();
      };
    });

    this.socket =
      addressOrSocket instanceof Socket
        ? new tls.TLSSocket(addressOrSocket.socket)
        : new net.Socket({
            allowHalfOpen: this.allowHalfOpen,
          });

    this.socket.on('close', (hadError) => {
      if (!hadError && !this.closedFulfilled && !this.closedResolved) {
        this.closedResolve();
      }
    });

    this.socket.on('error', (err) => {
      if (!this.closedFulfilled && !this.closedRejected) {
        this.closedReject(err);
      }
    });

    // types are wrong. fixed based on docs https://nodejs.org/dist/latest-v19.x/docs/api/stream.html#streamduplextowebstreamduplex
    const { readable, writable } = net.Socket.Duplex.toWeb(
      this.socket,
    ) as unknown as { readable: ReadableStream; writable: WritableStream };
    this.readable = readable;
    this.writable = writable;

    if (!(addressOrSocket instanceof Socket)) {
      this.socket.connect(addressOrSocket);
    }
  }
  get closedFulfilled(): boolean {
    return this.closedResolved || this.closedRejected;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async close(): Promise<void> {
    this.socket.destroy();
    this.closedResolve();
  }

  startTls(): Socket {
    if (this.secureTransport !== 'starttls') {
      throw new Error("secureTransport must be set to 'starttls'");
    }
    if (this.startTlsCalled) {
      throw new Error('can only call startTls once');
    } else {
      this.startTlsCalled = true;
    }

    void this.close();

    return new Socket(this, { secureTransport: 'starttls' });
  }
}
