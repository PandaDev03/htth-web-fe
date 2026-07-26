import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router/router";
import { store } from "@/app/store/store";
import { queryClient } from "@/shared/api/queryClient";

export function AppProviders() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#1677ff",
              borderRadius: 6,
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            },
            components: {
              Layout: {
                bodyBg: "#f4f7fb",
                siderBg: "#111827",
              },
              Menu: {
                darkItemBg: "#111827",
                darkSubMenuItemBg: "#111827",
                darkItemSelectedBg: "#2563eb",
              },
            },
          }}
        >
          <RouterProvider router={router} />
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
