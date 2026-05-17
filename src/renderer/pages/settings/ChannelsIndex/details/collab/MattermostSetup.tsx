import React from "react";
import { useTranslation } from "react-i18next";
import { Hash } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const MattermostSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="mattermost" displayName="Mattermost" showDisconnect={false}>
      <EmptyState
        icon={Hash}
        title={t("settings.channels.mattermost.comingSoonTitle")}
        body={t("settings.channels.mattermost.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default MattermostSetup;
