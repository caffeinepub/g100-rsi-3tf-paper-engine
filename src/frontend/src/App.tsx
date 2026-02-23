import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Top5Tab } from './components/Top5Tab';
import { TradesTab } from './components/TradesTab';
import { StatsTab } from './components/StatsTab';
import { LogsTab } from './components/LogsTab';

function AppContent() {
  const [activeTab, setActiveTab] = useState('top5');
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">G100 RSI 3TF Paper Engine</h1>
          <p className="text-sm text-muted-foreground">Clean Room v1 — LONG-only, TOP5 rotation, 1m/5m/15m RSI strategy</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="top5">TOP5</TabsTrigger>
            <TabsTrigger value="trades">TRADES</TabsTrigger>
            <TabsTrigger value="stats">STATS</TabsTrigger>
            <TabsTrigger value="logs">LOGS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="top5">
            <Top5Tab />
          </TabsContent>
          
          <TabsContent value="trades">
            <TradesTab />
          </TabsContent>
          
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
          
          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} — Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'g100-rsi-engine')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
