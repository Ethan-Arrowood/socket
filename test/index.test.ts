import net from 'node:net';
import { once } from 'node:events';
import tap from 'tap';
import { SocketError, connect } from '../src';
import {
  getReaderWriterFromSocket,
  listenAndGetSocketAddress,
  writeAndReadSocket,
} from './utils';

void tap.test(
  'Socket connected to tcp server with secureTransport: off',
  async (t) => {
    t.plan(7);
    let connectCount = 0;
    const message = 'abcde\r\n';

    const server = net.createServer();

    server.on('connection', (c) => {
      connectCount++;
      c.setEncoding('utf-8');
      c.on('data', (data) => {
        t.equal(data, message);
      });
      c.on('end', () => {
        server.close();
      });
      c.pipe(c);
    });

    const address = await listenAndGetSocketAddress(server);
    const socket = connect(address);

    await t.resolveMatch(
      writeAndReadSocket(socket, message),
      message,
      'should pipe message',
    );

    await t.resolveMatch(socket.opened, { localAddress: '::1' });

    const close = socket.close();
    t.equal(
      socket.closed,
      close,
      '`.closed` and `.close()` should be the same object',
    );
    await t.resolves(close);

    await t.rejects(
      writeAndReadSocket(socket, message),
      'should fail to pipe after close',
    );

    await once(server, 'close');

    t.equal(connectCount, 1, 'should connect one time');
  },
);

void tap.test(
  'connect method correctly parses address as string',
  async (t) => {
    t.plan(4);
    let connectCount = 0;
    const message = 'abcde\r\n';

    const server = net.createServer();

    server.on('connection', (c) => {
      connectCount++;
      c.setEncoding('utf-8');
      c.on('data', (data) => {
        t.equal(data, message);
      });
      c.on('end', () => {
        server.close();
      });
    });

    const address = await listenAndGetSocketAddress(server);

    const socket = connect(`localhost:${address.port}`);

    const writer = socket.writable.getWriter();
    await t.resolves(writer.write(message));
    await t.resolves(socket.close());
    await once(server, 'close');
    t.equal(connectCount, 1, 'should connect one time');
  },
);

void tap.test('connect on port 443 works', async (t) => {
  const socket = connect(`github.com:443`);
  await t.resolves(socket.close());
});

for (const data of [
  new Uint8Array([0, 1, 2]),
  new Uint16Array([0, 1, 2]),
  new Uint32Array([0, 1, 2]),
  new BigUint64Array([0n, 1n, 2n]),
]) {
  void tap.test(
    `Read & write ${data.constructor.name} from the server`,
    async (t) => {
      const message =
        data.constructor.name === 'Uint8Array'
          ? (data as Uint8Array)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

      const server = net.createServer();
      server.on('connection', (c) => {
        c.setEncoding('binary');
        c.on('data', (data) => {
          t.equal(data, Buffer.from(message.buffer).toString());
          c.write(message);
        });
        c.on('end', () => {
          server.close();
        });
      });

      const address = await listenAndGetSocketAddress(server);

      const socket = connect(`localhost:${address.port}`);
      const { reader, writer } = getReaderWriterFromSocket(socket);

      await t.resolves(writer.write(message));

      await t.resolveMatch(reader.read(), { value: message, done: false });

      await t.resolves(socket.close());

      await once(server, 'close');
    },
  );
}

void tap.test('SocketError is thrown on connect failure', async (t) => {
  t.plan(2);

  const expectedError = new SocketError('connect ECONNREFUSED 127.0.0.1:1234');
  try {
    const socket = connect('127.0.0.1:1234');
    socket.opened.catch((err) => t.same(err, expectedError));
    await socket.closed;
  } catch (err) {
    t.same(err, expectedError);
  } finally {
    t.end();
  }
});
