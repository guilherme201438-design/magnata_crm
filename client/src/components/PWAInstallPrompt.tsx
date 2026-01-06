import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallPrompt() {
  const { installPrompt, isInstalled, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (installPrompt && !isInstalled) {
      setShowPrompt(true);
    }
  }, [installPrompt, isInstalled]);

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-card border-2 border-primary/50 rounded-lg shadow-2xl z-50 p-4 neon-glow animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <Download className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Instalar CRM Magnata</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Instale o app na sua tela inicial para acesso rápido e funcionalidade offline.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                installApp();
                setShowPrompt(false);
              }}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 bg-card-foreground/10 hover:bg-card-foreground/20 text-foreground rounded transition-colors"
            >
              Depois
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
