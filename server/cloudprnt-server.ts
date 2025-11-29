/**
 * CloudPRNT Server Implementation
 * Star Micronics CloudPRNT protocol for remote printing
 * 
 * CloudPRNT allows Star printers to poll the server for print jobs
 * Server responds with job availability and printer retrieves jobs via HTTP
 */

import { Router, Request, Response } from 'express';
import { StarFormatter } from '../src/lib/printer/star-formatter';
import { ESCPOSFormatter } from '../src/lib/printer/escpos-formatter';
import { ReceiptData } from '../src/lib/printer/types';
import crypto from 'crypto';

/**
 * Print job in CloudPRNT queue
 */
interface CloudPRNTPrintJob {
  jobId: string;
  printerMac: string;
  receiptData: ReceiptData;
  originalOrder?: any;
  createdAt: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  printerType: 'star' | 'escpos';
  mediaType: string; // 'application/vnd.star.starprnt' or 'application/vnd.star.line'
  rawData?: Uint8Array; // Pre-generated print data
}

/**
 * Printer registration info
 */
interface RegisteredPrinter {
  mac: string;
  model?: string;
  lastPoll: Date;
  capabilities?: string[];
}

/**
 * CloudPRNT Server Class
 */
export class CloudPRNTServer {
  private printJobs = new Map<string, CloudPRNTPrintJob>();
  private printers = new Map<string, RegisteredPrinter>();
  private jobsByPrinter = new Map<string, string[]>(); // printerMac -> jobIds[]
  
  /**
   * Get Express router for CloudPRNT endpoints
   */
  getRouter(): Router {
    const router = Router();

    // CloudPRNT endpoints
    router.post('/cloudprnt/:mac?', this.handlePoll.bind(this));
    router.get('/cloudprnt/:mac?/:jobId?', this.handleJobRequest.bind(this));
    router.delete('/cloudprnt/:mac?/:jobId?', this.handleJobConfirmation.bind(this));
    
    // Management endpoints
    router.post('/cloudprnt-api/submit-job', this.handleSubmitJob.bind(this));
    router.get('/cloudprnt-api/status', this.handleStatus.bind(this));
    router.get('/cloudprnt-api/printers', this.handleListPrinters.bind(this));

    return router;
  }

