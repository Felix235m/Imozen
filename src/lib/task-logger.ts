/**
 * Task Logging Utilities
 *
 * Provides comprehensive logging system for task operations,
 * validation, and debugging information.
 */

export interface TaskLogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  operation: string;
  taskId?: string;
  leadId?: string;
  message: string;
  data?: any;
}

export interface TaskMetrics {
  tasksCreated: number;
  tasksUpdated: number;
  tasksDeleted: number;
  duplicatesFound: number;
  duplicatesResolved: number;
  validationErrors: number;
  lastOperation: string;
  lastOperationTime: number;
}

class TaskLogger {
  private logs: TaskLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries
  private metrics: TaskMetrics = {
    tasksCreated: 0,
    tasksUpdated: 0,
    tasksDeleted: 0,
    duplicatesFound: 0,
    duplicatesResolved: 0,
    validationErrors: 0,
    lastOperation: 'none',
    lastOperationTime: Date.now()
  };

  /**
   * Add a log entry
   */
  private log(
    level: TaskLogEntry['level'],
    operation: string,
    message: string,
    data?: any,
    taskId?: string,
    leadId?: string
  ): void {
    const entry: TaskLogEntry = {
      timestamp: Date.now(),
      level,
      operation,
      taskId,
      leadId,
      message,
      data
    };

    this.logs.push(entry);

    // Trim logs if they exceed max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update metrics
    this.updateMetrics(operation, level);

    // Console logging based on level
    if (process.env.NODE_ENV === 'development' || level === 'error') {
      const consoleMessage = `🔧 TaskLogger [${operation.toUpperCase()}] ${message}`;
      const contextInfo = { taskId, leadId, timestamp: entry.timestamp, ...data };

      switch (level) {
        case 'debug':
          console.debug(consoleMessage, contextInfo);
          break;
        case 'info':
          console.info(consoleMessage, contextInfo);
          break;
        case 'warn':
          console.warn(consoleMessage, contextInfo);
          break;
        case 'error':
          console.error(consoleMessage, contextInfo);
          break;
      }
    }
  }

  /**
   * Update internal metrics based on operations
   */
  private updateMetrics(operation: string, level: TaskLogEntry['level']): void {
    this.metrics.lastOperation = operation;
    this.metrics.lastOperationTime = Date.now();

    switch (operation) {
      case 'task_created':
        this.metrics.tasksCreated++;
        break;
      case 'task_updated':
        this.metrics.tasksUpdated++;
        break;
      case 'task_deleted':
        this.metrics.tasksDeleted++;
        break;
      case 'duplicate_found':
        this.metrics.duplicatesFound++;
        break;
      case 'duplicate_resolved':
        this.metrics.duplicatesResolved++;
        break;
      case 'validation_error':
        this.metrics.validationErrors++;
        break;
    }
  }

  /**
   * Log task creation
   */
  logTaskCreation(taskId: string, leadId?: string, data?: any): void {
    this.log('info', 'task_created', 'Task created successfully', data, taskId, leadId);
  }

  /**
   * Log task update
   */
  logTaskUpdate(taskId: string, leadId?: string, changes?: any): void {
    this.log('info', 'task_updated', 'Task updated successfully', changes, taskId, leadId);
  }

  /**
   * Log task deletion
   */
  logTaskDeletion(taskId: string, leadId?: string): void {
    this.log('info', 'task_deleted', 'Task deleted successfully', undefined, taskId, leadId);
  }

  /**
   * Log duplicate task ID detection
   */
  logDuplicateFound(duplicateId: string, count: number, affectedTasks?: any[]): void {
    this.log('warn', 'duplicate_found', `Duplicate task ID found: ${duplicateId} (${count} occurrences)`,
             { duplicateId, count, affectedTasks });
  }

  /**
   * Log duplicate task ID resolution
   */
  logDuplicateResolution(oldId: string, newId: string, taskId?: string, leadId?: string): void {
    this.log('info', 'duplicate_resolved', `Duplicate task ID resolved: ${oldId} → ${newId}`,
             { oldId, newId }, taskId, leadId);
  }

  /**
   * Log task validation error
   */
  logValidationError(taskId: string, errors: string[], warnings: string[], leadId?: string): void {
    this.log('error', 'validation_error', `Task validation failed: ${errors.join(', ')}`,
             { errors, warnings }, taskId, leadId);
  }

  /**
   * Log task ID generation
   */
  logIdGeneration(newId: string, leadId?: string, context?: string): void {
    this.log('debug', 'id_generated', `New task ID generated: ${newId}`, { context }, newId, leadId);
  }

  /**
   * Log localStorage operation
   */
  logStorageOperation(operation: 'read' | 'write' | 'delete', key: string, dataSize?: number): void {
    this.log('debug', 'storage_operation', `Storage ${operation}: ${key}`, { dataSize });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, details?: any): void {
    this.log('debug', 'performance', `Performance: ${operation} took ${duration}ms`, details);
  }

