import React from "react";
import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const XiaomiSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="xiaomi" displayName="Xiaomi" showDisconnect={false}>
      <EmptyState
        icon={Smartphone}
        title={t("settings.channels.xiaomi.comingSoonTitle")}
        body={t("settings.channels.xiaomi.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default XiaomiSetup;
