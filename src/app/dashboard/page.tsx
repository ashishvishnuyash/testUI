"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Home,
  HelpCircle,
  Plus,
  Folder,
  BarChart3,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  MoreHorizontal,
  MoreVertical,
  Edit,
  Move,
  Copy,
  ExternalLink,
  Share,
  Trash2,
  FolderPlus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  saveDashboard,
  updateDashboard,
  deleteDashboard,
  getUserDashboards,
  organizeDashboards,
  DashboardData,
  Widget
} from '@/lib/firebase/dashboards';
import type { DashboardItem } from '@/lib/firebase/dashboards';
import { WidgetFrame, WidgetData, ChartWidget, MetricWidget, TableWidget, TradingViewWidgetComponent, WIDGET_TYPES } from '@/components/dashboard/WidgetFrame';
import { WidgetManager, useCopyWidgetDialog } from '@/components/dashboard/WidgetManager';
import { ShareDialog } from '@/components/dashboard/ShareDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Dashboard Item Component
function DashboardItem({
  item,
  activeSection,
  setActiveSection,
  setSidebarOpen,
  onContextMenu,
  editingItem,
  editingName,
  setEditingName,
  onSaveEdit,
  onCancelEdit,
  sidebarWidth,
  isMobile
}: {
  item: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  setSidebarOpen: (open: boolean) => void;
  onContextMenu: (e: React.MouseEvent, item: any) => void;
  editingItem: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  sidebarWidth: number;
  isMobile?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const isNarrow = !isMobile && sidebarWidth < 120;

  // Close dropdown when sidebar width changes from narrow to wide
  React.useEffect(() => {
    if (!isNarrow && showDropdown) {
      setShowDropdown(false);
    }
  }, [isNarrow, showDropdown]);

  // Recursive function to render all items in dropdown
  const renderDropdownItems = (items: any[], level: number = 0): React.ReactNode => {
    return items.map((child: any) => (
      <div key={child.id}>
        <button
          className={cn(
            "w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center transition-colors",
            activeSection === child.id && "bg-accent"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (child.type === 'dashboard') {
              setActiveSection(child.id);
              setSidebarOpen(false);
              setShowDropdown(false);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(e, child);
            setShowDropdown(false);
          }}
        >
          {child.type === 'folder' ? (
            <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
          ) : (
            <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
          )}
          <span className="truncate">{child.name}</span>
        </button>
        {/* Render nested items if it's a folder */}
        {child.type === 'folder' && child.children && child.children.length > 0 && (
          renderDropdownItems(child.children, level + 1)
        )}
      </div>
    ));
  };

  if (item.type === 'folder') {
    return (
      <div className="space-y-1">
        <div className="group flex items-center">
          {editingItem === item.id ? (
            <div className="flex-1 flex items-center px-2">
              <Folder className="h-3 w-3 mr-2 flex-shrink-0" />
              {!isNarrow && (
                <Input
                  value={editingName || ''}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  onBlur={onSaveEdit}
                  className="h-6 text-sm px-1"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 h-8 text-sm transition-all duration-200",
                  isNarrow ? "justify-center px-2" : "justify-start px-2"
                )}
                onClick={(e) => {
                  if (isNarrow) {
                    // Show dropdown in narrow mode
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropdownWidth = 300;
                    const dropdownHeight = 400;

                    // Calculate position to keep dropdown on screen
                    let x = rect.right + 8;
                    let y = rect.top;

                    // Adjust if dropdown would go off right edge
                    if (x + dropdownWidth > window.innerWidth) {
                      x = rect.left - dropdownWidth - 8;
                    }

                    // Adjust if dropdown would go off bottom edge
                    if (y + dropdownHeight > window.innerHeight) {
                      y = window.innerHeight - dropdownHeight - 8;
                    }

                    // Ensure dropdown doesn't go off top edge
                    if (y < 8) {
                      y = 8;
                    }

                    setDropdownPosition({ x, y });
                    setShowDropdown(!showDropdown);
                  } else {
                    // Normal expand/collapse behavior
                    setIsExpanded(!isExpanded);
                  }
                }}
                title={isNarrow ? item.name : undefined}
              >
                {!isNarrow && (isExpanded ? (
                  <ChevronDownIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0" />
                ))}
                <div className="relative">
                  <Folder className={cn(
                    "h-3 w-3 flex-shrink-0",
                    !isNarrow && "mr-2"
                  )} />
                  {/* Show indicator dot if folder has children and is in narrow mode */}
                  {isNarrow && item.children && item.children.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <span className={cn(
                  "transition-all duration-200 truncate",
                  isNarrow ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </Button>
              {!isNarrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => onContextMenu(e, item)}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
        {isExpanded && item.children && !isNarrow && (
          <div className="ml-4 space-y-1">
            {item.children.map((child: any) => (
              <DashboardItem
                key={child.id}
                item={child}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                setSidebarOpen={setSidebarOpen}
                onContextMenu={onContextMenu}
                editingItem={editingItem}
                editingName={editingName}
                setEditingName={setEditingName}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                sidebarWidth={sidebarWidth}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Dropdown for narrow mode */}
        {showDropdown && isNarrow && item.children && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            {/* Dropdown content */}
            <div
              className="fixed z-50 bg-popover border rounded-md shadow-lg py-2 min-w-[200px] max-w-[300px] max-h-[400px] overflow-y-auto"
              style={{
                left: `${dropdownPosition.x}px`,
                top: `${dropdownPosition.y}px`,
              }}
            >
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                {item.name}
              </div>
              <div className="py-1">
                {renderDropdownItems(item.children, 0)}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-center">
      {editingItem === item.id ? (
        <div className="flex-1 flex items-center px-2">
          <BarChart3 className="h-3 w-3 mr-2 flex-shrink-0" />
          {!isNarrow && (
            <Input
              value={editingName || ''}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              onBlur={onSaveEdit}
              className="h-6 text-sm px-1"
              autoFocus
            />
          )}
        </div>
      ) : (
        <>
          <Button
            variant={activeSection === item.id ? "secondary" : "ghost"}
            className={cn(
              "flex-1 h-8 text-sm transition-all duration-200",
              isNarrow ? "justify-center px-2" : "justify-start px-2"
            )}
            onClick={() => {
              setActiveSection(item.id);
              setSidebarOpen(false);
            }}
            title={isNarrow ? item.name : undefined}
          >
            <BarChart3 className={cn(
              "h-3 w-3 flex-shrink-0",
              !isNarrow && "mr-2"
            )} />
            <span className={cn(
              "transition-all duration-200 truncate",
              isNarrow ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
            )}>
              {item.name}
            </span>
          </Button>
          {!isNarrow && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => onContextMenu(e, item)}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

interface DashboardProps {
  initialDashboardId?: string;
}

export default function Dashboard({ initialDashboardId }: DashboardProps = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-sidebar-open');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  }); // Desktop sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(200); // Default width in pixels - made narrower
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize based on window width if available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from URL parameter or prop
    if (initialDashboardId) return initialDashboardId;
    if (params?.id) return params.id as string;
    return 'overview';
  });

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarWidth(240); // Fixed width on mobile - made narrower
        setSidebarOpen(false); // Auto-close on mobile
      } else if (tablet) {
        setSidebarWidth(Math.min(sidebarWidth, 240)); // Constrain width on tablet
      }


    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // Handle layout restoration when switching between mobile and desktop
  useEffect(() => {
    // Force layout recalculation when switching between mobile and desktop
    if (typeof window !== 'undefined') {
      // Small delay to ensure the grid has time to re-render
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Handle URL parameter changes
  useEffect(() => {
    const urlDashboardId = params?.id as string;
    if (urlDashboardId && urlDashboardId !== activeSection) {
      setActiveSection(urlDashboardId);
    } else if (!urlDashboardId && pathname === '/dashboard' && activeSection !== 'overview') {
      setActiveSection('overview');
    }
  }, [params?.id, pathname, activeSection]);

  // State declarations moved up before functions that use them
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(true);

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    item: any;
  }>({ show: false, x: 0, y: 0, item: null });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [moveItem, setMoveItem] = useState<any>(null);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDialogItem, setShareDialogItem] = useState<any>(null);
  const copyWidgetDialog = useCopyWidgetDialog();

  // Function to update URL when dashboard is selected
  function updateDashboardUrl(dashboardId: string) {
    if (dashboardId === 'overview') {
      // Navigate to base dashboard URL for overview
      router.push('/dashboard');
    } else {
      // Navigate to specific dashboard URL
      router.push(`/dashboard/${dashboardId}`);
    }
  }

  // Function to get shareable URL for a dashboard
  function getDashboardUrl(dashboardId: string) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (dashboardId === 'overview') {
      return `${baseUrl}/dashboard`;
    }
    return `${baseUrl}/dashboard/${dashboardId}`;
  }

  // Function to get dashboard name for title
  function getDashboardName(dashboardId: string) {
    if (dashboardId === 'overview') return 'Apps';
    
    const dashboard = dashboards.find(item => item.id === dashboardId) ||
      dashboards.find(folder => folder.children?.find((child: any) => child.id === dashboardId))?.children?.find((child: any) => child.id === dashboardId);
    
    return dashboard?.name || 'Dashboard';
  }

  // Wrapper function that updates both state and URL
  function navigateToDashboard(dashboardId: string) {
    console.log('Navigating to dashboard:', dashboardId);
    setActiveSection(dashboardId);
    updateDashboardUrl(dashboardId);
  }

  // Wrapper function for DashboardItem components
  function handleDashboardNavigation(dashboardId: string) {
    navigateToDashboard(dashboardId);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load dashboards from database
  useEffect(() => {
    const loadDashboards = async () => {
      if (user && !loading) {
        try {
          setIsLoadingDashboards(true);
          const userDashboards = await getUserDashboards(user.uid);

          // Clean any undefined values from loaded dashboards
          const cleanedDashboards = userDashboards.map(dashboard => ({
            ...dashboard,
            layout: dashboard.layout?.filter(item => item && item.i) || [],
            widgets: dashboard.widgets?.filter(widget => widget && widget.id) || [],
          }));

          const organizedDashboards = organizeDashboards(cleanedDashboards);
          setDashboards(organizedDashboards);
        } catch (error) {
          console.error('Error loading dashboards:', error);
          // Fallback to sample data if database fails
          setDashboards([
            {
              id: 'dashboard-1',
              name: 'Sales Analytics',
              type: 'dashboard',
              layout: [],
              userId: user.uid,
              createdAt: new Date() as any,
              updatedAt: new Date() as any,
              order: 0
            },
          ]);
        } finally {
          setIsLoadingDashboards(false);
        }
      }
    };

    loadDashboards();
  }, [user, loading]);

  // Validate dashboard exists when loading from URL
  useEffect(() => {
    if (!isLoadingDashboards && dashboards.length > 0 && activeSection !== 'overview') {
      const dashboardExists = dashboards.find(item => item.id === activeSection) ||
        dashboards.find(folder => folder.children?.find((child: any) => child.id === activeSection));
      
      if (!dashboardExists) {
        console.log(`Dashboard ${activeSection} not found, redirecting to overview`);
        navigateToDashboard('overview');
      }
    }
  }, [dashboards, isLoadingDashboards, activeSection]);

  // Update document title when dashboard changes
  useEffect(() => {
    const dashboardName = getDashboardName(activeSection);
    document.title = `${dashboardName} - StockWhisperer AI`;
  }, [activeSection, dashboards]);

  const handleChatClick = () => {
    router.push('/chat');
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const handleRename = (item: any) => {
    setEditingItem(item.id);
    setEditingName(item.name || '');
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const handleSaveEdit = async () => {
    if (editingItem && editingName.trim() && user) {
      try {
        // Update in database
        await safeUpdateDashboard(editingItem, { name: editingName.trim() });

        // Update local state
        setDashboards(prev => updateItemName(prev, editingItem, editingName.trim()));
      } catch (error) {
        console.error('Error updating dashboard name:', error);
      }
    }
    setEditingItem(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingName('');
  };

  const updateItemName = (items: any[], id: string, newName: string): any[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, name: newName };
      }
      if (item.children) {
        return { ...item, children: updateItemName(item.children, id, newName) };
      }
      return item;
    });
  };

  const handleDuplicate = async (item: any) => {
    if (!user) return;

    try {
      const newItem: DashboardData = {
        id: `${item.type}-${Date.now()}`,
        name: `${item.name} (Copy)`,
        type: item.type,
        parentId: item.parentId || null,
        layout: item.layout ? [...item.layout] : [],
        widgets: item.widgets ? [...item.widgets] : [],
        order: Date.now()
      };

      // Save to database
      await saveDashboard(user.uid, newItem);

      // Update local state
      const newDashboardItem: DashboardItem = {
        ...newItem,
        userId: user.uid,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };

      setDashboards(prev => [...prev, newDashboardItem]);
    } catch (error) {
      console.error('Error duplicating dashboard:', error);
    }

    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const handleDelete = async (itemId: string) => {
    try {
      // Delete from database
      await deleteDashboard(itemId);

      // Update local state
      setDashboards(prev => deleteItem(prev, itemId));

      if (activeSection === itemId) {
        navigateToDashboard('overview');
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    }

    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const deleteItem = (items: any[], id: string): any[] => {
    return items.filter(item => {
      if (item.id === id) return false;
      if (item.children) {
        item.children = deleteItem(item.children, id);
      }
      return true;
    });
  };

  const handleCreateInFolder = async (folderId: string, type: 'dashboard' | 'folder') => {
    if (!user) return;

    try {
      const newItem: DashboardData = {
        id: `${type}-${Date.now()}`,
        name: type === 'dashboard' ? 'New Dashboard' : 'New Folder',
        type,
        parentId: folderId,
        ...(type === 'dashboard' ? { layout: [], widgets: [] } : {}),
        order: Date.now()
      };

      // Save to database
      await saveDashboard(user.uid, newItem);

      // Update local state
      const newDashboardItem: DashboardItem = {
        ...newItem,
        userId: user.uid,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };

      setDashboards(prev => addItemToFolder(prev, folderId, newDashboardItem));
    } catch (error) {
      console.error('Error creating item in folder:', error);
    }

    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const addItemToFolder = (items: any[], folderId: string, newItem: any): any[] => {
    return items.map(item => {
      if (item.id === folderId && item.type === 'folder') {
        return { ...item, children: [...(item.children || []), newItem] };
      }
      if (item.children) {
        return { ...item, children: addItemToFolder(item.children, folderId, newItem) };
      }
      return item;
    });
  };

  const handleMoveItem = async (targetFolderId: string | null) => {
    if (!moveItem || !user) return;

    try {
      // Update in database
      await safeUpdateDashboard(moveItem.id, {
        parentId: targetFolderId,
        order: Date.now()
      });

      // Update local state
      setDashboards(prev => {
        const newDashboards = deleteItem(prev, moveItem.id);
        const updatedMoveItem = { ...moveItem, parentId: targetFolderId };

        // Add to target location
        if (targetFolderId === null) {
          // Move to root
          return [...newDashboards, updatedMoveItem];
        } else {
          // Move to specific folder
          return addItemToFolder(newDashboards, targetFolderId, updatedMoveItem);
        }
      });
    } catch (error) {
      console.error('Error moving item:', error);
    }

    setShowMoveMenu(false);
    setMoveItem(null);
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const handleOpenInNewWindow = (item: any) => {
    // Open the standalone dashboard page in a new window
    const standaloneUrl = `${window.location.origin}/dashboard/${item.id}/standalone`;
    window.open(standaloneUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const getFolderOptions = (currentItemId: string): any[] => {
    const options = [{ id: null, name: 'Root', type: 'root' }];

    const addFolderOptions = (items: any[], level = 0) => {
      items.forEach(item => {
        if (item.type === 'folder' && item.id !== currentItemId) {
          options.push({
            ...item,
            name: '  '.repeat(level) + item.name,
            level
          });
          if (item.children) {
            addFolderOptions(item.children, level + 1);
          }
        }
      });
    };

    addFolderOptions(dashboards);
    return options;
  };



  // Widget management functions
  const handleAddWidget = async (widgetData: Omit<WidgetData, 'id'>) => {
    if (!user) return;

    try {
      const currentDashboard = getCurrentDashboard();
      if (!currentDashboard || currentDashboard.type !== 'dashboard') return;

      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        title: widgetData.title || 'Untitled Widget',
        type: widgetData.type || 'Custom',
        isMinimized: false,
        isMaximized: false,
      };

      const newLayout = {
        i: newWidget.id,
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      };

      const updatedWidgets = [...(currentDashboard.widgets || []), newWidget];
      const updatedLayout = [...(currentDashboard.layout || []), newLayout];

      // Update in database
      await safeUpdateDashboard(activeSection, {
        widgets: updatedWidgets,
        layout: updatedLayout
      });

      // Update local state
      setDashboards(prev => prev.map(item => {
        if (item.id === activeSection) {
          return { ...item, widgets: updatedWidgets, layout: updatedLayout };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map((child: any) =>
              child.id === activeSection
                ? { ...child, widgets: updatedWidgets, layout: updatedLayout }
                : child
            )
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const handleCloseWidget = async (widgetId: string) => {
    console.log('handleCloseWidget called for widget:', widgetId);
    if (!user) return;

    try {
      const currentDashboard = getCurrentDashboard();
      if (!currentDashboard) return;

      const updatedWidgets = (currentDashboard.widgets || []).filter(w => w.id !== widgetId);
      const updatedLayout = (currentDashboard.layout || []).filter(l => l.i !== widgetId);

      console.log('Removing widget. Before:', currentDashboard.widgets?.length, 'After:', updatedWidgets.length);

      // Update in database
      await safeUpdateDashboard(activeSection, {
        widgets: updatedWidgets,
        layout: updatedLayout
      });

      // Update local state
      updateCurrentDashboard({ widgets: updatedWidgets, layout: updatedLayout });
    } catch (error) {
      console.error('Error closing widget:', error);
    }
  };

  const handleMinimizeWidget = async (widgetId: string) => {
    if (!user) return;

    try {
      const currentDashboard = getCurrentDashboard();
      if (!currentDashboard) return;

      const updatedWidgets = (currentDashboard.widgets || []).map(w =>
        w.id === widgetId ? { ...w, isMinimized: !w.isMinimized } : w
      );

      // Update in database
      await safeUpdateDashboard(activeSection, { widgets: updatedWidgets });

      // Update local state
      updateCurrentDashboard({ widgets: updatedWidgets });
    } catch (error) {
      console.error('Error minimizing widget:', error);
    }
  };



  const handleDuplicateWidget = async (widgetId: string) => {
    if (!user) return;

    try {
      const currentDashboard = getCurrentDashboard();
      if (!currentDashboard) return;

      const originalWidget = currentDashboard.widgets?.find(w => w.id === widgetId);
      if (!originalWidget) return;

      const newWidget: Widget = {
        ...originalWidget,
        id: `widget-${Date.now()}`,
        title: `${originalWidget.title} (Copy)`,
      };

      const newLayout = {
        i: newWidget.id,
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      };

      const updatedWidgets = [...(currentDashboard.widgets || []), newWidget];
      const updatedLayout = [...(currentDashboard.layout || []), newLayout];

      // Update in database
      await safeUpdateDashboard(activeSection, {
        widgets: updatedWidgets,
        layout: updatedLayout
      });

      // Update local state
      updateCurrentDashboard({ widgets: updatedWidgets, layout: updatedLayout });
    } catch (error) {
      console.error('Error duplicating widget:', error);
    }
  };

  const handleCopyWidgetTo = (widgetId: string) => {
    copyWidgetDialog.openCopyDialog(widgetId);
  };

  const handleCopyWidget = async (widgetId: string, targetDashboardId: string) => {
    if (!user) return;

    try {
      const currentDashboard = getCurrentDashboard();
      if (!currentDashboard) return;

      const originalWidget = currentDashboard.widgets?.find(w => w.id === widgetId);
      if (!originalWidget) return;

      const targetDashboard = findDashboardById(targetDashboardId);
      if (!targetDashboard || targetDashboard.type !== 'dashboard') return;

      const newWidget: Widget = {
        ...originalWidget,
        id: `widget-${Date.now()}`,
      };

      const newLayout = {
        i: newWidget.id,
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      };

      const updatedWidgets = [...(targetDashboard.widgets || []), newWidget];
      const updatedLayout = [...(targetDashboard.layout || []), newLayout];

      // Update in database
      await safeUpdateDashboard(targetDashboardId, {
        widgets: updatedWidgets,
        layout: updatedLayout
      });

      // Update local state
      setDashboards(prev => prev.map(item => {
        if (item.id === targetDashboardId) {
          return { ...item, widgets: updatedWidgets, layout: updatedLayout };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map((child: any) =>
              child.id === targetDashboardId
                ? { ...child, widgets: updatedWidgets, layout: updatedLayout }
                : child
            )
          };
        }
        return item;
      }));

      copyWidgetDialog.closeCopyDialog();
    } catch (error) {
      console.error('Error copying widget:', error);
    }
  };

  // Helper function to deeply clean objects of undefined values
  const deepCleanObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => deepCleanObject(item)).filter(item => item !== undefined);
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = deepCleanObject(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }

    return obj;
  };

  // Helper function to safely update dashboard in database
  const safeUpdateDashboard = async (dashboardId: string, updates: Partial<DashboardData>) => {
    try {
      console.log('safeUpdateDashboard called with:', { dashboardId, updates });

      // Validate dashboard ID
      if (!dashboardId || typeof dashboardId !== 'string') {
        console.error('Invalid dashboard ID:', dashboardId);
        return;
      }

      // Filter out undefined values with deep cleaning
      const cleanedUpdates: Partial<DashboardData> = {};

      if (updates.name !== undefined && updates.name !== null) {
        cleanedUpdates.name = updates.name;
      }
      if (updates.type !== undefined && updates.type !== null) {
        cleanedUpdates.type = updates.type;
      }
      if (updates.parentId !== undefined) {
        cleanedUpdates.parentId = updates.parentId; // Can be null
      }
      if (updates.order !== undefined && updates.order !== null) {
        cleanedUpdates.order = updates.order;
      }
      if (updates.layout !== undefined && updates.layout !== null) {
        const cleanedLayout = deepCleanObject(updates.layout);
        if (cleanedLayout && Array.isArray(cleanedLayout)) {
          cleanedUpdates.layout = cleanedLayout;
        }
      }
      if (updates.widgets !== undefined && updates.widgets !== null) {
        const cleanedWidgets = deepCleanObject(updates.widgets);
        if (cleanedWidgets && Array.isArray(cleanedWidgets)) {
          cleanedUpdates.widgets = cleanedWidgets;
        }
      }

      console.log('Cleaned updates:', cleanedUpdates);

      // Only update if there are valid changes
      if (Object.keys(cleanedUpdates).length > 0) {
        await updateDashboard(dashboardId, cleanedUpdates);
        console.log('Dashboard updated successfully');
      } else {
        console.log('No valid updates to apply');
      }
    } catch (error) {
      console.error('Error in safeUpdateDashboard:', error);
      console.error('Original updates:', updates);
      throw error;
    }
  };

  // Helper functions
  const getCurrentDashboard = () => {
    return dashboards.find(item => item.id === activeSection) ||
      dashboards.find(folder => folder.children?.find((child: any) => child.id === activeSection))?.children?.find((child: any) => child.id === activeSection);
  };

  const findDashboardById = (id: string): DashboardItem | undefined => {
    return dashboards.find(item => item.id === id) ||
      dashboards.find(folder => folder.children?.find((child: any) => child.id === id))?.children?.find((child: any) => child.id === id);
  };

  const updateCurrentDashboard = (updates: Partial<DashboardItem>) => {
    setDashboards(prev => prev.map(item => {
      if (item.id === activeSection) {
        return { ...item, ...updates };
      }
      if (item.children) {
        return {
          ...item,
          children: item.children.map((child: any) =>
            child.id === activeSection ? { ...child, ...updates } : child
          )
        };
      }
      return item;
    }));
  };

  // Generate responsive layouts for all breakpoints
  const generateResponsiveLayouts = (baseLayout: any[]) => {
    if (!baseLayout || baseLayout.length === 0) {
      return {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: []
      };
    }

    // Create mobile-optimized layouts
    const mobileLayout = baseLayout.map((item, index) => ({
      ...item,
      x: 0, // Stack vertically on mobile
      y: index * 4, // Ensure proper vertical spacing
      w: 2, // Full width on mobile (2 cols out of 2)
      h: Math.max(item.h, 3) // Minimum height for mobile
    }));

    const tabletLayout = baseLayout.map((item, index) => ({
      ...item,
      x: (index % 2) * 3, // 2 columns on tablet
      y: Math.floor(index / 2) * 4,
      w: Math.min(item.w, 3), // Max 3 cols on tablet
      h: item.h
    }));

    return {
      lg: baseLayout, // Desktop layout as-is
      md: tabletLayout, // Tablet optimized
      sm: mobileLayout, // Mobile optimized
      xs: mobileLayout, // Mobile optimized
      xxs: mobileLayout // Mobile optimized
    };
  };

  const renderWidgetContent = (widget: Widget) => {
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

  const getAvailableDashboards = () => {
    const allDashboards: Array<{ id: string; name: string }> = [];

    const addDashboards = (items: DashboardItem[]) => {
      items.forEach(item => {
        if (item.type === 'dashboard' && item.id !== activeSection) {
          allDashboards.push({ id: item.id, name: item.name });
        }
        if (item.children) {
          addDashboards(item.children);
        }
      });
    };

    addDashboards(dashboards);
    return allDashboards;
  };

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = Math.max(64, Math.min(400, e.clientX)); // Min 64px (icon only), max 400px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ show: false, x: 0, y: 0, item: null });
      setShowMoveMenu(false);
    };

    if (contextMenu.show || showMoveMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show, showMoveMenu]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close mobile sidebar
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      // Ctrl/Cmd + B to toggle desktop sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !isMobile) {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen, isSidebarOpen]);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-sidebar-open', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  // Handle touch gestures for mobile sidebar
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      const deltaX = currentX - startX;
      const threshold = 50;

      // Swipe right to open sidebar (from left edge)
      if (!sidebarOpen && startX < 20 && deltaX > threshold) {
        setSidebarOpen(true);
      }
      // Swipe left to close sidebar
      else if (sidebarOpen && deltaX < -threshold) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarOpen]);

  const sidebarItems = [
    { id: 'overview', label: 'Apps', icon: Home },
  ];

  if (loading || isLoadingDashboards) {
    return (
      <div className="h-screen bg-slate-900 flex overflow-hidden">
        <div className="w-64 bg-slate-800 border-r border-slate-700">
          <div className="p-4">
            <Skeleton className="h-8 w-32 bg-slate-700" />
          </div>
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full bg-slate-700" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center px-6 py-3 border-b border-slate-700 bg-slate-800">
            <Skeleton className="h-6 w-32 bg-slate-700" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-16 bg-slate-700" />
              <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
            </div>
          </div>
          <div className="p-8 space-y-6">
            <Skeleton className="h-12 w-64 bg-slate-700" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg bg-slate-700" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Dashboard scrollbar - visible but styled */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        
        /* Widget scrollbar - invisible/narrow */
        .widget-scrollbar::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        
        .widget-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .widget-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.1);
          border-radius: 1px;
          transition: background-color 0.2s ease;
        }
        
        .widget-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.2);
        }
        
        /* Firefox scrollbar styles */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) hsl(var(--muted));
        }
        
        .widget-scrollbar {
          scrollbar-width: none; /* Hide scrollbar in Firefox */
        }
        
        /* For browsers that don't support scrollbar-width: none */
        .widget-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        /* Prevent grid layout flickering and height expansion */
        .react-grid-layout {
          position: relative;
          width: 100% !important;
          min-height: 100%;
          max-height: 100%;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjODg4IiBkPSJtMTUgMTJjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0tNS0xMmMwIC41NTItLjQ0OCAxLTEgMXMtMS0uNDQ4LTEtMSAuNDQ4LTEgMS0xIDEgLjQ0OCAxIDFabTAgNGMwIC41NTItLjQ0OCAxLTEgMXMtMS0uNDQ4LTEtMSAuNDQ4LTEgMS0xIDEgLjQ0OCAxIDFabTAgNGMwIC41NTItLjQ0OCAxLTEgMXMtMS0uNDQ4LTEtMSAuNDQ4LTEgMS0xIDEgLjQ0OCAxIDFaIi8+Cjwvc3ZnPgo=');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        
        /* Ensure main container doesn't expand */
        .layout {
          overflow: visible !important;
        }
        
        /* Prevent body scroll when dashboard content overflows */
        body {
          overflow: hidden;
        }
        
        /* Responsive improvements */
        @media (max-width: 1024px) {
          .react-grid-item {
            touch-action: none;
          }
          
          .react-grid-item > .react-resizable-handle {
            display: none; /* Hide resize handles on mobile */
          }
        }
        
        @media (max-width: 768px) {
          .react-grid-layout {
            margin: 0 !important;
          }
          
          .react-grid-item {
            margin: 4px !important;
          }
        }
        
        /* Improve touch interactions on mobile */
        @media (hover: none) and (pointer: coarse) {
          .react-grid-item {
            cursor: default;
          }
          
          .react-grid-item.react-draggable-dragging {
            z-index: 1000;
            transform: scale(1.05);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          }
        }
      `}</style>
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onTouchStart={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Only render when needed */}
        {(isMobile ? sidebarOpen : isSidebarOpen) && (
          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 bg-card border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 flex-shrink-0 relative",
              isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
            )}
            style={{
              width: isMobile ? '240px' : `${sidebarWidth}px`
            }}
          >
          <div className="flex flex-col h-full">
            {/* Resize Handle - Only visible on desktop when sidebar is open */}
            {!isMobile && isSidebarOpen && (
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                }}
              >
                {/* Visual indicator for resize handle */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-8 bg-border group-hover:bg-primary/50 rounded-l transition-colors" />
              </div>
            )}
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className={cn(
                "text-lg font-semibold transition-opacity duration-200",
                !isMobile && sidebarWidth < 120 ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                Navigation
              </h2>
              <div className="flex items-center space-x-1">
                {/* Three Dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {/* User Profile Section */}
                    <div className="px-3 py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/help')} className="cursor-pointer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Close button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-8 w-8 p-0"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              {!isMobile && sidebarWidth < 120 ? (
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Search">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Apps Section */}
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isNarrow = !isMobile && sidebarWidth < 120;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full transition-all duration-200",
                      isNarrow ? "justify-center px-2" : "justify-start"
                    )}
                    onClick={() => {
                      navigateToDashboard(item.id);
                      setSidebarOpen(false); // Close mobile sidebar on selection
                    }}
                    title={isNarrow ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      !isNarrow && "mr-3"
                    )} />
                    <span className={cn(
                      "transition-all duration-200 truncate",
                      isNarrow ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Button>
                );
              })}

              {/* My Dashboards Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <h3 className={cn(
                    "text-sm font-medium text-muted-foreground transition-opacity duration-200 truncate",
                    !isMobile && sidebarWidth < 120 ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    My Dashboards
                  </h3>
                  <DropdownMenu open={showCreateMenu} onOpenChange={setShowCreateMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async () => {
                          if (!user) return;

                          try {
                            const newDashboard: DashboardData = {
                              id: `dashboard-${Date.now()}`,
                              name: 'New Dashboard',
                              type: 'dashboard' as const,
                              layout: [],
                              widgets: [],
                              order: Date.now()
                            };

                            // Save to database
                            await saveDashboard(user.uid, newDashboard);

                            // Update local state
                            const newDashboardItem: DashboardItem = {
                              ...newDashboard,
                              userId: user.uid,
                              createdAt: new Date() as any,
                              updatedAt: new Date() as any,
                            };

                            setDashboards([...dashboards, newDashboardItem]);
                          } catch (error) {
                            console.error('Error creating dashboard:', error);
                          }

                          setShowCreateMenu(false);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        New Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async () => {
                          if (!user) return;

                          try {
                            const newFolder: DashboardData = {
                              id: `folder-${Date.now()}`,
                              name: 'New Folder',
                              type: 'folder' as const,
                              order: Date.now()
                            };

                            // Save to database
                            await saveDashboard(user.uid, newFolder);

                            // Update local state
                            const newFolderItem: DashboardItem = {
                              ...newFolder,
                              userId: user.uid,
                              createdAt: new Date() as any,
                              updatedAt: new Date() as any,
                              children: []
                            };

                            setDashboards([...dashboards, newFolderItem]);
                          } catch (error) {
                            console.error('Error creating folder:', error);
                          }

                          setShowCreateMenu(false);
                        }}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        New Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Dashboard Items */}
                <div className="space-y-1">
                  {dashboards.map((item) => (
                    <DashboardItem
                      key={item.id}
                      item={item}
                      activeSection={activeSection}
                      setActiveSection={handleDashboardNavigation}
                      setSidebarOpen={setSidebarOpen}
                      onContextMenu={handleContextMenu}
                      editingItem={editingItem}
                      editingName={editingName}
                      setEditingName={setEditingName}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      sidebarWidth={sidebarWidth}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t">
              {/* User Profile in Footer */}
              <div className={cn(
                "flex items-center p-2 rounded-lg hover:bg-muted/50 transition-all duration-200",
                !isMobile && sidebarWidth < 120 ? "justify-center" : "space-x-3"
              )}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "flex-1 min-w-0 transition-all duration-200",
                  !isMobile && sidebarWidth < 120 ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                )}>
                  <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
          {/* Dashboard Header - Made narrower */}
          <div className={cn(
            "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 py-2",
            isMobile && sidebarOpen && "hidden"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Unified hamburger button - works for both mobile and desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Hamburger clicked', { isMobile, isSidebarOpen, sidebarOpen });
                    if (isMobile) {
                      setSidebarOpen(true);
                    } else {
                      setIsSidebarOpen(!isSidebarOpen);
                    }
                  }}
                  className={cn(
                    "h-7 w-7 p-0 z-50 relative transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    !isMobile && !isSidebarOpen && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md border border-primary/30"
                  )}
                  title={
                    isMobile 
                      ? "Open menu" 
                      : (isSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)")
                  }
                >
                  <Menu className="h-3.5 w-3.5" />
                </Button>
                <h1 className="text-base sm:text-lg font-semibold truncate">
                  {getDashboardName(activeSection)}
                </h1>
              </div>
              {/* Removed WidgetManager - now only available via right-click and floating button */}
            </div>
          </div>

          {/* Main Dashboard Content */}
          <main className={cn(
            "flex-1 overflow-hidden bg-background",
            isMobile && sidebarOpen && "hidden"
          )}>
            <div className="h-full w-full overflow-auto custom-scrollbar p-2 sm:p-0">
              {/* Dynamic Content Based on Active Section */}
              {activeSection === 'overview' ? (
                <div
                  className="h-full bg-background"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      show: true,
                      x: e.clientX,
                      y: e.clientY,
                      item: { id: 'overview', type: 'overview' }
                    });
                  }}
                >
                  <div className="h-full flex items-center justify-center text-foreground p-4">
                    <div className="text-center bg-card p-6 rounded-lg border shadow-sm">
                      <p className="mb-2 text-lg font-medium">Welcome to your Dashboard</p>
                      <p className="text-sm text-muted-foreground mb-4">Right-click to add content</p>
                      {/* Debug info */}
                      <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
                        <p>Mobile: {isMobile ? 'Yes' : 'No'}</p>
                        <p>Mobile Sidebar: {sidebarOpen ? 'Open' : 'Closed'}</p>
                        <p>Desktop Sidebar: {isSidebarOpen ? 'Open' : 'Collapsed'}</p>
                        <p>Floating Button: {(!isMobile && !isSidebarOpen) ? 'Visible' : 'Hidden'}</p>
                        <p>Sidebar Width: {isMobile ? (sidebarOpen ? '240px' : '0px') : (isSidebarOpen ? `${sidebarWidth}px` : '0px')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (() => {
                // Check if it's a dashboard item
                const dashboardItem = dashboards.find(item => item.id === activeSection) ||
                  dashboards.find(folder => folder.children?.find((child: any) => child.id === activeSection))?.children?.find((child: any) => child.id === activeSection);

                if (dashboardItem && dashboardItem.type === 'dashboard') {
                  return (
                    <div
                      className="h-full bg-background"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          show: true,
                          x: e.clientX,
                          y: e.clientY,
                          item: { id: activeSection, type: 'dashboard' }
                        });
                      }}
                    >
                      <ResponsiveGridLayout
                        key={`grid-${isMobile ? 'mobile' : 'desktop'}`}
                        className="layout h-full w-full"
                        layouts={generateResponsiveLayouts(dashboardItem.layout || [])}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={isMobile ? 50 : 60}
                        margin={isMobile ? [8, 8] : [16, 16]}
                        containerPadding={isMobile ? [8, 8] : [16, 16]}
                        isDraggable={!isMobile}
                        isResizable={!isMobile}
                        preventCollision={false}
                        compactType="vertical"
                        onLayoutChange={async (layout, layouts) => {
                          // Only save layout changes when on desktop (lg breakpoint)
                          // This prevents mobile layout changes from overwriting desktop layouts
                          if (!isMobile && layouts && layouts.lg) {
                            try {
                              const cleanLayout = layouts.lg?.filter(item =>
                                item &&
                                typeof item.i === 'string' &&
                                typeof item.x === 'number' &&
                                typeof item.y === 'number' &&
                                typeof item.w === 'number' &&
                                typeof item.h === 'number'
                              ) || [];

                              // Only save if there are actual changes
                              const currentLayout = dashboardItem.layout || [];
                              const hasChanges = JSON.stringify(cleanLayout) !== JSON.stringify(currentLayout);
                              
                              if (hasChanges) {
                                console.log('Saving desktop layout changes:', cleanLayout);
                                await safeUpdateDashboard(activeSection, { layout: cleanLayout });
                                updateCurrentDashboard({ layout: cleanLayout });
                              }
                            } catch (error) {
                              console.error('Error saving layout:', error);
                            }
                          }
                        }}
                      >
                        {(dashboardItem.widgets || []).map((widget) => (
                          <div key={widget.id}>
                            <WidgetFrame
                              widget={{
                                id: widget.id,
                                title: widget.title,
                                type: widget.type,
                                isMinimized: widget.isMinimized,
                              }}
                              onClose={handleCloseWidget}
                              onMinimize={handleMinimizeWidget}
                              onDuplicate={handleDuplicateWidget}
                              onCopyTo={handleCopyWidgetTo}
                            >
                              {renderWidgetContent(widget)}
                            </WidgetFrame>
                          </div>
                        ))}
                      </ResponsiveGridLayout>

                      {/* Copy Widget Dialog */}
                      {copyWidgetDialog.isOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                          <div className="bg-popover border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
                            <h3 className="text-lg font-semibold mb-4">Copy Widget to Dashboard</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {getAvailableDashboards().map((dashboard) => (
                                <button
                                  key={dashboard.id}
                                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent rounded flex items-center"
                                  onClick={() => handleCopyWidget(copyWidgetDialog.widgetId, dashboard.id)}
                                >
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  {dashboard.name}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={copyWidgetDialog.closeCopyDialog}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Default content for non-dashboard items
                return (
                  <div
                    className="h-full"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        show: true,
                        x: e.clientX,
                        y: e.clientY,
                        item: { id: activeSection, type: 'overview' }
                      });
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center bg-card p-6 rounded-lg border shadow-sm">
                        <p className="text-foreground">Right-click to add content</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </main>
        </div>

        {/* Move Menu Dialog */}
        {showMoveMenu && moveItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-popover border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
              <h3 className="text-lg font-semibold mb-4">Move "{moveItem.name}" to:</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {getFolderOptions(moveItem.id).map((option) => (
                  <button
                    key={option.id || 'root'}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent rounded flex items-center"
                    onClick={() => handleMoveItem(option.id)}
                  >
                    {option.type === 'root' ? (
                      <Home className="h-4 w-4 mr-2" />
                    ) : (
                      <Folder className="h-4 w-4 mr-2" />
                    )}
                    {option.name}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowMoveMenu(false);
                    setMoveItem(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.show && (
          <div
            className="fixed z-50 bg-popover border rounded-md shadow-md py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenu.item?.type === 'dashboard' || contextMenu.item?.type === 'overview' ? (
              <>
                {/* Add Widget option - available for both dashboard and overview */}
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                  onClick={() => {
                    setShowWidgetDialog(true);
                    setContextMenu({ show: false, x: 0, y: 0, item: null });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </button>
                
                {contextMenu.item?.type === 'dashboard' && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                      onClick={() => handleRename(contextMenu.item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </button>
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                      onClick={() => {
                        setMoveItem(contextMenu.item);
                        setShowMoveMenu(true);
                        setContextMenu({ show: false, x: 0, y: 0, item: null });
                      }}
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Move to
                    </button>
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                      onClick={() => handleDuplicate(contextMenu.item)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </button>
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                      onClick={() => handleOpenInNewWindow(contextMenu.item)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in new window
                    </button>
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                      onClick={() => {
                        setShareDialogItem(contextMenu.item);
                        setShowShareDialog(true);
                        setContextMenu({ show: false, x: 0, y: 0, item: null });
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </button>
                    <div className="border-t my-1" />
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center text-destructive"
                      onClick={() => handleDelete(contextMenu.item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Add Widget option for folders */}
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                  onClick={() => {
                    setShowWidgetDialog(true);
                    setContextMenu({ show: false, x: 0, y: 0, item: null });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </button>
                <div className="border-t my-1" />
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                  onClick={() => handleCreateInFolder(contextMenu.item.id, 'dashboard')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Create dashboard
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                  onClick={() => handleCreateInFolder(contextMenu.item.id, 'folder')}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create folder
                </button>
                <div className="border-t my-1" />
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center"
                  onClick={() => handleRename(contextMenu.item)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center text-destructive"
                  onClick={() => handleDelete(contextMenu.item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Widget Dialog */}
        <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 p-4">
              {Object.entries(WIDGET_TYPES).map(([key, type]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    handleAddWidget({
                      title: `New ${type}`,
                      type: type,
                      isMinimized: false,
                    });
                    setShowWidgetDialog(false);
                  }}
                >
                  <div className="text-2xl">
                    {key === 'CHART' && '📊'}
                    {key === 'TABLE' && '📋'}
                    {key === 'METRIC' && '📈'}
                    {key === 'TRADINGVIEW' && '📉'}
                    {key === 'TEXT' && '📝'}
                    {key === 'IMAGE' && '🖼️'}
                    {key === 'CALENDAR' && '📅'}
                    {key === 'WEATHER' && '🌤️'}
                    {key === 'NEWS' && '📰'}
                    {!['CHART', 'TABLE', 'METRIC', 'TRADINGVIEW', 'TEXT', 'IMAGE', 'CALENDAR', 'WEATHER', 'NEWS'].includes(key) && '🔧'}
                  </div>
                  <span className="text-xs">{type}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Sidebar Toggle - Only shown when desktop sidebar is collapsed */}
        {!isMobile && !isSidebarOpen && (
          <Button
            onClick={() => {
              console.log('Floating button clicked, expanding sidebar');
              setIsSidebarOpen(true);
            }}
            className="fixed top-1/2 left-0 -translate-y-1/2 h-12 w-8 p-0 rounded-r-lg shadow-lg hover:shadow-xl transition-all duration-200 z-50 bg-primary hover:bg-primary/90 text-primary-foreground border-r border-primary-foreground/20"
            title="Expand sidebar (Ctrl+B)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Floating Chat Button - Hidden when mobile sidebar is open */}
        {!(isMobile && sidebarOpen) && (
          <Button
            onClick={handleChatClick}
            className="fixed bottom-6 right-6 h-12 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center space-x-2"
            size="default"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Chat</span>
          </Button>
        )}

        {/* Share Dialog */}
        {shareDialogItem && (
          <ShareDialog
            isOpen={showShareDialog}
            onClose={() => {
              setShowShareDialog(false);
              setShareDialogItem(null);
            }}
            dashboardId={shareDialogItem.id}
            dashboardName={shareDialogItem.name}
            ownerId={user?.uid || ''}
          />
        )}
      </div>
    </>
  );
}