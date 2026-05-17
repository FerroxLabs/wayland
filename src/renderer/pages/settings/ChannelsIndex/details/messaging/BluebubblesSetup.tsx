import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const BluebubblesSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="bluebubbles" displayName="BlueBubbles" showDisconnect={false}>
      <EmptyState
        icon={MessageSquare}
        title={t("settings.channels.bluebubbles.comingSoonTitle")}
        body={t("settings.channels.bluebubbles.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default BluebubblesSetup;
