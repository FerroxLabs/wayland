import React from "react";
import { useTranslation } from "react-i18next";
import { Cloud } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const NextcloudTalkSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="nextcloud-talk" displayName="Nextcloud Talk" showDisconnect={false}>
      <EmptyState
        icon={Cloud}
        title={t("settings.channels.nextcloudTalk.comingSoonTitle")}
        body={t("settings.channels.nextcloudTalk.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default NextcloudTalkSetup;
