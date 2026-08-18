'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Download, 
  Settings2, 
  BarChart3, 
  Zap,
  FileText
} from 'lucide-react';

const actions = [
  {
    icon: Plus,
    label: 'New Application',
    description: 'Start a new grant application',
    primary: true
  },
  {
    icon: Search,
    label: 'Find Opportunities',
    description: 'Search for matching grants',
    primary: false
  },
  {
    icon: Download,
    label: 'Export Report',
    description: 'Download intelligence report',
    primary: false
  },
  {
    icon: Settings2,
    label: 'Configure Alerts',
    description: 'Set up custom notifications',
    primary: false
  },
  {
    icon: BarChart3,
    label: 'Create Custom View',
    description: 'Build your own dashboard',
    primary: false
  },
  {
    icon: Zap,
    label: 'Run Auto-Fill Demo',
    description: 'See automation in action',
    primary: false
  }
];

export function QuickActionsPanel() {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.label}
                variant={action.primary ? 'default' : 'outline'}
                className={`h-auto py-3 px-3 flex flex-col items-center gap-2 ${
                  action.primary 
                    ? 'bg-primary hover:bg-primary/90 text-white' 
                    : 'border-border hover:bg-secondary text-foreground'
                }`}
                onClick={() => alert(`${action.label} would open here`)}
              >
                <Icon className={`w-5 h-5 ${action.primary ? 'text-white' : 'text-primary'}`} />
                <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3">Recent Activity</p>
          <div className="space-y-2">
            {[
              { action: 'Auto-filled', target: 'EIC Accelerator App', time: '2h ago' },
              { action: 'Exported', target: 'Q4 Intelligence Report', time: '5h ago' },
              { action: 'Submitted', target: 'UKRI Grant Proposal', time: '1d ago' }
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{activity.action}</span>
                <span className="text-foreground truncate flex-1">{activity.target}</span>
                <span className="text-muted-foreground flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
