import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const Header = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { getForUser, unreadCountForUser, markAsRead, markAllAsRead } = useNotifications();
  const userNotifications = getForUser(user);
  const unreadCount = unreadCountForUser(user);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64 bg-muted/50"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[280px]">
                {userNotifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </div>
                ) : (
                  userNotifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn(
                        'flex flex-col items-start gap-0.5 py-3 cursor-pointer whitespace-normal',
                        !n.read && 'bg-muted/50'
                      )}
                      onSelect={(e) => {
                        e.preventDefault();
                        markAsRead(n.id);
                      }}
                    >
                      <span className="font-medium text-sm">{n.title}</span>
                      {n.message && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </span>
                      )}
                      {n.createdAt && (
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">
              {user?.displayName?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

