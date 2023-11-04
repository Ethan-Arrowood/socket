import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const certsPath = join(__dirname, '/certs');
const caPath = join(certsPath, '/ca');
const serverPath = join(certsPath, '/server');
const clientPath = join(certsPath, '/client');

/**
 * Generate certificates for testing.
 */
function generateCerts(): void {
  // Delete certs directory if it exists
  execSync(`rm -rf ${certsPath}`);

  [certsPath, caPath, serverPath, clientPath].forEach((path) => {
    if (!existsSync(path)) {
      execSync(`mkdir -p ${path}`);
    }
  });

  execSync(
    `openssl genrsa -out ${join(caPath, 'ca.key')} 2048 > /dev/null 2>&1`,
  );
  execSync(
    `openssl req -x509 -new -nodes -key ${join(
      caPath,
      'ca.key',
    )} -sha256 -days 1024 -out ${join(
      caPath,
      'ca.crt',
    )} -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" > /dev/null 2>&1`,
  );
  execSync(
    `openssl genrsa -out ${join(
      serverPath,
      'server.key',
    )} 2048 > /dev/null 2>&1`,
  );
  execSync(
    `openssl req -new -key ${join(serverPath, 'server.key')} -out ${join(
      serverPath,
      'server.csr',
    )} -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" > /dev/null 2>&1`,
  );
  execSync(
    `openssl x509 -req -in ${join(serverPath, 'server.csr')} -CA ${join(
      caPath,
      'ca.crt',
    )} -CAkey ${join(caPath, 'ca.key')} -CAcreateserial -out ${join(
      serverPath,
      'server.crt',
    )} -days 500 -sha256 > /dev/null 2>&1`,
  );
  execSync(
    `openssl genrsa -out ${join(
      clientPath,
      'client.key',
    )} 2048 > /dev/null 2>&1`,
  );
  execSync(
    `openssl req -new -key ${join(clientPath, 'client.key')} -out ${join(
      clientPath,
      'client.csr',
    )} -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" > /dev/null 2>&1`,
  );
  execSync(
    `openssl x509 -req -in ${join(clientPath, 'client.csr')} -CA ${join(
      caPath,
      'ca.crt',
    )} -CAkey ${join(caPath, 'ca.key')} -CAcreateserial -out ${join(
      clientPath,
      'client.crt',
    )} -days 500 -sha256 > /dev/null 2>&1`,
  );
}

/**
 * Deletes/cleans up certificates.
 */
function deleteCerts(): void {
  unlinkSync(join(caPath, 'ca.key'));
  unlinkSync(join(caPath, 'ca.crt'));
  unlinkSync(join(serverPath, 'server.key'));
  unlinkSync(join(serverPath, 'server.csr'));
  unlinkSync(join(serverPath, 'server.crt'));
  unlinkSync(join(clientPath, 'client.key'));
  unlinkSync(join(clientPath, 'client.csr'));
  unlinkSync(join(clientPath, 'client.crt'));

  execSync(`rm -rf ${certsPath}`);
}

export { generateCerts, deleteCerts };
