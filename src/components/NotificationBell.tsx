import React from 'react';
import { Bell, BellDot, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import useNotifications from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { data: notifications, markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleAction = (n: any) => {
    markAsRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5 text-blue-500 animate-pulse" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-[500px] overflow-y-auto" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notificações
          {unreadCount > 0 && <Badge variant="outline">{unreadCount} novas</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications?.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação por enquanto.
          </div>
        ) : (
          notifications?.map((n) => (
            <div 
              key={n.id} 
              className={`p-3 border-b last:border-0 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 cursor-pointer" onClick={() => handleAction(n)}>
                  <h4 className="text-sm font-bold">{n.title}</h4>
                  <p className="text-xs text-foreground/80 mt-1">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead.mutate(n.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNotification.mutate(n.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;