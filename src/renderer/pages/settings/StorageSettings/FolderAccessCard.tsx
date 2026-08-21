/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Message, Spin, Tag } from '@arco-design/web-react';
import { FolderKey } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { workspaceFolderGrants } from '@/common/adapter/ipcBridge';
import type { FolderGrantRefusal, FolderGrantWithheldReason } from '@/common/workspace/folderGrants';
import type { FolderGrantWorkspaceView } from '@/common/workspace/folderGrantsIpc';
import { Card, ConfirmDialog } from '@renderer/components/settings/shared';
import { isElectronDesktop } from '@renderer/utils/platform';

type Label = { key: string; fallback: string };

/**
 * Where the grant came from, in the user's terms. Persisted precisely so every
 * entry can be accounted for, so it is rendered rather than summarised away.
 */
const ORIGIN_LABELS: Record<FolderGrantWorkspaceView['grants'][number]['origin'], Label> = {
  consent_card: { key: 'settings.storagePage.folderAccessOriginConsentCard', fallback: 'Approved during a chat' },
  settings: { key: 'settings.storagePage.folderAccessOriginSettings', fallback: 'Added here in Settings' },
};

/**
 * Every refusal the store can return, shown in the words the user will
 * recognise. A refusal reported as a generic failure is a refusal the user
 * cannot act on.
 */
const REFUSAL_LABELS: Record<FolderGrantRefusal, Label> = {
  root_of_filesystem: {
    key: 'settings.storagePage.folderAccessRefusalRoot',
    fallback: 'That is the whole drive. Pick a folder inside it.',
  },
  home_directory: {
    key: 'settings.storagePage.folderAccessRefusalHome',
    fallback: 'That is your home folder, which would grant nearly everything. Pick a folder inside it.',
  },
  wayland_private: {
    key: 'settings.storagePage.folderAccessRefusalWaylandPrivate',
    fallback: "That folder holds Wayland's own settings and saved keys.",
  },
  credential_store: {
    key: 'settings.storagePage.folderAccessRefusalCredentialStore',
    fallback: 'That folder holds saved sign-in keys, such as .ssh or .aws.',
  },
  grant_cap_reached: {
    key: 'settings.storagePage.folderAccessRefusalCapReached',
    fallback: 'This workspace already has the maximum of 64 folders. Remove one first.',
  },
  not_an_absolute_directory: {
    key: 'settings.storagePage.folderAccessRefusalNotADirectory',
    fallback: 'That is not a folder Wayland can reach.',
  },
};

/**
 * Why an entry that IS on record is not in effect.
 *
 * Every read re-checks each recorded folder against the filesystem as it is
 * now, because a folder can be renamed and replaced by a link to somewhere else
 * long after it was allowed. An entry that no longer checks out is shown here
 * rather than quietly trusted or quietly deleted - the first would hand out
 * access nobody re-checked, the second would erase a decision the user made and
 * leave nothing to explain the gap.
 */
const WITHHELD_LABELS: Record<FolderGrantWithheldReason, Label> = {
  root_changed: {
    key: 'settings.storagePage.folderAccessWithheldRootChanged',
    fallback: 'This path now leads somewhere else than the folder you allowed, so it is not being read.',
  },
  not_an_absolute_directory: {
    key: 'settings.storagePage.folderAccessWithheldMissing',
    fallback: 'This folder is no longer there, so it is not being read.',
  },
  root_of_filesystem: {
    key: 'settings.storagePage.folderAccessWithheldRoot',
    fallback: 'This path now leads to a whole drive, so it is not being read.',
  },
  home_directory: {
    key: 'settings.storagePage.folderAccessWithheldHome',
    fallback: 'This path now leads to your home folder, so it is not being read.',
  },
  wayland_private: {
    key: 'settings.storagePage.folderAccessWithheldWaylandPrivate',
    fallback: "This path now leads to Wayland's own settings and saved keys, so it is not being read.",
  },
  credential_store: {
    key: 'settings.storagePage.folderAccessWithheldCredentialStore',
    fallback: 'This path now leads to saved sign-in keys, so it is not being read.',
  },
  grant_cap_reached: {
    key: 'settings.storagePage.folderAccessWithheldCapReached',
    fallback: 'This workspace is over the limit of 64 folders, so this one is not being read.',
  },
  unrecognised_workspace_key: {
    key: 'settings.storagePage.folderAccessWithheldUnknownKey',
    fallback: 'This entry is filed under a workspace Wayland does not recognise, so it is not being read.',
  },
};

function basename(value: string): string {
  const normalized = value.replace(/[\\/]+$/, '');
  const separator = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return normalized.slice(separator + 1) || value;
}

