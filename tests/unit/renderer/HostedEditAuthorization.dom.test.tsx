import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequestGrant } = vi.hoisted(() => ({ mockRequestGrant: vi.fn() }));

vi.mock('@renderer/services/ConstitutionService', () => ({
  requestConstitutionEditGrantHttp: mockRequestGrant,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  ),
  Input: {
    Password: ({
      value,
      onChange,
      placeholder,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder: string;
    }) => (
      <input
        type='password'
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  },
  Modal: ({
    visible,
    children,
    onOk,
    okText,
  }: {
    visible: boolean;
    children: React.ReactNode;
    onOk: () => void;
    okText: string;
  }) =>
    visible ? (
      <section>
        {children}
        <button type='button' onClick={onOk}>
          {okText}
        </button>
      </section>
    ) : null,
}));

import HostedEditAuthorization from '@renderer/pages/settings/ConstitutionSettings/HostedEditAuthorization';

describe('HostedEditAuthorization', () => {
  beforeEach(() => mockRequestGrant.mockReset());

  it('shows a retryable error and clears the password when authorization is unavailable', async () => {
    mockRequestGrant.mockResolvedValue(null);
    const onGranted = vi.fn();
    render(<HostedEditAuthorization scopes={['constitution.write']} onGranted={onGranted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    const password = screen.getByPlaceholderText('WebUI password') as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'never-retain-me' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[1]);

    expect(
      await screen.findByText(
        'Editing could not be unlocked. Check the password and use a trusted local or Tailscale connection.'
      )
    ).toBeInTheDocument();
    expect(password.value).toBe('');
    expect(onGranted).not.toHaveBeenCalled();
  });

  it('returns a successful scoped grant and closes the password surface', async () => {
    const grant = { token: 'opaque-grant', expiresAt: Date.now() + 60_000 };
    mockRequestGrant.mockResolvedValue(grant);
    const onGranted = vi.fn();
    render(<HostedEditAuthorization scopes={['constitution.write']} onGranted={onGranted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[1]);

    await waitFor(() => expect(onGranted).toHaveBeenCalledWith(grant));
    expect(screen.queryByPlaceholderText('WebUI password')).not.toBeInTheDocument();
  });
});
