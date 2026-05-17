import React from "react";
import { useTranslation } from "react-i18next";
import { AtSign } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const MastodonSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="mastodon" displayName="Mastodon" showDisconnect={false}>
      <EmptyState
        icon={AtSign}
        title={t("settings.channels.mastodon.comingSoonTitle")}
        body={t("settings.channels.mastodon.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default MastodonSetup;
