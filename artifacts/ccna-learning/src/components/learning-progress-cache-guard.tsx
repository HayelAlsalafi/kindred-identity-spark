import { useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  progressIdentity,
  removeOtherProgress,
  removeProgress,
} from '../lib/learning-progress-cache';

export function LearningProgressCacheGuard() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const client = useQueryClient();
  useEffect(() => {
    const identity = progressIdentity({ isLoaded, isSignedIn, userId, sessionId });
    removeOtherProgress(client, identity);
    return () => {
      if (identity) removeProgress(client, identity);
    };
  }, [client, isLoaded, isSignedIn, userId, sessionId]);
  return null;
}
