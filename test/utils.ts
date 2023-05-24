import type net from 'node:net';
import events from 'node:events';
import type {
  ReadableStreamDefaultReader,
  WritableStreamDefaultWriter,
} from 'node:stream/web';
import type { Socket, SocketAddress } from '../src';

/**
 * Calls `.listen()` on the server and return the address in the form of a Socket API SocketAddress.
 */
export async function listenAndGetSocketAddress(
  server: net.Server,
): Promise<SocketAddress> {
  server.listen();
  await events.once(server, 'listening');
  const { address, port } = server.address() as net.AddressInfo;
  return { hostname: address, port };
}

/**
 * Utility function for extracting the respective reader and writer from a Socket instance.
 */
export function getReaderWriterFromSocket(socket: Socket): {
  reader: ReadableStreamDefaultReader<unknown>;
  writer: WritableStreamDefaultWriter<unknown>;
} {
  return {
    reader: socket.readable.getReader(),
    writer: socket.writable.getWriter(),
  };
}

/**
 * Utility function for writing the `message` to the writer of the `socket`, and then returning the result of the `socket`'s reader as a string.
 */
export async function writeAndReadSocket(
  socket: Socket,
  message: string,
): Promise<string> {
  const { reader, writer } = getReaderWriterFromSocket(socket);
  await writer.write(message);
  const result = await reader.read();
  return Buffer.from(result.value as ArrayBuffer).toString();
}
