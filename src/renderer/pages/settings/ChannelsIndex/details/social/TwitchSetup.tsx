import React from "react";
import { useTranslation } from "react-i18next";
import { Tv } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const TwitchSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="twitch" displayName="Twitch" showDisconnect={false}>
      <EmptyState
        icon={Tv}
        title={t("settings.channels.twitch.comingSoonTitle")}
        body={t("settings.channels.twitch.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default TwitchSetup;
