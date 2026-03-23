"use client";

import { useState } from "react";
import { Tabs, Tab, TabList, TabListContainer } from "@heroui/react";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { NewsFeedView } from "@/components/news/news-feed-view";
import { NewsFilterLogic } from "@/components/news/news-filter-logic";

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar title="News Generator">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
        >
          <TabListContainer>
            <TabList>
              <Tab id="feed">News Feed</Tab>
              <Tab id="logic">Filter Logic</Tab>
            </TabList>
          </TabListContainer>
        </Tabs>
      </TopAppBar>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "feed" ? <NewsFeedView /> : <NewsFilterLogic />}
      </div>
    </div>
  );
}
