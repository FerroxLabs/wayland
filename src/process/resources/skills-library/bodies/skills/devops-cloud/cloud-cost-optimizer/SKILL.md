---
name: cloud-cost-optimizer
description: |
  Expert guide for FinOps practices and cloud cost optimization including right-sizing, reserved instances, spot instances, savings plans, budget alerting, cost allocation, and building a cost-aware engineering culture.
  Use when the user asks about cloud cost optimizer, cloud cost optimizer best practices, or needs guidance on cloud cost optimizer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud optimization"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cloud Cost Optimizer

You are a FinOps and cloud cost optimization expert. You guide teams through cost visibility, right-sizing, commitment-based discounts, spot instance strategies, architectural cost optimization, budget management, and building sustainable cost governance across AWS, Azure, and GCP.

## Core Principles

1. **Visibility before optimization** - You cannot optimize what you cannot see. Tagging and cost allocation come first.
2. **Right-size before committing** - Stabilize workloads and eliminate waste, then lock in discounts.
3. **Cost is a non-functional requirement** - Treat it like performance or security: measure, alert, review continuously.

## FinOps Maturity Phases

```
PHASE     FOCUS                        KEY ACTIVITIES
------------------------------------------------------------------
Crawl     Visibility and allocation     Tag everything, cost reports,
                                        identify top 10 cost drivers
Walk      Optimization and governance   Right-size, purchase RI/SP,
                                        spot for stateless, cleanup
Run       Continuous optimization       Unit economics, cost per
                                        transaction, anomaly detection
```

## Tagging Strategy

```
TAG KEY          PURPOSE                  EXAMPLES
----------------------------------------------------------
Environment      Separate env costs       production, staging, dev
Service          Cost per service         user-service, order-api
Team             Accountability           platform, payments
CostCenter       Finance allocation       CC-1234
ManagedBy        IaC tracking             terraform, pulumi, manual
```

### Tag Enforcement (AWS IAM)

```json
{
  "Statement": [{
    "Effect": "Deny",
    "Action": ["ec2:RunInstances", "rds:CreateDBInstance", "s3:CreateBucket"],
    "Resource": "*",
    "Condition": {
      "Null": {
        "aws:RequestTag/Environment": "true",
        "aws:RequestTag/Service": "true",
        "aws:RequestTag/Team": "true"
      }
    }
  }]
}
```

## Right-Sizing

### Process

```
1. Collect metrics (minimum 14 days, ideally 30)
   CPU, memory, network, disk IOPS (average + p95)

2. Action matrix (based on p95 utilization):
   < 10%     Terminate or consolidate
   10-30%    Downsize 2 steps (e.g., xlarge -> medium)
   30-50%    Downsize 1 step (e.g., xlarge -> large)
   50-80%    Right-sized, no action
   > 80%     Upsize 1 step
```

### Automation

```python
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
ec2 = boto3.client('ec2')

def find_oversized(threshold=30.0):
    instances = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}])
    candidates = []
    for res in instances['Reservations']:
        for inst in res['Instances']:
            avg_cpu = get_avg_cpu(inst['InstanceId'], days=14)
            if avg_cpu < threshold:
                candidates.append({
                    'InstanceId': inst['InstanceId'],
                    'Type': inst['InstanceType'],
                    'AvgCPU': round(avg_cpu, 2),
                })
    return sorted(candidates, key=lambda x: x['AvgCPU'])
```

## Reserved Instances and Savings Plans

### Decision Framework

```
TYPE                  DISCOUNT    FLEXIBILITY      BEST FOR
---------------------------------------------------------------------------
On-Demand             0%          Maximum          Unpredictable workloads
Compute Savings Plan  ~30-40%     Any family/region  Stable, evolving infra
EC2 Instance SP       ~40-50%     Specific family    Predictable steady-state
Standard RI           ~40-60%     Least flexible     Databases (RDS/ElastiCache)
```

### Coverage Strategy

```
TARGET COVERAGE:
  Production steady-state:   70-80% committed (RI/SP)
  Production variable:       On-demand or spot
  Staging:                   Spot or scheduled
  Development:               Spot or stop outside hours

PROCESS:
  1. Pull 90 days of hourly usage
  2. Find baseline (minimum sustained usage)
  3. Commit to 70-80% of baseline
  4. Cover peaks with on-demand/spot
  5. Review and adjust quarterly
```

## Spot Instances

### Suitability Matrix

```
WORKLOAD                 SPOT?     STRATEGY
---------------------------------------------------------
Stateless web servers    YES       Mixed ASG (on-demand + spot)
Batch processing         YES       Spot fleets with checkpointing
CI/CD runners            YES       Spot with on-demand fallback
K8s non-critical pods    YES       Spot node groups
Databases                NO        Use RIs
Single-instance apps     NO        No interruption tolerance
```

### Mixed Instance ASG

```yaml
AutoScalingGroup:
  Properties:
    MixedInstancesPolicy:
      InstancesDistribution:
        OnDemandBaseCapacity: 2
        OnDemandPercentageAboveBaseCapacity: 20
        SpotAllocationStrategy: capacity-optimized
      LaunchTemplate:
        Supersedes:
          - { InstanceType: m5.large }
          - { InstanceType: m5a.large }
          - { InstanceType: m6i.large }
          - { InstanceType: m6a.large }
```

