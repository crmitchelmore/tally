const { execFileSync } = require('node:child_process');

// Inspect the signed profile, rather than its name or creation date: profiles
// issued before enabling Sign in with Apple cannot sign the updated app.
function supportsAppleSignIn(profileContent) {
  if (!profileContent) return false;
  try {
    const plist = execFileSync('security', ['cms', '-D'], {
      input: Buffer.from(profileContent, 'base64'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const result = execFileSync('python3', ['-c',
      "import plistlib, sys; values = plistlib.loads(sys.stdin.buffer.read()).get('Entitlements', {}).get('com.apple.developer.applesignin', []); print(isinstance(values, list) and 'Default' in values)"
    ], {
      input: plist,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.toString().trim() === 'True';
  } catch {
    return false;
  }
}

module.exports = { supportsAppleSignIn };
