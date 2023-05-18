/* eslint-disable @typescript-eslint/no-shadow, @typescript-eslint/no-floating-promises */
import net from 'node:net';
import { once } from 'node:events';
import tap from 'tap';
import { connect } from '../src';

tap.test('tcp secureTransport: off', t => {
    t.test('should connect to basic tcp server', async t => {
        t.plan(1);
        let connectCount = 0;
        const server = net.createServer();
        server.on('connection', () => {
            connectCount++;
        })
        server.listen();
        await once(server, 'listening');
        const { port, address } = server.address() as net.AddressInfo;
        const socket = connect({ hostname: address, port });
        await once(server, 'connection');
        t.equal(connectCount, 1);
        await socket.close();
        server.close();
    })
    t.end();
});
/* eslint-enable @typescript-eslint/no-shadow, @typescript-eslint/no-floating-promises */