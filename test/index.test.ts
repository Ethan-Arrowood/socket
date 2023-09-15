import net from 'node:net';
import { once } from 'node:events';
import tap from 'tap';
import { connect } from '../src';
import { listenAndGetSocketAddress, writeAndReadSocket } from './utils';

void tap.test(
  'Socket connected to tcp server with secureTransport: off',
  async (t) => {
    t.plan(6);
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

    t.equal(connectCount, 1, 'should connect one time');

    await once(server, 'close');
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

    const socket = connect(`tcp://localhost:${address.port}`);

    const writer = socket.writable.getWriter();
    await t.resolves(writer.write(message));

    await t.resolves(socket.close());

    t.equal(connectCount, 1, 'should connect one time');

    await once(server, 'close');
  },
);

void tap.test('Uint8Array can be written to server', async (t) => {
  t.plan(3);
  const message = new Uint8Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', (data) => {
      t.equal(data, Buffer.from(message).toString());
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const writer = socket.writable.getWriter();
  await t.resolves(writer.write(message));

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('Uint8Array can be read from server', async (t) => {
  t.plan(3);
  const message = new Uint8Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', () => {
      c.write(message);
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const reader = socket.readable.getReader();
  await t.resolves(socket.writable.getWriter().write('ready'));
  await t.resolveMatch(reader.read(), message.buffer);

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('Uint16Array can be written to server', async (t) => {
  t.plan(3);
  const message = new Uint16Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', (data) => {
      t.equal(data, Buffer.from(message.buffer).toString());
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const writer = socket.writable.getWriter();
  await t.resolves(
    writer.write(
      new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
    ),
  );

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('Uint16Array can be read from server', async (t) => {
  t.plan(3);
  const message = new Uint16Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', () => {
      c.write(
        new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
      );
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const reader = socket.readable.getReader();
  await t.resolves(socket.writable.getWriter().write('ready'));
  await t.resolveMatch(reader.read(), message.buffer);

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('Uint32Array can be written to server', async (t) => {
  t.plan(3);
  const message = new Uint32Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', (data) => {
      t.equal(data, Buffer.from(message.buffer).toString());
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const writer = socket.writable.getWriter();
  await t.resolves(
    writer.write(
      new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
    ),
  );

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('Uint32Array can be read from server', async (t) => {
  t.plan(3);
  const message = new Uint32Array([0, 1, 2]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', () => {
      c.write(
        new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
      );
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const reader = socket.readable.getReader();
  await t.resolves(socket.writable.getWriter().write('ready'));
  await t.resolveMatch(reader.read(), message.buffer);

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('BigUint64Array can be written to server', async (t) => {
  t.plan(3);
  const message = new BigUint64Array([0n, 1n, 2n]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', (data) => {
      t.equal(data, Buffer.from(message.buffer).toString());
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const writer = socket.writable.getWriter();
  await t.resolves(
    writer.write(
      new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
    ),
  );

  await t.resolves(socket.close());

  await once(server, 'close');
});

void tap.test('BigUint64Array can be read from server', async (t) => {
  t.plan(3);
  const message = new BigUint64Array([0n, 1n, 2n]);

  const server = net.createServer();
  server.on('connection', (c) => {
    c.setEncoding('binary');
    c.on('data', () => {
      c.write(
        new Uint8Array(message.buffer, message.byteOffset, message.byteLength),
      );
    });
    c.on('end', () => {
      server.close();
    });
  });

  const address = await listenAndGetSocketAddress(server);

  const socket = connect(`tcp://localhost:${address.port}`);

  const reader = socket.readable.getReader();
  await t.resolves(socket.writable.getWriter().write('ready'));
  await t.resolveMatch(reader.read(), message.buffer);

  await t.resolves(socket.close());

  await once(server, 'close');
});
