import React from "react";
import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const ViberSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="viber" displayName="Viber" showDisconnect={false}>
      <EmptyState
        icon={Phone}
        title={t("settings.channels.viber.comingSoonTitle")}
        body={t("settings.channels.viber.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default ViberSetup;
