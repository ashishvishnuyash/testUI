"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDashboard } from '@/lib/firebase/dashboards';
import type { DashboardItem } from '@/lib/firebase/dashboards';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetFrame, ChartWidget, MetricWidget, TableWidget, TradingViewWidgetComponent, WIDGET_TYPES } from '@/components/dashboard/WidgetFrame';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function StandaloneDashboard() {
  const params = useParams();
  const dashboardId = params?.id as string;
  const [dashboard, setDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!dashboardId) {
        setError('Dashboard ID not provided');
        setLoading(false);
        return;
      }

      try {
        const dashboardData = await getDashboard(dashboardId);
        if (!dashboardData) {
          setError('Dashboard not found');
        } else {
          setDashboard(dashboardData);
          // Set page title
          document.title = `${dashboardData.name} - StockWhisperer AI`;
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [dashboardId]);

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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
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
          <h1 className="text-xl font-semibold">{dashboard.name}</h1>
          <div className="text-sm text-muted-foreground">
            Standalone View
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
                    onClose={() => {}} // No close functionality in standalone
                    onMinimize={() => {}} // No minimize functionality in standalone
                    onCopyTo={() => {}} // No copy functionality in standalone
                    isStandalone={true}
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
    </div>
  );
}