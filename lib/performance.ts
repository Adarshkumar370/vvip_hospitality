/**
 * Performance Optimization Utilities
 * 
 * This file contains utilities for optimizing component loading
 * and reducing initial JavaScript bundle size.
 */

import dynamic from 'next/dynamic';

/**
 * Dynamically import motion components from framer-motion
 * This reduces the initial bundle size by code-splitting animation libraries
 */
export const MotionDiv = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.div),
    { ssr: true }
);

export const MotionNav = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.nav),
    { ssr: true }
);

export const MotionA = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.a),
    { ssr: true }
);