  /**
   * Log React key duplication issue
   */
  logReactKeyDuplication(duplicateKey: string, component: string, context?: any): void {
    this.log('error', 'react_key_duplication', `React key duplication detected: ${duplicateKey} in ${component}`,
             { duplicateKey, component, context });
  }

  /**
   * Log API operation
   */
  logApiOperation(operation: string, url: string, method: string, status?: number, duration?: number): void {
    const level = status && status >= 400 ? 'error' : status && status >= 300 ? 'warn' : 'info';
    this.log(level, 'api_operation', `API ${operation}: ${method} ${url}`, { status, duration });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50, level?: TaskLogEntry['level']): TaskLogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-count);
  }

  /**
   * Get logs by task ID
   */
  getLogsByTaskId(taskId: string): TaskLogEntry[] {
    return this.logs.filter(log => log.taskId === taskId);
  }

  /**
   * Get logs by lead ID
   */
  getLogsByLeadId(leadId: string): TaskLogEntry[] {
    return this.logs.filter(log => log.leadId === leadId);
  }

  /**
   * Get error logs
   */
  getErrorLogs(count: number = 50): TaskLogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count);
  }

  /**
   * Get current metrics
   */
  getMetrics(): TaskMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      tasksCreated: 0,
      tasksUpdated: 0,
      tasksDeleted: 0,
      duplicatesFound: 0,
      duplicatesResolved: 0,
      validationErrors: 0,
      lastOperation: 'none',
      lastOperationTime: Date.now()
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      logs: this.logs
    }, null, 2);
  }

  /**
   * Generate summary report
   */
  generateSummary(): string {
    const errorCount = this.logs.filter(log => log.level === 'error').length;
    const warnCount = this.logs.filter(log => log.level === 'warn').length;
    const recentErrors = this.getErrorLogs(5);

    return `
Task Logger Summary
==================
Metrics:
- Tasks Created: ${this.metrics.tasksCreated}
- Tasks Updated: ${this.metrics.tasksUpdated}
- Tasks Deleted: ${this.metrics.tasksDeleted}
- Duplicates Found: ${this.metrics.duplicatesFound}
- Duplicates Resolved: ${this.metrics.duplicatesResolved}
- Validation Errors: ${this.metrics.validationErrors}

Log Statistics:
- Total Logs: ${this.logs.length}
- Errors: ${errorCount}
- Warnings: ${warnCount}
- Last Operation: ${this.metrics.lastOperation} (${new Date(this.metrics.lastOperationTime).toISOString()})

Recent Errors:
${recentErrors.map(log => `- ${log.message} (${new Date(log.timestamp).toISOString()})`).join('\n')}
    `.trim();
  }
}

// Create singleton instance
export const taskLogger = new TaskLogger();

// Export convenience functions for common operations
export const logTaskCreation = (taskId: string, leadId?: string, data?: any) =>
  taskLogger.logTaskCreation(taskId, leadId, data);

export const logTaskUpdate = (taskId: string, leadId?: string, changes?: any) =>
  taskLogger.logTaskUpdate(taskId, leadId, changes);

export const logTaskDeletion = (taskId: string, leadId?: string) =>
  taskLogger.logTaskDeletion(taskId, leadId);

export const logDuplicateFound = (duplicateId: string, count: number, affectedTasks?: any[]) =>
  taskLogger.logDuplicateFound(duplicateId, count, affectedTasks);

export const logDuplicateResolution = (oldId: string, newId: string, taskId?: string, leadId?: string) =>
  taskLogger.logDuplicateResolution(oldId, newId, taskId, leadId);

export const logValidationError = (taskId: string, errors: string[], warnings: string[], leadId?: string) =>
  taskLogger.logValidationError(taskId, errors, warnings, leadId);

export const logIdGeneration = (newId: string, leadId?: string, context?: string) =>
  taskLogger.logIdGeneration(newId, leadId, context);

export const logReactKeyDuplication = (duplicateKey: string, component: string, context?: any) =>
  taskLogger.logReactKeyDuplication(duplicateKey, component, context);

// Development-only convenience function for debugging React key issues
export const debugReactKeys = (componentName: string, items: any[], keyExtractor: (item: any) => string) => {
  if (process.env.NODE_ENV === 'development') {
    const keys = items.map(keyExtractor);
    const uniqueKeys = new Set(keys);

    if (keys.length !== uniqueKeys.size) {
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
      taskLogger.logReactKeyDuplication(
        duplicates[0],
        componentName,
        { totalItems: items.length, uniqueKeys: uniqueKeys.size, duplicates: duplicates.length }
      );
    }
  }
};