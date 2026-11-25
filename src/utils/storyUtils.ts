import { Lang, StoryHighlight, StoryItem } from '../types/siteConfig';

export function isStoryExpired(story: StoryItem, nowMs = Date.now()): boolean {
  if (!story.expiresAt) return false;
  const expMs = new Date(story.expiresAt).getTime();
  if (Number.isNaN(expMs)) return false;
  return expMs <= nowMs;
}

export function formatStoryExpiryRemaining(
  story: StoryItem,
  lang: Lang,
  nowMs = Date.now()
): string | null {
  if (!story.expiresAt) return null;
  const expMs = new Date(story.expiresAt).getTime();
  if (Number.isNaN(expMs)) return null;
  const diffMs = expMs - nowMs;
  if (diffMs <= 0) {
    return lang === 'ar' ? 'منتهية الصلاحية' : 'Expired';
  }
  const totalMins = Math.ceil(diffMs / 60000);
  if (totalMins < 60) {
    return lang === 'ar' ? `متبقي ${totalMins} د` : `${totalMins}m left`;
  }
  const hours = Math.floor(totalMins / 60);
  return lang === 'ar' ? `متبقي ${hours} س` : `${hours}h left`;
}

export function resolveHighlightStories(
  highlight: StoryHighlight,
  allStories: StoryItem[]
): StoryItem[] {
  const map = new Map(allStories.map((s) => [s.id, s]));
  return highlight.storyIds
    .map((id) => map.get(id))
    .filter((s): s is StoryItem => Boolean(s));
}
