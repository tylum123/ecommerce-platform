"use client";

import dynamic from "next/dynamic";
import type { AuthSessionUser } from "@/lib/auth";
import { AdminErpSkeleton } from "@/components/sites/nari/ui-skeletons";

const AdminErpView = dynamic(
  () =>
    import("@/components/sites/nari/admin-erp-view").then(
      (mod) => mod.AdminErpView,
    ),
  {
    ssr: false,
    loading: () => <AdminErpSkeleton />,
  },
);

export function AdminErpLoader({
  initialSession,
}: {
  initialSession?: AuthSessionUser;
}) {
  return <AdminErpView initialSession={initialSession} />;
}
