import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import tap from 'tap';
import { connect } from '../src';
import { listenAndGetSocketAddress, writeAndReadSocket } from './utils';

function getTLSServer(): tls.Server {
  const server = tls.createServer({
    key: fs.readFileSync(path.join(__dirname, '/certs/server/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/certs/server/server.crt')),
    ca: fs.readFileSync(path.join(__dirname, '/certs/ca/ca.crt')),
    rejectUnauthorized: false,
  });

  return server;
}

void tap.test('Socket `connect` with TLS', (t) => {
  t.before(() => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  });

  void t.test('with `secureTransport: "on"`', (t) => {
    void t.test('should connect securely, write, and read data', async (t) => {
      let connectCount = 0;
      const message = 'abcde\r\n';
      const server = getTLSServer();
      server.on('connection', () => {
        connectCount++;
      });
      server.on('secureConnection', (c) => {
        connectCount++;
        c.pipe(c);
      });
      const address = await listenAndGetSocketAddress(server);
      const socket = connect(address, { secureTransport: 'on' });
      const result = await writeAndReadSocket(socket, message);
      t.equal(connectCount, 2, 'should connect two times');
      t.equal(result, message, 'should pipe message');
      await socket.close();
      server.close();
      t.end();
    });

    void t.test('should not be able to call `.startTls()`', async (t) => {
      const server = getTLSServer();
      const address = await listenAndGetSocketAddress(server);
      const socket = connect(address, { secureTransport: 'on' });
      t.throws(
        () => {
          socket.startTls();
        },
        "secureTransport must be set to 'starttls'",
        'calling .startTls() throws an error',
      );
      await socket.close();
      server.close();
      t.end();
    });

    t.end();
  });

  void t.test('with `secureTransport: "starttls"`', (t) => {
    void t.test(
      'should connect securely (on demand), write, and read data',
      async (t) => {
        let connectCount = 0;
        const message = 'abcde\r\n';
        const server = getTLSServer();
        server.on('connection', () => {
          connectCount++;
        });
        server.on('secureConnection', (c) => {
          connectCount++;
          c.pipe(c);
        });
        const address = await listenAndGetSocketAddress(server);
        const socket = connect(address, { secureTransport: 'starttls' });
        const secureSocket = socket.startTls();
        const result = await writeAndReadSocket(secureSocket, message);
        t.equal(connectCount, 2, 'should connect two times');
        t.equal(result, message, 'should pipe message');
        await socket.close();
        await secureSocket.close();
        server.close();
        t.end();
      },
    );

    void t.test('should only be able to call startTls once', async (t) => {
      const server = getTLSServer();
      const address = await listenAndGetSocketAddress(server);
      const socket = connect(address, { secureTransport: 'starttls' });
      const secureSocket = socket.startTls();
      t.throws(
        () => {
          socket.startTls();
        },
        'can only call startTls once',
        'second call to .startTls() throws an error',
      );
      await socket.close();
      await secureSocket.close();
      server.close();
      t.end();
    });
    t.end();
  });

  t.end();
});