  /**
   * Handle POST poll from printer
   * Printer sends status and asks if there are jobs
   */
  private async handlePoll(req: Request, res: Response): Promise<void> {
    try {
      const mac = req.params.mac || this.extractMacFromBody(req.body);
      
      if (!mac) {
        res.status(400).json({ error: 'Printer MAC address required' });
        return;
      }

      console.log(`📡 CloudPRNT Poll from printer ${mac}`);
      console.log(`📊 Printer status:`, JSON.stringify(req.body, null, 2));

      // Register/update printer
      this.registerPrinter(mac, req.body);

      // Check for pending jobs for this printer
      const pendingJobs = this.getPendingJobsForPrinter(mac);

      if (pendingJobs.length > 0) {
        const job = pendingJobs[0];
        console.log(`✅ Job ready for printer ${mac}: ${job.jobId}`);

        // Determine media types based on printer type
        const mediaTypes = job.printerType === 'star'
          ? ['application/vnd.star.starprnt', 'application/vnd.star.line']
          : ['application/vnd.star.line']; // ESC/POS as Star Line Mode

        res.json({
          jobReady: true,
          mediaTypes: mediaTypes,
          jobToken: job.jobId,
          deleteMethod: 'DELETE'
        });
      } else {
        console.log(`ℹ️ No jobs for printer ${mac}`);
        res.json({
          jobReady: false
        });
      }
    } catch (error) {
      console.error('❌ CloudPRNT poll error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle GET request for print job data
   * Printer retrieves the actual print data
   */
  private async handleJobRequest(req: Request, res: Response): Promise<void> {
    try {
      const mac = req.params.mac;
      const jobId = req.params.jobId || req.query.jobToken as string;
      const acceptHeader = req.get('Accept') || '';

      console.log(`📥 Job request from ${mac} for job ${jobId}`);
      console.log(`📄 Accept header: ${acceptHeader}`);

      if (!jobId) {
        res.status(400).json({ error: 'Job ID required' });
        return;
      }

      const job = this.printJobs.get(jobId);
      if (!job) {
        console.log(`❌ Job ${jobId} not found`);
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      // Mark job as printing
      job.status = 'printing';

      // Generate print data if not already generated
      if (!job.rawData) {
        if (job.printerType === 'star') {
          const starFormatter = new StarFormatter();
          job.rawData = starFormatter.formatReceipt(job.receiptData, job.originalOrder);
        } else {
          // ESC/POS
          job.rawData = ESCPOSFormatter.formatReceipt(job.receiptData, job.originalOrder);
        }
      }

      // Determine content type based on Accept header and printer type
      let contentType = 'application/vnd.star.line'; // Default to Line Mode (compatible with ESC/POS)
      
      if (job.printerType === 'star' && acceptHeader.includes('application/vnd.star.starprnt')) {
        contentType = 'application/vnd.star.starprnt';
      }

      console.log(`✅ Sending job ${jobId} (${job.rawData.length} bytes) as ${contentType}`);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', job.rawData.length.toString());
      res.send(Buffer.from(job.rawData));
    } catch (error) {
      console.error('❌ Job request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle DELETE confirmation of job completion
   * Printer confirms it has printed the job
   */
  private async handleJobConfirmation(req: Request, res: Response): Promise<void> {
    try {
      const mac = req.params.mac;
      const jobId = req.params.jobId || req.query.jobToken as string;
      const code = req.query.code as string;

      console.log(`✅ Job confirmation from ${mac} for job ${jobId} (code: ${code})`);

      if (!jobId) {
        res.status(400).json({ error: 'Job ID required' });
        return;
      }

      const job = this.printJobs.get(jobId);
      if (job) {
        if (code === 'success') {
          job.status = 'completed';
          console.log(`✅ Job ${jobId} completed successfully`);
        } else {
          job.status = 'failed';
          console.log(`❌ Job ${jobId} failed with code: ${code}`);
        }

        // Remove job from queue after 1 minute
        setTimeout(() => {
          this.removeJob(jobId);
        }, 60000);
      }

      res.status(204).send(); // No content
    } catch (error) {
      console.error('❌ Job confirmation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Submit a new print job to CloudPRNT queue
   * This is called by the admin app to queue receipts
   */
  private async handleSubmitJob(req: Request, res: Response): Promise<void> {
    try {
      const { printerMac, receiptData, originalOrder, printerType } = req.body;

      if (!printerMac || !receiptData) {
        res.status(400).json({ error: 'Printer MAC and receipt data required' });
        return;
      }

      console.log(`📝 Submitting print job for printer ${printerMac}`);

      const jobId = this.createJob(printerMac, receiptData, originalOrder, printerType || 'star');

      res.json({
        success: true,
        jobId: jobId,
        message: `Print job queued for printer ${printerMac}`
      });
    } catch (error) {
      console.error('❌ Submit job error:', error);
      res.status(500).json({ error: 'Failed to submit job' });
    }
  }

  /**
   * Get CloudPRNT system status
   */
  private async handleStatus(req: Request, res: Response): Promise<void> {
    const status = {
      totalJobs: this.printJobs.size,
      pendingJobs: Array.from(this.printJobs.values()).filter(j => j.status === 'pending').length,
      printingJobs: Array.from(this.printJobs.values()).filter(j => j.status === 'printing').length,
      completedJobs: Array.from(this.printJobs.values()).filter(j => j.status === 'completed').length,
      failedJobs: Array.from(this.printJobs.values()).filter(j => j.status === 'failed').length,
      registeredPrinters: this.printers.size,
      printers: Array.from(this.printers.values())
    };

    res.json(status);
  }

  /**
   * List registered printers
   */
  private async handleListPrinters(req: Request, res: Response): Promise<void> {
    const printers = Array.from(this.printers.entries()).map(([mac, printer]) => ({
      mac,
      model: printer.model,
      lastPoll: printer.lastPoll,
      capabilities: printer.capabilities,
      pendingJobs: this.getPendingJobsForPrinter(mac).length
    }));

    res.json({ printers });
  }

  /**
   * Create a new print job
   */
  public createJob(
    printerMac: string,
    receiptData: ReceiptData,
    originalOrder?: any,
    printerType: 'star' | 'escpos' = 'star'
  ): string {
    const jobId = this.generateJobId();

    const job: CloudPRNTPrintJob = {
      jobId,
      printerMac: printerMac.toUpperCase(),
      receiptData,
      originalOrder,
      createdAt: new Date(),
      status: 'pending',
      printerType,
      mediaType: printerType === 'star' 
        ? 'application/vnd.star.starprnt' 
        : 'application/vnd.star.line'
    };

    this.printJobs.set(jobId, job);

    // Add to printer's job queue
    const printerJobs = this.jobsByPrinter.get(job.printerMac) || [];
    printerJobs.push(jobId);
    this.jobsByPrinter.set(job.printerMac, printerJobs);

    console.log(`✅ Created job ${jobId} for printer ${printerMac}`);

    return jobId;
  }

  /**
   * Register or update printer info
   */
  private registerPrinter(mac: string, statusData: any): void {
    const macUpper = mac.toUpperCase();
    
    const printer: RegisteredPrinter = {
      mac: macUpper,
      model: statusData.printerModel || statusData.model,
      lastPoll: new Date(),
      capabilities: statusData.mediaTypes || []
    };

    this.printers.set(macUpper, printer);
  }

  /**
   * Get pending jobs for a specific printer
   */
  private getPendingJobsForPrinter(mac: string): CloudPRNTPrintJob[] {
    const macUpper = mac.toUpperCase();
    const jobIds = this.jobsByPrinter.get(macUpper) || [];
    
    return jobIds
      .map(id => this.printJobs.get(id))
      .filter(job => job && job.status === 'pending') as CloudPRNTPrintJob[];
  }

  /**
   * Remove a job from queue
   */
  private removeJob(jobId: string): void {
    const job = this.printJobs.get(jobId);
    if (job) {
      this.printJobs.delete(jobId);
      
      // Remove from printer's job queue
      const printerJobs = this.jobsByPrinter.get(job.printerMac) || [];
      const index = printerJobs.indexOf(jobId);
      if (index > -1) {
        printerJobs.splice(index, 1);
        this.jobsByPrinter.set(job.printerMac, printerJobs);
      }

      console.log(`🗑️ Removed job ${jobId}`);
    }
  }

  /**
   * Extract MAC address from request body
   */
  private extractMacFromBody(body: any): string | null {
    return body?.mac || body?.macAddress || body?.printerMAC || null;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Clean up old completed jobs (older than 1 hour)
   */
  public cleanupOldJobs(): void {
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    for (const [jobId, job] of this.printJobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.createdAt < oneHourAgo) {
        this.removeJob(jobId);
      }
    }
  }
}

// Export singleton instance
export const cloudPRNTServer = new CloudPRNTServer();

// Clean up old jobs every 15 minutes
setInterval(() => {
  cloudPRNTServer.cleanupOldJobs();
}, 900000);
