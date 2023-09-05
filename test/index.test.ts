import net from 'node:net';
import { once } from 'node:events';
import tap from 'tap';
import { connect } from '../src';
import {
  getReaderWriterFromSocket,
  listenAndGetSocketAddress,
  writeAndReadSocket,
} from './utils';

void tap.test(
  'Socket connected to tcp server with secureTransport: off',
  (t) => {
    void t.test(
      'should be able to connect, write, and read data',
      async (t) => {
        let connectCount = 0;
        const message = 'abcde\r\n';
        const server = net.createServer();
        server.on('connection', (c) => {
          connectCount++;
          c.pipe(c);
        });
        const address = await listenAndGetSocketAddress(server);
        const socket = connect(address);
        const result = await writeAndReadSocket(socket, message);
        t.equal(connectCount, 1, 'should connection one time');
        t.equal(result, message, 'should pipe message');
        await socket.close();
        server.close();
        t.end();
      },
    );
    t.end();
  },
);

void tap.test('Socket closed promise', (t) => {
  void t.test(
    '`.closed` and `.close()` should be the same object',
    async (t) => {
      const server = net.createServer();
      const address = await listenAndGetSocketAddress(server);
      const socket = connect(address);
      const closed = socket.closed;
      const close = socket.close();
      t.equal(closed, close);
      await close;
      server.close();
      t.end();
    },
  );
  void t.test(`socket properly closes after .close() is awaited`, async (t) => {
    t.plan(3);
    const server = net.createServer();
    const message = 'abc\r\n';

    server.on('connection', (c) => {
      c.setEncoding('utf-8');
      c.on('data', (data) => {
        t.equal(data, message);
      });
      c.on('end', () => {
        server.close();
      });
    });

    const address = await listenAndGetSocketAddress(server);
    const socket = connect(address);

    const { writer } = getReaderWriterFromSocket(socket);
    await t.resolves(writer.write(message));

    await socket.close();
    await t.rejects(writer.write('x'));

    await once(server, 'close');
  });
  t.end();
});
