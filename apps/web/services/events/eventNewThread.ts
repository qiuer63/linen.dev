import { ChannelType, mentions, users } from '@linen/database';
import { createTwoWaySyncJob } from 'queue/jobs';
import { resolvePush } from 'services/push';
import { eventNewMentions } from './eventNewMentions';
import { notificationListener } from 'services/notifications';
import ChannelsService from 'services/channels';

interface MentionNode {
  type: string;
  id: string;
  source: string;
}

type NewThreadEvent = {
  channelId: any;
  threadId: any;
  messageId: any;
  imitationId: string;
  mentions: (mentions & {
    users: users | null;
  })[];
  mentionNodes: MentionNode[];
  communityId: string;
  thread: string;
  userId?: string;
};

export async function eventNewThread({
  channelId,
  messageId,
  threadId,
  imitationId,
  mentions = [],
  mentionNodes = [],
  communityId,
  thread,
  userId,
}: NewThreadEvent) {
  const event = {
    channelId,
    messageId,
    threadId,
    imitationId,
    isThread: true,
    isReply: false,
    thread,
  };

  const channel = await ChannelsService.getChannelAndMembersWithAuth(channelId);

  const promises: Promise<any>[] = [
    createTwoWaySyncJob({ ...event, event: 'newThread', id: messageId }),
    eventNewMentions({ mentions, mentionNodes, channelId, threadId }),
    notificationListener({ ...event, communityId, mentions }),
    ...resolvePush({ channel, userId, event, communityId }),
  ];

  if (channel?.type === ChannelType.DM) {
    promises.push(ChannelsService.unarchiveChannel({ channelId: channel.id }));
  }

  await Promise.allSettled(promises);
}
