import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const XDmsStubSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="x-dms" displayName="X (Twitter) DMs" showDisconnect={false}>
      <EmptyState
        icon={AlertCircle}
        title={t("settings.channels.xDms.comingSoonTitle")}
        body={t("settings.channels.xDms.premiumGate")}
      />
    </ChannelDetailLayout>
  );
};

export default XDmsStubSetup;
