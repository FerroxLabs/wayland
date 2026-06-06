import React, { useState } from 'react';
import { Modal } from '@arco-design/web-react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownView from '@renderer/components/Markdown';
import { openExternalUrl } from '@renderer/utils/platform';

export interface ByoVendorHint {
  /** URL of the vendor's "create OAuth app" console (e.g. https://api.slack.com/apps). */
  registrationUrl: string;
  /** Optional markdown rendered above the inputs. Catalog `auth.byoClient.guide`. */
  guide?: string;
  /** Whether the vendor requires a client_secret (most do; some PKCE-only public clients don't). */
  requiresSecret?: boolean;
}

interface Props {
  visible: boolean;
  vendorName: string;
  /** Redirect URI the user must paste verbatim into the vendor console. */
  redirectUri: string;
  /** Vendor-specific catalog hint when known; undefined triggers the universal fallback UI. */
  vendorHint?: ByoVendorHint;
  onCancel: () => void;
  onSubmit: (clientId: string, clientSecret: string | undefined) => Promise<void>;
}

/**
 * BYO OAuth credentials modal. Two modes:
 *
 *   1. Vendor-aware - when the catalog entry provides `auth.byoClient` with
 *      registrationUrl and (optional) guide markdown, render the per-vendor
 *      instructions above the inputs and link directly to the right console
 *      page.
 *
 *   2. Universal fallback - when the catalog has no hint but the OAuth flow
 *      still failed with code='needs_byo' (e.g. Figma 403, a new Slack-class
 *      vendor we haven't catalogued yet), render generic guidance: "your
 *      vendor needs you to register an OAuth app yourself; here's the
 *      redirect URI to paste."
 *
 * The submit button is disabled until clientId (and clientSecret if required)
 * are filled - prevents a noisy retry against the OAuth provider.
 */
export function ByoCredentialsModal({
  visible,
  vendorName,
  redirectUri,
  vendorHint,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requiresSecret = vendorHint?.requiresSecret !== false; // default true (most vendors)
  const trimmedId = clientId.trim();
  const trimmedSecret = clientSecret.trim();
  const canSubmit = trimmedId.length > 0 && (!requiresSecret || trimmedSecret.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmedId, requiresSecret ? trimmedSecret : trimmedSecret || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      onCancel={handleCancel}
      title={t('mcpLibrary.byo.title', 'Connect {{vendor}} - paste OAuth credentials', { vendor: vendorName })}
      okText={t('mcpLibrary.byo.submit', 'Save & sign in')}
      cancelText={t('mcpLibrary.byo.cancel', 'Cancel')}
      onOk={handleSubmit}
      okButtonProps={{ disabled: !canSubmit, loading: submitting }}
      cancelButtonProps={{ disabled: submitting }}
      maskClosable={!submitting}
      autoFocus
      simple={false}
    >
      <div className="mcp-byo-body">
        {vendorHint?.guide ? (
          <div className="mcp-byo-vendor-guide">
            <MarkdownView>{vendorHint.guide}</MarkdownView>
          </div>
        ) : (
          <div className="mcp-byo-universal-guide">
            <p>
              {t(
                'mcpLibrary.byo.universalIntro',
                '{{vendor}} does not allow Wayland to auto-register an OAuth client. Register an OAuth app on the vendor\'s developer console and paste the credentials below.',
                { vendor: vendorName },
              )}
            </p>
          </div>
        )}

        {vendorHint?.registrationUrl && (
          <button
            type="button"
            className="mcp-byo-open-console"
            onClick={() => void openExternalUrl(vendorHint.registrationUrl)}
          >
            <ExternalLink size={14} />
            {t('mcpLibrary.byo.openConsole', 'Open {{vendor}} developer console', { vendor: vendorName })}
          </button>
        )}

        <div className="mcp-byo-redirect">
          <div className="mcp-byo-redirect-label">
            {t('mcpLibrary.byo.redirectLabel', 'Redirect URI to paste in the vendor console:')}
          </div>
          <code className="mcp-byo-redirect-uri">{redirectUri}</code>
        </div>

        <div className="mcp-byo-input">
          <label htmlFor="mcp-byo-client-id">
            {t('mcpLibrary.byo.clientIdLabel', 'Client ID')}
          </label>
          <input
            id="mcp-byo-client-id"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={t('mcpLibrary.byo.clientIdPlaceholder', 'Paste the client_id from the vendor console')}
          />
        </div>

        {requiresSecret && (
          <div className="mcp-byo-input">
            <label htmlFor="mcp-byo-client-secret">
              {t('mcpLibrary.byo.clientSecretLabel', 'Client secret')}
            </label>
            <input
              id="mcp-byo-client-secret"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={t('mcpLibrary.byo.clientSecretPlaceholder', 'Paste the client_secret')}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
