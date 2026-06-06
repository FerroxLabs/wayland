/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown, Eye } from 'lucide-react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { diffColors, iconColors } from '@/renderer/styles/colors';
import { useTranslation } from 'react-i18next';

/**
 * File change item data
 */
export interface FileChangeItem {
  /** File name */
  fileName: string;
  /** Full path */
  fullPath: string;
  /** Number of insertions */
  insertions: number;
  /** Number of deletions */
  deletions: number;
}

/**
 * File changes panel props
 */
export interface FileChangesPanelProps {
  /** Panel title */
  title: string;
  /** File changes list */
  files: FileChangeItem[];
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Callback when preview button is clicked */
  onFileClick?: (file: FileChangeItem) => void;
  /** Callback when change stats are clicked (opens diff view) */
  onDiffClick?: (file: FileChangeItem) => void;
  /** Additional class name */
  className?: string;
}

/**
 * File changes panel component
 *
 * Used to display generated/modified files in conversation, supports expand/collapse
 */
const FileChangesPanel: React.FC<FileChangesPanelProps> = ({
  title,
  files,
  defaultExpanded = true,
  onFileClick,
  onDiffClick,
  className,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className={classNames(
        'w-full box-border rounded-8px overflow-hidden border border-solid border-[var(--aou-2)]',
        className
      )}
      style={{ width: '100%' }}
    >
      {/* Header */}
      <div
        className='flex items-center justify-between px-16px py-12px cursor-pointer select-none'
        onClick={() => setExpanded(!expanded)}
      >
        <div className='flex items-center gap-8px'>
          {/* Green dot */}
          <span className='w-8px h-8px rounded-full shrink-0' style={{ backgroundColor: diffColors.addition }}></span>
          {/* Title */}
          <span className='text-14px text-t-primary font-medium'>{title}</span>
        </div>
        {/* Expand/collapse arrow */}
        <ChevronDown size={16} color={iconColors.secondary}
          className={classNames('transition-transform duration-200', expanded && 'rotate-180')}
        />
      </div>

      {/* File list */}
      {expanded && (
        <div className='w-full bg-2'>
          {files.map((file, index) => (
            <div
              key={`${file.fullPath}-${index}`}
              className={classNames(
                'group flex items-center justify-between px-16px py-12px hover:bg-3 transition-colors'
              )}
            >
              {/* File name */}
              <div className='flex items-center min-w-0'>
                <span className='text-14px text-t-primary truncate'>{file.fileName}</span>
              </div>
              {/* Change statistics + Preview button */}
              <div className='flex items-center gap-8px shrink-0'>
                {/* Change stats - click to open diff view */}
                {(file.insertions > 0 || file.deletions > 0) && (
                  <span
                    className={classNames(
                      'flex items-center gap-4px rd-4px px-4px py-2px',
                      onDiffClick && 'cursor-pointer hover:bg-4 transition-colors'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiffClick?.(file);
                    }}
                  >
                    {file.insertions > 0 && (
                      <span className='text-14px font-medium' style={{ color: diffColors.addition }}>
                        +{file.insertions}
                      </span>
                    )}
                    {file.deletions > 0 && (
                      <span className='text-14px font-medium' style={{ color: diffColors.deletion }}>
                        -{file.deletions}
                      </span>
                    )}
                  </span>
                )}
                {/* Preview button - click to open file preview */}
                <span
                  className='group-hover:opacity-100 transition-opacity shrink-0 ml-4px flex items-center gap-4px text-12px text-t-secondary cursor-pointer rd-4px px-4px py-2px hover:bg-4'
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick?.(file);
                  }}
                >
                  <Eye className='line-height-8px' size={14} color={iconColors.secondary} />
                  {t('preview.preview')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileChangesPanel;
