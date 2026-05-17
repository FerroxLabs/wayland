import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const ZaloSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="zalo" displayName="Zalo" showDisconnect={false}>
      <EmptyState
        icon={MessageSquare}
        title={t("settings.channels.zalo.comingSoonTitle")}
        body={t("settings.channels.zalo.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default ZaloSetup;