### Interruption Handling

```typescript
// Poll for 2-minute interruption warning
scheduleRepeating(async () => {
  try {
    const resp = await get('[reference URL]',
      { signal: AbortSignal.timeout(1000) });
    if (resp.ok) {
      console.log('Spot interruption detected');
      server.close();
      await drainConnections(25_000);
      await checkpointState();
      process.exit(0);
    }
  } catch { /* no interruption */ }
}, 5000);
```

## Architectural Cost Optimization

### Storage Tiering (S3)

```
CLASS                 COST/GB/MO    USE CASE
---------------------------------------------------
Standard              $0.023        Frequently accessed (<30 days)
Intelligent-Tiering   $0.023+fee    Unknown access patterns
Standard-IA           $0.0125       Infrequent (>30 days)
Glacier Instant       $0.004        Archive, millisecond access
Glacier Flexible      $0.0036       Archive, minutes-hours
Glacier Deep          $0.00099      Long-term, 12-hour retrieval
```

```json
{
  "Rules": [{
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER_IR" },
      { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
    ],
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

### Common Cost Traps

```
TRAP                           FIX
----------------------------------------------------
Always-on dev/staging          Schedule stop nights/weekends (save ~65%)
Oversized databases            Aurora Serverless v2 for variable load
NAT Gateway data transfer      VPC endpoints for AWS services (free)
Cross-AZ transfer              AZ-aware routing for related services
Unattached EBS volumes         Snapshot and delete
Idle load balancers            Clean up or consolidate
Over-provisioned Lambda        Right-size with power-tuning tool
Unbounded log retention        Set CloudWatch retention (30-90 days)
```

## Budget and Alerting

```yaml
Resources:
  MonthlyBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetLimit: { Amount: 50000, Unit: USD }
        TimeUnit: MONTHLY
        BudgetType: COST
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
          Subscribers:
            - { SubscriptionType: EMAIL, Address: finops@company.com }
        - Notification:
            NotificationType: FORECASTED
            ComparisonOperator: GREATER_THAN
            Threshold: 100
          Subscribers:
            - { SubscriptionType: EMAIL, Address: finops@company.com }
```

### Anomaly Detection

```shell
aws ce create-anomaly-monitor --anomaly-monitor '{
  "MonitorName": "service-monitor",
  "MonitorType": "DIMENSIONAL",
  "MonitorDimension": "SERVICE"
}'
```

## Cost Reporting

### Unit Economics

```
KEY METRICS:
  Cost per transaction = Monthly spend / Total transactions
  Cost per user        = Monthly spend / Monthly active users
  Infrastructure ratio = Infra spend / Total revenue (<15% target)

CADENCE:
  Weekly:     Anomaly alerts, top 5 cost drivers
  Monthly:    Full cost review, unit economics tracking
  Quarterly:  Commitment coverage review, purchasing decisions
```

## Waste Elimination

```python
def find_unused_ebs():
    """Unattached EBS volumes older than 7 days."""
    vols = ec2.describe_volumes(Filters=[{'Name': 'status', 'Values': ['available']}])
    cutoff = datetime.utcnow() - timedelta(days=7)
    return [v for v in vols['Volumes'] if v['CreateTime'].replace(tzinfo=None) < cutoff]

def find_unused_eips():
    """EIPs not associated with any instance ($3.60/mo each)."""
    addrs = ec2.describe_addresses()
    return [a for a in addrs['Addresses'] if 'AssociationId' not in a]
```

## Production Checklist

```
VISIBILITY:
  [ ] Mandatory tagging enforced (Environment, Service, Team)
  [ ] Cost and Usage Reports enabled
  [ ] Cost Explorer activated
  [ ] Monthly cost review meeting scheduled
  [ ] Unit economics tracked

OPTIMIZATION:
  [ ] Right-sizing completed (EC2, RDS, Lambda)
  [ ] Savings Plans at 70-80% coverage
  [ ] Spot for stateless/fault-tolerant workloads
  [ ] Storage lifecycle policies configured
  [ ] Non-prod scheduled (stop nights/weekends)
  [ ] Unused resources cleaned up
  [ ] VPC endpoints for high-traffic AWS services

GOVERNANCE:
  [ ] Budget alerts at 80% actual, 100% forecast
  [ ] Cost anomaly detection enabled
  [ ] Weekly cost reports to team leads
  [ ] Quarterly commitment review
  [ ] Cost estimates required before new service launch
  [ ] FinOps champion per engineering team
```

## When to Use

**Use this skill when:**
- Designing or implementing cloud cost optimizer solutions
- Reviewing or improving existing cloud cost optimizer approaches
- Making architectural or implementation decisions about cloud cost optimizer
- Learning cloud cost optimizer patterns and best practices
- Troubleshooting cloud cost optimizer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cloud Cost Optimizer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement cloud cost optimizer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cloud cost optimizer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cloud cost optimizer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
