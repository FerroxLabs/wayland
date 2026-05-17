import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const SignalSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="signal" displayName="Signal" showDisconnect={false}>
      <EmptyState
        icon={ShieldCheck}
        title={t("settings.channels.signal.comingSoonTitle")}
        body={t("settings.channels.signal.comingSoonBody", { phase: t("settings.channelsIndex.phase3Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default SignalSetup;
