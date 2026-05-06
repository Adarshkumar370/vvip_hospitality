"use client";

import React from 'react';

export default function BakeryBackground() {
    return (
        <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-[0.15] overflow-hidden select-none" 
            style={{ 
                backgroundImage: 'url(/images/bakery_background.svg)',
                backgroundRepeat: 'repeat',
                backgroundSize: '1200px auto'
            }}
            aria-hidden="true"
        />
    );
}
