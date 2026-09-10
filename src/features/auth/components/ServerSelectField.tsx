import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Server } from "lucide-react";

import { getGameServers } from "@/features/auth/api/serverApi";
import type { ServerId } from "@/shared/types/server";

type ServerSelectFieldProps = {
  id: string;
  value: ServerId;
  onChange: (serverId: ServerId) => void;
  disabled?: boolean;
  error?: string;
};

export function ServerSelectField({
  id,
  value,
  onChange,
  disabled = false,
  error,
}: ServerSelectFieldProps) {
  const serversQuery = useQuery({
    queryKey: ["game-servers"],
    queryFn: getGameServers,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-600 text-gray-700">
        Server
      </label>
      <div className="relative">
        <Server
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <select
          id={id}
          value={value}
          disabled={disabled || serversQuery.isPending || serversQuery.isError}
          aria-invalid={Boolean(error || serversQuery.isError)}
          className={[
            "h-12 w-full appearance-none rounded-xl border bg-gray-50/90 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
            error || serversQuery.isError
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-amber-400 focus:ring-amber-100",
          ].join(" ")}
          onChange={(event) => onChange(event.target.value as ServerId)}
        >
          {serversQuery.isPending ? (
            <option value={value}>Đang tải danh sách server...</option>
          ) : (
            serversQuery.data?.map((server) => (
              <option key={server.id} value={server.id} disabled={!server.enabled}>
                {server.displayName}{server.enabled ? "" : " (Chưa mở)"}
              </option>
            ))
          )}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400"
        >
          ▼
        </span>
      </div>
      {(error || serversQuery.isError) && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={12} />
          {error ?? "Không thể tải danh sách server. Vui lòng thử lại."}
        </p>
      )}
    </div>
  );
}

