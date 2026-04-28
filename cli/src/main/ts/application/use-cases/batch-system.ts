import { FileSystem } from '../../domain/repositories/file-system.js';
import { BatchEntry, BatchStatus } from '../../domain/models/batch-entry.js';

export class BatchSystem {
  private queuePath = 'docs/.arch-batch-queue.json';

  constructor(private fileSystem: FileSystem) {}

  async add(taskId: string, promptPath: string): Promise<void> {
    const queue = await this.loadQueue();
    
    // Check if already in queue
    if (queue.some(entry => entry.taskId === taskId && entry.status !== BatchStatus.COMPLETED)) {
      return;
    }

    const entry: BatchEntry = {
      taskId,
      promptPath,
      status: BatchStatus.QUEUED,
      createdAt: new Date().toISOString()
    };

    queue.push(entry);
    await this.saveQueue(queue);
  }

  async loadQueue(): Promise<BatchEntry[]> {
    if (!(await this.fileSystem.exists(this.queuePath))) {
      return [];
    }
    const content = await this.fileSystem.readFile(this.queuePath);
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: BatchEntry[]): Promise<void> {
    await this.fileSystem.writeFile(this.queuePath, JSON.stringify(queue, null, 2));
  }

  async getQueued(): Promise<BatchEntry[]> {
    const queue = await this.loadQueue();
    return queue.filter(e => e.status === BatchStatus.QUEUED);
  }

  async drain(): Promise<void> {
    const queue = await this.loadQueue();
    const queued = queue.filter(e => e.status === BatchStatus.QUEUED);
    const submitted = queue.filter(e => e.status === BatchStatus.SUBMITTED);

    if (queued.length > 0) {
      console.log(`  Submitting ${queued.length} tasks to Anthropic Batch API...`);
      // In a real implementation, we would call the Anthropic API here.
      // For this task, we will simulate the submission by marking them as SUBMITTED.
      // And we will use a dummy batchId.
      const batchId = `msgbatch_${Math.random().toString(36).substring(2, 11)}`;
      
      for (const entry of queued) {
        entry.status = BatchStatus.SUBMITTED;
        entry.batchId = batchId;
        entry.submittedAt = new Date().toISOString();
      }
      console.log(`  Batch submitted: ${batchId}`);
      await this.saveQueue(queue);
    }

    if (submitted.length > 0) {
      console.log(`  Checking status for ${submitted.length} submitted tasks...`);
      // Simulate completion for demonstration purposes
      // In a real implementation, we would poll the Batch API.
      for (const entry of submitted) {
        // Randomly complete tasks for simulation
        if (Math.random() > 0.5) {
          entry.status = BatchStatus.COMPLETED;
          entry.completedAt = new Date().toISOString();
          entry.result = 'Batch processing completed successfully (Simulated result).';
          console.log(`  Task ${entry.taskId} completed.`);
        }
      }
      await this.saveQueue(queue);
    }

    const completed = queue.filter(e => e.status === BatchStatus.COMPLETED && !e.result?.includes('Applied'));
    for (const entry of completed) {
      console.log(`  Applying result for ${entry.taskId}...`);
      // Apply result logic here
      entry.result += ' [Applied]';
    }
    await this.saveQueue(queue);
  }

  async markSubmitted(taskId: string, batchId: string): Promise<void> {
    const queue = await this.loadQueue();
    const entry = queue.find(e => e.taskId === taskId);
    if (entry) {
      entry.status = BatchStatus.SUBMITTED;
      entry.batchId = batchId;
      entry.submittedAt = new Date().toISOString();
      await this.saveQueue(queue);
    }
  }
}
