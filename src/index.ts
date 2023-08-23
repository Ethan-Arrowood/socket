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
  readable: ReadableStream<unknown>;
  writable: WritableStream<unknown>;
  closed: Promise<void>;

  private socket: net.Socket | tls.TLSSocket;
  private allowHalfOpen: boolean;
  private secureTransport: SocketOptions['secureTransport'];
  private closedResolved = false;
  private closedRejected = false;
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
        this.closedResolved = true;
        resolve(...args);
      };
      this.closedReject = (...args): void => {
        this.closedRejected = true;
        // eslint-disable-next-line prefer-promise-reject-errors
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
    const { readable, writable } = Duplex.toWeb(this.socket) as unknown as {
      readable: ReadableStream<unknown>;
      writable: WritableStream<unknown>;
    };
    this.readable = readable;
    this.writable = writable;
  }

  get closedFulfilled(): boolean {
    return this.closedResolved || this.closedRejected;
  }

  close(): Promise<void> {
    this.socket.destroy();
    this.closedResolve();
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
