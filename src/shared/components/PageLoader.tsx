import LoadingOutlined from "@ant-design/icons/lib/icons/LoadingOutlined";
import { Spin } from "antd";
import type { ReactNode } from "react";
import { Suspense } from "react";

type PageLoaderProps = {
  children: ReactNode;
};

export function PageLoader({ children }: PageLoaderProps) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spin size="large" indicator={<LoadingOutlined spin />} style={{}} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
