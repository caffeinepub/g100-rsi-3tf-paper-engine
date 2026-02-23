import { ScrollArea } from '@/components/ui/scroll-area';
import { useEngineStore } from '../store/engineStore';

export function LogsTab() {
  const { logs } = useEngineStore();
  const safeLogs = Array.isArray(logs) ? logs : [];
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 text-gray-100 rounded-lg p-4">
        <div className="font-mono text-sm mb-2">
          LOGS PANEL OK | count={safeLogs.length} | time={timeStr}
        </div>
        <ScrollArea className="h-[50vh] w-full">
          <div className="space-y-2 font-mono text-xs">
            {safeLogs.length === 0 ? (
              <div className="text-gray-400">No logs yet. Start the engine to see events.</div>
            ) : (
              safeLogs.map((log, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-2">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`font-bold shrink-0 ${getLogColor(log.eventType)}`}>
                      {log.eventType}
                    </span>
                  </div>
                  {log.payload && (
                    <pre className="text-gray-300 mt-1 ml-24 overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function getLogColor(eventType: string): string {
  // Red for critical failures
  if (eventType === 'FETCH_FAIL' || eventType === 'TOP5_REFRESH_FAIL') {
    return 'text-red-400';
  }
  
  // Yellow for warnings and retries
  if (eventType === 'FETCH_RETRY' || eventType === 'UNIVERSE_FALLBACK') {
    return 'text-yellow-400';
  }
  
  // Default color for informational events
  if (eventType === 'UNIVERSE_EMPTY' || eventType === 'TOP5_SKIP_EMPTY') {
    return 'text-gray-400';
  }
  
  // Existing color logic
  if (eventType.includes('REJECT')) {
    return 'text-red-400';
  }
  
  if (eventType.includes('OK') || eventType.includes('OPEN')) {
    return 'text-green-400';
  }
  
  if (eventType.includes('HIT')) {
    return 'text-yellow-400';
  }
  
  return 'text-blue-400';
}
