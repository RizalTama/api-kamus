import * as PlayHT from 'playht';
import fs from 'fs';

// Initialize client
PlayHT.init({
  userId: 'Qxj6aUeTVFaLdLOQtuHVfFMgjKC2',
  apiKey: 'ak-884dcd0974314bc6af2390c5f5e97cbe',
});

async function streamAudio(text) {
  const stream = await PlayHT.stream('All human wisdom is summed up in these two words: Wait and hope.', { voiceEngine: 'PlayDialog' });
  stream.on('data', (chunk) => {
    // Do whatever you want with the stream, you could save it to a file, stream it in realtime to the browser or app, or to a telephony system
    fs.appendFileSync('output.mp3', chunk);
  });
  return stream;
}