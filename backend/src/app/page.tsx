export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">NovelScope API</h1>
        <p className="mt-2 text-gray-500">API 服务运行中</p>
        <div className="mt-4 text-sm text-gray-400">
          <p>Health: <a href="/api/health" className="underline">/api/health</a></p>
        </div>
      </div>
    </main>
  );
}
