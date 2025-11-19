import { router } from '../lib/llm/router';
import { Message } from '../lib/llm/types';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
    const messages: Message[] = [
        { role: 'user', content: 'Hello, say "Test OK" if you can hear me.' }
    ];

    console.log('Testing OpenAI Worker...');
    try {
        const openaiWorker = router.getWorker('openai');
        const response = await openaiWorker.generate(messages);
        console.log('OpenAI Response:', response.content);
    } catch (e: any) {
        console.error('OpenAI Error:', e.message);
    }

    console.log('\nTesting Gemini Worker...');
    try {
        const geminiWorker = router.getWorker('gemini');
        const response = await geminiWorker.generate(messages);
        console.log('Gemini Response:', response.content);
    } catch (e: any) {
        console.error('Gemini Error:', e.message);
    }
}

test();
