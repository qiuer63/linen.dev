import { hideEmptyChannels } from 'services/channels';
import { fetchToken } from './sync/fetchToken';
import { syncChannels } from './sync/syncChannels';
import { syncUsers } from './sync/syncUsers';
import { fetchAllTopLevelMessages } from './sync/fetchAllTopLevelMessages';
import { saveAllThreads } from './sync/saveAllThreads';
import { syncMemberships } from './sync/membership';
import { SyncWrapperTypes } from './types';

export async function syncWrapper({
  account,
  domain,
  accountId,
  channelId,
  skipUsers,
  fullSync,
  fetchTeamInfo,
  joinChannel,
  getSlackChannels,
  listUsers,
  fetchConversationsTyped,
  fetchReplies,
  getMemberships,
}: SyncWrapperTypes) {
  const { token, syncFrom, shouldJoinChannel } = await fetchToken({
    account,
    domain,
    accountId,
    fetchTeamInfo,
  });
  console.log({ token, syncFrom, shouldJoinChannel });
  const oldest = syncFrom
    ? Math.floor(syncFrom.getTime() / 1000).toString()
    : '0';

  // create and join channels
  const channels = await syncChannels({
    account,
    token,
    accountId,
    channelId,
    joinChannel,
    getSlackChannels,
    shouldJoinChannel,
  });

  //paginate and find all the users
  const usersInDb = await syncUsers({
    accountId,
    token,
    account,
    skipUsers,
    listUsers,
  });

  for (const channel of channels) {
    if (!channel.externalChannelId) {
      continue;
    }

    await syncMemberships({
      accountId,
      channelId: channel.id,
      externalChannelId: channel.externalChannelId,
      token,
      getMemberships,
    });
    //fetch and save all top level conversations
    await fetchAllTopLevelMessages({
      channel,
      account,
      usersInDb,
      token,
      fullSync,
      fetchConversationsTyped,
      oldest,
    });

    // Save all threads
    // only fetch threads with single message
    // There will be edge cases where not all the threads are sync'd if you cancel the script
    await saveAllThreads({ channel, token, usersInDb, fetchReplies });
  }

  await hideEmptyChannels(accountId);
}
