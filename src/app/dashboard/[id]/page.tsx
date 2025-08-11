"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardPage from '../page';

export default function DashboardWithId() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;

  // This component will render the main dashboard page
  // The dashboard page will handle the URL parameter internally
  return <DashboardPage initialDashboardId={dashboardId} />;
}