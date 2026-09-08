from pathlib import Path
import hashlib,json,base64,random,math
P=Path('public/artifacts');P.mkdir(parents=True,exist_ok=True)
solutions={};hints={}
def add(id,artifact,answer,hint):
 (P/(id+'.txt')).write_text(artifact.strip()+'\n'); solutions[id]=answer;hints[id]=hint
payload=b'Northstar export 417: maintenance window moved to 03:40 UTC. Approver: relay-7.'
b64=base64.b64encode(payload).decode();chunks=[b64[i:i+20] for i in range(0,len(b64),20)]
lines=[f'2026-06-17T03:11:{10+i:02}Z DNS 10.4.0.8 -> 10.4.0.53 session=cedar seq={i} data={c}' for i,c in enumerate(chunks)]
lines += [lines[1], '2026-06-17T03:11:12Z DNS 10.4.0.9 -> 10.4.0.53 session=birch seq=0 data=ZGVjb3ktdHJhZmZpYw==']
random.Random(8).shuffle(lines)
add('packet-whisperer','''NORTHSTAR / PACKET EXPORT
DNS data labels use base64; sequence numbers start at zero. Packet order is capture order.
AUDIT: export job 417 used source=10.4.0.8 session=cedar; payload length=78 bytes.
'''+ '\n'.join(lines),f'CTF{{cedar:{hashlib.sha256(payload).hexdigest()[:16]}}}','Correlate the job with its source and session; deduplicate by sequence, join base64 chunks, then hash the decoded bytes. Trust the captured payload for its exact bytes.')
q=10007;x=731;k=313
sig=lambda h,r,k: ((h+x*r)*pow(k,-1,q))%q
add('nonce-sense',f'''FAILOVER SIGNING AUDIT
This toy appliance uses s = (h + x*r) / k mod q. All r values are supplied; no curve operations are needed.
q={q}
Node A before reboot: h=812 r=409 s={sig(812,409,k)}
Node B healthy: h=618 r=301 s={sig(618,301,122)}
Node A after reboot: h=1901 r=409 s={sig(1901,409,k)}
Verification record: h=229 r=812 s={sig(229,812,877)}
Recover x, then recover k for the verification record.''','CTF{731:877}','Subtract the two equations sharing r to recover k. Recover x with modular inverses, then solve the verification equation for its nonce.')
add('paper-trail','''FICTIONAL RECORDS / ALL TIMES LOCAL UNLESS MARKED
Acquisition register: 2025-11-04, asset VAULT-9 acquired by entity 4418.
Corporate history: 4418 / Elm Relay Ltd / before 2025-12-01: 6 Foundry Lane; after: 40 Market St.
Corporate history: 4419 / Elm Rail Ltd / 6 Market Lane.
Collection instruction dated 2025-11-05: use the tram terminus serving our registered office; collect on the first departure after 09:20.
Transit zone UTC+02:00. 6 Foundry Lane served only by FDR. 40 Market St served by MKT.
FDR departures: 09:10,09:25,09:40. MKT: 09:23,09:38.
Normalize departure to UTC; station codes are uppercase.''','CTF{FDR:0725}','Use the registered address on the instruction date, rather than today’s address. Then convert the first qualifying departure to UTC.')
plain=b'RELAY-42';state=0x37;enc=[]
for b in plain:
 y=b^state;y=((y<<3)|(y>>5))&255;enc.append(y);state=(state+y+17)&255
