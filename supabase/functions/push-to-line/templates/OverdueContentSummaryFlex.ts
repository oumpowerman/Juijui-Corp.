import { getAppUrl } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { OverdueChannelGroup, OverdueItem } from './overdue-summary/types.ts';
import { cleanText } from './overdue-summary/constants.ts';
import { buildEmptyStateBubble } from './overdue-summary/EmptyStateBubble.ts';
import { buildOverviewBubble } from './overdue-summary/OverviewBubble.ts';
import { buildChannelDetailBubble } from './overdue-summary/ChannelDetailBubble.ts';
import { buildOverflowBubble } from './overdue-summary/OverflowBubble.ts';

export type { OverdueItem, OverdueChannelGroup };

/**
 * Builds the LINE Flex Message Payload for the Daily Morning Overdue Content Summary.
 * Structure:
 * - Bubble 1: Summary Overview Card (Total overdue, top overdue channels, quick summary)
 * - Bubbles 2-11: Detailed cards for the top 10 channels with most overdue clips
 * - Bubble 12: Remaining channels summary card (if > 10 channels)
 * Guarantee: Maximum 12 bubbles in carousel (LINE strict limit).
 */
export function buildOverdueContentSummaryPayload(
  targetDestination: string,
  record: ClaimedNotificationRecord
) {
  let meta: any = {};
  if (record.metadata) {
    try {
      meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (_) {
      meta = {};
    }
  }

  const baseAppUrl = getAppUrl();
  const dateStr = cleanText(meta.date_str, new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }));

  const rawChannels: OverdueChannelGroup[] = Array.isArray(meta.channels) ? meta.channels : [];
  
  // Sort channels by overdue count descending
  const sortedChannels = [...rawChannels].sort((a, b) => {
    const aLen = Array.isArray(a.items) ? a.items.length : 0;
    const bLen = Array.isArray(b.items) ? b.items.length : 0;
    return bLen - aLen;
  });

  const totalOverdueCount = Number(meta.total_overdue_count) || sortedChannels.reduce((sum, ch) => sum + (ch.items?.length || 0), 0);

  // If no channels or empty items, render clean empty notice bubble
  if (sortedChannels.length === 0 || totalOverdueCount === 0) {
    return {
      to: targetDestination,
      messages: [
        {
          type: "flex",
          altText: `[Kontent OS] รายงานประจำวัน: ไม่มีคลิปค้างลง (${dateStr})`,
          contents: buildEmptyStateBubble(dateStr, baseAppUrl)
        }
      ]
    };
  }

  const allBubbles: any[] = [];

  // Bubble 1: Summary Overview Card
  allBubbles.push(buildOverviewBubble(sortedChannels, totalOverdueCount, dateStr, baseAppUrl));

  // Bubbles 2-11: Top 10 Channel Details
  const maxChannelCards = 10;
  const topChannels = sortedChannels.slice(0, maxChannelCards);
  const remainingChannels = sortedChannels.slice(maxChannelCards);

  topChannels.forEach((ch) => {
    allBubbles.push(buildChannelDetailBubble(ch, dateStr, baseAppUrl));
  });

  // Bubble 12: Remaining Channels Overflow Card (if > 10 channels)
  if (remainingChannels.length > 0) {
    allBubbles.push(buildOverflowBubble(remainingChannels, dateStr, baseAppUrl));
  }

  // Ensure strict limit of max 12 bubbles for LINE Carousel
  const finalBubbles = allBubbles.slice(0, 12);

  const contentsPayload = finalBubbles.length === 1
    ? finalBubbles[0]
    : {
        type: "carousel",
        contents: finalBubbles
      };

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: `⚠️ สรุปคลิปค้างลง ${totalOverdueCount} รายการ (${dateStr})`,
        contents: contentsPayload
      }
    ]
  };
}
