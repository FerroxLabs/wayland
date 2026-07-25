import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListReference = vi.hoisted(() => vi.fn());
const mockListArchivedReference = vi.hoisted(() => vi.fn());
const mockRemoveReference = vi.hoisted(() => vi.fn());
const mockRestoreReference = vi.hoisted(() => vi.fn());
const mockMessageSuccess = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    icon,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
  }) => (
    <button type='button' onClick={onClick}>
      {icon}
      {children}
    </button>
  ),
  Message: {
    success: mockMessageSuccess,
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    project: {
      listReference: { invoke: (...args: unknown[]) => mockListReference(...args) },
      listArchivedReference: { invoke: (...args: unknown[]) => mockListArchivedReference(...args) },
      removeReference: { invoke: (...args: unknown[]) => mockRemoveReference(...args) },
      restoreReference: { invoke: (...args: unknown[]) => mockRestoreReference(...args) },
      addReference: { invoke: vi.fn() },
    },
    dialog: { showOpen: { invoke: vi.fn() } },
  },
}));

vi.mock('@/renderer/pages/conversation/Workspace/hooks/useWorkspaceDragImport', () => ({
  useWorkspaceDragImport: () => ({ isDragging: false, dragHandlers: {} }),
}));

vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@/renderer/services/FileService', () => ({ uploadProjectReferencesViaHttp: vi.fn() }));

import ProjectReferencePanel from '@/renderer/pages/projects/components/ProjectReferencePanel';

describe('ProjectReferencePanel recoverable reference archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('archives a live reference and surfaces it in the visible restore list', async () => {
    mockListReference.mockResolvedValue([{ name: 'brief.pdf', path: '/workspace/brief.pdf', size: 2048 }]);
    mockListArchivedReference
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'archive-1', name: 'brief.pdf', size: 2048, archivedAt: 1 }]);
    mockRemoveReference.mockResolvedValue([]);

    render(<ProjectReferencePanel projectId='project-1' hasWorkspace onSetWorkspace={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'projects.knowledge.reference.remove' }));

    await waitFor(() => {
      expect(mockRemoveReference).toHaveBeenCalledWith({ id: 'project-1', name: 'brief.pdf' });
      expect(screen.getByText('brief.pdf')).toBeInTheDocument();
      expect(screen.getByText('projects.knowledge.reference.restore')).toBeInTheDocument();
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('projects.knowledge.fileArchived');
  });

  it('restores an archived reference through the project UI', async () => {
    mockListReference.mockResolvedValue([]);
    mockListArchivedReference
      .mockResolvedValueOnce([{ id: 'archive-2', name: 'research.docx', size: 4096, archivedAt: 2 }])
      .mockResolvedValueOnce([]);
    mockRestoreReference.mockResolvedValue([{ name: 'research.docx', path: '/workspace/research.docx', size: 4096 }]);

    render(<ProjectReferencePanel projectId='project-2' hasWorkspace onSetWorkspace={vi.fn()} />);

    fireEvent.click(await screen.findByText('projects.knowledge.reference.restore'));

    await waitFor(() => {
      expect(mockRestoreReference).toHaveBeenCalledWith({ id: 'project-2', archiveId: 'archive-2' });
      expect(screen.getByText('research.docx')).toBeInTheDocument();
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('projects.knowledge.fileRestored');
  });
});
