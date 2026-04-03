export const discoveryTechniques = [
  {
    id: "T1087",
    name: "Account Discovery",
    summary: "net user • Get-ADUser • id • who",
    description: "Discovering user accounts on local systems, domains, and cloud environments to plan further attacks.",
    tags: ["T1087", "net user", "Get-ADUser", "account enumeration"],
    steps: [
      { type: "comment", content: "# T1087.001 - Local account enumeration" },
      { type: "cmd", content: "net user  # Windows local users\ncat /etc/passwd  # Linux users\nGet-LocalUser  # PowerShell" },
      { type: "comment", content: "# T1087.002 - Domain account enumeration" },
      { type: "cmd", content: "net user /domain\nnet group \"Domain Admins\" /domain\nGet-ADUser -Filter * -Properties * | Select SamAccountName,EmailAddress,LastLogonDate" },
      { type: "comment", content: "# T1087.003 - Cloud account discovery (Azure)" },
      { type: "cmd", content: "az ad user list --output table\naz ad group list --output table\nGet-AzureADUser -All $true" },
      { type: "comment", content: "# T1087.004 - AWS IAM user discovery" },
      { type: "cmd", content: "aws iam list-users\naws iam list-groups\naws iam get-account-authorization-details" },
    ]
  },
  {
    id: "T1010",
    name: "Application Window Discovery",
    summary: "tasklist • ps • window enumeration",
    description: "Enumerating open windows and running applications to understand the victim's active environment.",
    tags: ["T1010", "tasklist", "ps", "window enumeration"],
    steps: [
      { type: "comment", content: "# Enumerate running processes and windows" },
      { type: "cmd", content: "tasklist /v  # Windows with verbose info\nGet-Process | Select Name,Id,MainWindowTitle | Where MainWindowTitle -ne ''" },
      { type: "comment", content: "# PowerShell - enumerate open windows" },
      { type: "code", content: "Add-Type -TypeDefinition @'\npublic class WinHelper {\n    [System.Runtime.InteropServices.DllImport(\"user32.dll\")]\n    public static extern int EnumWindows(System.MulticastDelegate x, int y);\n}\n'@" },
    ]
  },
  {
    id: "T1217",
    name: "Browser Information Discovery",
    summary: "browser history • bookmarks • saved passwords",
    description: "Gathering information from web browsers including history, bookmarks, installed extensions, and saved passwords.",
    tags: ["T1217", "browser history", "bookmarks", "Chrome", "Firefox"],
    steps: [
      { type: "comment", content: "# Extract Chrome browser history (SQLite)" },
      { type: "cmd", content: "copy '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History' /tmp/history.db\nsqlite3 /tmp/history.db 'SELECT url,title,last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 50;'" },
      { type: "comment", content: "# Firefox history" },
      { type: "cmd", content: "sqlite3 ~/.mozilla/firefox/*.default-release/places.sqlite 'SELECT url,title,visit_count FROM moz_places ORDER BY visit_count DESC LIMIT 50;'" },
    ]
  },
  {
    id: "T1083",
    name: "File and Directory Discovery",
    summary: "dir • ls • find • tree",
    description: "Enumerating files, directories, and shares to find sensitive data, credentials, and configuration files.",
    tags: ["T1083", "dir", "ls", "find", "file discovery"],
    steps: [
      { type: "comment", content: "# Search for sensitive files on Windows" },
      { type: "cmd", content: "dir /s /b C:\\*.txt C:\\*.docx C:\\*.xlsx C:\\*.pdf C:\\*.config 2>nul | findstr /i \"password secret credential key\"" },
      { type: "comment", content: "# Search for interesting files on Linux" },
      { type: "cmd", content: "find / -name '*.conf' -o -name '*.config' -o -name '.env' -o -name 'wp-config.php' 2>/dev/null\nfind /home /root /etc -type f -readable 2>/dev/null" },
      { type: "comment", content: "# Recursive search for password files" },
      { type: "cmd", content: "Get-ChildItem -Path C:\\ -Recurse -Include *.txt,*.ini,*.config -ErrorAction SilentlyContinue | Select-String -Pattern 'password|secret|credential'" },
    ]
  },
  {
    id: "T1046",
    name: "Network Service Discovery",
    summary: "nmap • netstat • nxc • port scanning",
    description: "Scanning the network to discover available services, open ports, and network topology.",
    tags: ["T1046", "nmap", "netstat", "port scan", "service discovery"],
    steps: [
      { type: "comment", content: "# Network service discovery from compromised host" },
      { type: "cmd", content: "nmap -sS -sV -O -p 22,80,443,445,3389,8080,8443 10.0.0.0/24 --open -oA internal_scan" },
      { type: "comment", content: "# Living-off-the-land port scan (no nmap needed)" },
      { type: "code", content: "# PowerShell port scan\n1..1024 | ForEach-Object {\n    $port = $_\n    $result = Test-NetConnection -ComputerName target -Port $port -WarningAction SilentlyContinue\n    if ($result.TcpTestSucceeded) { \"Port $port open\" }\n}" },
      { type: "comment", content: "# CrackMapExec service discovery" },
      { type: "cmd", content: "nxc smb 10.0.0.0/24 --shares\nnxc winrm 10.0.0.0/24\nnxc mssql 10.0.0.0/24" },
    ]
  },
  {
    id: "T1135",
    name: "Network Share Discovery",
    summary: "net view • smbclient • Share enumeration",
    description: "Enumerating network shares on local and remote systems to find accessible data stores.",
    tags: ["T1135", "net view", "smbclient", "SMB shares", "NFS"],
    steps: [
      { type: "comment", content: "# Enumerate shares on domain" },
      { type: "cmd", content: "net view \\\\target_host\nnet view /domain:CORP" },
      { type: "comment", content: "# CrackMapExec share enumeration" },
      { type: "cmd", content: "nxc smb 10.0.0.0/24 -u user -p pass --shares\nnxc smb target -u user -p pass --spider share_name --depth 5 --pattern .xlsx,.pdf,.docx" },
      { type: "comment", content: "# Linux NFS share discovery" },
      { type: "cmd", content: "showmount -e target_ip\nnmap --script nfs-ls,nfs-showmount target_ip" },
    ]
  },
  {
    id: "T1069",
    name: "Permission Groups Discovery",
    summary: "net group • Get-ADGroupMember • id",
    description: "Enumerating permission groups and group memberships to understand access controls and find privilege escalation paths.",
    tags: ["T1069", "net group", "Get-ADGroupMember", "groups", "ACL"],
    steps: [
      { type: "comment", content: "# T1069.002 - Domain group enumeration" },
      { type: "cmd", content: "net group /domain\nnet group \"Domain Admins\" /domain\nnet group \"Enterprise Admins\" /domain\nGet-ADGroupMember -Identity 'Domain Admins' -Recursive" },
      { type: "comment", content: "# T1069.003 - Cloud group discovery (Azure)" },
      { type: "cmd", content: "az ad group member list --group 'Global Administrators' --query '[].userPrincipalName'" },
      { type: "comment", content: "# BloodHound for AD group relationship mapping" },
      { type: "cmd", content: "SharpHound.exe -c All --outputdirectory C:\\temp\n# Import into BloodHound CE for graph analysis" },
    ]
  },
  {
    id: "T1057",
    name: "Process Discovery",
    summary: "tasklist • ps aux • Get-Process",
    description: "Enumerating running processes to identify security tools, understand the environment, and find injection targets.",
    tags: ["T1057", "tasklist", "ps aux", "process discovery", "AV detection"],
    steps: [
      { type: "comment", content: "# Enumerate running processes and identify security tools" },
      { type: "cmd", content: "tasklist /svc  # Windows with service names\nGet-Process | Where-Object {$_.Name -match 'defender|sentinel|crowdstrike|carbon|tanium|cylance|edr'}" },
      { type: "comment", content: "# Check for AV/EDR products via registry" },
      { type: "cmd", content: "reg query 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall' /s | findstr /i 'defender\\|symantec\\|mcafee\\|trend\\|crowdstrike'" },
      { type: "comment", content: "# Linux process discovery" },
      { type: "cmd", content: "ps aux --forest\n# Look for security monitoring: auditd, osquery, wazuh, falco" },
    ]
  },
  {
    id: "T1018",
    name: "Remote System Discovery",
    summary: "nmap • ping sweep • ARP scan • net view",
    description: "Identifying remote systems within the network to map attack surface and identify targets for lateral movement.",
    tags: ["T1018", "ping sweep", "ARP scan", "nmap", "host discovery"],
    steps: [
      { type: "comment", content: "# Ping sweep without nmap (living off the land)" },
      { type: "code", content: "# PowerShell ping sweep\n1..254 | ForEach-Object {\n    $ip = \"10.0.0.$_\"\n    if (Test-Connection -ComputerName $ip -Count 1 -Quiet -ErrorAction SilentlyContinue) {\n        [PSCustomObject]@{IP=$ip; Status='Up'}\n    }\n} | Format-Table" },
      { type: "comment", content: "# ARP-based host discovery (more reliable on local network)" },
      { type: "cmd", content: "arp-scan -I eth0 10.0.0.0/24\nnmap -sn 10.0.0.0/24 --send-ip  # ICMP sweep" },
      { type: "comment", content: "# AD environment - find all computers" },
      { type: "cmd", content: "Get-ADComputer -Filter * -Properties OperatingSystem | Select Name,OperatingSystem,Enabled | Sort Name" },
    ]
  },
  {
    id: "T1082",
    name: "System Information Discovery",
    summary: "systeminfo • uname • hostname • sysinfo",
    description: "Collecting detailed information about the compromised system including OS version, hardware, and configuration.",
    tags: ["T1082", "systeminfo", "uname", "hostname", "OS discovery"],
    steps: [
      { type: "comment", content: "# Windows system information gathering" },
      { type: "cmd", content: "systeminfo\nhostname && whoami && net user %username%\nwmic computersystem get Name,Domain,TotalPhysicalMemory,NumberOfProcessors" },
      { type: "comment", content: "# Linux system information" },
      { type: "cmd", content: "uname -a && cat /etc/os-release && hostname && id && env\ncat /proc/cpuinfo | grep 'model name' | head -1" },
      { type: "comment", content: "# Meterpreter post-exploitation info" },
      { type: "cmd", content: "meterpreter > sysinfo\nmeterpreter > run post/multi/recon/local_exploit_suggester" },
    ]
  },
  {
    id: "T1016",
    name: "System Network Configuration Discovery",
    summary: "ipconfig • ifconfig • netstat • route",
    description: "Gathering network configuration information including IP addresses, routing tables, DNS servers, and proxy settings.",
    tags: ["T1016", "ipconfig", "ifconfig", "netstat", "route"],
    steps: [
      { type: "comment", content: "# Windows network configuration" },
      { type: "cmd", content: "ipconfig /all\nnetstat -ano  # Active connections\nroute print\nnslookup -type=srv _ldap._tcp.dc._msdcs.domain.com" },
      { type: "comment", content: "# Linux network configuration" },
      { type: "cmd", content: "ip addr show && ip route show && cat /etc/resolv.conf\nnetstat -tulnp && ss -tlnp" },
      { type: "comment", content: "# Discover proxy settings for pivoting" },
      { type: "cmd", content: "reg query 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' | findstr 'Proxy'\nenv | grep -i proxy" },
    ]
  },
];