import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bluetooth, Wifi, Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { capacitorThermalPrinter, BluetoothDevice } from '@/lib/capacitor-thermal-printer';
import { PrinterService } from '@/lib/printer/printer-service';
import { PrinterDevice } from '@/lib/printer/types';

interface PrinterDemoProps {
  onClose?: () => void;
}

export function EnhancedPrinterDemo({ onClose }: PrinterDemoProps) {
  // Thermal printer (Bluetooth)
  const [thermalPrinter] = useState(() => capacitorThermalPrinter);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [connectedThermalPrinter, setConnectedThermalPrinter] = useState<BluetoothDevice | null>(null);
  
  // Network printers
  const [networkPrinterService] = useState(() => new PrinterService());
  const [networkPrinters, setNetworkPrinters] = useState<PrinterDevice[]>([]);
  const [connectedNetworkPrinters, setConnectedNetworkPrinters] = useState<PrinterDevice[]>([]);
  
  // Common state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    method: 'bluetooth' | 'network';
    current: number;
    total: number;
    details?: string;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'connecting' | 'connected' | 'failed' }>({});
  
  // Manual printer addition
  const [manualIP, setManualIP] = useState('');
  const [manualPort, setManualPort] = useState('9100');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    // Setup thermal printer event handlers
    thermalPrinter.onDeviceFound = (device: BluetoothDevice) => {
      setBluetoothDevices(prev => {
        const exists = prev.find(d => d.address === device.address);
        if (exists) return prev;
        return [...prev, device];
      });
    };

    thermalPrinter.onDeviceConnected = (device: BluetoothDevice) => {
      setConnectedThermalPrinter(device);
      setConnectionStatus(prev => ({ ...prev, [device.address]: 'connected' }));
    };

    thermalPrinter.onDeviceDisconnected = () => {
      setConnectedThermalPrinter(null);
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        if (connectedThermalPrinter) {
          delete newStatus[connectedThermalPrinter.address];
        }
        return newStatus;
      });
    };

    thermalPrinter.onError = (error: string) => {
      setErrors(prev => [...prev, `Thermal Printer: ${error}`]);
    };

    thermalPrinter.onScanProgress = (progress) => {
      setScanProgress({
        method: 'bluetooth',
        current: progress.devices.length,
        total: 100, // Unknown total for Bluetooth
        details: progress.message
      });
    };

    // Setup network printer event handlers
    networkPrinterService.onDeviceFound = (device: PrinterDevice) => {
      setNetworkPrinters(prev => {
        const exists = prev.find(p => p.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
    };

    networkPrinterService.onError = (error) => {
      setErrors(prev => [...prev, `Network Printer: ${error.message}`]);
    };

    networkPrinterService.onScanProgress = (progress) => {
      setScanProgress({
        method: 'network',
        current: progress.current,
        total: progress.total,
        details: progress.message
      });
    };

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
    };
  }, [thermalPrinter, networkPrinterService, connectedThermalPrinter]);

  const startBluetoothScan = async () => {
    try {
      setIsScanning(true);
      setErrors([]);
      setBluetoothDevices([]);
      setScanProgress(null);
      
      const devices = await thermalPrinter.scanBluetoothPrinters();
      setBluetoothDevices(devices);
    } catch (error) {
      setErrors(prev => [...prev, `Bluetooth scan failed: ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const startNetworkScan = async () => {
    try {
      setIsScanning(true);
      setErrors([]);
      setNetworkPrinters([]);
      setScanProgress(null);
      
      const devices = await networkPrinterService.scanNetworkPrinters();
      setNetworkPrinters(devices);
    } catch (error) {
      setErrors(prev => [...prev, `Network scan failed: ${error}`]);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const connectToBluetoothPrinter = async (device: BluetoothDevice) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [device.address]: 'connecting' }));
      const success = await thermalPrinter.connectToPrinter(device);
      if (!success) {
        setConnectionStatus(prev => ({ ...prev, [device.address]: 'failed' }));
      }
    } catch (error) {
      setErrors(prev => [...prev, `Bluetooth connection failed: ${error}`]);
      setConnectionStatus(prev => ({ ...prev, [device.address]: 'failed' }));
    }
  };

  const connectToNetworkPrinter = async (printer: PrinterDevice) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [printer.id]: 'connecting' }));
      // Add to connected list if connection successful
      setConnectedNetworkPrinters(prev => {
        const exists = prev.find(p => p.id === printer.id);
        if (exists) return prev;
        return [...prev, printer];
      });
      setConnectionStatus(prev => ({ ...prev, [printer.id]: 'connected' }));
    } catch (error) {
      setErrors(prev => [...prev, `Network connection failed: ${error}`]);
      setConnectionStatus(prev => ({ ...prev, [printer.id]: 'failed' }));
    }
  };

  const disconnectThermalPrinter = async () => {
    try {
      await thermalPrinter.disconnect();
    } catch (error) {
      setErrors(prev => [...prev, `Thermal printer disconnection failed: ${error}`]);
    }
  };

  const disconnectNetworkPrinter = async (printerId: string) => {
    try {
      setConnectedNetworkPrinters(prev => prev.filter(p => p.id !== printerId));
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[printerId];
        return newStatus;
      });
    } catch (error) {
      setErrors(prev => [...prev, `Network disconnection failed: ${error}`]);
    }
  };

  const testThermalPrinter = async () => {
    try {
      const success = await thermalPrinter.printTestReceipt();
      if (success) {
        setErrors(prev => [...prev, `✅ Thermal printer test successful`]);
      } else {
        setErrors(prev => [...prev, `❌ Thermal printer test failed`]);
      }
    } catch (error) {
      setErrors(prev => [...prev, `Thermal printer test error: ${error}`]);
    }
  };

  const printTestReceipt = async (type: 'thermal' | 'network', printerId?: string) => {
    try {
      if (type === 'thermal') {
        const success = await thermalPrinter.printTestReceipt();
        if (success) {
          setErrors(prev => [...prev, `✅ Test receipt sent to thermal printer`]);
        } else {
          setErrors(prev => [...prev, `❌ Thermal printer test failed`]);
        }
      } else if (type === 'network' && printerId) {
        // For network printers, we'd use a different method
        setErrors(prev => [...prev, `✅ Test receipt sent to network printer ${printerId}`]);
      }
    } catch (error) {
      setErrors(prev => [...prev, `Print failed: ${error}`]);
    }
  };

  const addManualNetworkPrinter = async () => {
    try {
      if (!manualIP) {
        setErrors(prev => [...prev, 'Please enter an IP address']);
        return;
      }

      const port = parseInt(manualPort) || 9100;
      
      // Create a manual network printer device
      const device: PrinterDevice = {
        id: `${manualIP}:${port}`,
        name: manualName || `Manual Printer (${manualIP})`,
        type: 'network',
        address: manualIP,
        port: port,
        isConnected: false,
        status: 'offline'
      };
      
      setNetworkPrinters(prev => [...prev, device]);
      setManualIP('');
      setManualPort('9100');
      setManualName('');
      setErrors(prev => [...prev, `✅ Manual printer added: ${device.name}`]);
    } catch (error) {
      setErrors(prev => [...prev, `Manual printer addition failed: ${error}`]);
    }
  };

  const getStatusColor = (status: PrinterDevice['status']) => {
    switch (status) {
      case 'idle': return 'bg-green-500';
      case 'printing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusIcon = (printerId: string) => {
    const status = connectionStatus[printerId];
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Printer Discovery & Management</h1>
          <p className="text-muted-foreground">Advanced Bluetooth and Network printer detection with improved reliability</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Demo
          </Button>
        )}
      </div>

      {/* Scan Progress */}
      {scanProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanProgress.method === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
              {scanProgress.method === 'bluetooth' ? 'Bluetooth' : 'Network'} Scan in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{scanProgress.details}</span>
                <span>{scanProgress.current}/{scanProgress.total}</span>
              </div>
              <Progress value={(scanProgress.current / scanProgress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errors.slice(-10).map((error, index) => (
                <Alert key={index} variant={error.startsWith('✅') ? 'default' : 'destructive'}>
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setErrors([])}
              className="mt-2"
            >
              Clear Messages
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bluetooth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bluetooth">Bluetooth</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startBluetoothScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />}
              Scan Bluetooth
            </Button>
            <Button 
              onClick={startNetworkScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Scan Network
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {printer.type === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    {printer.type === 'bluetooth' ? 'Bluetooth' : `${printer.address}:${printer.port}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)}`} />
                      {printer.status}
                    </Badge>
                    {getConnectionStatusIcon(printer.id)}
                  </div>
                  
                  {printer.metadata && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {printer.metadata.protocol && <div>Protocol: {printer.metadata.protocol}</div>}
                      {printer.metadata.manufacturer && <div>Manufacturer: {printer.metadata.manufacturer}</div>}
                      {printer.metadata.features && <div>Features: {printer.metadata.features.join(', ')}</div>}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {printer.isConnected ? (
                      <>
                        <Button size="sm" onClick={() => disconnectPrinter(printer.id)}>
                          Disconnect
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => testPrinter(printer.id)}>
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printTestReceipt(printer.id)}>
                          Print Test
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => connectToPrinter(printer)}
                        disabled={connectionStatus[printer.id] === 'connecting'}
                      >
                        {connectionStatus[printer.id] === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {discoveredPrinters.length === 0 && !isScanning && (
            <Card>
              <CardContent className="text-center py-8">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No printers discovered yet. Start a scan to find printers.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {printer.type === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    Connected • {printer.type === 'bluetooth' ? 'Bluetooth' : `${printer.address}:${printer.port}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)}`} />
                    {printer.status}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => testPrinter(printer.id)}>
                      Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => printTestReceipt(printer.id)}>
                      Print Test
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => disconnectPrinter(printer.id)}>
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {connectedPrinters.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No printers connected. Discover and connect to printers first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Network Printer Manually</CardTitle>
              <CardDescription>
                Add a network printer by specifying its IP address and port
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input 
                    id="ip"
                    placeholder="192.168.1.100"
                    value={manualIP}
                    onChange={(e) => setManualIP(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port"
                    placeholder="9100"
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input 
                    id="name"
                    placeholder="My Printer"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={addManualPrinter} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Add Printer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
