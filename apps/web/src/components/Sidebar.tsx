"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/sources", label: "Fuentes", icon: "📡" },
  { href: "/saved-searches", label: "Búsquedas", icon: "🔍" },
  { href: "/alerts", label: "Alertas", icon: "🔔" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col h-screen shrink-0">
      <div className="px-5 py-6 border-b border-gray-700">
        <span className="font-bold text-lg">Demand Radar</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-400 hover:text-white text-left px-3 py-2 rounded-md hover:bg-gray-800 transition"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
