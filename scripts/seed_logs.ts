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

console.log(`Connecting to Supabase: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

const main = async () => {
    console.log('Inserting dummy logs...');
    const { error } = await supabase.from('detection_logs').insert([
        { text_content: 'This is a safe message.', confidence: 0.05, threshold_used: 0.5, model_version: 'koelectra-v1', is_harmful: false },
        { text_content: 'I hate you!', confidence: 0.95, threshold_used: 0.5, model_version: 'koelectra-v1', is_harmful: true },
        { text_content: 'Have a nice day.', confidence: 0.01, threshold_used: 0.5, model_version: 'kanana-v1', is_harmful: false },
        { text_content: 'You are stupid.', confidence: 0.88, threshold_used: 0.5, model_version: 'kanana-v1', is_harmful: true },
        { text_content: 'Suspicious content here.', confidence: 0.6, threshold_used: 0.5, model_version: 'koelectra-v1', is_harmful: true },
    ]);

    if (error) {
        console.error('Error inserting logs:', error);
    } else {
        console.log('Logs inserted successfully');
    }
};

main();
