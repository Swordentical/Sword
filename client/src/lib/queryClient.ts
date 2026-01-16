import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

function flattenObjectToParams(obj: Record<string, unknown>, params: URLSearchParams, prefix = ""): void {
  for (const [key, value] of Object.entries(obj)) {
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    
    if (value === undefined || value === null || value === "") {
      continue;
    }
    
    if (value instanceof Date) {
      params.append(paramKey, value.toISOString());
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          flattenObjectToParams(item as Record<string, unknown>, params, `${paramKey}[${index}]`);
        } else {
          params.append(`${paramKey}[]`, String(item));
        }
      });
    } else if (typeof value === "object") {
      flattenObjectToParams(value as Record<string, unknown>, params, paramKey);
    } else {
      params.append(paramKey, String(value));
    }
  }
}

function buildUrl(queryKey: readonly unknown[]): string {
  if (queryKey.length === 0) {
    return "";
  }

  const [path, ...rest] = queryKey;

  if (typeof path !== "string") {
    throw new Error("First element of queryKey must be a string (the URL path)");
  }

  if (rest.length === 0) {
    return path;
  }

  const stringSegments: string[] = [];
  let paramsObj: Record<string, unknown> | null = null;

  for (const segment of rest) {
    if (typeof segment === "string") {
      stringSegments.push(segment);
    } else if (typeof segment === "number") {
      stringSegments.push(String(segment));
    } else if (typeof segment === "object" && segment !== null) {
      paramsObj = segment as Record<string, unknown>;
    }
  }

  let basePath = path;
  if (stringSegments.length > 0) {
    basePath = `${path}/${stringSegments.join("/")}`;
  }

  if (paramsObj) {
    const params = new URLSearchParams();
    flattenObjectToParams(paramsObj, params);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }

  return basePath;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl(queryKey);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
