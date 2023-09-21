import net from 'node:net';
import tls from 'node:tls';
import { Duplex } from 'node:stream';
import type { ReadableStream, WritableStream } from 'node:stream/web';
import type { SocketAddress, SocketOptions } from './types';
import { isSocketAddress } from './is-socket-address';

export function connect(
  address: SocketAddress | string,
  options?: SocketOptions,
): Socket {
  if (typeof address === 'string') {
    const url = new URL("https://" + address);
    // eslint-disable-next-line no-param-reassign -- there is no harm reassigning to this param
    address = {
      hostname: url.hostname,
      port: parseInt(url.port == "" ? "443" : url.port),
    };
  }
  return new Socket(address, options);
}

export class Socket {
  readable: ReadableStream<unknown>;
  writable: WritableStream<unknown>;
  closed: Promise<void>;

  private socket: net.Socket | tls.TLSSocket;
  private allowHalfOpen: boolean;
  private secureTransport: SocketOptions['secureTransport'];
  private closedResolve!: () => void;
  private closedReject!: (reason?: unknown) => void;
  private startTlsCalled = false;

  constructor(
    addressOrSocket: SocketAddress | net.Socket,
    options?: SocketOptions,
  ) {
    this.secureTransport = options?.secureTransport ?? 'off';
    this.allowHalfOpen = options?.allowHalfOpen ?? true;

    this.closed = new Promise((resolve, reject) => {
      this.closedResolve = (...args): void => {
        resolve(...args);
      };
      this.closedReject = (...args): void => {
        // eslint-disable-next-line prefer-promise-reject-errors -- ESLint gets this wrong as we are completely forwarding the arguments to reject.
        reject(...args);
      };
    });

    if (isSocketAddress(addressOrSocket)) {
      const connectOptions: net.NetConnectOpts = {
        host: addressOrSocket.hostname,
        port: addressOrSocket.port,
        allowHalfOpen: this.allowHalfOpen,
      };
      if (this.secureTransport === 'on') {
        this.socket = tls.connect(connectOptions);
      } else {
        this.socket = net.connect(connectOptions);
      }
    } else {
      this.socket = new tls.TLSSocket(addressOrSocket);
    }

    this.socket.on('close', (hadError) => {
      if (!hadError) {
        this.closedResolve();
      }
    });

    this.socket.on('error', (err) => {
      this.closedReject(err);
    });

    // types are wrong. fixed based on docs https://nodejs.org/dist/latest/docs/api/stream.html#streamduplextowebstreamduplex
    const { readable, writable } = Duplex.toWeb(this.socket) as unknown as {
      readable: ReadableStream<unknown>;
      writable: WritableStream<unknown>;
    };
    this.readable = readable;
    this.writable = writable;
  }

  close(): Promise<void> {
    this.socket.end(() => {
      this.closedResolve();
    });
    return this.closed;
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

    return new Socket(this.socket, { secureTransport: 'on' });
  }
}

export type * from './types';
