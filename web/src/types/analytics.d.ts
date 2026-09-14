export {};

declare global {
  interface Window {
    ym?: (
      id: string | number,
      method: string,
      ...args: unknown[]
    ) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
