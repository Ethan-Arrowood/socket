import tap from 'tap';
import { isSocketAddress } from '../src/is-socket-address';

void tap.test(
  'isSocketAddress correctly validates Socket API socket address objects',
  (t) => {
    t.ok(isSocketAddress({ hostname: 'localhost', port: 0 }));
    t.notOk(isSocketAddress({ hostname: 'localhost' }), 'missing port');
    t.notOk(isSocketAddress({ port: 0 }), 'missing hostname');
    t.notOk(isSocketAddress({}), 'empty object');
    t.notOk(isSocketAddress(null), 'null');
    t.end();
  },
);