add('dead-drop',f'''REGISTER MACHINE / 8-bit unsigned registers
state = 0x37
for each input byte b:
    y = ROL8(b XOR state, 3)
    state = (state + y + 17) & 255
    emit y
compare output against: {bytes(enc).hex()}
ROL8 rotates bits within eight bits. Input is 8 ASCII bytes.''','CTF{RELAY-42}','Rotate each output byte right by three, then XOR the previous state. Update state using the output byte, not the recovered input.')
add('the-last-commit','''RECOVERY EXPORT
commits:
a11 parent=null config={mode:locked,debug:false}
b22 parent=a11 config_patch={mode:observe}
c33 parent=b22 config_patch={debug:true}
d44 parent=b22 config_patch={mode:enforce}
e55 parent=c33 config_patch={mode:disabled}
Events:
10:00 deploy e55 (failed health check)
10:03 rollback to signed manifest sha256=91aa
10:04 worker confirms manifest 91aa active
10:05 branch main moves to d44 (no deploy)
Signed manifest 91aa: revision=b22, environment_override={debug:false}
Effective mode follows config inheritance, then environment override.''','CTF{b22:observe}','Separate the branch head from the deployed manifest. Resolve b22 along its parent chain, then apply the environment override.')
add('afterimage','''INCIDENT / CLOCK CALIBRATION
Gateway clock: UTC+00:00. Host clock: UTC+00:02:00. Store clock: UTC-00:00:30.
GATEWAY 14:05:01 request=req-71 worker=812 action=health
GATEWAY 14:05:03 request=req-72 worker=913 action=export
HOST 14:07:04 parent=913 child=927 exec=archive-fetch
HOST 14:07:05 parent=812 child=928 exec=probe
STORE 14:04:35 pid=928 object=public/status result=200
STORE 14:04:36 pid=927 object=restricted/ledger result=200
STORE 14:04:37 pid=913 object=restricted/ledger result=403
Use the successful protected-object read time, not its request start time.''','CTF{req-72:927:140506}','Follow parent-child process links. Add 30 seconds to the store timestamp to normalize to UTC; failed reads are not evidence of exfiltration.')
p=1000003;q1=1000033;q2=1000037;n=p*q1;e=65537;m=int.from_bytes(b'RELAY','big');cipher=pow(m,e,n)
add('common-ground',f'''DEVICE INVENTORY / TEXTBOOK RSA
Device 1: n={n}, e={e}, ciphertext={cipher}
Device 2: n={p*q2}, e={e}
Device 3: n={1000039*1000081}, e={e}
Plaintext is a big-endian ASCII integer, without padding.''','CTF{RELAY}','Compute pairwise GCDs of the moduli. Factor Device 1, calculate phi, invert e modulo phi, and decrypt.')
add('off-the-grid','''FICTIONAL SURVEY ARCHIVE
Witness: the relay was east of the river, above 80m elevation, with a passenger departure within 10 minutes after the tower clock read 17:50.
Weather bulletin: western crossing closed 17:00–19:00; no traffic allowed.
Sites: ALP west elevation=120m; BRK east elevation=65m; CRN east elevation=110m; DUN east elevation=95m.
Departures in civil local time: ALP 18:00; BRK 17:58; CRN 17:56; DUN 18:09.
Maintenance log: tower clock was 4 minutes slow. Local zone UTC+03:00.
A departure must be strictly after the corrected observation and no later than 10 minutes afterward.''','CTF{CRN:1456}','The observation is 17:54 civil time. Apply geography, elevation, and the 10-minute window together, then subtract three hours.')
plain=b'follow_the_state';state=93;enc=[]
for b in plain:enc.append(b^state);state=(state+b+7)&255
add('signal-lost',f'''FIRMWARE NOTES
Calibration packet: plaintext byte 0x41, ciphertext byte 0x1c.
Reset state to the calibration packet’s INITIAL state before decoding the message.
For each byte: output = ciphertext XOR state; state = (state + output + 7) mod 256.
Message hex: {bytes(enc).hex()}''','CTF{follow_the_state}','Recover the initial state as 0x41 XOR 0x1c. The decoded byte, rather than the ciphertext, feeds the next state.')
add('dependency-hell','''RECOVERY SCHEDULER
Two identical workers. All tasks released at minute zero subject to predecessors.
Task  Duration  Predecessors
A     3         -
B     4         -
C     5         A
D     2         A
E     3         B,D
vault 2         C,E
F     4         C
Objective: minimize completion of ALL tasks. Report makespan and earliest vault completion among optimal schedules.
Tasks cannot be paused or moved between workers after starting.''','CTF{12:11}','Start A and B together. Compare C before D against D before C, then overlap E with the remaining work. A critical-path bound alone does not enforce worker capacity.')
# Correct computed values and avoid contradictory metadata.
p=P/'packet-whisperer.txt';p.write_text(p.read_text().replace('length=78',f'length={len(payload)}'))
for id,hint in [('ghost-in-the-cache','Compare the origin’s path interpretation with the gateway cache key. The support preview fetches as an internal user and shares the cache.'),('signed-sealed','Check which duplicate value the signature verifier uses and which value the dispatch authorization reads.')]:hints[id]=hint
Path('server/evidence-secrets.json').write_text(json.dumps({'flags':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in solutions.items()},'hints':hints},indent=2)+'\n')
Path('docs/SOLUTIONS.md').write_text('# Organizer solutions — keep private\n\nThese solutions and the source repository must not be shared with competitors. Public downloadable evidence contains no solution key. Rotate challenge variants before a real event.\n\n'+'\n\n'.join(f'## {k}\n\n{hints[k]}\n\n`{v}`' for k,v in solutions.items())+'\n')
