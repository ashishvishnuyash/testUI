"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getDashboard } from '@/lib/firebase/dashboards';
import { checkDashboardAccess } from '@/lib/firebase/sharing';
import type { DashboardItem } from '@/lib/firebase/dashboards';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetFrame, ChartWidget, MetricWidget, TableWidget, TradingViewWidgetComponent, WIDGET_TYPES } from '@/components/dashboard/WidgetFrame';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function PublicDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dashboardId = params?.id as string;
  const token = searchParams?.get('token');
  
  const [dashboard, setDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const loadPublicDashboard = async () => {
      if (!dashboardId) {
        setError('Dashboard ID not provided');
        setLoading(false);
        return;
      }

      if (!token) {
        setError('Access token not provided');
        setLoading(false);
        return;
      }

      try {
        // For public dashboards, we need to verify the token
        // This is a simplified version - in a real app, you'd verify the token against the database
        const dashboardData = await getDashboard(dashboardId);
        
        if (!dashboardData) {
          setError('Dashboard not found');
        } else {
          // In a real implementation, you'd verify the public token here
          // For now, we'll assume the token is valid if the dashboard exists
          setDashboard(dashboardData);
          setHasAccess(true);
          document.title = `${dashboardData.name} - Public Dashboard`;
        }
      } catch (err) {
        console.error('Error loading public dashboard:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadPublicDashboard();
  }, [dashboardId, token]);

  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case WIDGET_TYPES.CHART:
        return <ChartWidget />;
      case WIDGET_TYPES.METRIC:
        return <MetricWidget title="Sample Metric" value="$12,345" change="+5.2%" />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget />;
      case WIDGET_TYPES.TRADINGVIEW:
        return <TradingViewWidgetComponent />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading public dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'You don\'t have permission to view this dashboard.'}
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Dashboard Not Found</h1>
          <p className="text-muted-foreground">The requested dashboard could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{dashboard.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              Public View
            </span>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              size="sm"
            >
              Go to App
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-4">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-muted rounded text-xs">
            <p>Dashboard ID: {dashboard.id}</p>
            <p>Widgets: {dashboard.widgets?.length || 0}</p>
            <p>Layout items: {dashboard.layout?.length || 0}</p>
            {dashboard.widgets?.map(w => (
              <p key={w.id}>Widget: {w.id} - {w.type} - {w.title}</p>
            ))}
          </div>
        )}
        
        {dashboard.layout && dashboard.layout.length > 0 ? (
          <ErrorBoundary>
            <ResponsiveGridLayout
              className="layout"
              layouts={{
                lg: dashboard.layout,
                md: dashboard.layout,
                sm: dashboard.layout,
                xs: dashboard.layout,
                xxs: dashboard.layout
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60}
              isDraggable={false}
              isResizable={false}
              margin={[16, 16]}
              containerPadding={[0, 0]}
            >
              {dashboard.widgets?.map((widget) => (
                <div key={widget.id}>
                  <WidgetFrame
                    widget={{
                      id: widget.id,
                      title: widget.title,
                      type: widget.type,
                      isMinimized: false,
                    }}
                    onClose={() => {}} // No functionality in public view
                    onMinimize={() => {}} // No functionality in public view
                    onCopyTo={() => {}} // No functionality in public view
                    isStandalone={true} // Hide all controls
                  >
                    {renderWidget(widget)}
                  </WidgetFrame>
                </div>
              ))}
            </ResponsiveGridLayout>
          </ErrorBoundary>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium mb-2">Empty Dashboard</h2>
              <p className="text-muted-foreground">This dashboard doesn't have any widgets yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-4 py-3 mt-8">
        <div className="text-center text-sm text-muted-foreground">
          Powered by StockWhisperer AI
        </div>
      </div>
    </div>
  );
}