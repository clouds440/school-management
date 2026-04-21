import { Section } from '@/types';
import { createResourceStore } from './createResourceStore';

export const sectionsStore = createResourceStore<Section>("sections", {
  invalidateOnMutation: true
});

export default sectionsStore;
