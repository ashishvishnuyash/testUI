"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BarChart3, Table, Activity, Type, Image, Calendar, Cloud, Newspaper, TrendingUp } from 'lucide-react';
import { WidgetData, WIDGET_TYPES } from './WidgetFrame';
import { cn } from '@/lib/utils';

// Widget type configurations with icons and descriptions
const WIDGET_CONFIGS = {
  [WIDGET_TYPES.CHART]: {
    icon: BarChart3,
    title: 'Chart',
    description: 'Display data visualizations and graphs'
  },
  [WIDGET_TYPES.TABLE]: {
    icon: Table,
    title: 'Table',
    description: 'Show data in rows and columns'
  },
  [WIDGET_TYPES.METRIC]: {
    icon: Activity,
    title: 'Metric',
    description: 'Display key performance indicators'
  },
  [WIDGET_TYPES.TEXT]: {
    icon: Type,
    title: 'Text',
    description: 'Add text content and notes'
  },
  [WIDGET_TYPES.IMAGE]: {
    icon: Image,
    title: 'Image',
    description: 'Display images and media'
  },
  [WIDGET_TYPES.CALENDAR]: {
    icon: Calendar,
    title: 'Calendar',
    description: 'Show calendar and events'
  },
  [WIDGET_TYPES.WEATHER]: {
    icon: Cloud,
    title: 'Weather',
    description: 'Display weather information'
  },
  [WIDGET_TYPES.NEWS]: {
    icon: Newspaper,
    title: 'News',
    description: 'Show news feeds and updates'
  },
  [WIDGET_TYPES.TRADINGVIEW]: {
    icon: TrendingUp,
    title: 'TradingView',
    description: 'Interactive stock charts and trading data'
  },
  [WIDGET_TYPES.CUSTOM]: {
    icon: Plus,
    title: 'Custom',
    description: 'Create a custom widget'
  }
};

interface WidgetManagerProps {
  onAddWidget: (widget: Omit<WidgetData, 'id'>) => void;
  onCopyWidget: (widgetId: string, targetDashboard: string) => void;
  availableDashboards?: Array<{ id: string; name: string }>;
}

export function WidgetManager({ 
  onAddWidget, 
  onCopyWidget, 
  availableDashboards = [] 
}: WidgetManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('');
  const [newWidget, setNewWidget] = useState({
    title: '',
    type: '',
  });

  const handleAddWidget = () => {
    if (newWidget.title && newWidget.type) {
      onAddWidget({
        title: newWidget.title,
        type: newWidget.type,
        isMinimized: false,
      });
      setNewWidget({ title: '', type: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleCopyWidget = (targetDashboard: string) => {
    if (selectedWidgetId && targetDashboard) {
      onCopyWidget(selectedWidgetId, targetDashboard);
      setIsCopyDialogOpen(false);
      setSelectedWidgetId('');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Add Widget Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Widget</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Widget Type Selection */}
            <div className="space-y-3">
              <Label>Choose Widget Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(WIDGET_CONFIGS).map(([type, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setNewWidget(prev => ({ ...prev, type }))}
                      className={cn(
                        "p-4 border rounded-lg text-left transition-all hover:shadow-md",
                        newWidget.type === type
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          newWidget.type === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{config.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget Title Input */}
            {newWidget.type && (
              <div className="space-y-2">
                <Label htmlFor="widget-title">Widget Title</Label>
                <Input
                  id="widget-title"
                  placeholder={`Enter ${WIDGET_CONFIGS[newWidget.type as keyof typeof WIDGET_CONFIGS]?.title || 'widget'} title`}
                  value={newWidget.title}
                  onChange={(e) => setNewWidget(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewWidget({ title: '', type: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWidget}
                disabled={!newWidget.title || !newWidget.type}
              >
                Add Widget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copy Widget Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Widget to Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-dashboard">Target Dashboard</Label>
              <Select onValueChange={handleCopyWidget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {availableDashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCopyDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hook to manage widget copy dialog
export function useCopyWidgetDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [widgetId, setWidgetId] = useState<string>('');

  const openCopyDialog = (id: string) => {
    setWidgetId(id);
    setIsOpen(true);
  };

  const closeCopyDialog = () => {
    setIsOpen(false);
    setWidgetId('');
  };

  return {
    isOpen,
    widgetId,
    openCopyDialog,
    closeCopyDialog,
  };
}