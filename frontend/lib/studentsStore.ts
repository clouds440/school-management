import { Student } from '@/types';
import { createResourceStore } from './createResourceStore';

export const studentsStore = createResourceStore<Student>("students", {
  invalidateOnMutation: true
});

export default studentsStore;
