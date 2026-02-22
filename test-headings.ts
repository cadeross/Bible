import { getChapterText } from './src/lib/api-bible.ts';
async function test() {
  // web: 9879dbb7cfe39e4d-01
  const chap = await getChapterText('9879dbb7cfe39e4d-01', 'GEN.1');
  console.log(chap?.content);
}
test();
