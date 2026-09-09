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
  hintCost?: number;
  published?: boolean;
  authorId?: string | null;
  featured?: boolean;
  environment?: string | null;
  solves?: number;
  solved?: boolean;
  prerequisite?: string | null;
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
];
