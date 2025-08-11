"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  X,
  Minus,
  MoreHorizontal,
  Copy,
  Files,
  Settings,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TradingViewWidget from '@/components/TradingViewWidget';

export interface WidgetData {
  id: string;
  title: string;
  type: string;
  content?: React.ReactNode;
  isMinimized?: boolean;
}

interface WidgetFrameProps {
  widget: WidgetData;
  onClose: (widgetId: string) => void;
  onMinimize: (widgetId: string) => void;
  onDuplicate?: (widgetId: string) => void;
  onCopyTo: (widgetId: string) => void;
  onSettings?: (widgetId: string) => void;
  onMaximize?: (widgetId: string) => void;
  children?: React.ReactNode;
  className?: string;
  isStandalone?: boolean;
}

export function WidgetFrame({
  widget,
  onClose,
  onMinimize,
  onDuplicate,
  onCopyTo,
  onSettings,
  onMaximize,
  children,
  className,
  isStandalone = false
}: WidgetFrameProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "bg-card border rounded-lg shadow-sm transition-all duration-200 h-full flex flex-col",
        isHovered && "shadow-md border-primary/20",
        widget.isMinimized && "h-12",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center space-x-2 flex-1 min-w-0 cursor-move drag-handle">
          <h3 className="text-sm font-medium truncate">{widget.title}</h3>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            {widget.type}
          </span>
        </div>

        {/* Widget Controls */}
        {!isStandalone && (
          <div className={cn(
            "flex items-center space-x-1 transition-opacity duration-200 pointer-events-auto",
            isHovered ? "opacity-100" : "opacity-60"
          )}>
          {/* Minimize Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted relative z-10 pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Minimize button clicked for widget:', widget.id);
              onMinimize(widget.id);
            }}
            title={widget.isMinimized ? "Restore" : "Minimize"}
          >
            {widget.isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </Button>

          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                title="More options"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={() => onDuplicate(widget.id)}
                  className="cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onCopyTo(widget.id)}
                className="cursor-pointer"
              >
                <Files className="h-4 w-4 mr-2" />
                Copy to Dashboard
              </DropdownMenuItem>
              {onSettings && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onSettings(widget.id)}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose(widget.id);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground relative z-10 pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked for widget:', widget.id);
              onClose(widget.id);
            }}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        )}
      </div>

      {/* Widget Content */}
      {!widget.isMinimized && (
        <div className="flex-1 p-4 overflow-auto widget-scrollbar">
          {children || widget.content || (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm">Widget content goes here</p>
                <p className="text-xs mt-1">Type: {widget.type}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimized State Indicator */}
      {widget.isMinimized && (
        <div className="flex-1 flex items-center px-4">
          <div className="text-xs text-muted-foreground">
            Widget minimized - click restore to expand
          </div>
        </div>
      )}
    </div>
  );
}

// Sample widget types for demonstration
export const WIDGET_TYPES = {
  CHART: 'Chart',
  TABLE: 'Table',
  METRIC: 'Metric',
  TEXT: 'Text',
  IMAGE: 'Image',
  CALENDAR: 'Calendar',
  WEATHER: 'Weather',
  NEWS: 'News',
  TRADINGVIEW: 'TradingView',
  CUSTOM: 'Custom'
} as const;

// Sample widget content components
export function ChartWidget() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">📈</div>
        <h4 className="font-medium mb-2">Chart Widget</h4>
        <p className="text-sm text-muted-foreground">
          Chart visualization would go here
        </p>
      </div>
    </div>
  );
}

export function MetricWidget({ title, value, change }: { title: string; value: string; change?: string }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-center">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {change && (
          <div className={cn(
            "text-sm",
            change.startsWith('+') ? "text-green-600" : "text-red-600"
          )}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

export function TableWidget() {
  return (
    <div className="h-full">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">📋</div>
        <h4 className="font-medium">Data Table</h4>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">Item {i}</span>
            <span className="text-sm font-medium">${(i * 100).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TradingViewWidgetComponent() {
  return (
    <div className="h-full w-full">
      <TradingViewWidget />
    </div>
  );
}