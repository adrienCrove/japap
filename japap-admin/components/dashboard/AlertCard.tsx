import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import React from 'react';

type AlertCardProps = {
  status: string;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'green' | 'yellow' | 'blue';
  icon: React.ReactNode;
  title: string;
  category: string;
  description: string;
  location?: string;
  children?: React.ReactNode; // For the action button
  onClick?: () => void;
};

const badgeVariants = {
    default: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    secondary: 'bg-gray-100 text-gray-900',
    outline: 'text-gray-900',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
};


export const AlertCard = ({ status, badgeVariant = 'default', icon, title, category, description, location, children, onClick }: AlertCardProps) => {
  return (
    <div 
      className={cn(
        "flex items-start space-x-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm",
        onClick ? "cursor-pointer hover:bg-gray-50 transition-colors " : ""
      )}
      onClick={onClick}
    >
      
      <div className="flex-1">
        <Badge className={cn('text-xs font-semibold', badgeVariants[badgeVariant])}>{status}</Badge>
        <div className="flex items-center space-x-2">
          <div className="mt-1">{icon}</div>
          <h4 className="font-semibold text-card-foreground mt-2"> {title}</h4>
        </div>
        {/*<p className="text-sm text-muted-foreground mt-1">
            {description}
        </p>*/}
        {location && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <MapPin className="h-4 w-4 mr-2 shrink-0" /> {location} 
          </p>
        )}
        {children && (
          <div className="mt-3">
              {children}
          </div>
        )}
      </div>
    </div>
  );
};
