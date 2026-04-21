import { Organization } from '@/types';
import { createResourceStore } from './createResourceStore';

export const organizationsStore = createResourceStore<Organization>("organizations", {
  ttl: 180000, // 3 minutes
  invalidateOnMutation: false
});

export default organizationsStore;
