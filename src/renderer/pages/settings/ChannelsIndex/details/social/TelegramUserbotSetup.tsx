import React from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import EmptyState from "@renderer/components/settings/shared/feedback/EmptyState";
import ChannelDetailLayout from "../../ChannelDetailLayout";

// Placeholder. Real implementation lands in a future phase.
const TelegramUserbotSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId="telegram-userbot" displayName="Telegram (Userbot)" showDisconnect={false}>
      <EmptyState
        icon={User}
        title={t("settings.channels.telegramUserbot.comingSoonTitle")}
        body={t("settings.channels.telegramUserbot.comingSoonBody", { phase: t("settings.channelsIndex.phase5Label") })}
      />
    </ChannelDetailLayout>
  );
};

export default TelegramUserbotSetup;
