import React from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const LineSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="line" displayName="LINE" showDisconnect={false}>
      <EmptyState
        icon={MessageCircle}
        title={t("settings.channels.line.comingSoonTitle")}
        body={t("settings.channels.line.comingSoonBody", { phase: t("settings.channelsIndex.phase3Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default LineSetup;
