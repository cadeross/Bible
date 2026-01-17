'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IconProps {
    className?: string;
    isActive?: boolean;
    strokeWidth?: number;
}

// Material 3 "Home" - Open rounded door style
export function AnimatedHomeIcon({ className, isActive, strokeWidth = 2 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            // Material 3 uses Fill for active
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isActive ? 0 : strokeWidth} // No stroke if filled
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <motion.path
                d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" // Material Filled/Outlined shape approx
                initial={false}
                animate={isActive ? { y: [0, -2, 0] } : { y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
            />
        </svg>
    );
}

// Material 3 "Book" (Auto_stories or similar)
// We keep the page turn animation but make the shape more "Material"
export function AnimatedBookIconFinal({ className, isActive, strokeWidth = 2 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isActive ? 0 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Base Book Shape */}
            <path d="M4 6c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v12c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2z" />
            <path d="M18 6c0-1.1-.9-2-2-2h-6c-1.1 0-2 .9-2 2v12c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z" />

            {/* Animated Page Overlay for "Active" */}
            {/* We animate a 'fake' page flipping from right to left */}
            <motion.path
                fill={isActive ? "currentColor" : "none"}
                stroke={isActive ? "none" : "currentColor"}
                strokeWidth={isActive ? 0 : strokeWidth}
                // Shape that simulates a page
                d="M18 6c0-1.1-.9-2-2-2h-6c-1.1 0-2 0.9-2 2v12c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z"
                animate={isActive ? {
                    x: [0, -12], // Move across
                    scaleX: [1, 0.1, 1], // Squeeze
                    opacity: [1, 0.5, 0] // Fade out
                } : { x: 0, scaleX: 1, opacity: 0 }}
                transition={{ duration: 0.5 }}
            />
        </svg>
    );
}

// Material 3 "Calendar_Month"
export function AnimatedCalendarIcon({ className, isActive, strokeWidth = 2 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            // Material Calendar is usually a rect with dots or lines
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isActive ? 0 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <motion.path
                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
                animate={isActive ? { rotate: [0, -5, 5, -5, 0] } : {}}
                transition={{ duration: 0.5 }}
            />
        </svg>
    );
}

// Material 3 "Search"
export function AnimatedSearchIcon({ className, isActive, strokeWidth = 2 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            // Search is usually thick stroke or filled handle? 
            // Often Search is just stroke even in Material, but let's make it thicker.
            fill="none"
            stroke="currentColor"
            // Material 3 Active Search is often just bolder stroke
            strokeWidth={isActive ? 3 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <motion.circle
                cx="11" cy="11" r="8"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
            />
            <motion.line
                x1="21" y1="21" x2="16.65" y2="16.65"
                animate={isActive ? { x: [0, 2, 0], y: [0, 2, 0] } : {}}
                transition={{ duration: 0.4 }}
            />
        </svg>
    );
}

// Material 3 "Person"
export function AnimatedUserIcon({ className, isActive, strokeWidth = 2 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isActive ? 0 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <motion.path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                animate={isActive ? { y: [0, -1, 0], scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
            />
        </svg>
    );
}
