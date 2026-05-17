import React from "react";
import { useTranslation } from "react-i18next";
import { Apple } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const IMessageSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="imessage" displayName="iMessage" showDisconnect={false}>
      <EmptyState
        icon={Apple}
        title={t("settings.channels.imessage.comingSoonTitle")}
        body={t("settings.channels.imessage.comingSoonBody", { phase: t("settings.channelsIndex.phase3Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default IMessageSetup;
