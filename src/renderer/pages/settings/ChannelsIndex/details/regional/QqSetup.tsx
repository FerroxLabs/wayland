import React from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const QqSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="qq" displayName="QQ" showDisconnect={false}>
      <EmptyState
        icon={MessageCircle}
        title={t("settings.channels.qq.comingSoonTitle")}
        body={t("settings.channels.qq.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default QqSetup;
