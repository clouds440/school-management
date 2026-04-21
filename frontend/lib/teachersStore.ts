import { Teacher } from '@/types';
import { createResourceStore } from './createResourceStore';

export const teachersStore = createResourceStore<Teacher>("teachers", {
  invalidateOnMutation: true
});

export default teachersStore;
