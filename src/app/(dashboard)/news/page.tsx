"use client";

import { useState } from "react";
import { Tabs, Tab, TabList, TabListContainer } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { NewsFeedView } from "@/components/news/news-feed-view";
import { NewsFilterLogic } from "@/components/news/news-filter-logic";
import { ArrowLeft } from "lucide-react";

export default function NewsPage() {
  const [showFilterLogic, setShowFilterLogic] = useState(false);
  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar title={showFilterLogic ? "News Filter Logic" : "News Generator"}>
        {!showFilterLogic && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => setShowFilterLogic(true)}
            className="flex items-center gap-2 text-(--sw-primary) border-(--sw-primary)"
          >
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            <span className="text-xs font-bold">Filter Logic</span>
          </Button>
        )}
      </TopAppBar>
      <div className="flex-1 overflow-y-auto">
        {showFilterLogic ? <NewsFilterLogic onBack={() => setShowFilterLogic(false)} /> : <NewsFeedView />}
      </div>
    </div>
  );
}
