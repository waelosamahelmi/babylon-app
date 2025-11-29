import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud,
  Printer,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Server,
  Clock,
  Loader2,
  Info
} from 'lucide-react';
import { createCloudPRNTClient } from '@/lib/printer/cloudprnt-client';

interface CloudPRNTStatus {
  totalJobs?: number;
  pendingJobs?: number;
  printingJobs?: number;
  completedJobs?: number;
  failedJobs?: number;
  registeredPrinters?: number;
  printers?: Array<{
    mac: string;
    model?: string;
    lastPoll?: string;
    capabilities?: any;
    pendingJobs?: number;
  }>;
}

export function CloudPRNTManagement() {
  const { toast } = useToast();
  const [status, setStatus] = useState<CloudPRNTStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    // Detect server URL
    const detectedUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:5000'
      : window.location.origin.replace(/:\d+/, ':5000');
    setServerUrl(detectedUrl);
    
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const client = createCloudPRNTClient(serverUrl || 'http://localhost:5000');
      const statusData = await client.getStatus();
      setStatus(statusData || {});
    } catch (error) {
      console.error('Failed to load CloudPRNT status:', error);
      setStatus({});
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const getServerIpInstructions = () => {
    // Get local network IP hint
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return "Replace 'localhost' with your server's local IP address (e.g., 192.168.1.100)";
    }
    return `Use: ${hostname}`;
  };

  return (
    <div className="space-y-4">
      {/* CloudPRNT Server Status */}
      <Card className={status?.registeredPrinters ? 'border-green-500' : 'border-yellow-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            CloudPRNT Server Status
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin ml-auto" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadStatus}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {status?.registeredPrinters ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <p className="text-sm font-medium">Server Status</p>
                <p className="text-xs text-muted-foreground">
                  {status?.registeredPrinters !== undefined ? 'Running' : 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Registered Printers</p>
                <p className="text-xs text-muted-foreground">
                  {status?.registeredPrinters || 0} device(s)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Pending Jobs</p>
                <p className="text-xs text-muted-foreground">
                  {status?.pendingJobs || 0} job(s)
                </p>
              </div>
            </div>
          </div>

          {status?.totalJobs !== undefined && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Total Jobs: {status.totalJobs}</div>
              <div className="flex gap-4">
                <span className="text-yellow-600">Printing: {status.printingJobs || 0}</span>
                <span className="text-green-600">Completed: {status.completedJobs || 0}</span>
                <span className="text-red-600">Failed: {status.failedJobs || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Printer Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">CloudPRNT Server URL:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                {serverUrl}/cloudprnt/PRINTER_MAC
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${serverUrl}/cloudprnt/PRINTER_MAC`)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Replace PRINTER_MAC with your printer's MAC address (e.g., 00:11:62:AA:BB:CC)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Setup Steps:
            </p>
            <ol className="text-sm space-y-1 ml-6 list-decimal">
              <li>Access your Star printer's web interface (usually at the printer's IP address)</li>
              <li>Navigate to CloudPRNT settings</li>
              <li>Enable CloudPRNT</li>
              <li>Set Server Type: "HTTP"</li>
              <li>Set Server URL: <code className="bg-white dark:bg-black px-1 rounded">{serverUrl}/cloudprnt/[MAC]</code></li>
              <li>Set Polling Interval: 5 seconds (recommended)</li>
              <li>Save and restart the printer</li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Network Configuration:
            </p>
            <p className="text-xs">
              {getServerIpInstructions()}
            </p>
            <p className="text-xs">
              Ensure your printer and server are on the same network or the printer can reach the server.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Registered Printers */}
      {status?.printers && status.printers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Registered CloudPRNT Printers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.printers.map((printer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Printer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{printer.mac}</p>
                      <p className="text-xs text-muted-foreground">
                        {printer.model || 'Unknown Model'}
                        {printer.lastPoll && ` • Last poll: ${new Date(printer.lastPoll).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {printer.pendingJobs !== undefined && printer.pendingJobs > 0 && (
                      <Badge variant="secondary">{printer.pendingJobs} jobs</Badge>
                    )}
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            CloudPRNT Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Remote Printing:</strong> Printers poll the server automatically, no direct connection needed</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Modern Receipts:</strong> QR codes, logos, and proper Finnish character encoding (ä, ö, å)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Job Queue:</strong> Automatic job management per printer with 1-hour retention</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Multi-Printer:</strong> Support for multiple printers with MAC-based routing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Dual Format:</strong> Supports both Star and ESC/POS printer commands</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Need Help?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Complete documentation is available in the project files:
              </p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li><code className="bg-white dark:bg-black px-1 rounded">CLOUDPRNT_INTEGRATION.md</code> - Technical documentation</li>
                <li><code className="bg-white dark:bg-black px-1 rounded">IMPLEMENTATION_SUMMARY.md</code> - Features and overview</li>
                <li><code className="bg-white dark:bg-black px-1 rounded">CLOUDPRNT_USAGE_EXAMPLES.tsx</code> - Integration examples</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
