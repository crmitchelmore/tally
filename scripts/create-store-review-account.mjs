import { randomBytes, publicEncrypt } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Creates only the dedicated review identity; never resets an existing user's password.
const email = 'chrismitchelmore+tallyreview@gmail.com';
const secret = process.env.CLERK_SECRET_KEY;
if (!secret?.startsWith('sk_live_')) throw new Error('A production Clerk key is required');
const password = randomBytes(24).toString('base64url');
const encrypted = publicEncrypt({ key: process.env.STORE_REVIEW_PUBLIC_KEY, oaepHash: 'sha256' },
  Buffer.from(JSON.stringify({ email, password, purpose: 'Tally store review' })));
async function clerk(path, body) {
  const response = await fetch(`https://api.clerk.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Clerk ${response.status}: ${result.errors?.[0]?.code || 'request_failed'}`);
  return result;
}
const existing = await clerk(`users?email_address=${encodeURIComponent(email)}`);
if (existing.length) throw new Error('Review identity already exists; use the saved credentials instead of creating or resetting it');
await clerk('users', { email_address: [email], password, first_name: 'Tally', last_name: 'Review',
  private_metadata: { purpose: 'app-store-review' } });
writeFileSync('store-review-credentials.enc', encrypted, { mode: 0o600 });
console.log('Created dedicated store-review account; credentials are encrypted to the local recovery key.');
