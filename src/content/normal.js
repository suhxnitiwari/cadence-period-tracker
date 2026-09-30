// "Is this normal?" answers. Every answer follows the same shape:
//   happening: what's going on, in plain words
//   usually:   reassurance, where it's medically appropriate
//   watch:     what's useful to keep an eye on (optional)
//   tell:      when to tell a trusted adult or doctor (optional)
// Based on guidance from ACOG, the American Academy of Pediatrics and the NHS.
// Written to calm, never to diagnose. Needs review by a pediatric clinician before launch.

export const NORMAL = [
  // ---- blood & flow ----
  {
    id: 'brown-blood', topic: 'flow',
    q: 'Why is my blood brown?',
    keywords: 'brown dark black color colour old',
    happening: 'Brown blood is blood that’s a little older. It took longer to leave your body, so it changed color, like an apple slice turning brown.',
    usually: 'This is really common at the very start or end of a period, and in first periods. It’s normal.',
    watch: 'If brown discharge comes with a bad smell or itching, that’s different, and worth mentioning.',
  },
  {
    id: 'clots', topic: 'flow',
    q: 'Why are there clumps in my blood?',
    keywords: 'clumps clots chunks jelly lumps thick blobs',
    happening: 'Those clumps are called clots. They’re just period blood that thickened before it came out, a bit like jelly.',
    usually: 'Small clots are normal, especially on your heaviest days.',
    watch: 'You can log “Clots” in Cadence to see how often they happen.',
    tell: 'If clots are often bigger than a quarter, or come with very heavy bleeding.',
  },
  {
    id: 'stop-start', topic: 'flow',
    q: 'My period stopped yesterday and came back. Why?',
    keywords: 'stop start again pause came back returned stopped',
    happening: 'Periods don’t always flow evenly. Bleeding can slow down or pause for a day, then start again.',
    usually: 'This is common, especially in the first few years. Cadence counts it as the same period.',
  },
  {
    id: 'bleeding-lot', topic: 'flow',
    q: 'I’m bleeding a lot. Is that okay?',
    keywords: 'bleeding lot heavy much soak soaking flood',
    happening: 'Most periods have one or two heavier days, usually near the start. It often looks like more blood than it is. A whole period is usually only a few tablespoons.',
    usually: 'Needing to change more often on your heaviest day is normal.',
    watch: 'Log your flow each day so you can see which days are heaviest.',
    tell: 'If you soak through a pad or tampon every hour or two for several hours in a row, your period lasts more than 7 days, or you feel dizzy or faint. If you feel faint right now, tell an adult right away.',
  },
  {
    id: 'not-come', topic: 'cycle',
    q: 'My period hasn’t come back. Why?',
    keywords: 'missed skipped not come back yet where late irregular waiting hasnt',
    happening: 'When periods are new, your body is still finding its rhythm. The time between periods can change a lot.',
    usually: 'In the first few years, anywhere from about 3 to 6 weeks between periods is common, and sometimes a month gets skipped. Stress, being sick, lots of sports and travel can shift things too.',
    watch: 'Keep logging. Cadence shows you how long it’s been.',
    tell: 'If it’s been more than 3 months. And if you’ve ever had sex, a missed period can also be a sign of pregnancy, so talk to a trusted adult or doctor.',
  },
  {
    id: 'irregular', topic: 'cycle',
    q: 'Why aren’t my periods regular?',
    keywords: 'irregular regular random different every month cycle length',
    happening: 'Your cycle is controlled by hormones, and when periods are new, those hormones are still settling into a pattern.',
    usually: 'Irregular periods are really common for the first couple of years. Almost nobody has exactly the same number of days every time, even adults. That’s why Cadence shows a range, not a date.',
    tell: 'If your periods come less than 3 weeks apart, or more than 3 months apart.',
  },
  {
    id: 'spotting', topic: 'flow',
    q: 'I have a little blood between periods.',
    keywords: 'spotting between spots little blood middle unexpected',
    happening: 'A few spots of blood between periods is called spotting.',
    usually: 'It can happen now and then, especially while your cycle is new.',
    watch: 'Log it as “Spotting” or “Unexpected bleeding” so you can see if it keeps happening.',
    tell: 'If it happens a lot, or it’s more than a few spots.',
  },
  {
    id: 'blood-clothes', topic: 'school',
    q: 'I got blood on my clothes.',
    keywords: 'blood clothes pants leak stain bled through accident underwear sheets',
    happening: 'Leaks happen to almost everyone who has periods. It doesn’t mean you did anything wrong.',
    usually: 'Tie a sweater or jacket around your waist if you need to, and change when you can. Rinse the stain with cold water (not hot) as soon as you can, then wash as usual.',
    watch: 'If it happens a lot, a longer pad, one with wings, or period underwear as backup can help.',
  },
  {
    id: 'underwear-stuff', topic: 'discharge',
    q: 'Why is there stuff in my underwear?',
    keywords: 'stuff underwear white clear sticky discharge wet mucus yellow',
    happening: 'That’s discharge. It’s fluid that keeps your vagina clean and healthy.',
    usually: 'Clear or white discharge is normal. It often starts before your first period, and it can change during the month, from sticky to slippery.',
    tell: 'If it itches, smells bad, or turns green, gray or lumpy like cottage cheese.',
  },

  // ---- pain & body ----
  {
    id: 'cramps', topic: 'cramps',
    q: 'My cramps really hurt.',
    keywords: 'cramps hurt pain stomach belly tummy ache hurts',
    happening: 'Your uterus is a muscle. During your period it squeezes to help the lining come out, and that squeezing is what cramps are.',
    usually: 'Cramps are usually strongest on the first day or two. Warmth (a heating pad or warm bath), gentle movement, rest, and pain medicine like ibuprofen can help. Ask a parent, guardian or doctor which medicine is right for you.',
    watch: 'Log how much it hurts. Cadence can show you if it’s getting worse over time.',
    tell: 'If cramps keep you home from school or stop you doing normal things, or medicine doesn’t help. Painful periods can be treated. You don’t have to just put up with it.',
  },
  {
    id: 'poop', topic: 'period',
    q: 'Why do I poop more on my period?',
    keywords: 'poop diarrhea bathroom toilet stomach bowel loose',
    happening: 'The same chemicals that make your uterus squeeze can also make your intestines move faster.',
    usually: 'Looser poop or going more often around your period is really common and normal.',
    tell: 'If it’s very bad, you see blood in your poop, or it doesn’t get better after your period.',
  },
  {
    id: 'crying', topic: 'mood',
    q: 'Why am I crying so much?',
    keywords: 'crying cry sad mood emotional upset feelings angry moody',
    happening: 'Hormones change during your cycle, and they can affect how you feel. Many people feel more sensitive, sad or irritable in the days before their period.',
    usually: 'It’s common, and it usually gets better once your period starts. Sleep, moving your body, eating regularly and talking to someone can help.',
    watch: 'Log your feelings. You might notice they follow your cycle.',
    tell: 'If you feel sad most days, or so down that it’s hard to get through the day. If you ever think about hurting yourself, tell an adult right away, or call or text 988 (in the US) any time.',
  },
  {
    id: 'headache', topic: 'period',
    q: 'Why do I get headaches around my period?',
    keywords: 'headache head migraine',
    happening: 'Hormone changes around your period can bring on headaches for some people.',
    usually: 'Drinking water, getting enough sleep and not skipping meals can help.',
    tell: 'If headaches are very bad or come with changes in how you see.',
  },
  {
    id: 'acne', topic: 'skin',
    q: 'Why do I break out before my period?',
    keywords: 'acne pimples spots skin breakout zits',
    happening: 'Hormones before your period can make your skin oilier, which can lead to pimples.',
    usually: 'This is very common. Washing your face gently twice a day helps. Try not to pick.',
    tell: 'If your skin is painful or really bothering you. A doctor can help.',
  },

  // ---- before / first period ----
  {
    id: 'signs', topic: 'before',
    q: 'How do I know my first period is coming?',
    keywords: 'signs coming soon ready prepare expect first when',
    happening: 'There’s no exact countdown, but there are clues.',
    usually: 'Periods usually start about 2 to 3 years after breasts begin to grow. Many people notice discharge in their underwear about 6 to 12 months before. Keeping a pad in your bag means you’re ready either way.',
  },
  {
    id: 'what-age', topic: 'before',
    q: 'When will I get my first period?',
    keywords: 'age old young early late when first',
    happening: 'Everyone’s body has its own timing.',
    usually: 'Anywhere from about 9 to 15 is normal, and around 12 is common. Earlier or later doesn’t mean anything is wrong.',
    tell: 'If you’re 15 and haven’t had one, or it’s been 3 years since your breasts started growing.',
  },
  {
    id: 'will-hurt', topic: 'before',
    q: 'Will my period hurt?',
    keywords: 'hurt pain feel like first',
    happening: 'Some people get cramps, which feel like an ache low in your tummy or back. Some people barely feel anything.',
    usually: 'Many first periods don’t hurt much. If you do get cramps, there are lots of ways to help.',
  },
  {
    id: 'first-light', topic: 'period',
    q: 'My first period was really light. Is that okay?',
    keywords: 'light little first small amount few spots',
    happening: 'First periods are often light, and sometimes they’re just a few spots or a brownish stain.',
    usually: 'Totally normal. Periods usually settle into more of a pattern over the next couple of years.',
  },

  // ---- products ----
  {
    id: 'change-pad', topic: 'products',
    q: 'How often should I change my pad?',
    keywords: 'pad change often how long hours',
    happening: 'Pads soak up blood, so they need changing before they get too full.',
    usually: 'About every 4 to 8 hours, or sooner if it feels full or wet. You can wear a longer overnight pad while you sleep.',
  },
  {
    id: 'tampon', topic: 'products',
    q: 'How long can I leave a tampon in?',
    keywords: 'tampon how long hours tss toxic shock',
    happening: 'Tampons go inside and soak up blood there.',
    usually: 'Change it every 4 to 8 hours, and never leave one in longer than 8 hours. Use the lowest absorbency you need. This lowers the risk of a rare but serious illness called toxic shock syndrome.',
    tell: 'If you’re using a tampon and suddenly get a high fever, throw up, get a sunburn-like rash or feel faint, take it out and get medical help right away.',
  },
  {
    id: 'no-pad', topic: 'school',
    q: 'I got my period and I don’t have a pad.',
    keywords: 'no pad dont have forgot supplies nothing emergency friend house',
    happening: 'This happens to everyone at some point, and there’s always something you can do.',
    usually: 'Fold toilet paper into a thick strip and put it in your underwear for now. Then ask for a pad: at school, the nurse or front office almost always has them; at a friend’s house, ask your friend or their parent. Most adults have been there and are happy to help.',
  },
  {
    id: 'swim', topic: 'sports',
    q: 'Can I swim on my period?',
    keywords: 'swim swimming pool beach water',
    happening: 'Yes, you can.',
    usually: 'Pads don’t work in water, so people use a tampon, a menstrual cup or period swimwear. If you’d rather not swim, that’s okay too.',
  },
  {
    id: 'sports', topic: 'sports',
    q: 'Can I do sports and PE on my period?',
    keywords: 'sports pe gym exercise run practice game',
    happening: 'Yes. Your period doesn’t stop you from moving.',
    usually: 'Exercise can even help with cramps. Dark shorts and a pad with wings, or period underwear, can help you feel more secure. It’s okay to take it easier on a rough day.',
  },
  {
    id: 'others-tell', topic: 'school',
    q: 'Can people tell I’m on my period?',
    keywords: 'others tell know notice see smell',
    happening: 'No. Pads and tampons don’t show through clothes, and people can’t tell by looking at you.',
    usually: 'Changing regularly keeps you feeling fresh.',
  },
];

const words = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
const STOP = new Set(['the', 'and', 'why', 'what', 'how', 'can', 'does', 'this', 'that', 'there', 'have', 'got', 'with', 'for', 'normal', 'okay', 'just', 'really']);

/** Private, on-device search. Nothing she types leaves the phone. */
export function searchNormal(query) {
  const terms = words(query).filter((t) => !STOP.has(t));
  if (!terms.length) return NORMAL;
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
  const match = (w, t) => w === t || (t.length >= 5 && w.startsWith(t));
  return NORMAL
    .map((item) => {
      const title = words(item.q).map(stem), keys = words(item.keywords).map(stem);
      const body = words(`${item.happening} ${item.usually}`).map(stem);
      const score = terms.map(stem).reduce((s, t) => s
        + (title.some((w) => match(w, t)) ? 3 : 0)
        + (keys.some((w) => match(w, t)) ? 2 : 0)
        + (body.some((w) => w === t) ? 0.5 : 0), 0);
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
