import { ClientOnly, HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SentriNG Admin" },
      { name: "theme-color", content: "#0D1117" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryProvider>
          {/* The build is one SPA shell for every path: pages render after hydration, so the shell never has to
              match the page of the current URL */}
          <ClientOnly>{children}</ClientOnly>
          <Toaster position="bottom-right" />
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
