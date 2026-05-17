import React from "react";
import { useTranslation } from "react-i18next";
import { Grid3X3 } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const MatrixSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="matrix" displayName="Matrix" showDisconnect={false}>
      <EmptyState
        icon={Grid3X3}
        title={t("settings.channels.matrix.comingSoonTitle")}
        body={t("settings.channels.matrix.comingSoonBody", { phase: t("settings.channelsIndex.phase3Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default MatrixSetup;
