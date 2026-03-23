"use client";

import { useState } from "react";
import { Tabs, Tab, TabList, TabListContainer } from "@heroui/react";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { TwitterDraftsView } from "@/components/twitter/twitter-drafts-view";
import { EditorLogicView } from "@/components/twitter/editor-logic-view";

export default function TwitterPage() {
  const [activeTab, setActiveTab] = useState("drafts");

  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar title="Twitter Post Creator">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
        >
          <TabListContainer>
            <TabList>
              <Tab id="drafts">Draft Proposals</Tab>
              <Tab id="logic">Editor Logic</Tab>
            </TabList>
          </TabListContainer>
        </Tabs>
      </TopAppBar>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "drafts" ? <TwitterDraftsView /> : <EditorLogicView />}
      </div>
    </div>
  );
}
