export const categories = [
  'All challenges',
  'Web',
  'Forensics',
  'Cryptography',
  'OSINT',
  'Reverse Engineering',
  'Misc',
];
export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  summary: string;
  description: string;
  tags: string[];
  artifact: string;
  site?: string;
  hintCost?: number;
  published?: boolean;
  authorId?: string | null;
  featured?: boolean;
  environment?: string | null;
  solves?: number;
  solved?: boolean;
  prerequisite?: string | null;
  /** The evidence yields a core answer; the final suffix is unique per solo player/team. */
  dynamic?: boolean;
  personalToken?: string;
};
export const catalog: Challenge[] = [
  {
    id: 'ghost-in-the-cache',
    title: 'Ghost in the Cache',
    category: 'Web',
    difficulty: 'Medium',
    points: 350,
    summary: 'One cache. Two interpretations. Someone else’s secrets.',
    description:
      'Northstar’s invoice gateway caches responses before the application checks access. Study the provided gateway source, map the cache key, and chain a support preview with a cache collision to retrieve the restricted invoice. The flag is generated inside your own isolated instance.',
    tags: ['Cache poisoning', 'Access control'],
    artifact: 'ghost-in-the-cache.txt',
    featured: true,
    environment: 'cache',
  },
  {
    id: 'packet-whisperer',
    title: 'Packet Whisperer',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 150,
    summary: 'The traffic stopped. The conversation didn’t.',
    description:
      'A telemetry service transmitted a file through DNS labels. Reconstruct the session from the packet export, discard retransmissions and decoy sessions, order the chunks, then validate the decoded payload against the endpoint audit log. Submit CTF{session_id:sha256_of_payload_first_16_hex}.',
    tags: ['Network analysis', 'DNS'],
    artifact: 'packet-whisperer.txt',
  },
  {
    id: 'nonce-sense',
    title: 'Nonce Sense',
    category: 'Cryptography',
    difficulty: 'Hard',
    points: 450,
    summary: 'Two signatures. One mistake that changes everything.',
    description:
      'The signing appliance repeated a nonce after a failover. Identify the two related audit entries, recover the nonce and private scalar using the documented toy signature equation, and verify against the third signature. Submit CTF{private_scalar:third_nonce}. All arithmetic is modulo q.',
    tags: ['Nonce reuse', 'Modular arithmetic'],
    artifact: 'nonce-sense.txt',
  },
  {
    id: 'paper-trail',
    title: 'Paper Trail',
    category: 'OSINT',
    difficulty: 'Medium',
    points: 300,
    summary: 'A quiet acquisition. A very public paper trail.',
    description:
      'Use this self-contained fictional public-records archive. Match the acquisition to a shell company, follow its historical address, and cross-reference the transit notice to identify the collection point and time in UTC. Submit CTF{station_code:HHMM}. No real people or outside services are involved.',
    tags: ['Public records', 'Timeline'],
    artifact: 'paper-trail.txt',
  },
  {
    id: 'dead-drop',
    title: 'Dead Drop',
    category: 'Reverse Engineering',
    difficulty: 'Hard',
    points: 500,
    summary: 'A small binary with something big to hide.',
    description:
      'Recover the original eight-byte access code from a small register machine. The trace describes the execution semantics; the comparison bytes are generated after a stateful transform. Reverse the feedback and rotate operations. Submit CTF{recovered_ascii_code}.',
    tags: ['Virtual machine', 'Data flow'],
    artifact: 'dead-drop.txt',
  },
  {
    id: 'the-last-commit',
    title: 'The Last Commit',
    category: 'Misc',
    difficulty: 'Easy',
    points: 100,
    summary: 'The history is messy. The truth is still in there.',
    description:
      'A deployment was rebuilt from a signed manifest after a rollback. Reconcile the commit DAG with the deployment event, select the configuration actually deployed, and calculate its effective mode. Submit CTF{commit_id:effective_mode}. Do not assume the newest timestamp is the deployed revision.',
    tags: ['Git history', 'Incident response'],
    artifact: 'the-last-commit.txt',
  },
  {
    id: 'signed-sealed',
    title: 'Signed, Sealed, Delivered',
    category: 'Web',
    difficulty: 'Hard',
    points: 450,
    summary: 'The receipt is valid. The transaction is not.',
    description:
      'An order service authenticates signed receipts but keeps authorization state separately. Inspect the provided source, obtain a legitimate receipt, and exploit an ambiguous field parser to promote the order. Retrieve the instance-specific flag from the dispatch endpoint.',
    tags: ['Parser differential', 'Business logic'],
    artifact: 'signed-sealed.txt',
    environment: 'receipts',
  },
  {
    id: 'afterimage',
    title: 'Afterimage',
    category: 'Forensics',
    difficulty: 'Medium',
    points: 300,
    summary: 'Rebuild the minutes that the logs forgot.',
    description:
      'Correlate process, object-store, and gateway events. Normalize clock offsets, identify the process that actually fetched the protected object, and link it to the initiating request. Submit CTF{request_id:pid:UTC_HHMMSS}.',
    tags: ['Log correlation', 'Clock skew'],
    artifact: 'afterimage.txt',
    prerequisite: 'packet-whisperer',
  },
  {
    id: 'common-ground',
    title: 'Common Ground',
    category: 'Cryptography',
    difficulty: 'Medium',
    points: 300,
    summary: 'Independent keys. An unexpectedly shared foundation.',
    description:
      'A fleet created RSA keys from a faulty entropy pool. Find the nontrivial shared factor, reconstruct the first device’s private key, decrypt its integer ciphertext, then interpret the resulting ASCII bytes. Submit CTF{plaintext}. This is deliberately small textbook RSA for education.',
    tags: ['RSA', 'Shared primes'],
    artifact: 'common-ground.txt',
  },
  {
    id: 'off-the-grid',
    title: 'Off the Grid',
    category: 'OSINT',
    difficulty: 'Hard',
    points: 400,
    summary: 'Three observations. One place where they all meet.',
    description:
      'Cross-reference the fictional survey, timetable, and weather bulletin. Apply every observation, including the local clock correction. Identify the only site and departure compatible with the evidence. Submit CTF{site_code:UTC_HHMM}.',
    tags: ['Geospatial', 'Evidence correlation'],
    artifact: 'off-the-grid.txt',
  },
  {
    id: 'signal-lost',
    title: 'Signal Lost',
    category: 'Reverse Engineering',
    difficulty: 'Medium',
    points: 300,
    summary: 'Follow the state, not the strings.',
    description:
      'Reverse the firmware’s rolling XOR decoder. Every output byte changes the next state, so a static XOR key will fail. Use the calibration packet to establish the initial state, then decode the message. Submit CTF{decoded_message}.',
    tags: ['Firmware', 'State machine'],
    artifact: 'signal-lost.txt',
  },
  {
    id: 'dependency-hell',
    title: 'Dependency Hell',
    category: 'Misc',
    difficulty: 'Hard',
    points: 400,
    summary: 'Every step has a cost. Order is everything.',
    description:
      'A recovery scheduler must restore services with dependencies and only two workers. Find the minimum possible completion time and the time that the vault becomes available under the optimal schedule. Submit CTF{makespan:vault_ready_time}. Durations are integer minutes; tasks cannot be interrupted.',
    tags: ['Dependency graph', 'Scheduling'],
    artifact: 'dependency-hell.txt',
  },
  {
    id: 'hawkins-fourth-signal',
    title: 'Hawkins: The Fourth Signal',
    category: 'Forensics',
    difficulty: 'Hard',
    points: 700,
    summary: 'Four cameras went dark. Only one timeline belongs to this world.',
    description:
      'An original 1980s supernatural-mystery case archive contains clock-skewed radio logs, contact sheets, maintenance notes, and many tempting fake flags. Reconstruct the true outage sequence, identify the four frames selected by the calibrated receiver, and inspect their PNG bit planes with zsteg or an equivalent LSB tool. Join the recovered fragments in event order. Your evidence yields the CORE; append the personal token shown below and submit CTF{CORE:TOKEN}. No outside browsing is required.',
    tags: ['PNG steganography', 'Timeline reconstruction', 'Dynamic flag'],
    artifact: 'hawkins-fourth-signal.zip',
    featured: true,
    dynamic: true,
  },
  {
    id: 'nevermore-murder-board',
    title: 'Nevermore: A Murder of Clues',
    category: 'OSINT',
    difficulty: 'Hard',
    points: 600,
    summary: 'Everyone left a statement. Almost everyone lied about the time.',
    description:
      'Work through a self-contained gothic academy case board: class schedules, edited notices, witness statements, a library index, and a raven photograph. Normalize bell times, eliminate impossible witnesses, then use the surviving shelf references to extract a phrase from the catalog. Several flags and one famous video link are deliberate dead ends. Submit the one flag supported by every independent source.',
    tags: ['Source validation', 'Constraint solving', 'Decoy analysis'],
    artifact: 'nevermore-murder-board.zip',
  },
  {
    id: 'ravens-of-the-seven-realms',
    title: 'Ravens of the Seven Realms',
    category: 'Cryptography',
    difficulty: 'Hard',
    points: 750,
    summary: 'The seals are genuine. The order in which they arrived is not.',
    description:
      'A fantasy court intercepted a directory of raven dispatches. Validate chained wax-seal digests, reconstruct the only route consistent with travel times and weather closures, reject forged but well-formed scrolls, and use the authentic route as a columnar-transposition key. The plaintext provides a CORE rather than a reusable flag; append your personal token as CTF{CORE:TOKEN}. This challenge is fully fictional and offline.',
    tags: ['Hash chains', 'Transposition cipher', 'Dynamic flag'],
    artifact: 'ravens-of-the-seven-realms.zip',
    prerequisite: 'common-ground',
    dynamic: true,
  },
  {
    id: 'pensieve-missing-hour',
    title: 'The Pensieve of the Missing Hour',
    category: 'Misc',
    difficulty: 'Hard',
    points: 700,
    summary: 'A memory can be altered. Its bookkeeping is harder to fool.',
    description:
      'Explore an original magical-archive evidence tree containing damaged memory indexes, portraits, checksum ledgers, mirrored annotations, and nested faculty folders. Determine which memories survived the clock rollback, collect four image fragments, inspect the correct color-channel bit planes, and apply the curator’s ordering rule. Decoy flags fail either the checksum ledger or the chronology. Submit CTF{recovered_phrase}.',
    tags: ['File archaeology', 'Image steganography', 'Checksums'],
    artifact: 'pensieve-missing-hour.zip',
    prerequisite: 'afterimage',
  },
  {
    id: 'red-console-protocol',
    title: 'The Red Console Protocol',
    category: 'Web',
    difficulty: 'Medium',
    points: 450,
    summary: 'The page is quiet. The console is waiting for you to wake it.',
    description:
      'Enter a standalone cyber-simulation website and investigate its rendered clues, DOM attributes, and browser console. Discover the exposed console object, probe the three unstable nodes, and issue the correct unlock phrase. The website reveals a flag containing your personal solo/team token, so copying another player’s result will fail. This challenge has no downloadable evidence.',
    tags: ['Browser console', 'DOM inspection', 'Dynamic flag'],
    artifact: '',
    site: '/labs/red-console',
    dynamic: true,
  },
  {
    id: 'last-screening',
    title: 'The Last Screening',
    category: 'Web',
    difficulty: 'Hard',
    points: 600,
    summary:
      'The video store closed at midnight. One rental was never returned.',
    description:
      'Investigate a long-form retro thriller website with separate incident, rental, security, maintenance, and terminal views. Reconcile a drifting CCTV clock with the checkout ledger, identify the correct customer code and recover the missing aisle suffix. One optional training-video link is a deliberate rickroll; it is the only rickroll in the new web set. Enter the reconstructed access code on the website to reveal the flag.',
    tags: ['Multi-page investigation', 'Timeline', 'Web puzzle'],
    artifact: '',
    site: '/labs/last-screening',
  },
  {
    id: 'baker-street-packet',
    title: 'The Baker Street Packet',
    category: 'Web',
    difficulty: 'Hard',
    points: 650,
    summary:
      'Every request leaves a footprint. This one hid inside the headers.',
    description:
      'Open an original detective-themed case website and follow its live same-origin API trail. Read the dispatch, correlate the telegram with the evidence ledger, then reconstruct the final request using the required query value and HTTP headers. The final endpoint returns the flag only when the complete evidence order is supplied. No download and no external services are required.',
    tags: ['HTTP headers', 'API investigation', 'Request reconstruction'],
    artifact: '',
    site: '/labs/baker-street-packet',
  },
];

export function challengeVisual(id: string) {
  const index = catalog.findIndex((challenge) => challenge.id === id);
  const cell = index < 0 ? 19 : index % 20;
  return {
    backgroundPosition: `${(cell % 5) * 25}% ${Math.floor(cell / 5) * (100 / 3)}%`,
  };
}
