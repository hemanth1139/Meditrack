"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

export default function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications/");
      return res.data.data;
    },
    refetchInterval: 30000, 
    retry: 1,
  });

  const readMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/notifications/${id}/read/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all/");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  const handleRead = (id, isRead) => {
    if (!isRead) readMutation.mutate(id);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-600"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => readAllMutation.mutate()}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.is_read ? "bg-blue-50/50 font-medium" : "opacity-80"}`}
                onClick={(e) => {
                  e.preventDefault(); 
                  handleRead(n.id, n.is_read);
                }}
              >
                <div className="text-sm text-slate-900 whitespace-normal line-clamp-2">{n.message}</div>
                <div className="text-[11px] text-slate-500">{formatDate(n.created_at)}</div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">No new notifications</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
