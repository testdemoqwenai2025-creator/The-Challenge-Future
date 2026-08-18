'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Search,
  FileText,
  Newspaper,
  BarChart3,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '#dashboard' },
  { icon: Search, label: 'Opportunities', href: '#opportunities', badge: 12 },
  { icon: FileText, label: 'Applications', href: '#applications' },
  { icon: Newspaper, label: 'Gazette Monitor', href: '#gazette', badge: 3 },
  { icon: BarChart3, label: 'Intelligence', href: '#intelligence' },
  { icon: Star, label: 'Watchlist', href: '#watchlist' },
  { icon: Settings, label: 'Settings', href: '#settings' }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const [activeItem, setActiveItem] = useState('Dashboard');

  return (
    <aside
      className={`relative flex flex-col h-screen bg-sidebar border-r border-border transition-all duration-300 ${
        collapsed ? 'w-[70px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">NEXUS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={collapsed ? 'mx-auto' : ''}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 scrollbar-thin">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <Button
                key={item.label}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${
                  collapsed ? 'px-0 h-10' : ''
                } ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                onClick={() => setActiveItem(item.label)}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-primary' : ''}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-1.5 text-xs bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Upgrade Banner */}
        {!collapsed && user?.plan !== 'Enterprise' && (
          <div className="mx-2 mt-6">
            <Separator className="mb-4 bg-border" />
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to Pro</p>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock unlimited searches & auto-fill
              </p>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-xs">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Avatar className="w-9 h-9 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.plan || 'Free'} Plan
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              className="h-8 w-8"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
