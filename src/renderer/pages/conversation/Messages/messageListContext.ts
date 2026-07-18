/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { createContext } from '@renderer/utils/ui/createContext';

/**
 * The message-stream context is deliberately isolated from the mutation/cache
 * hooks. Read-only consumers such as the execution spine should not acquire a
 * hidden dependency on the entire Messages hooks module.
 */
export const [useMessageList, MessageListProvider, useUpdateMessageList] = createContext([] as TMessage[]);
