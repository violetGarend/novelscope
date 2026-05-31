function getApiBaseUrl(): string {
  // 1. 构建时注入的环境变量
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // 2. 运行时检测：如果前端部署在 novelscope.top 域名下
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith("novelscope.top") || host.endsWith(".vercel.app")) {
      return "https://api.novelscope.top";
    }
  }

  // 3. 本地开发默认值
  return "http://localhost:3001";
}

const API_BASE_URL = getApiBaseUrl();

export { getApiBaseUrl };

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
