---
name: pulumi-engineer
description: |
  Expert guide for infrastructure as code using Pulumi with TypeScript, Python, and Go. Covers stack management, state backends, component resources, secrets, testing, CI/CD integration, and migration from Terraform.
  Use when the user asks about pulumi engineer, pulumi engineer best practices, or needs guidance on pulumi engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud automation"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Pulumi Engineer

You are an expert in Pulumi infrastructure as code. You guide teams through project architecture, stack management, component resource design, state backends, secrets management, testing, and CI/CD integration using real programming languages instead of domain-specific configuration languages.

## Core Principles

1. **Real languages, real power** - Use loops, conditionals, functions, classes, and type systems from your language of choice.
2. **Stacks for environments** - One project, multiple stacks (dev, staging, prod). Same code, different configuration.
3. **Components for abstraction** - Build reusable component resources that encapsulate cloud patterns.

## Project Structure (TypeScript)

```
infrastructure/
  Pulumi.yaml                     # Project definition
  Pulumi.dev.yaml                 # Dev stack config
  Pulumi.staging.yaml
  Pulumi.prod.yaml
  index.ts                        # Entry point
  package.json
  tsconfig.json
  src/
    components/                   # Reusable component resources
      vpc.ts
      database.ts
    config/
      settings.ts
  __tests__/
    vpc.test.ts
```

### Stack Configuration

```yaml
# Pulumi.prod.yaml
config:
  aws:region: us-east-1
  my-infra:environment: production
  my-infra:vpcCidr: "10.0.0.0/16"
  my-infra:instanceType: m5.large
  my-infra:dbPassword:
    secure: AAABAMt1P8K...       # Encrypted secret
```

## Component Resources

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface VpcArgs {
  cidrBlock: string;
  azs: string[];
  enableNat?: boolean;
  tags?: Record<string, string>;
}

export class Vpc extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:networking:Vpc", name, {}, opts);
    const parent = { parent: this };
    const tags = { ...args.tags, ManagedBy: "pulumi" };

    const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.cidrBlock,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `${name}-vpc` },
    }, parent);

    this.vpcId = vpc.id;
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];

    const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: vpc.id, tags: { ...tags, Name: `${name}-igw` },
    }, parent);

    const publicRt = new aws.ec2.RouteTable(`${name}-public-rt`, {
      vpcId: vpc.id,
      routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
    }, parent);

    args.azs.forEach((az, i) => {
      const pub = new aws.ec2.Subnet(`${name}-pub-${i}`, {
        vpcId: vpc.id, cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az, mapPublicIpOnLaunch: true,
      }, parent);
      this.publicSubnetIds.push(pub.id);

      new aws.ec2.RouteTableAssociation(`${name}-pub-rta-${i}`, {
        subnetId: pub.id, routeTableId: publicRt.id,
      }, parent);

      const priv = new aws.ec2.Subnet(`${name}-priv-${i}`, {
        vpcId: vpc.id, cidrBlock: `10.0.${128 + i}.0/24`,
        availabilityZone: az,
      }, parent);
      this.privateSubnetIds.push(priv.id);
    });

    this.registerOutputs({ vpcId: this.vpcId });
  }
}

// Usage
const vpc = new Vpc("main", {
  cidrBlock: config.require("vpcCidr"),
  azs: ["us-east-1a", "us-east-1b", "us-east-1c"],
  tags: { Environment: pulumi.getStack() },
});
export const vpcId = vpc.vpcId;
```

## State Management

### Backend Options

```
BACKEND               WHEN TO USE                      COMMAND
---------------------------------------------------------------------------
Pulumi Cloud          Default, managed, team features   pulumi login
AWS S3                Self-managed, AWS-only            pulumi login s3://bucket
Azure Blob            Self-managed, Azure-only          pulumi login azblob://ctr
GCS                   Self-managed, GCP-only            pulumi login gs://bucket
Local filesystem      Development only                  pulumi login --local
```

### Stack References (Cross-Stack)

```typescript
// networking stack exports
export const vpcId = vpc.vpcId;
export const privateSubnetIds = vpc.privateSubnetIds;

// compute stack imports
const netStack = new pulumi.StackReference("myorg/networking/prod");
const vpcId = netStack.getOutput("vpcId");
const subnetIds = netStack.getOutput("privateSubnetIds");
```

## Secrets

```shell
pulumi config set --secret dbPassword 'my-s3cr3t'
pulumi stack init prod --secrets-provider="awskms://alias/pulumi-secrets"
```

```typescript
const config = new pulumi.Config();
const dbPassword = config.requireSecret("dbPassword");  // Output<string>, encrypted

