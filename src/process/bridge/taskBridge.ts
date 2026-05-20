/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Task Management Bridge Module
 *
 * Handles management of all running tasks (pause all, get running count, etc.)
 */

import { ipcBridge } from '@/common';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';

export function initTaskBridge(workerTaskManager: IWorkerTaskManager): void {
  // Stop all running tasks
  ipcBridge.task.stopAll.provider(async () => {
    try {
      const tasks = workerTaskManager.listTasks();
      const stopPromises = tasks.map((taskInfo) => {
        const task = workerTaskManager.getTask(taskInfo.id);
        return task?.stop?.();
      });
      await Promise.allSettled(stopPromises);
      return { success: true, count: tasks.length };
    } catch (error) {
      console.error('Failed to stop all tasks:', error);
      return { success: false, count: 0 };
    }
  });

  // Get count of running tasks
  ipcBridge.task.getRunningCount.provider(async () => {
    try {
      const tasks = workerTaskManager.listTasks();
      return { success: true, count: tasks.length };
    } catch (error) {
      console.error('Failed to get running task count:', error);
      return { success: false, count: 0 };
    }
  });
}
