import React from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const EmailImapSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="email-imap" displayName="Email (IMAP / SMTP)" showDisconnect={false}>
      <EmptyState
        icon={Mail}
        title={t("settings.channels.emailImap.comingSoonTitle")}
        body={t("settings.channels.emailImap.comingSoonBody", { phase: t("settings.channelsIndex.phase2Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default EmailImapSetup;
