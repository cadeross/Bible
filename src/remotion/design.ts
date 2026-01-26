import { Easing } from 'remotion';

export const COLORS = {
    BACKGROUND: '#F9F8F4',
    TEXT: '#2D2D2D',
    ACCENT: '#C5A065',
    PAPER: '#FFFFFF',
};

export const FONTS = {
    SERIF: 'Merriweather, serif',
    SANS: 'Inter, sans-serif',
};

// Smooth ease-out: bezier(0.25, 0.1, 0.25, 1)
export const EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
