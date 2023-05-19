/* eslint-disable @typescript-eslint/no-shadow, @typescript-eslint/no-floating-promises */
import net from 'node:net';
import { once } from 'node:events';
import tap from 'tap';
import { connect } from '../src';

tap.test('Socket connected to tcp server with secureTransport: off', (t) => {
  t.test('should be able to connect, write, and read data', async (t) => {
    let connectCount = 0;
    const m = 'abcde\r\n';
    const server = net.createServer();
    server.on('connection', (c) => {
      connectCount++;
      c.pipe(c);
    });
    server.listen();
    await once(server, 'listening');
    const { port, address } = server.address() as net.AddressInfo;
    const socket = connect({ hostname: address, port });
    const reader = socket.readable.getReader();
    const writer = socket.writable.getWriter();
    await once(server, 'connection');
    await writer.write(m);
    const read = await reader.read();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const res = Buffer.from(read.value).toString();
    t.equal(connectCount, 1);
    t.equal(res, m);
    await socket.close();
    server.close();
    t.end();
  });
  t.end();
});
/* eslint-enable @typescript-eslint/no-shadow, @typescript-eslint/no-floating-promises */
