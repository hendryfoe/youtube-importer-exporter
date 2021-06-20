import { useMemo } from 'react';
import { toast} from './toast.class';

export function useToast() {
  return useMemo(() => toast, []);
}