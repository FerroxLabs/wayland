// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ importZip: vi.fn(), browse: vi.fn(async () => ['/fixture/skill.zip']) }));
vi.mock('@/common', () => ({
  ipcBridge: {
    dialog: { showOpen: { invoke: h.browse } },
    skills: { import: { zip: { invoke: h.importZip } } },
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));
vi.mock('@arco-design/web-react', () => {
  const Tabs = Object.assign(
    ({
      children,
      activeTab,
      onChange,
    }: {
      children: React.ReactNode;
      activeTab: string;
      onChange: (key: string) => void;
    }) => {
      const panes = React.Children.toArray(children) as React.ReactElement<{
        title: string;
        children: React.ReactNode;
      }>[];
      return (
        <div>
          {panes.map((pane) => (
            <button key={pane.key} onClick={() => onChange(String(pane.key).replace('.$', ''))}>
              {pane.props.title}
            </button>
          ))}
          {panes.find((pane) => String(pane.key) === `.$${activeTab}`)?.props.children}
        </div>
      );
    },
    { TabPane: ({ children }: { children: React.ReactNode }) => <>{children}</> }
  );
  return {
    Tabs,
    Modal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? <div role='dialog'>{children}</div> : null,
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Input: ({ value, readOnly }: { value: string; readOnly?: boolean }) => <input value={value} readOnly={readOnly} />,
    Message: { error: vi.fn() },
  };
});

import ImportModal from '@/renderer/pages/settings/SkillsSettings/ImportModal';
afterEach(cleanup);

it('settles a duplicate ZIP import with the backend error and clears Importing', async () => {
  let deliver!: (reply: { ok: false; error: string }) => void;
  h.importZip.mockReturnValueOnce(
    new Promise((resolve) => {
      deliver = resolve;
    })
  );
  const onImported = vi.fn();
  const onClose = vi.fn();
  render(<ImportModal visible onImported={onImported} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'ZIP file' }));
  fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
  await waitFor(() => expect(screen.getByDisplayValue('/fixture/skill.zip')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Import', exact: true }));
  expect(screen.getByRole('button', { name: 'Importing…' })).toBeTruthy();
  const error = 'Rejected: a skill named "tide-morning-brief" is already installed.';
  await act(async () => deliver({ ok: false, error }));
  expect(screen.getByText(error)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Importing…' })).toBeNull();
  expect((screen.getByRole('button', { name: 'Import', exact: true }) as HTMLButtonElement).disabled).toBe(false);
  expect(h.importZip).toHaveBeenCalledWith({ zipPath: '/fixture/skill.zip' });
  expect(onImported).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
