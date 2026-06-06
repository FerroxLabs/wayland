---
guideVersion: 1.1.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `awslabs.aws-api-mcp-server` from PyPI via `uvx` on first
      launch - no manual install needed. If the server fails to start later,
      reinstall from this page.
  - id: credentials
    title: Paste your AWS access key + secret
    estSeconds: 240
    externalAction: { label: "Open AWS IAM console", url: "https://console.aws.amazon.com/iam" }
    inputs:
      - { name: AWS_ACCESS_KEY_ID, label: "Access key ID" }
      - { name: AWS_SECRET_ACCESS_KEY, label: "Secret access key", secret: true }
      - { name: AWS_REGION, label: "Default region", default: "us-east-1" }
      - { name: AWS_SESSION_TOKEN, label: "Session token (optional, for STS/SSO)", secret: true }
    warning: |
      Never paste **root account** credentials. Create a dedicated IAM user
      with only the policies you need, and prefer short-lived STS credentials
      (paste the session token in the optional field) over long-lived keys.
      Also set `READ_OPERATIONS_ONLY=true` in the env if you want a read-only
      sandbox - see the AWS Labs README for the full env reference.
    body: |
      You'll create a dedicated IAM user, attach a minimum-privilege policy,
      then generate an access key pair for that user. Do **not** use your
      root account - AWS explicitly warns against it.

      **A. Create the IAM user** (≈ 90 sec)

      1. Click **Open AWS IAM console** above and sign in (root or admin).
      2. Left sidebar → **Access management → Users**.
      3. Click **Create user** (top right).
      4. Give it a name like `wayland-mcp`. Leave **Provide user access to the
         AWS Management Console** unchecked - programmatic access only.
      5. Click **Next**.

      **B. Attach a minimum-privilege policy** (≈ 60 sec)

      1. On **Set permissions**, choose **Attach policies directly**.
      2. Search for and check only the AWS-managed policies that match the
         services you'll ask Wayland about - e.g. `AmazonS3ReadOnlyAccess`,
         `AmazonEC2ReadOnlyAccess`, `CloudWatchReadOnlyAccess`.
         Avoid `AdministratorAccess`.
      3. Click **Next → Create user**.

      **C. Generate the access key** (≈ 60 sec)

      1. From the user list, click into the user you just created.
      2. Open the **Security credentials** tab → scroll to **Access keys** →
         click **Create access key**.
      3. Use case: pick **Application running outside AWS**. Click **Next**,
         then **Create access key**.
      4. Copy the **Access key** and **Secret access key** - the secret is
         shown **only once**. Paste both above.
      5. Set the region to wherever your resources live (e.g. `us-east-1`,
         `eu-west-1`, `ap-southeast-2`). It must be a valid AWS region code.
---

# AWS setup

Wayland talks to AWS through the official `awslabs.aws-api-mcp-server`. It
covers every AWS service the AWS CLI supports, scoped to whatever permissions
your IAM user has.

For SSO/Identity Center workflows, you can leave the long-lived keys blank and
paste a short-lived `AWS_SESSION_TOKEN` triplet from `aws sso login` instead.
