const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { supportsAppleSignIn } = require('./apple-signin-profile.cjs');

const directory = mkdtempSync(join(tmpdir(), 'tally-profile-test-'));
after(() => rmSync(directory, { recursive: true, force: true }));
const key = join(directory, 'key.pem');
const cert = join(directory, 'cert.pem');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
  '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=Disposable Profile Test'],
{ stdio: 'ignore' });

function signedProfile(entitlements) {
  const path = join(directory, 'profile.plist');
  writeFileSync(path, `<?xml version="1.0"?><plist version="1.0"><dict>
    <key>ExpirationDate</key><date>2030-01-01T00:00:00Z</date>
    <key>Entitlements</key><dict>${entitlements}</dict>
  </dict></plist>`);
  return execFileSync('openssl', ['cms', '-sign', '-binary', '-nodetach',
    '-in', path, '-signer', cert, '-inkey', key, '-outform', 'DER']).toString('base64');
}

test('accepts a signed profile with the Default Apple sign-in entitlement', () => {
  assert.equal(supportsAppleSignIn(signedProfile(
    '<key>com.apple.developer.applesignin</key><array><string>Default</string></array>'
  )), true);
});

test('rejects an older profile without Apple sign-in', () => {
  assert.equal(supportsAppleSignIn(signedProfile('')), false);
});

test('rejects the wrong entitlement value', () => {
  assert.equal(supportsAppleSignIn(signedProfile(
    '<key>com.apple.developer.applesignin</key><array><string>Other</string></array>'
  )), false);
});

test('rejects missing and malformed profiles', () => {
  assert.equal(supportsAppleSignIn(undefined), false);
  assert.equal(supportsAppleSignIn(Buffer.from('invalid').toString('base64')), false);
});
