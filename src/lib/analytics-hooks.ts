"use client";

import useSWR from 'swr';
import { analyticsApi, ClinicalAnalytics, FinancialAnalytics, InventoryAnalytics } from './analytics-api';

const swrOptions = { revalidateOnFocus: false, dedupingInterval: 30_000 };

export function useClinicalAnalytics(period: string = 'last_30_days') {
  const { data, error, isLoading, mutate } = useSWR<ClinicalAnalytics>(
    ['clinical', period],
    () => analyticsApi.getClinicalAnalytics(period),
    swrOptions
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useFinancialAnalytics(period: string = 'last_month') {
  const { data, error, isLoading, mutate } = useSWR<FinancialAnalytics>(
    ['financial', period],
    () => analyticsApi.getFinancialAnalytics(period),
    swrOptions
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useOperationalAnalytics(period: string = 'last_30_days') {
  const { data, error, isLoading, mutate } = useSWR<InventoryAnalytics>(
    ['operational', period],
    () => analyticsApi.getInventoryAnalytics(period),
    swrOptions
  );
  return { data, error, isLoading, refresh: mutate };
}


