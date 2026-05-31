import React from 'react';

export interface SpacerProps {
    height?: number;
}

export const SpacerBlock: React.FC<SpacerProps> = ({ height = 32 }) => {
    return (
        <div style={{ height: `${height}px`, width: '100%' }} aria-hidden="true" />
    );
};

export const spacerSchema = {
    name: 'Spacer',
    category: 'Layout',
    settings: [
        { id: 'height', type: 'number', label: 'Chiều cao (px)', default: 32 }
    ]
};
