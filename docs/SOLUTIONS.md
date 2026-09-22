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

## hawkins-fourth-signal

Normalize both clocks before correlating. The four matching camera-local seconds are 22:12:17, 22:18:17, 22:25:17 and 22:33:17. Inspect those frames’ sequential RGB LSBs and keep only payloads marked VALID KQ4.

`CTF{THE_GATE_CLOSES_AT_0315:<personal token>}`

## nevermore-murder-board

The valid witnesses are Ada, Bram, Dahlia and Faye. Convert the east-wing display by subtracting seven minutes, then read Q4/2, M2/5, A7/1 and V3/4 in alphabetical witness order.

`CTF{RAVENS_REMEMBER_UNEDITED_INK}`

## ravens-of-the-seven-realms

Validate each registered SHA-256 seal and follow PREVIOUS from GENESIS. The valid route is FROSTHOLD → EMBERFORD → MOONKEEP → SUNSPIRE, giving key FEMS. Place ciphertext columns back in alphabetical key order before reading rows.

`CTF{THE_TRUE_HEIR_BURNS_THE_LEDGER:<personal token>}`

## pensieve-missing-hour

The controller confirms memories 021, 034, 055 and 089. Sort them by original capture time, then extract sequential RGB LSB text from each corresponding portrait.

`CTF{MEMORY_LEAVES_A_SILVER_TRACE}`

## red-console-protocol

Open Developer Tools on the challenge website. The Console announces a window object; call its help method, then probe the three node names visible in the DOM.

`CTF{WAKE_THE_RED_SIGNAL:<personal token>}`

## last-screening

CAM 02 is 17 minutes slow, so its 22:53 frame occurred at 23:10. Match that corrected time to the rental ledger, then use the maintenance aisle for unlabeled returns.

`CTF{REWIND_THE_FINAL_FRAME}`

## baker-street-packet

Inspect the dispatch response header and Base64-decode its telegram. The ledger response names the two headers required by the vault.

`CTF{THE_HEADER_WAS_THE_FOOTPRINT}`
