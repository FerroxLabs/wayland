import React from "react";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const NostrSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="nostr" displayName="Nostr" showDisconnect={false}>
      <EmptyState
        icon={Zap}
        title={t("settings.channels.nostr.comingSoonTitle")}
        body={t("settings.channels.nostr.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default NostrSetup;
