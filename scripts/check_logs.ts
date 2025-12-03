import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const main = async () => {
    console.log('Fetching logs...');
    const { data, error } = await supabase
        .from('detection_logs')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        console.log('Logs fetched successfully:', data);
        console.log('Count:', data?.length);
    }
};

main();
