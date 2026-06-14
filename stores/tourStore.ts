import { create } from 'zustand';

interface TourState {
  showTour: boolean;
  setShowTour: (show: boolean) => void;
}

export const useTourStore = create<TourState>((set) => ({
  showTour: false,
  setShowTour: (show) => set({ showTour: show }),
}));
