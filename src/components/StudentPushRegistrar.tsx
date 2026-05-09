'use client';
import { useEffect } from 'react';
import { registerStudentPushNotifications } from '@/lib/push-notifications';

interface Props {
  studentToken: string;
}

export default function StudentPushRegistrar({ studentToken }: Props) {
  useEffect(() => {
    registerStudentPushNotifications(studentToken);
  }, [studentToken]);
  return null;
}
