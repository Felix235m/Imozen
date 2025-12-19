/**
 * Lazy-loaded task utility functions
 * These functions are loaded on-demand when task utilities are needed
 */

let taskUtilsLoaded = false;
let taskUtils: any = null;

const loadTaskUtils = async () => {
  if (taskUtilsLoaded) return taskUtils;

  try {
    const module = await import('./task-utils');
    taskUtils = module;
    taskUtilsLoaded = true;
    return module;
  } catch (error) {
    console.error('Failed to load task utilities:', error);
    throw new Error('Task utilities could not be loaded');
  }
};

// Lazy wrappers for task functions
export const lazyCopyToClipboard = async (text: string): Promise<boolean> => {
  const utils = await loadTaskUtils();
  return utils.copyToClipboard(text);
};

export const lazyFormatDate = async (date: Date): Promise<string> => {
  const utils = await loadTaskUtils();
  return utils.formatDate ? utils.formatDate(date) : date.toLocaleDateString();
};

export const lazyFormatTime = async (time: string): Promise<string> => {
  const utils = await loadTaskUtils();
  return utils.formatTime ? utils.formatTime(time) : time;
};