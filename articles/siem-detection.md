# SIEM et détection d'intrusion : voir tout ce qui se passe

Un SIEM (Security Information and Event Management) centralise, corrèle et analyse les logs de toute votre infrastructure pour détecter les menaces en temps réel. C'est le système nerveux central d'un SOC moderne.

## Qu'est-ce qu'un SIEM ?

```
Sans SIEM :
Serveur web  → logs éparpillés
Firewall     → logs éparpillés    → Impossible de corréler
Active Directory → logs éparpillés
Antivirus    → logs éparpillés

Avec SIEM :
Tous les logs → [SIEM] → Corrélation → Alerte contextualisée
                              ↓
          "L'utilisateur Jean s'est connecté depuis Paris à 9h
           ET depuis Tokyo 2 minutes plus tard = IMPOSSIBLE"
```

## Architecture d'un SIEM

```
Sources de logs :
├── Endpoints (Windows Event Logs, Sysmon, EDR)
├── Réseau (Firewall, IDS/IPS, NetFlow)
├── Applications (Web server logs, DB logs)
├── Cloud (CloudTrail, Azure Monitor)
└── Identités (Active Directory, Azure AD)
         ↓
Collection (Beats, Fluentd, Syslog, Agent)
         ↓
Parsing & Normalisation (ECS, CEF, LEEF)
         ↓
Stockage & Indexation (Elasticsearch, Splunk)
         ↓
Corrélation & Détection (Règles, ML)
         ↓
Alertes → SOC Analyst
```

## ELK Stack — SIEM Open Source

### Installation avec Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_PASSWORD=changeme
    depends_on:
      - elasticsearch

volumes:
  esdata:
```

### Pipeline Logstash

```ruby
# logstash/pipeline/syslog.conf
input {
  beats {
    port => 5044
  }
  syslog {
    port => 514
  }
}

filter {
  # Parser les logs Windows
  if [event][dataset] == "system.security" {
    mutate {
      add_field => { "log_source" => "windows_security" }
    }
  }

  # Enrichissement GeoIP
  if [source][ip] {
    geoip {
      source => "[source][ip]"
      target => "geoip"
    }
  }

  # Détecter les faux positifs connus
  if [source][ip] =~ /^10\./ or [source][ip] =~ /^192\.168\./ {
    mutate { add_tag => ["internal_ip"] }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    user => "elastic"
    password => "changeme"
    index => "logs-%{+YYYY.MM.dd}"
  }
}
```

## Règles de détection

### Sigma — Format universel de règles

```yaml
# Règle Sigma - Détection Mimikatz
title: Mimikatz Detection
id: 06d71506-7beb-4f22-8888-e2e5e2ca7fd8
status: stable
description: Détecte l'utilisation de Mimikatz via l'accès à LSASS
author: Temgus CyberBlog
date: 2024/04/01
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\lsass.exe'
        GrantedAccess|contains:
            - '0x1010'
            - '0x1410'
            - '0x147a'
            - '0x1038'
            - '0x1fffff'
    filter_legit:
        SourceImage|contains:
            - 'AV_Program.exe'
            - 'antivirus.exe'
    condition: selection and not filter_legit
falsepositives:
    - Antivirus software
    - Backup solutions
level: high
```

```bash
# Convertir une règle Sigma vers différents SIEM
pip install sigma-cli
sigma convert -t splunk rules/mimikatz.yml
sigma convert -t elasticsearch rules/mimikatz.yml
sigma convert -t azure-monitor rules/mimikatz.yml
```

### Requêtes KQL (Microsoft Sentinel)

```kql
// Détection Impossible Travel (connexion depuis deux pays en même temps)
let timeWindow = 10m;
SigninLogs
| where ResultType == 0  // Connexion réussie
| project TimeGenerated, UserPrincipalName, IPAddress, Location
| summarize
    Locations = make_set(Location),
    IPs = make_set(IPAddress),
    LoginCount = count()
    by UserPrincipalName, bin(TimeGenerated, timeWindow)
| where array_length(Locations) > 1
| extend Alert = strcat("Connexions depuis ", array_length(Locations), " pays différents : ", tostring(Locations))

// Détection brute force SSH
Syslog
| where Facility == "auth"
| where SyslogMessage contains "Failed password"
| parse SyslogMessage with * "from " SourceIP " port" *
| summarize FailureCount = count() by SourceIP, bin(TimeGenerated, 5m)
| where FailureCount > 20
| extend Alert = strcat("Brute force SSH depuis ", SourceIP, " : ", FailureCount, " tentatives")

// Détection de données exfiltrées (volume anormal)
AzureNetworkAnalytics_CL
| where FlowDirection_s == "O"  // Outbound
| where FlowStatus_s == "A"     // Allowed
| summarize TotalBytes = sum(OutboundBytes_d) by SrcIP_s, bin(TimeGenerated, 1h)
| where TotalBytes > 1073741824  // Plus de 1GB sortant en 1h
```

## IDS/IPS avec Suricata

```yaml
# suricata.yaml - Configuration de base
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

# Règles de détection
rule-files:
  - suricata.rules
  - /etc/suricata/rules/emerging-threats.rules
```

```bash
# Règles Suricata personnalisées
# /etc/suricata/rules/custom.rules

# Détecter Cobalt Strike beaconing
alert http $HOME_NET any -> $EXTERNAL_NET any (
    msg:"Cobalt Strike Beacon";
    content:"Accept: */*";
    content:"User-Agent|3a 20|";
    pcre:"/User-Agent: [A-Za-z0-9+\/=]{20,}$/";
    threshold:type both, track by_src, count 5, seconds 60;
    classtype:trojan-activity;
    sid:9000001;
    rev:1;
)

# Détecter DNS tunneling
alert dns any any -> any 53 (
    msg:"DNS Tunneling - Long Subdomain";
    dns.query;
    pcre:"/^[a-z0-9]{30,}\./";
    threshold:type both, track by_src, count 10, seconds 60;
    classtype:policy-violation;
    sid:9000002;
    rev:1;
)

# Lancer Suricata en mode IDS
suricata -c /etc/suricata/suricata.yaml -i eth0

# Mode IPS (inline)
suricata -c /etc/suricata/suricata.yaml --af-packet=eth0
```

## Métriques SOC

```python
# KPIs essentiels pour un SOC

kpis = {
    "MTTD": {
        "nom": "Mean Time To Detect",
        "objectif": "< 1 heure",
        "mesure": "Temps entre début attaque et première alerte"
    },
    "MTTR": {
        "nom": "Mean Time To Respond",
        "objectif": "< 4 heures",
        "mesure": "Temps entre alerte et confinement"
    },
    "false_positive_rate": {
        "nom": "Taux de faux positifs",
        "objectif": "< 10%",
        "mesure": "Alertes fausses / total alertes"
    },
    "alert_volume": {
        "nom": "Volume d'alertes par analyste",
        "objectif": "< 50/jour",
        "mesure": "Au-dessus = alert fatigue = manque alertes réelles"
    },
    "sla_compliance": {
        "nom": "Conformité SLA",
        "objectif": "> 95%",
        "mesure": "% d'alertes traitées dans les délais"
    }
}
```

## Conclusion

Un SIEM efficace n'est pas juste un agrégateur de logs — c'est un outil de **détection contextuelle** qui croise des événements de sources multiples pour révéler des attaques invisibles individuellement. La clé du succès : des sources de données de qualité, des règles bien calibrées (peu de faux positifs), et des analystes formés pour investiguer rapidement.

---
*Article suivant : [Zero Trust Architecture](../articles/zero-trust)*
