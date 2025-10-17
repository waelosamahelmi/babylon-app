import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrinter } from '@/lib/printer-context';
import { Bluetooth, Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function BluetoothPrinterTest() {
  const {
    printers,
    activePrinter,
    isDiscovering,
    connectionStatus,
    startBluetoothDiscovery,
    connectToPrinter
  } = usePrinter();

  const bluetoothPrinters = printers.filter(p => p.type === 'bluetooth');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="w-5 h-5 text-blue-500" />
          Bluetooth Printer Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Connection Status:</span>
          <Badge variant={connectionStatus === 'Connected' ? 'default' : 'secondary'}>
            {connectionStatus}
          </Badge>
        </div>

        {/* Active Printer */}
        {activePrinter && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium">Active Printer:</span>
              <span>{activePrinter.name}</span>
            </div>
            <Badge variant="default" className="bg-green-500">
              {activePrinter.type}
            </Badge>
          </div>
        )}

        {/* Scan Button */}
        <Button
          onClick={startBluetoothDiscovery}
          disabled={isDiscovering}
          className="w-full"
          variant="outline"
        >
          {isDiscovering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning for Bluetooth Printers...
            </>
          ) : (
            <>
              <Bluetooth className="w-4 h-4 mr-2" />
              Scan for Bluetooth Printers
            </>
          )}
        </Button>

        {/* Bluetooth Printers List */}
        {bluetoothPrinters.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Found Bluetooth Printers:</h3>
            {bluetoothPrinters.map((printer) => (
              <div key={printer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{printer.name}</div>
                    <div className="text-sm text-gray-500">{printer.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {printer.isConnected ? (
                    <Badge variant="default" className="bg-green-500">
                      Connected
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => connectToPrinter(printer)}
                      variant="outline"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Messages */}
        {bluetoothPrinters.length === 0 && !isDiscovering && (
          <div className="text-center py-6 text-gray-500">
            <Bluetooth className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No Bluetooth printers found</p>
            <p className="text-sm">Make sure your printer is in pairing mode</p>
          </div>
        )}

        {/* Debug Info */}
        <details className="mt-6">
          <summary className="text-sm text-gray-600 cursor-pointer">Debug Information</summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              totalPrinters: printers.length,
              bluetoothPrinters: bluetoothPrinters.length,
              isDiscovering,
              connectionStatus,
              activePrinter: activePrinter ? {
                name: activePrinter.name,
                type: activePrinter.type,
                isConnected: activePrinter.isConnected,
                status: activePrinter.status
              } : null
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}