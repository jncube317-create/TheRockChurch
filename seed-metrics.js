
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleData() {
    const metrics = [
        'attendance_adults', 'attendance_kids', 'tithes', 'offerings', 'visitors', 'volunteers'
    ];

    const now = new Date();
    const data = [];

    for (const metric of metrics) {
        let baseValue = metric.includes('tithes') || metric.includes('offerings') ? 5000 : 100;
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            baseValue += (Math.random() - 0.5) * (baseValue * 0.1);
            data.push({
                metric_type: metric,
                metric_value: Math.max(0, Math.round(baseValue)),
                metric_date: date.toISOString().split('T')[0]
            });
        }
    }

    console.log(`Inserting ${data.length} sample records...`);
    const { error } = await supabase.from('metrics').insert(data);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('✅ Sample data added successfully!');
    }
}

addSampleData();
