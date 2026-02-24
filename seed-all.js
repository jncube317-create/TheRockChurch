
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedEverything() {
    console.log('Seeding dummy data...');

    // 1. Seed Events
    const events = [
        { title: 'Community Outreach', event_date: '2026-03-05', event_time: '10:00 AM', description: 'Helping the local neighborhood with food and supplies.', status: 'upcoming' },
        { title: 'Youth Night', event_date: '2026-03-12', event_time: '06:30 PM', description: 'Energetic service for the youth with music and games.', status: 'upcoming' },
        { title: 'Worship Rehearsal', event_date: '2026-03-02', event_time: '07:00 PM', description: 'Weekly practice for the worship team.', status: 'upcoming' }
    ];

    // 2. Seed Roster
    const roster = [
        { topic: 'Walking in Faith', speaker: 'Pastor John Smith', date: '2026-03-01', status: 'confirmed' },
        { topic: 'The Power of Prayer', speaker: 'Sarah Jenkins', date: '2026-03-08', status: 'confirmed' },
        { topic: 'Kingdom Living', speaker: 'David Wilson', date: '2026-03-15', status: 'confirmed' }
    ];

    // 3. Seed Members
    const members = [
        { full_name: 'Alice Johnson', email: 'alice@example.com', member_status: 'active' },
        { full_name: 'Bob Thompson', email: 'bob@example.com', member_status: 'active' },
        { full_name: 'Charlie Davis', email: 'charlie@example.com', member_status: 'active' },
        { full_name: 'Diana Prince', email: 'diana@example.com', member_status: 'inactive' }
    ];

    try {
        console.log('Inserting events...');
        await supabase.from('events').insert(events);

        console.log('Inserting roster...');
        await supabase.from('preaching_roster').insert(roster);

        console.log('Inserting members...');
        await supabase.from('members').insert(members);

        console.log('✅ All dummy data seeded successfully!');
    } catch (error) {
        console.error('Error seeding data:', error.message);
    }
}

seedEverything();
