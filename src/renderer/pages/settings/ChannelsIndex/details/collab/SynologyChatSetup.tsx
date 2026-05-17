import React from "react";
import { useTranslation } from "react-i18next";
import { HardDrive } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const SynologyChatSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="synology-chat" displayName="Synology Chat" showDisconnect={false}>
      <EmptyState
        icon={HardDrive}
        title={t("settings.channels.synologyChat.comingSoonTitle")}
        body={t("settings.channels.synologyChat.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default SynologyChatSetup;
