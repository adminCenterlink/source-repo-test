import Link from "next/link";

// 생성된 라우트 목록 — init 후 필요에 맞게 수정하세요
const routes: { href: string; label: string; description: string }[] = [];

export default function HomePage() {
  if (routes.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">app/page.tsx에 routes를 등록하세요.</p>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-12">
      <h1 className="text-3xl font-bold text-gray-900">{{PROJECT_NAME}}</h1>
      <ul className="flex flex-col gap-3 w-full max-w-sm">
        {routes.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex flex-col rounded-md border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"
            >
              <span className="font-semibold text-blue-600">{r.label}</span>
              <span className="text-sm text-gray-500">{r.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
