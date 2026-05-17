import React from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const MsTeamsSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="ms-teams" displayName="Microsoft Teams" showDisconnect={false}>
      <EmptyState
        icon={Users}
        title={t("settings.channels.msTeams.comingSoonTitle")}
        body={t("settings.channels.msTeams.comingSoonBody", { phase: t("settings.channelsIndex.phase3Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default MsTeamsSetup;
