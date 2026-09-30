// Birthday (month + year only) and grade. Both optional, both stay on this device.
// They're used for one thing: talking to her the right way for where she is.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const GRADES = [
  ['3', '3rd grade'], ['4', '4th grade'], ['5', '5th grade'], ['6', '6th grade'], ['7', '7th grade'],
  ['8', '8th grade'], ['9', '9th grade'], ['10', '10th grade'], ['11', '11th grade'], ['12', '12th grade'],
  ['college', 'College'], ['done', 'Done with school'], ['none', 'Not in school'],
];

/** Age in whole years from { year, month } (month 1–12), treating the birthday as the 1st. */
export function ageFrom(birth, today) {
  if (!birth?.year || !birth?.month) return null;
  const [y, m] = today.split('-').map(Number);
  return y - birth.year - (m < birth.month ? 1 : 0);
}

// School years roll over on August 1.
const schoolYear = (iso) => {
  const [y, m] = iso.split('-').map(Number);
  return m >= 8 ? y : y - 1;
};

/** Grade moves up by itself every school year. 12th grade becomes college, then "done". */
export function currentGrade(grade, today) {
  if (!grade?.value) return null;
  const n = Number(grade.value);
  if (Number.isNaN(n)) return grade.value;
  const next = n + Math.max(0, schoolYear(today) - schoolYear(grade.setOn));
  return next <= 12 ? String(next) : next <= 16 ? 'college' : 'done';
}

export const gradeLabel = (g) => GRADES.find(([k]) => k === g)?.[1] ?? null;

/** What the "School" tab is called, for where she is in life. */
export function placeFor(grade) {
  if (grade === 'college') return { tab: 'Campus', title: 'Campus', blurb: 'Be ready for class, practice, the library and everything in between.' };
  if (grade === 'done' || grade === 'none') return { tab: 'On the go', title: 'On the go', blurb: 'Be ready at work, on trips and everywhere else, and know what to do if something happens.' };
  return { tab: 'School', title: 'School', blurb: 'Be ready, and know exactly what to do if something happens.' };
}

/** Starting voice from age. She can change it anytime. */
export function voiceForAge(age, stage) {
  if (age == null) return stage === 'notYet' || stage === 'new' ? 'simple' : 'standard';
  if (age <= 10) return 'simple';
  if (age >= 16) return 'grown';
  return 'standard';
}

/** Gentle, standard pediatric check-ins that depend on age (ACOG / AAP guidance). */
export function ageCheckIns({ age, stage, periodsCount }) {
  const notes = [];
  if (age == null) return notes;
  if (stage === 'notYet' && periodsCount === 0 && age >= 15) {
    notes.push('Most people get their first period by 15. It’s a good idea to check in with a doctor, just to make sure everything is on track.');
  }
  if (periodsCount > 0 && age < 9) {
    notes.push('Periods before age 9 are less common. It’s a good idea to mention it to a doctor.');
  }
  return notes;
}