// Secrets propagate: interpolating a secret produces a secret
const connStr = pulumi.interpolate`postgres://admin:${dbPassword}@${db.endpoint}/mydb`;
```

## Dynamic Providers

```typescript
const provider: pulumi.dynamic.ResourceProvider = {
  async create(inputs) {
    const resp = await get(`[reference URL] {
      method: "POST", body: JSON.stringify(inputs),
    });
    const data = await resp.json();
    return { id: data.id, outs: { ...inputs, url: data.url } };
  },
  async delete(id) {
    await get(`[reference URL] { method: "DELETE" });
  },
};

export class CustomResource extends pulumi.dynamic.Resource {
  public readonly url!: pulumi.Output<string>;
  constructor(name: string, args: any, opts?: pulumi.CustomResourceOptions) {
    super(provider, name, { url: undefined, ...args }, opts);
  }
}
```

## Testing

### Unit Tests

```typescript
import * as pulumi from "@pulumi/pulumi";

pulumi.runtime.setMocks({
  newResource(args) { return { id: `${args.name}-id`, state: args.inputs }; },
  call(args) { return args.inputs; },
});

describe("VPC Component", () => {
  it("should create subnets per AZ", async () => {
    const { Vpc } = await import("../src/components/vpc");
    const vpc = new Vpc("test", { cidrBlock: "10.0.0.0/16", azs: ["us-east-1a", "us-east-1b"] });
    const pubIds = await new Promise(resolve => pulumi.all(vpc.publicSubnetIds).apply(resolve));
    expect(pubIds).toHaveLength(2);
  });
});
```

### Integration Tests (Automation API)

```typescript
import { LocalWorkspace } from "@pulumi/pulumi/automation";

const stack = await LocalWorkspace.createOrSelectStack({
  stackName: `test-${Date.now()}`, projectName: "test-infra",
  program: async () => {
    const vpc = new aws.ec2.Vpc("test", { cidrBlock: "10.0.0.0/16" });
    return { vpcId: vpc.id };
  },
});
const result = await stack.up();
expect(result.outputs.vpcId.value).toBeDefined();
await stack.destroy();
```

## CI/CD (GitHub Actions)

```yaml
name: Infrastructure
on:
  pull_request:
    paths: ["infrastructure/**"]
  push:
    branches: [main]
    paths: ["infrastructure/**"]

jobs:
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: infrastructure
      - uses: pulumi/actions@v5
        with:
          command: preview
          stack-name: myorg/staging
          work-dir: infrastructure
          comment-on-pr: true
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: infrastructure
      - uses: pulumi/actions@v5
        with:
          command: up
          stack-name: myorg/prod
          work-dir: infrastructure
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

## Migration from Terraform

```shell
pulumi import --from terraform ./terraform.tfstate
pulumi convert --from terraform --language typescript --out ./pulumi-infra
pulumi import aws:ec2/instance:Instance web i-0123456789abcdef0
```

### Concept Mapping

```
TERRAFORM              PULUMI
---------------------------------------------
.tf files              TypeScript/Python/Go
terraform.tfstate      Pulumi state (backend)
Modules                Component Resources
Variables              Config + function args
Outputs                Stack exports
Data sources           Provider functions
Workspaces             Stacks
terraform plan         pulumi preview
terraform apply        pulumi up
```

## Common Commands

```shell
pulumi stack init dev             # Create stack
pulumi stack select prod          # Switch stack
pulumi preview                    # Show diff
pulumi up                         # Apply changes
pulumi up --yes --skip-preview    # Non-interactive (CI)
pulumi destroy                    # Tear down
pulumi refresh                    # Sync state with cloud
pulumi config set key value       # Set config
pulumi config set --secret k v    # Set secret
```

## Production Checklist

```
PROJECT:
  [ ] Consistent structure with components and tests
  [ ] TypeScript strict mode for type safety
  [ ] Stack config per environment (no hardcoded values)
  [ ] Secrets encrypted via Pulumi Cloud, KMS, or Vault

STATE:
  [ ] Remote backend configured
  [ ] State access restricted to authorized roles
  [ ] Stack references for cross-stack deps

CI/CD:
  [ ] Preview on PRs with comments
  [ ] Deploy on merge to main
  [ ] Separate jobs per stack (staging -> prod)
  [ ] Policy packs for compliance

RESOURCES:
  [ ] protect: true on critical resources
  [ ] retainOnDelete where needed
  [ ] Consistent tagging via helper function
  [ ] Resource naming convention enforced
```

## When to Use

**Use this skill when:**
- Designing or implementing pulumi engineer solutions
- Reviewing or improving existing pulumi engineer approaches
- Making architectural or implementation decisions about pulumi engineer
- Learning pulumi engineer patterns and best practices
- Troubleshooting pulumi engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Pulumi Engineer Analysis

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

**Input:** "Help me implement pulumi engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended pulumi engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When pulumi engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
