import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/base/styles/globals.css";

export const metadata: Metadata = {
  title: "{{PROJECT_NAME}}",
  description: "CP Source Registry로 생성된 프로젝트",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
