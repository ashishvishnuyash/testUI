"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    screenSize: '',
    windowSize: '',
    isMobile: false,
    isTouch: false,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: window.innerWidth < 768,
        isTouch: 'ontouchstart' in window,
      });
    };

    updateDebugInfo();
    window.addEventListener('resize', updateDebugInfo);
    return () => window.removeEventListener('resize', updateDebugInfo);
  }, []);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-6 z-50 opacity-50 hover:opacity-100"
        size="sm"
        variant="outline"
      >
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 bg-card border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Debug Info</h3>
        <Button
          onClick={() => setIsVisible(false)}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      <div className="space-y-1 text-xs">
        <div><strong>Screen:</strong> {debugInfo.screenSize}</div>
        <div><strong>Window:</strong> {debugInfo.windowSize}</div>
        <div><strong>Mobile:</strong> {debugInfo.isMobile ? 'Yes' : 'No'}</div>
        <div><strong>Touch:</strong> {debugInfo.isTouch ? 'Yes' : 'No'}</div>
        <div><strong>UA:</strong> {debugInfo.userAgent.substring(0, 50)}...</div>
      </div>
    </div>
  );
}