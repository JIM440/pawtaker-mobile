export const MOCK_IN_CARE = {
    petName: 'Polo',
    careType: 'Daytime',
    dayLabel: 'Day 1/5',
    caregiverName: 'Jane Ambers',
    caregiverAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    endsIn: '2h 15m',
};

export const MOCK_STATS = { points: 58, careGiven: 12, careReceived: 17 };

export const MOCK_CARE_GIVEN_ROWS = [
    {
        id: '1',
        ownerName: 'Jane Ambers',
        ownerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        handshakes: 12,
        paws: 17,
        pet: 'Polo',
        careType: 'Daytime',
        date: 'Mar 15, 2025',
    },
];

export const MOCK_LIKED_PETS = [
    {
        id: '1',
        /** Care request id — matches home feed / post-requests/[id] */
        requestId: '1',
        imageSource: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
        petName: 'Polo',
        breed: 'Golden Retriever',
        petType: 'Dog',
        bio: 'Polo is a friendly and energetic golden retriever who loves long walks and playing for hours in the park.',
        tags: ['fenced yard', 'high energy', '1-3yrs'],
        seekingDateRange: 'Mar 14-Apr 02',
        seekingTime: '8am-4pm',
        isSeeking: true,
    },
    {
        id: '2',
        requestId: '3',
        imageSource: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        petName: 'Luna',
        breed: 'Tabby',
        petType: 'Cat',
        bio: 'Luna is an independent and affectionate tabby cat. She enjoys her alone time but never says no to chin scratches.',
        tags: ['fenced yard', 'calm', '3-8yrs'],
        seekingDateRange: '',
        seekingTime: '',
        isSeeking: false,
    },
];
