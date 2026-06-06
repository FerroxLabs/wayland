export type Tier = 'core' | 'worker' | 'builder';
export type MaintainerType = 'official' | 'community' | 'wayland';
export type AuthMethod = 'none' | 'api-key' | 'oauth2-byo' | 'local-credentials';

export interface CatalogIndexEntry {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl: string;
  tier: Tier;
  categories: string[];
  maintainerType: MaintainerType;
  verifiedByWayland: string | null;
  popularityRank: number;
  installRate: number;
  entryUrl: string;
  guideUrl: string;
}

export interface CatalogIndex {
  version: string;
  publishedAt: string;
  entries: CatalogIndexEntry[];
}

export interface PackageRef {
  registryType: 'npm' | 'pypi' | 'oci' | 'binary' | 'mcpb';
  identifier: string;
  version: string;
  runtimeHint: 'npx' | 'uvx' | 'docker' | 'native';
  transport: { type: 'stdio' | 'streamable-http' | 'sse' };
  environmentVariables?: EnvVar[];
}

export interface RemoteRef {
  type: string;
  url: string;
  headers?: { name: string; value: string }[];
}

export interface EnvVar {
  name: string;
  description: string;
  isRequired: boolean;
  isSecret?: boolean;
  default?: string;
}

export interface WaylandExtension {
  tier: Tier;
  categories: string[];
  tags?: string[];
  maintainerType: MaintainerType;
  license?: string;
  verifiedAt?: string;
  popularityRank?: number;
  installRate?: number;
  iconUrl: string;
  brand?: { logoBackground?: string; logoForeground?: string };
  auth: {
    method: AuthMethod;
    providerName?: string;
    providerSignupUrl?: string;
    scopes?: { name: string; plainLanguage: string }[];
    /**
     * Vendor hint for the BYO-credentials flow. When the OAuth server does
     * not support Dynamic Client Registration (Slack, GitHub, HubSpot,
     * Zoom, Box, Figma...), the user must register an OAuth app on the
     * vendor's developer console and paste the client_id/secret here.
     * Absent on vendors that support DCR (Notion, Linear, Stripe, ...) -
     * for those, the universal BYO modal handles unexpected DCR failures.
     */
    byoClient?: {
      /** URL of the vendor's "create an OAuth app" page. */
      registrationUrl: string;
      /** Vendor-specific markdown shown above the credential inputs. */
      guide?: string;
      /**
       * Redirect URI the user must paste into the vendor console.
       * Defaults to http://localhost:57000/oauth/callback (Wayland's pinned
       * OAUTH_CALLBACK_PORT). Override if the vendor enforces something
       * specific (e.g. https-only).
       */
      redirectUriHint?: string;
      /** Whether this vendor requires both client_id AND client_secret. */
      requiresSecret?: boolean;
    };
  };
  toolGroups?: { label: string; count: number }[];
  setupGuide?: { path: string; estimatedMinutes: number; stepCount: number };
  platforms?: ('macos' | 'windows' | 'linux')[];
  minWaylandVersion?: string;
}

export interface CatalogEntry {
  name: string;
  title: string;
  description: string;
  version: string;
  websiteUrl?: string;
  repository?: { url: string; source: string };
  packages: PackageRef[];
  remotes?: RemoteRef[];
  'x-wayland': WaylandExtension;
}

export interface SetupStep {
  id: string;
  title: string;
  estSeconds?: number;
  autoCompletedByInstall?: boolean;
  externalAction?: { label: string; url: string };
  primaryAction?: { label: string; action: string };
  inputs?: { name: string; label: string; placeholder?: string; secret?: boolean }[];
  warning?: string;
  /** Markdown instructions rendered under the step title. Used for vendor UI navigation paths, console screenshots, and prerequisites. */
  body?: string;
}

export interface SetupGuide {
  guideVersion: string;
  estimatedMinutes: number;
  steps: SetupStep[];
  body: string; // markdown after frontmatter
}
