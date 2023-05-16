interface SocketOptions {};

interface Socket {
  constructor(hostPort: string, options: SocketOptions);
  readable : ReadableStream;
  writable : WritableStream;
  closed : Promise<void>;
  close() : Promise<void>;
  startTls() : Socket;
}