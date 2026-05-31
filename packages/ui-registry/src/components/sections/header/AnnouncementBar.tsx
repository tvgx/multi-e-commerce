import React from 'react';

export interface AnnouncementBarProps {
    text: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
    text,
    link,
    backgroundColor = '#000000',
    textColor = '#ffffff'
}) => {
    const content = (
        <div
            className="flex items-center justify-center py-2 px-4 text-sm font-medium transition-colors"
            style={{ backgroundColor, color: textColor }}
        >
            {text}
        </div>
    );

    if (link) {
        return (
            <a href={link} className="block hover:opacity-90 transition-opacity">
                {content}
            </a>
        );
    }

    return content;
};

export const announcementBarSchema = {
    name: 'Announcement bar',
    category: 'Header',
    settings: [
        { id: 'text', type: 'text', label: 'Nội dung', default: 'Welcome to our store' },
        { id: 'link', type: 'text', label: 'Đường dẫn' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền', default: '#000000' },
        { id: 'textColor', type: 'color', label: 'Màu chữ', default: '#ffffff' }
    ]
};
