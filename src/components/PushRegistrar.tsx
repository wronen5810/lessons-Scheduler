'use client';
import { useEffect } from 'react';
import { registerPushNotifications } from '@/lib/push-notifications';

export default function PushRegistrar() {
  useEffect(() => {
    registerPushNotifications();
  }, []);
  return null;
}