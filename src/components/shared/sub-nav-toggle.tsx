"use client";

import { Tabs, Tab, TabList, TabListContainer } from "@heroui/react";

interface SubNavToggleProps {
  tabs: { label: string; value: string }[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function SubNavToggle({
  tabs,
  activeTab,
  onTabChange,
}: SubNavToggleProps) {
  return (
    <Tabs
      selectedKey={activeTab}
      onSelectionChange={(key) => onTabChange(String(key))}
    >
      <TabListContainer>
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.value} id={tab.value}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </TabListContainer>
    </Tabs>
  );
}
