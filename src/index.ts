import net from 'node:net';
import tls from 'node:tls';
import { Duplex } from 'node:stream';
import type { ReadableStream, WritableStream } from 'node:stream/web';
import type { SocketAddress, SocketInfo, SocketOptions } from './types';
import { isSocketAddress } from './is-socket-address';

export function connect(
  address: SocketAddress | string,
  options?: SocketOptions,
): Socket {
  if (typeof address === 'string') {
    const url = new URL(`https://${address}`);
    // eslint-disable-next-line no-param-reassign -- there is no harm reassigning to this param
    address = {
      hostname: url.hostname,
      port: parseInt(url.port === '' ? '443' : url.port),
    };
  }
  return new Socket(address, options);
}

export class Socket {
  readable: ReadableStream<unknown>;
  writable: WritableStream<unknown>;
  opened: Promise<SocketInfo>;
  closed: Promise<void>;

  private socket: net.Socket | tls.TLSSocket;
  private allowHalfOpen: boolean;
  private secureTransport: SocketOptions['secureTransport'];
  private openedIsResolved: boolean;
  private openedResolve!: (info: SocketInfo) => void;
  private openedReject!: (reason?: unknown) => void;
  private closedResolve!: () => void;
  private closedReject!: (reason?: unknown) => void;
  private startTlsCalled = false;

  constructor(
    addressOrSocket: SocketAddress | net.Socket,
    options?: SocketOptions,
  ) {
    this.secureTransport = options?.secureTransport ?? 'off';
    this.allowHalfOpen = options?.allowHalfOpen ?? true;

    this.openedIsResolved = false;
    this.opened = new Promise((resolve, reject) => {
      this.openedResolve = (info): void => {
        this.openedIsResolved = true;
        resolve(info);
      };
      this.openedReject = (...args): void => {
        this.openedIsResolved = true;
        // eslint-disable-next-line prefer-promise-reject-errors -- ESLint gets this wrong as we are completely forwarding the arguments to reject.
        reject(...args);
      };
    });

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
        this.socket = tls.connect({
          ...connectOptions,
          ALPNProtocols: options?.alpn,
          servername: options?.sni,
        });
      } else {
        this.socket = net.connect(connectOptions);
      }
    } else {
      this.socket = new tls.TLSSocket(addressOrSocket, {
        ALPNProtocols: options?.alpn,
      });
    }

    if (this.socket instanceof tls.TLSSocket) {
      this.socket.on('secureConnect', () => {
        // Typescript doesn't deduce that it can only be TLSSocket in this scope
        const tlsSocket = this.socket as tls.TLSSocket;

        let alpnProtocol: string | undefined;
        if (typeof tlsSocket.alpnProtocol === 'string') {
          alpnProtocol = tlsSocket.alpnProtocol;
        }

        this.openedResolve({
          remoteAddress: this.socket.remoteAddress,
          localAddress: this.socket.localAddress,
          alpn: alpnProtocol,
        });
      });
    } else {
      this.socket.on('connect', () => {
        this.openedResolve({
          remoteAddress: this.socket.remoteAddress,
          localAddress: this.socket.localAddress,
        });
      });
    }

    this.socket.on('close', (hadError) => {
      if (!hadError) {
        this.closedResolve();
      }
    });

    this.socket.on('error', (err) => {
      const socketError = new SocketError(
        err instanceof Error ? err.message : (err as string),
      );
      if (!this.openedIsResolved) {
        this.openedReject(socketError);
      }
      this.closedReject(socketError);
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
      throw new SocketError("secureTransport must be set to 'starttls'");
    }
    if (this.startTlsCalled) {
      throw new SocketError('can only call startTls once');
    } else {
      this.startTlsCalled = true;
    }

    return new Socket(this.socket, { secureTransport: 'on' });
  }
}

export class SocketError extends TypeError {
  constructor(message: string) {
    super(`SocketError: ${message}`);
  }
}

export type * from './types';
