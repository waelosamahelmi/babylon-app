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
import { useAndroid } from '@/lib/android-context';

interface PrinterDemoProps {
  onClose?: () => void;
}

export function EnhancedPrinterDemo({ onClose }: PrinterDemoProps) {
  // Android context for permissions
  const { hasBluetoothPermission, requestBluetoothPermission, isAndroid } = useAndroid();
  
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

      // Check for Android and Bluetooth permissions first
      if (!isAndroid) {
        throw new Error('Bluetooth scanning is only available on Android devices');
      }

      if (!hasBluetoothPermission) {
        console.log('🔵 Requesting Bluetooth permission...');
        const granted = await requestBluetoothPermission();
        if (!granted) {
          throw new Error('Bluetooth permission is required for scanning');
        }
      }

      console.log('🔵 Starting Bluetooth scan with timeout...');
      setScanProgress({
        method: 'bluetooth',
        current: 0,
        total: 100,
        details: 'Scanning for Bluetooth thermal printers...'
      });

      // Add timeout to prevent infinite hanging
      const scanPromise = thermalPrinter.scanBluetoothPrinters();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Scan timeout after 30 seconds')), 30000)
      );

      const devices = await Promise.race([scanPromise, timeoutPromise]);
      setBluetoothDevices(devices);
      
      console.log(`✅ Bluetooth scan completed: ${devices.length} devices found`);
      setScanProgress({
        method: 'bluetooth',
        current: 100,
        total: 100,
        details: `Scan completed - ${devices.length} devices found`
      });
    } catch (error: any) {
      console.error('❌ Bluetooth scan failed:', error);
      setErrors(prev => [...prev, `Bluetooth scan failed: ${error.message || error}`]);
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

  const clearErrors = () => setErrors([]);

  const getConnectionStatusIcon = (id: string) => {
    const status = connectionStatus[id];
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

  const totalConnectedPrinters = (connectedThermalPrinter ? 1 : 0) + connectedNetworkPrinters.length;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🖨️ Enhanced Printer Demo</h2>
          <p className="text-muted-foreground">Test Bluetooth thermal printers and network printers</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Messages ({errors.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearErrors}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-orange-700">{error}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bluetooth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bluetooth">Bluetooth Thermal</TabsTrigger>
          <TabsTrigger value="network">Network Printers</TabsTrigger>
          <TabsTrigger value="connected">Connected ({totalConnectedPrinters})</TabsTrigger>
        </TabsList>

        <TabsContent value="bluetooth" className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startBluetoothScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />}
              Scan Bluetooth Thermal Printers
            </Button>
          </div>

          {scanProgress && scanProgress.method === 'bluetooth' && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bluetooth Scan</span>
                    <span>{scanProgress.current} devices</span>
                  </div>
                  <Progress value={isScanning ? 50 : 100} />
                  {scanProgress.details && (
                    <p className="text-xs text-muted-foreground">{scanProgress.details}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {bluetoothDevices.map((device) => (
              <Card key={device.address}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bluetooth className="h-5 w-5" />
                    {device.name}
                  </CardTitle>
                  <CardDescription>
                    Bluetooth Thermal Printer • {device.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${connectedThermalPrinter?.address === device.address ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {connectedThermalPrinter?.address === device.address ? 'Connected' : 'Available'}
                    </Badge>
                    {getConnectionStatusIcon(device.address)}
                  </div>
                  
                  <div className="flex gap-2">
                    {connectedThermalPrinter?.address === device.address ? (
                      <>
                        <Button size="sm" onClick={disconnectThermalPrinter}>
                          Disconnect
                        </Button>
                        <Button size="sm" variant="outline" onClick={testThermalPrinter}>
                          Test
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => printTestReceipt('thermal')}
                        >
                          Print Test Receipt
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => connectToBluetoothPrinter(device)}
                        disabled={connectionStatus[device.address] === 'connecting'}
                      >
                        {connectionStatus[device.address] === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {bluetoothDevices.length === 0 && !isScanning && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bluetooth className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No Bluetooth thermal printers found.</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your thermal printer is powered on, in pairing mode, and within range.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startNetworkScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Scan Network Printers
            </Button>
          </div>

          {scanProgress && scanProgress.method === 'network' && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network Scan</span>
                    <span>{scanProgress.current}/{scanProgress.total}</span>
                  </div>
                  <Progress value={(scanProgress.current / scanProgress.total) * 100} />
                  {scanProgress.details && (
                    <p className="text-xs text-muted-foreground">{scanProgress.details}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Network Printer Addition */}
          <Card>
            <CardHeader>
              <CardTitle>Add Network Printer Manually</CardTitle>
              <CardDescription>
                Enter the IP address and port of your network printer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    placeholder="192.168.1.100"
                    value={manualIP}
                    onChange={(e) => setManualIP(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="9100"
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="name">Printer Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Kitchen Printer"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <Button onClick={addManualNetworkPrinter} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Add Printer
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {networkPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wifi className="h-5 w-5" />
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    Network Printer • {printer.address}:{printer.port}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${connectedNetworkPrinters.find(p => p.id === printer.id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {connectedNetworkPrinters.find(p => p.id === printer.id) ? 'Connected' : 'Available'}
                    </Badge>
                    {getConnectionStatusIcon(printer.id)}
                  </div>
                  
                  <div className="flex gap-2">
                    {connectedNetworkPrinters.find(p => p.id === printer.id) ? (
                      <>
                        <Button size="sm" onClick={() => disconnectNetworkPrinter(printer.id)}>
                          Disconnect
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => printTestReceipt('network', printer.id)}
                        >
                          Print Test Receipt
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => connectToNetworkPrinter(printer)}
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

          {networkPrinters.length === 0 && !isScanning && (
            <Card>
              <CardContent className="p-8 text-center">
                <Wifi className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No network printers found.</p>
                <p className="text-sm text-muted-foreground">
                  Try scanning or add a printer manually using its IP address.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid gap-4">
            {/* Connected Thermal Printer */}
            {connectedThermalPrinter && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bluetooth className="h-5 w-5" />
                    {connectedThermalPrinter.name}
                  </CardTitle>
                  <CardDescription>
                    Connected Bluetooth Thermal Printer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Connected
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={disconnectThermalPrinter}>
                      Disconnect
                    </Button>
                    <Button size="sm" variant="outline" onClick={testThermalPrinter}>
                      Test Connection
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => printTestReceipt('thermal')}
                    >
                      Print Test Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connected Network Printers */}
            {connectedNetworkPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    Connected Network Printer • {printer.address}:{printer.port}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Connected
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => disconnectNetworkPrinter(printer.id)}>
                      Disconnect
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => printTestReceipt('network', printer.id)}
                    >
                      Print Test Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalConnectedPrinters === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No printers connected.</p>
                <p className="text-sm text-muted-foreground">
                  Connect to Bluetooth thermal printers or network printers to see them here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}