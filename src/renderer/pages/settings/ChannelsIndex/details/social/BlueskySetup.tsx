import React from "react";
import { useTranslation } from "react-i18next";
import { Cloud } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const BlueskySetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="bluesky" displayName="Bluesky" showDisconnect={false}>
      <EmptyState
        icon={Cloud}
        title={t("settings.channels.bluesky.comingSoonTitle")}
        body={t("settings.channels.bluesky.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default BlueskySetup;
