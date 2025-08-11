"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Share,
  UserPlus,
  Copy,
  Trash2,
  Eye,
  Edit,
  Globe,
  Users,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  shareDashboard,
  removeDashboardAccess,
  getDashboardShares,
  generatePublicShareToken,
  revokePublicAccess
} from '@/lib/firebase/sharing';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardName: string;
  ownerId: string;
}

interface SharedUser {
  email: string;
  permission: 'view' | 'edit';
}

export function ShareDialog({
  isOpen,
  onClose,
  dashboardId,
  dashboardName,
  ownerId
}: ShareDialogProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingShares, setLoadingShares] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { toast } = useToast();

  // Load existing shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDashboardShares();
    }
  }, [isOpen, dashboardId]);

  const loadDashboardShares = async () => {
    try {
      setLoadingShares(true);
      const shares = await getDashboardShares(dashboardId);
      setSharedUsers(shares.users);
      setIsPublic(shares.isPublic);
      
      // If public, we might want to get the token (you'd need to modify the API)
      // For now, we'll generate it when needed
    } catch (error) {
      console.error('Error loading dashboard shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sharing information',
        variant: 'destructive',
      });
    } finally {
      setLoadingShares(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is already shared
    if (sharedUsers.some(user => user.email.toLowerCase() === newUserEmail.toLowerCase())) {
      toast({
        title: 'Error',
        description: 'This user already has access to the dashboard',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await shareDashboard(dashboardId, ownerId, [newUserEmail], newUserPermission);
      
      // Add to local state
      setSharedUsers(prev => [...prev, { email: newUserEmail, permission: newUserPermission }]);
      setNewUserEmail('');
      setNewUserPermission('view');
      
      toast({
        title: 'Success',
        description: `Dashboard shared with ${newUserEmail}`,
      });
    } catch (error: any) {
      console.error('Error sharing dashboard:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to share dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userEmail: string) => {
    try {
      setLoading(true);
      await removeDashboardAccess(dashboardId, userEmail);
      
      // Remove from local state
      setSharedUsers(prev => prev.filter(user => user.email !== userEmail));
      
      toast({
        title: 'Success',
        description: `Removed access for ${userEmail}`,
      });
    } catch (error: any) {
      console.error('Error removing user access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async (enabled: boolean) => {
    try {
      setLoading(true);
      
      if (enabled) {
        const token = await generatePublicShareToken(dashboardId, ownerId);
        setPublicToken(token);
        setIsPublic(true);
        toast({
          title: 'Success',
          description: 'Public sharing enabled',
        });
      } else {
        await revokePublicAccess(dashboardId);
        setPublicToken(null);
        setIsPublic(false);
        toast({
          title: 'Success',
          description: 'Public sharing disabled',
        });
      }
    } catch (error: any) {
      console.error('Error toggling public access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update public sharing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = async () => {
    if (!publicToken) return;
    
    const publicUrl = `${window.location.origin}/dashboard/${dashboardId}/public?token=${publicToken}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      toast({
        title: 'Success',
        description: 'Public link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const copyStandaloneLink = async () => {
    const standaloneUrl = `${window.location.origin}/dashboard/${dashboardId}/standalone`;
    
    try {
      await navigator.clipboard.writeText(standaloneUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      toast({
        title: 'Success',
        description: 'Standalone link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share "{dashboardName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add User Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Share with users
            </Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUser();
                  }
                }}
                className="flex-1"
              />
              <Select value={newUserPermission} onValueChange={(value: 'view' | 'edit') => setNewUserPermission(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      View
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-3 w-3" />
                      Edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} disabled={loading} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Shared Users List */}
          {loadingShares ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading shared users...
            </div>
          ) : sharedUsers.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Shared with ({sharedUsers.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {sharedUsers.map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{user.email}</span>
                      <Badge variant={user.permission === 'edit' ? 'default' : 'secondary'} className="text-xs">
                        {user.permission === 'edit' ? (
                          <>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </>
                        )}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user.email)}
                      disabled={loading}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Separator />

          {/* Public Sharing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public sharing
              </Label>
              <Switch
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={loading}
              />
            </div>
            
            {isPublic && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can view this dashboard
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPublicLink}
                  className="w-full"
                  disabled={!publicToken}
                >
                  {copiedToClipboard ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy public link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Standalone Link Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Standalone view</Label>
            <p className="text-xs text-muted-foreground">
              Open this dashboard in a new window without the sidebar
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={copyStandaloneLink}
              className="w-full"
            >
              {copiedToClipboard ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy standalone link
                </>
              )}
            </Button>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}