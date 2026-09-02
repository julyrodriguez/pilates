"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatisticsDashboard } from "@/components/statistics/StatisticsDashboard";

export default function EstadisticasPage() {
  return (
    <AppShell>
      <div className="pt-1 sm:pt-2">
        <StatisticsDashboard />
      </div>
    </AppShell>
  );
}
