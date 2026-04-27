import { baseURL } from "@/baseUrl";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <NextChatSDKBootstrap baseUrl={baseURL} />
      </head>
      <body>{children}</body>
    </html>
  );
}

function NextChatSDKBootstrap({ baseUrl }: { baseUrl: string }) {
  return (
    <>
      <base href={baseUrl}></base>
      <script>{`window.innerBaseUrl = ${JSON.stringify(baseUrl)}`}</script>
      <script>{`window.__isChatGptApp = typeof window.openai !== "undefined";`}</script>
      <script>
        {"(" +
          (() => {
            const baseUrl = (window as any).innerBaseUrl;
            const htmlElement = document.documentElement;
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.target === htmlElement) {
                  const attrName = mutation.attributeName;
                  if (attrName && attrName !== "suppresshydrationwarning") {
                    htmlElement.removeAttribute(attrName);
                  }
                }
              });
            });
            observer.observe(htmlElement, { attributes: true, attributeOldValue: true });

            const originalReplaceState = history.replaceState;
            history.replaceState = (s: any, unused: any, url: any) => {
              const u = new URL(url ?? "", window.location.href);
              const href = u.pathname + u.search + u.hash;
              originalReplaceState.call(history, unused, href);
            };

            const originalPushState = history.pushState;
            history.pushState = (s: any, unused: any, url: any) => {
              const u = new URL(url ?? "", window.location.href);
              const href = u.pathname + u.search + u.hash;
              originalPushState.call(history, unused, href);
            };

            const appOrigin = new URL(baseUrl).origin;
            const isInIframe = window.self !== window.top;

            window.addEventListener("click", (e) => {
              const a = (e?.target as HTMLElement)?.closest("a");
              if (!a || !a.href) return;
              const url = new URL(a.href, window.location.href);
              if (url.origin !== window.location.origin && url.origin !== appOrigin) {
                try {
                  if ((window as any).openai) {
                    (window as any).openai?.openExternal({ href: a.href });
                    e.preventDefault();
                  }
                } catch {
                  console.warn("openExternal failed");
                }
              }
            }, true);

            if (isInIframe && window.location.origin !== appOrigin) {
              const originalFetch = window.fetch;
              window.fetch = (input: URL | RequestInfo, init?: RequestInit) => {
                let url: URL;
                if (typeof input === "string" || input instanceof URL) {
                  url = new URL(input as string, window.location.href);
                } else {
                  url = new URL((input as Request).url, window.location.href);
                }
                if (url.origin === appOrigin) {
                  if (typeof input === "string" || input instanceof URL) input = url.toString();
                  else input = new Request(url.toString(), input as Request);
                  return originalFetch.call(window, input, { ...init, mode: "cors" });
                }
                if (url.origin === window.location.origin) {
                  const newUrl = new URL(baseUrl);
                  newUrl.pathname = url.pathname;
                  newUrl.search = url.search;
                  newUrl.hash = url.hash;
                  url = newUrl;
                  if (typeof input === "string" || input instanceof URL) input = url.toString();
                  else input = new Request(url.toString(), input as Request);
                  return originalFetch.call(window, input, { ...init, mode: "cors" });
                }
                return originalFetch.call(window, input, init);
              };
            }
          }).toString() +
          ")()"}
      </script>
    </>
  );
}
