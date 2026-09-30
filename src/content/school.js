// School Mode: practical help for real moments. Short steps, not articles.

export const DEFAULT_POUCH = [
  'Pads (2 or 3)',
  'Tampons, if you use them',
  'Spare underwear',
  'Small bag to carry things home',
  'Wipes',
  'Pain medicine, if a grown-up says it’s okay',
  'Heat patch',
];

export const EMERGENCIES = [
  {
    id: 'started',
    title: 'I think I just got my period',
    steps: [
      'Go to the bathroom. It’s okay to say “Can I go? It’s urgent.”',
      'No pad? Fold toilet paper into a thick strip and put it in your underwear for now.',
      'Go to the nurse or the front office and say “I got my period, do you have a pad?” They have them, and they help with this all the time.',
      'Tap “I got my period” in Cadence when you get a moment.',
    ],
    note: 'If it’s your first period: this is normal, and you handled it.',
  },
  {
    id: 'bled',
    title: 'I bled through my clothes',
    steps: [
      'Tie a sweater, hoodie or jacket around your waist.',
      'Go to the bathroom or the nurse. The nurse often has spare clothes.',
      'Ask a friend or a teacher you trust to help, or call home if you want to change.',
      'Later, rinse the stain in cold water (hot water sets it).',
    ],
    note: 'This happens to almost everyone at some point. It is not a big deal, even if it feels like one right now.',
  },
  {
    id: 'nopad',
    title: 'I don’t have a pad',
    steps: [
      'Fold toilet paper into a thick strip for now.',
      'Ask the nurse or front office. Many school bathrooms have free pads too.',
      'Ask a friend. Lots of people carry spares and are happy to share.',
      'Add pads to your pouch checklist for next time.',
    ],
  },
  {
    id: 'cramps',
    title: 'My cramps really hurt',
    steps: [
      'Ask to see the nurse. You can say “I have bad cramps.”',
      'Warmth helps: a heat patch, or pressing your hands on your tummy.',
      'Sipping water and gently walking or stretching can help.',
      'If you have pain medicine a grown-up said is okay, the nurse can help you take it.',
    ],
    tell: 'If cramps often send you home or stop you from doing things, tell a parent, guardian or doctor. Painful periods can be treated.',
  },
  {
    id: 'pe',
    title: 'I have PE or swimming today',
    steps: [
      'You can still do PE. Moving can even help cramps.',
      'A pad with wings, period underwear, or dark shorts can help you feel secure.',
      'For swimming, pads don’t work in water. People use a tampon, a cup, or period swimwear.',
      'If you’d rather sit out, you can quietly tell the teacher “I’m on my period.” Many teachers understand.',
    ],
  },
];

export const GUIDES = [
  { id: 'uniform', title: 'Uniforms and skirts', body: 'Shorts or leggings under a skirt add protection. Dark colors on heavier days can help you relax. A spare pair of underwear in your bag saves the day.' },
  { id: 'teacher', title: 'Asking a teacher', body: 'You never have to explain. “Can I go to the bathroom? It’s urgent” or “Can I see the nurse?” is enough. If you want, tell one teacher you trust privately once, so they understand next time.' },
  { id: 'nurse', title: 'The school nurse', body: 'The nurse can give you pads, help with cramps, let you rest, and call home if you need to. Helping with periods is a normal part of their job.' },
  { id: 'trips', title: 'Field trips, sleepovers and camp', body: 'Pack more supplies than you think you need, plus a small bag for used products. At a sleepover, an overnight pad and dark pajamas help. At camp, you can tell a counselor privately. They can help.' },
  { id: 'sports', title: 'Sports and practice', body: 'Your period doesn’t have to stop you. Period underwear or a pad with wings stays put. Cramps often feel better once you’re moving. Pack a spare in your sports bag.' },
  { id: 'travel', title: 'Travel and long days', body: 'Bring supplies in your carry-on or backpack, not just your suitcase. Use Cadence’s “My life” plans to see if a trip might overlap your period.' },
];