type PendingRemoval = { workspaceId: string; grantId: string; root: string };

const FolderAccessCard: React.FC = () => {
  const { t } = useTranslation();
  const desktop = isElectronDesktop();
  const [workspaces, setWorkspaces] = React.useState<readonly FolderGrantWorkspaceView[] | null>(null);
  const [loading, setLoading] = React.useState(desktop);
  const [error, setError] = React.useState(false);
  const [pendingRemoval, setPendingRemoval] = React.useState<PendingRemoval | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!desktop) return;
    setLoading(true);
    setError(false);
    try {
      // The provider RESOLVES a classified refusal rather than rejecting: the
      // IPC bridge has no reject and no timeout, so a throw on the process side
      // would leave this card loading forever with neither `catch` nor
      // `finally` running. Both halves of the union land on the same message.
      const result = await workspaceFolderGrants.list.invoke();
      if (result?.ok !== true) {
        setWorkspaces(null);
        setError(true);
        return;
      }
      setWorkspaces(result.workspaces);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [desktop]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const addFolder = React.useCallback(
    async (workspaceId: string) => {
      setBusy(true);
      try {
        // No path crosses this call. The main process opens the native picker
        // itself, so the folder granted is the one a human chose in an OS
        // dialog rather than a string this renderer supplied.
        const result = await workspaceFolderGrants.add.invoke({ workspaceId });
        // `=== true` / `=== false`, never a truthiness test: this project does
        // not enable `strictNullChecks`, so TypeScript will not narrow a
        // boolean-literal discriminant through `if (result?.ok)` and the
        // `reason` / `refusal` reads below fail to compile.
        if (result?.ok === true) {
          Message.success(
            t('settings.storagePage.folderAccessAdded', {
              folder: basename(result.root),
              defaultValue: `${basename(result.root)} can now be read by this workspace.`,
            })
          );
          await refresh();
          return;
        }
        if (result?.ok === false) {
          // Dismissing the picker is the most common ending and must stay silent.
          if (result.reason === 'cancelled') return;
          if (result.reason === 'refused') {
            const label = REFUSAL_LABELS[result.refusal];
            Message.error(t(label.key, label.fallback));
            return;
          }
        }
        Message.error(t('settings.storagePage.folderAccessAddFailed', 'Could not add that folder.'));
      } catch {
        Message.error(t('settings.storagePage.folderAccessAddFailed', 'Could not add that folder.'));
      } finally {
        setBusy(false);
      }
    },
    [refresh, t]
  );

  const confirmRemoval = React.useCallback(async () => {
    if (!pendingRemoval) return;
    const target = pendingRemoval;
    setPendingRemoval(null);
    setBusy(true);
    try {
      const result = await workspaceFolderGrants.remove.invoke({
        workspaceId: target.workspaceId,
        grantId: target.grantId,
      });
      if (result?.ok !== true) {
        Message.error(t('settings.storagePage.folderAccessRemoveFailed', 'Could not remove that folder.'));
        return;
      }
      // A removal that edited the record but could not reach a running engine
      // is NOT the same event as a clean revoke, and saying so is the whole
      // point of reporting the live count back.
      if (result.liveSessionsFailed > 0) {
        Message.warning(
          t(
            'settings.storagePage.folderAccessRemovedSessionPending',
            'Removed. A chat that is still running may keep reading it until it ends.'
          )
        );
      } else {
        Message.success(t('settings.storagePage.folderAccessRemoved', 'Removed.'));
      }
      await refresh();
    } catch {
      Message.error(t('settings.storagePage.folderAccessRemoveFailed', 'Could not remove that folder.'));
    } finally {
      setBusy(false);
    }
  }, [pendingRemoval, refresh, t]);

  const body = (): React.ReactNode => {
    if (!desktop) {
      return (
        <p className='text-12px text-[var(--color-text-3)]'>
          {t('settings.storagePage.folderAccessDesktopOnly', 'Folder access is managed in the desktop app.')}
        </p>
      );
    }
    if (loading && !workspaces) {
      return (
        <div className='flex justify-center py-16px' aria-label={t('common.loading', 'Loading')}>
          <Spin />
        </div>
      );
    }
    if (error) {
      return (
        <div className='flex flex-col items-start gap-8px'>
          <p className='text-12px text-[var(--color-text-2)]'>
            {t(
              'settings.storagePage.folderAccessUnavailable',
              'Wayland could not read the folder list, so nothing is shown rather than a list that might be wrong.'
            )}
          </p>
          <Button size='mini' onClick={() => void refresh()}>
            {t('settings.storagePage.tryAgain', 'Try again')}
          </Button>
        </div>
      );
    }
    if (!workspaces || workspaces.length === 0) {
      return (
        <p className='text-12px text-[var(--color-text-3)]'>
          {t(
            'settings.storagePage.folderAccessEmpty',
            'No workspace can reach anything outside its own folder. Wayland will ask before it reads elsewhere.'
          )}
        </p>
      );
    }

    return (
      <div className='flex flex-col gap-14px'>
        {workspaces.map((workspace) => (
          <div key={workspace.workspaceId} className='flex flex-col gap-6px'>
            <div className='flex items-center gap-8px'>
              <span
                className='truncate text-13px font-medium text-[var(--color-text-1)]'
                title={workspace.workspaceDir ?? workspace.workspaceId}
              >
                {workspace.displayName ??
                  t('settings.storagePage.folderAccessUnknownWorkspace', 'Workspace no longer on disk')}
              </span>
              {workspace.workspaceDir && (
                <Button size='mini' type='text' disabled={busy} onClick={() => void addFolder(workspace.workspaceId)}>
                  {t('settings.storagePage.folderAccessAdd', 'Add folder')}
                </Button>
              )}
            </div>
            {workspace.grants.map((grant) => (
              <div key={grant.grantId} className='flex items-center gap-8px rounded-6px px-2px py-4px'>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-12px font-medium text-[var(--color-text-2)]' title={grant.root}>
                    {grant.root}
                  </div>
                  <div className='text-11px text-[var(--color-text-3)]'>
                    {t(ORIGIN_LABELS[grant.origin].key, ORIGIN_LABELS[grant.origin].fallback)}
                    {' - '}
                    {t('settings.storagePage.folderAccessGrantedAt', {
                      when: new Date(grant.grantedAtMs).toLocaleString(),
                      defaultValue: `granted ${new Date(grant.grantedAtMs).toLocaleString()}`,
                    })}
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-6px'>
                  <Tag size='small' color='blue'>
                    {t('settings.storagePage.folderAccessReadOnly', 'Read only')}
                  </Tag>
                  <Button
                    size='mini'
                    status='danger'
                    disabled={busy}
                    onClick={() =>
                      setPendingRemoval({
                        workspaceId: workspace.workspaceId,
                        grantId: grant.grantId,
                        root: grant.root,
                      })
                    }
                  >
                    {t('settings.storagePage.folderAccessRemove', 'Remove')}
                  </Button>
                </div>
              </div>
            ))}
            {workspace.withheld.map(({ grant, reason }) => (
              <div
                key={grant.grantId}
                className='flex items-center gap-8px rounded-6px px-2px py-4px'
                data-testid='folder-access-withheld'
              >
                <div className='min-w-0 flex-1'>
                  <div
                    className='truncate text-12px font-medium text-[var(--color-text-3)] line-through'
                    title={grant.root}
                  >
                    {grant.root}
                  </div>
                  <div className='text-11px text-[var(--color-warning-6,var(--color-text-2))]'>
                    {t(WITHHELD_LABELS[reason].key, WITHHELD_LABELS[reason].fallback)}
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-6px'>
                  <Tag size='small' color='orange'>
                    {t('settings.storagePage.folderAccessNeedsAttention', 'Not in effect')}
                  </Tag>
                  <Button
                    size='mini'
                    status='danger'
                    disabled={busy}
                    onClick={() =>
                      setPendingRemoval({
                        workspaceId: workspace.workspaceId,
                        grantId: grant.grantId,
                        root: grant.root,
                      })
                    }
                  >
                    {t('settings.storagePage.folderAccessRemove', 'Remove')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card
        title={t('settings.storagePage.folderAccessTitle', 'Folders this workspace may reach')}
        titleIcon={FolderKey}
        actions={
          desktop ? (
            <Button size='mini' loading={loading} onClick={() => void refresh()}>
              {t('settings.storagePage.refresh', 'Refresh')}
            </Button>
          ) : undefined
        }
      >
        <p className='mb-10px text-12px text-[var(--color-text-2)]'>
          {t(
            'settings.storagePage.folderAccessSubtitle',
            'Folders outside a workspace that you have allowed it to read. Everything here is read only, and removing an entry withdraws it from any chat still running.'
          )}
        </p>
        {body()}
      </Card>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => void confirmRemoval()}
        title={t('settings.storagePage.folderAccessRemoveConfirmTitle', 'Stop reading this folder?')}
        body={t('settings.storagePage.folderAccessRemoveConfirmBody', {
          folder: pendingRemoval?.root ?? '',
          defaultValue: `Wayland will no longer read ${pendingRemoval?.root ?? ''} for this workspace.`,
        })}
        confirmLabel={t('settings.storagePage.folderAccessRemove', 'Remove')}
        destructive
      />
    </>
  );
};

export default FolderAccessCard;
