import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';

/**
 * The ONE place the Models surfaces decide whether a provider needs attention.
 *
 * Live defect: the list row and the Manage (detail) page each derived this for
 * themselves, and they disagreed. The row read `state === 'error' ||
 * credsUndecryptable`, Manage read only `state === 'error'` - so a row whose
 * stored ciphertext cannot be decrypted (nothing has demoted its `state` yet)
 * rendered red "Action needed, saved key unreadable" in the list and a green
 * "Connected" badge the moment the user clicked into it. Same provider, same
 * snapshot, two answers.
 *
 * Every surface that paints a provider's health must call this, so the two
 * views cannot drift again.
 */
export function isProviderActionNeeded(provider: IModelRegistryProviderView): boolean {
  return provider.state === 'error' || provider.credsUndecryptable === true;
}

/**
 * True for a keyless, machine-local provider - today only the auto-registered
 * Ollama daemon (`connectedVia: 'auto-local'`, `creds.key` is `''`).
 *
 * These have no API key at all, so every credential-shaped affordance is
 * category-wrong for them: re-keying is meaningless, and an unreachable daemon
 * is a "it is not running here" problem, not a "your key was rejected" one.
 */
export function isKeylessLocalProvider(provider: IModelRegistryProviderView): boolean {
  return provider.connectedVia === 'auto-local';
}
