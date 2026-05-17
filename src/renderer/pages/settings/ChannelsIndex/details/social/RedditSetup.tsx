import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const RedditSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="reddit" displayName="Reddit" showDisconnect={false}>
      <EmptyState
        icon={MessageSquare}
        title={t("settings.channels.reddit.comingSoonTitle")}
        body={t("settings.channels.reddit.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default RedditSetup;
