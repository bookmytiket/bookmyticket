"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganiserCatchAllRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/organiser");
  }, [router]);
  return null;
}

