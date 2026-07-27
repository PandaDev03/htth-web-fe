import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { router } from "@/app/router/router";
import { store } from "@/app/store/store";
import { AuthSessionBootstrap } from "@/features/auth/components/AuthSessionBootstrap";
import { queryClient } from "@/shared/api/queryClient";

export function AppProviders() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#d97706",
              borderRadius: 8,
              fontFamily: "Plus Jakarta Sans, sans-serif",
            },
          }}
        >
          <AuthSessionBootstrap />
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
