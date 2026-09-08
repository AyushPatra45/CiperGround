# Organizer solutions — keep private

These solutions and the source repository must not be shared with competitors. Public downloadable evidence contains no solution key. Rotate challenge variants before a real event.

## packet-whisperer

Correlate the job with its source and session; deduplicate by sequence, join base64 chunks, then hash the decoded bytes. Trust the captured payload for its exact bytes.

`CTF{cedar:32f8c9f3a82233be}`

## nonce-sense

Subtract the two equations sharing r to recover k. Recover x with modular inverses, then solve the verification equation for its nonce.

`CTF{731:877}`

## paper-trail

Use the registered address on the instruction date, rather than today’s address. Then convert the first qualifying departure to UTC.

`CTF{FDR:0725}`

## dead-drop

Rotate each output byte right by three, then XOR the previous state. Update state using the output byte, not the recovered input.

`CTF{RELAY-42}`

## the-last-commit

Separate the branch head from the deployed manifest. Resolve b22 along its parent chain, then apply the environment override.

`CTF{b22:observe}`

## afterimage

Follow parent-child process links. Add 30 seconds to the store timestamp to normalize to UTC; failed reads are not evidence of exfiltration.

`CTF{req-72:927:140506}`

## common-ground

Compute pairwise GCDs of the moduli. Factor Device 1, calculate phi, invert e modulo phi, and decrypt.

`CTF{RELAY}`

## off-the-grid

The observation is 17:54 civil time. Apply geography, elevation, and the 10-minute window together, then subtract three hours.

`CTF{CRN:1456}`

## signal-lost

Recover the initial state as 0x41 XOR 0x1c. The decoded byte, rather than the ciphertext, feeds the next state.

`CTF{follow_the_state}`

## dependency-hell

Start A and B together. Compare C before D against D before C, then overlap E with the remaining work. A critical-path bound alone does not enforce worker capacity.

`CTF{12:11}`
