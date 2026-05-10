export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type TimeRangeKey = 'morning' | 'daytime' | 'evening' | 'night' | 'lateNight';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type CalendarReactionRule = {
  ruleId: string;
  name: string;
  seasons?: Season[];
  timeRanges?: TimeRangeKey[];
  dates?: string[];
  weekdays?: Weekday[];
  events?: string[];
  lines?: string[];
  motionCandidates?: string[];
  costumeCandidates?: string[];
  voicePreset?: string;
};
