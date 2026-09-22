from pathlib import Path
import hashlib,json,base64,random,math,struct,zlib,zipfile,io
P=Path('public/artifacts');P.mkdir(parents=True,exist_ok=True)
solutions={};hints={};dynamic=set()
def add(id,artifact,answer,hint):
 (P/(id+'.txt')).write_text(artifact.strip()+'\n'); solutions[id]=answer;hints[id]=hint
def chunk(kind,data):
 return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
def lsb_png(message,seed,width=192,height=128):
 """Create an original RGB PNG whose sequential RGB LSBs hold a NUL-terminated message."""
 rng=random.Random(seed);pixels=[]
 for y in range(height):
  for x in range(width):
   glow=max(0,70-abs(x-width//2)//2-abs(y-height//2)//2)
   pixels.extend(((12+x//5+glow+rng.randrange(9))%256,(18+y//3+glow//2+rng.randrange(7))%256,(28+(x^y)//4+rng.randrange(11))%256))
 payload=(message+'\0').encode();bits=[(byte>>(7-bit))&1 for byte in payload for bit in range(8)]
 if len(bits)>len(pixels):raise ValueError('LSB payload too large')
 for index,bit in enumerate(bits):pixels[index]=(pixels[index]&0xfe)|bit
 raw=b''.join(b'\0'+bytes(pixels[y*width*3:(y+1)*width*3]) for y in range(height))
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,2,0,0,0))+chunk(b'tEXt',b'Comment\0Original Cipherground evidence image')+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
def make_zip(id,files):
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for name,value in sorted(files.items()):
   archive.writestr(name,value.encode() if isinstance(value,str) else value)
 (P/(id+'.zip')).write_bytes(out.getvalue())
def add_dynamic(id,files,core,hint):
 make_zip(id,files);solutions[id]=core;hints[id]=hint;dynamic.add(id)
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

# Four long-form, original fan-themed investigations. Their archives are intentionally
# noisy, but every real step is supported by two pieces of evidence rather than trivia.
hawkins={
 'CASE-784/START_HERE.txt':'''HAWKINS COUNTY SIGNAL CASE 784 / OFFLINE COPY
All people, artwork and records in this archive are fictional and original.

Objective
1. Normalize receiver and camera clocks to UTC using the signed service notes.
2. Keep only KQ4 pulses; KQ1 is a calibration loop and KQ9 is an injected echo.
3. For each KQ4 pulse, select the camera frame at the same normalized second.
4. Inspect sequential RGB least-significant bits in those PNGs (zsteg b1,rgb,lsb works).
5. Join VALID fragments by normalized event time. The result is the CORE.

Many operators wrote flag-shaped reminders. A candidate unsupported by the clock
calibration, channel identity and all four frame payloads is not the answer.''',
 'CASE-784/radio/receiver.log':'''receiver=R-17 clock=RADIO_LOCAL
22:12:01 channel=KQ1 amplitude=11 marker=CAL
22:14:02 channel=KQ4 amplitude=73 marker=A
22:17:18 channel=KQ9 amplitude=73 marker=ECHO
22:20:02 channel=KQ4 amplitude=81 marker=B
22:27:02 channel=KQ4 amplitude=76 marker=C
22:35:02 channel=KQ4 amplitude=88 marker=D
22:36:04 channel=KQ1 amplitude=10 marker=CAL
''',
 'CASE-784/radio/channel_registry.txt':'''KQ1 = bench calibration loop; never connected to the field array.
KQ4 = field array / west ridge / hardware key 71-Delta.
KQ9 = echo injector used to test false-positive handling.
Only the signed KQ4 registration was active during Case 784.''',
 'CASE-784/maintenance/clock_service.txt':'''SIGNED SERVICE CARD 784-C
At the incident, RADIO_LOCAL was 00:01:02 ahead of UTC.
At the incident, CAMERA_LOCAL was 00:00:43 behind UTC.
Offsets remained constant from 22:00 through 23:00. Card digest: 71-Delta.
''',
 'CASE-784/maintenance/unsigned-sticky-note.txt':'''Try subtracting thirteen minutes from everything.
CTF{THE_MONSTER_WAS_THE_CLOCK}
[Unsigned; handwriting does not match any technician roster entry.]''',
 'CASE-784/cameras/frame_index.csv':'''frame,camera_local,sha_marker
frame_01,22:11:03,noise
frame_02,22:12:17,71D-A
frame_03,22:14:59,noise
frame_04,22:16:33,echo
frame_05,22:18:17,71D-B
frame_06,22:20:02,noise
frame_07,22:25:17,71D-C
frame_08,22:27:40,noise
frame_09,22:31:11,noise
frame_10,22:33:17,71D-D
frame_11,22:34:50,noise
frame_12,22:38:21,noise
''',
 'CASE-784/archive/boxes/1986/box-04/inventory.txt':'Spare coax, burned relay, one red lens, no evidence payload.\n',
 'CASE-784/archive/boxes/1986/box-11/not-a-flag.txt':'CTF{RUNNING_UP_THE_WRONG_HILL}\nStatus: training placard; cataloged three months before Case 784.\n',
 'CASE-784/archive/boxes/1987/box-02/operator-note.txt':'If the wall starts singing, verify the hardware-key marker before believing it.\n',
}
hawkins_fragments={2:'[VALID KQ4/1] FRAGMENT=THE_GATE_',5:'[VALID KQ4/2] FRAGMENT=CLOSES_',7:'[VALID KQ4/3] FRAGMENT=AT_',10:'[VALID KQ4/4] FRAGMENT=0315'}
for number in range(1,13):
 message=hawkins_fragments.get(number,f'[DECOY FRAME {number:02}] CTF{{STATIC_IS_NOT_A_SIGNAL_{number:02}}}')
 hawkins[f'CASE-784/cameras/frames/frame_{number:02}.png']=lsb_png(message,7800+number)
add_dynamic('hawkins-fourth-signal',hawkins,'THE_GATE_CLOSES_AT_0315','Normalize both clocks before correlating. The four matching camera-local seconds are 22:12:17, 22:18:17, 22:25:17 and 22:33:17. Inspect those frames’ sequential RGB LSBs and keep only payloads marked VALID KQ4.')

nevermore={
 'NEVERMORE_CASE/READ_FIRST.txt':'''NEVERMORE ACADEMY / CASE BOARD 13-B
This fictional archive is complete; web searches and external links are unnecessary.

The incident occurred at 13:38:00 UTC according to the sealed security controller.
The east-wing bell began running seven minutes fast at 13:00. The west-wing bell
remained accurate. Reject a statement if its claimed place conflicts with the room
register, or if its normalized time is more than one minute from the incident.

Each surviving statement has a shelf reference. In witness-name alphabetical order,
look up those references in library/catalog.txt and take the indexed word. Join the
four extracted words with underscores and wrap them in CTF{...}.''',
 'NEVERMORE_CASE/timing/bell_service.csv':'''wing,effective_utc,display_offset_seconds,signature
east,13:00:00,+420,CROW-19
west,00:00:00,+0,CROW-07
''',
 'NEVERMORE_CASE/timing/room_register.csv':'''name,room,wing,authorized_from,authorized_to
Ada Vale,conservatory,east,13:30,14:10
Bram Thorn,archive,west,13:20,13:50
Corin Pike,aviary,east,13:00,13:20
Dahlia Wren,library,west,13:10,14:00
Edgar Flint,crypt,west,14:00,15:00
Faye Graves,studio,east,13:25,13:45
''',
 'NEVERMORE_CASE/statements/ada-vale.txt':'I saw the ink spill in the east conservatory when its bell displayed 13:45. Shelf ref Q4/2.\n',
 'NEVERMORE_CASE/statements/bram-thorn.txt':'The west archive clock showed 13:38 when the raven struck the glass. Shelf ref M2/5.\n',
 'NEVERMORE_CASE/statements/corin-pike.txt':'I was in the east aviary at displayed 13:45. Shelf ref X9/9.\n',
 'NEVERMORE_CASE/statements/dahlia-wren.txt':'The west library clock had just reached 13:39. Shelf ref A7/1.\n',
 'NEVERMORE_CASE/statements/edgar-flint.txt':'From the west crypt I heard it at 13:38. Shelf ref Z1/3.\n',
 'NEVERMORE_CASE/statements/faye-graves.txt':'The east studio bell displayed 13:45 as the portrait fell. Shelf ref V3/4.\n',
 'NEVERMORE_CASE/library/catalog.txt':'''Q4 | A RAVENS SPEAK SOFTLY | take word 2
M2 | ASHES FADE BUT OLD REMEMBER FIRES | take word 5
A7 | UNEDITED MARGINS OUTLIVE POLISHED LIES | take word 1
V3 | FALSE SMILES HIDE INK BENEATH | take word 4
X9 | THIS SHELF ENTRY WAS ADDED AFTER THE INCIDENT | take word 9
Z1 | THE CRYPT REGISTER DISPROVES THIS ACCOUNT | take word 3
''',
 'NEVERMORE_CASE/library/errata.txt':'''Catalog instructions use the number after the slash as a word index.
The printed “take word” comments were added by the investigator as a cross-check.
Punctuation does not count as a word.''',
 'NEVERMORE_CASE/decoys/anonymous_tip.url':'[InternetShortcut]\nURL=https://www.youtube.com/watch?v=dQw4w9WgXcQ\n; entertainment, not evidence\n',
 'NEVERMORE_CASE/decoys/obvious-flag.txt':'CTF{SNAP_TWICE_AND_TRUST_ME}\nRejected: created 14:22, forty-four minutes after evidence sealing.\n',
 'NEVERMORE_CASE/media/raven_portrait.png':lsb_png('[DECOY] A picture can brood without testifying. CTF{BLACK_FEATHERS}',13013),
}
make_zip('nevermore-murder-board',nevermore)
solutions['nevermore-murder-board']='CTF{RAVENS_REMEMBER_UNEDITED_INK}'
hints['nevermore-murder-board']='The valid witnesses are Ada, Bram, Dahlia and Faye. Convert the east-wing display by subtracting seven minutes, then read Q4/2, M2/5, A7/1 and V3/4 in alphabetical witness order.'

route=['FROSTHOLD','EMBERFORD','MOONKEEP','SUNSPIRE'];previous='GENESIS';ravens={
 'RAVEN_COURT/READ_ME.txt':'''ROYAL COURIER AUDIT / FICTIONAL REALM
The ledger format is documented in cipher/PROCEDURE.txt. Do not trust filenames or
the SEQUENCE field alone: an authentic dispatch must have a listed seal, point to the
previous authentic seal, and obey route/weather travel constraints. After recovering
the four-stop route, concatenate the first letter of each stop to form the key.
Decrypt the columnar-transposition ciphertext. Its plaintext is the CORE; append the
personal token from Cipherground and submit CTF{CORE:TOKEN}.''',
 'RAVEN_COURT/routes/travel-times.csv':'''from,to,minutes
FROSTHOLD,EMBERFORD,47
FROSTHOLD,MOONKEEP,74
EMBERFORD,MOONKEEP,38
EMBERFORD,SUNSPIRE,80
MOONKEEP,SUNSPIRE,52
MOONKEEP,EMBERFORD,38
''',
 'RAVEN_COURT/weather/closures.txt':'''00:00-09:30 UTC: direct Frosthold–Moonkeep pass CLOSED.
09:50-11:30 UTC: Emberford–Sunspire valley CLOSED.
All other listed routes open. Departures use UTC and cannot precede arrival.''',
 'RAVEN_COURT/cipher/PROCEDURE.txt':'''SEAL = lowercase SHA-256 of the canonical bytes printed above the SEAL line.
PREVIOUS must equal the preceding authentic SEAL (GENESIS for the first).

Columnar cipher: write plaintext left-to-right in rows under the route key. Pad with X.
Encryption reads whole columns in alphabetical key-letter order. To decrypt, split the
ciphertext into equal column lengths, place chunks back under alphabetically ordered
key letters, then read rows left-to-right. Remove terminal padding X only.''',
}
times=[('08:10','08:57'),('09:03','09:41'),('09:48','10:40'),('10:44','11:21')]
for index,(place,(depart,arrive)) in enumerate(zip(route,times),1):
 canonical=f'SEQUENCE={index}\nLOCATION={place}\nDEPART={depart}\nARRIVE={arrive}\nPREVIOUS={previous}\n'
 seal=hashlib.sha256(canonical.encode()).hexdigest()
 ravens[f'RAVEN_COURT/dispatches/scroll-{[7,2,9,4][index-1]}.txt']=canonical+f'SEAL={seal}\n'
 ravens[f'RAVEN_COURT/seal-ledger/registered-{index}.txt']=f'{seal} signer=royal-courier-{index}\n'
 previous=seal
forged='SEQUENCE=3\nLOCATION=EMBERFORD\nDEPART=09:44\nARRIVE=10:22\nPREVIOUS=GENESIS\n'
ravens['RAVEN_COURT/dispatches/scroll-1-forged.txt']=forged+f'SEAL={hashlib.sha256(forged.encode()).hexdigest()}\nCTF{{THE_NORTH_REMEMBERS_THE_WRONG_LEDGER}}\n'
core='THE_TRUE_HEIR_BURNS_THE_LEDGER';key=''.join(place[0] for place in route);padded=core+'X'*((-len(core))%len(key));rows=[padded[i:i+len(key)] for i in range(0,len(padded),len(key))];cipher=''.join(''.join(row[col] for row in rows) for col in sorted(range(len(key)),key=lambda i:key[i]))
ravens['RAVEN_COURT/cipher/intercept.txt']=f'ciphertext={cipher}\ncolumns={len(key)}\npadding=X\n'
add_dynamic('ravens-of-the-seven-realms',ravens,core,'Validate each registered SHA-256 seal and follow PREVIOUS from GENESIS. The valid route is FROSTHOLD → EMBERFORD → MOONKEEP → SUNSPIRE, giving key FEMS. Place ciphertext columns back in alphabetical key order before reading rows.')

pensieve={
 'PENSIEVE_VAULT/START.txt':'''PENSIEVE VAULT / MISSING HOUR RECOVERY
The archive controller rolled back at 03:00. Use ledger/controller.log to find the four
memory IDs that were written before the rollback, replayed afterward, and retained the
same SHA marker. Folder dates and portraits alone are untrusted.

For those four IDs, inspect sequential RGB least-significant bits in the portraits.
Order VALID fragments by ORIGINAL_CAPTURE from ledger/memory-index.csv, not replay or
filename order. Join the fragments and wrap the result in CTF{...}.

Decoy flags are preservation drills. The valid answer is supported by controller log,
index chronology, SHA markers and all four image payloads.''',
 'PENSIEVE_VAULT/ledger/controller.log':'''02:58:10 SNAPSHOT begin generation=441
02:59:02 WRITE memory=021 sha=MOON-71
02:59:11 WRITE memory=034 sha=INK-22
02:59:39 WRITE memory=055 sha=GLASS-08
02:59:52 WRITE memory=089 sha=SILVER-19
03:00:00 ROLLBACK generation=440
03:02:02 REPLAY memory=055 sha=GLASS-08
03:02:04 REPLAY memory=021 sha=MOON-71
03:02:08 REPLAY memory=089 sha=SILVER-19
03:02:13 REPLAY memory=034 sha=INK-22
03:03:00 VERIFY retained=4 rejected=7
''',
 'PENSIEVE_VAULT/ledger/memory-index.csv':'''memory,original_capture,sha_marker,replay_folder
021,01:14:09,MOON-71,faculty/astronomy/021
034,01:42:31,INK-22,faculty/runes/034
055,02:03:07,GLASS-08,faculty/charms/055
089,02:41:55,SILVER-19,faculty/history/089
013,01:02:03,BROKEN-00,faculty/history/013
144,02:54:10,CHANGED-91,faculty/potions/144
233,03:04:01,LATE-17,faculty/runes/233
''',
 'PENSIEVE_VAULT/ledger/mirror-note.txt':'.redro yalper ro redro eman elif ton ,emit erutpac lanigiro esU\n',
 'PENSIEVE_VAULT/drills/flag-practice.txt':'CTF{I_SOLEMNLY_SWEAR_THIS_IS_A_DECOY}\nPreservation drill 12; not a memory payload.\n',
}
memory_fragments={'021':'[VALID 1/4] MEMORY_','034':'[VALID 2/4] LEAVES_A_','055':'[VALID 3/4] SILVER_','089':'[VALID 4/4] TRACE'}
folders={'021':'astronomy','034':'runes','055':'charms','089':'history','013':'history','144':'potions','233':'runes','377':'defense','610':'herbology','987':'divination'}
for offset,(memory,folder) in enumerate(folders.items()):
 message=memory_fragments.get(memory,f'[DRILL {memory}] CTF{{MEMORY_{memory}_IS_NOT_VERIFIED}}')
 pensieve[f'PENSIEVE_VAULT/faculty/{folder}/{memory}/portrait.png']=lsb_png(message,44000+offset)
 pensieve[f'PENSIEVE_VAULT/faculty/{folder}/{memory}/annotation.txt']=f'Memory {memory}; consult the controller ledger before trusting this folder.\n'
make_zip('pensieve-missing-hour',pensieve)
solutions['pensieve-missing-hour']='CTF{MEMORY_LEAVES_A_SILVER_TRACE}'
hints['pensieve-missing-hour']='The controller confirms memories 021, 034, 055 and 089. Sort them by original capture time, then extract sequential RGB LSB text from each corresponding portrait.'

# Correct computed values and avoid contradictory metadata.
p=P/'packet-whisperer.txt';p.write_text(p.read_text().replace('length=78',f'length={len(payload)}'))
for id,hint in [('ghost-in-the-cache','Compare the origin’s path interpretation with the gateway cache key. The support preview fetches as an internal user and shares the cache.'),('signed-sealed','Check which duplicate value the signature verifier uses and which value the dispatch authorization reads.')]:hints[id]=hint
Path('server/evidence-secrets.json').write_text(json.dumps({'flags':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in solutions.items()},'hints':hints},indent=2)+'\n')
Path('docs/SOLUTIONS.md').write_text('# Organizer solutions — keep private\n\nThese solutions and the source repository must not be shared with competitors. Public downloadable evidence contains no solution key. Rotate challenge variants before a real event.\n\n'+'\n\n'.join(f'## {k}\n\n{hints[k]}\n\n`{f"CTF{{{v}:<personal token>}}" if k in dynamic else v}`' for k,v in solutions.items())+'\n')
