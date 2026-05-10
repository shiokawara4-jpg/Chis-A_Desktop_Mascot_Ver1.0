export type SpeechBubbleActionType = 'changeCostume' | 'changePose' | 'openSettings' | 'dummyTalk';

export type SpeechBubbleAction = {
  actionId: string;
  label: string;
  type: SpeechBubbleActionType;
};

export type SpeechBubbleContent = {
  message: string;
  suggestedReplies: string[];
  actions?: SpeechBubbleAction[];
};
