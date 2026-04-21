import { Course } from '@/types';
import { createResourceStore } from './createResourceStore';

export const coursesStore = createResourceStore<Course>("courses", {
  invalidateOnMutation: true
});

export default coursesStore;
