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
  /**
   * The Application-Layer Protocol Negotiation list to send, as an array of strings.
   * If the server agrees with one of the protocols specified in this list, it will
   * return the matching protocol in the info property. May be specified if and only
   * if secureTransport is on or starttls.
   */
  alpn?: string[];
  /**
   * The Server Name Indication TLS option to send as part of the TLS handshake.
   * If specified, requests that the server send a certificate with a matching
   * common name. May be specified if and only if secureTransport is on or starttls.
   */
  sni?: string;
}

export interface SocketAddress {
  /** The hostname to connect to. Example: `vercel.com`. */
  hostname: string;
  /** The port number to connect to. Example: `5432`. */
  port: number;
}

export interface SocketInfo {
  remoteAddress?: string;
  localAddress?: string;
  alpn?: string;
}
