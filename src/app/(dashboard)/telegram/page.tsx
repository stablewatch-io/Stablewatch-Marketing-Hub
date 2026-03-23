"use client";

import { useState } from "react";
import { Tabs, Tab, TabList, TabListContainer } from "@heroui/react";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { FormatterView } from "@/components/telegram/formatter-view";
import { FormatLogicView } from "@/components/telegram/format-logic-view";

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState("formatter");

  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar title="Telegram Formatter">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
        >
          <TabListContainer>
            <TabList>
              <Tab id="formatter">Formatter</Tab>
              <Tab id="logic">Formatting Logic</Tab>
            </TabList>
          </TabListContainer>
        </Tabs>
      </TopAppBar>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "formatter" ? <FormatterView /> : <FormatLogicView />}
      </div>
    </div>
  );
}
