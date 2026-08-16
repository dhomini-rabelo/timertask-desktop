export type IndexReportsTab = "today" | "week";

interface IndexReportsTabsProps {
  activeTab: IndexReportsTab;
  onChange: (tab: IndexReportsTab) => void;
}

const TABS: { key: IndexReportsTab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
];

export function IndexReportsTabs({
  activeTab,
  onChange,
}: IndexReportsTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-Black-100/50 dark:bg-Black-700 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={
            tab.key === activeTab
              ? "px-3 py-1.5 rounded-lg text-sm font-medium bg-White text-Black-700 dark:bg-Black-600 dark:text-White"
              : "px-3 py-1.5 rounded-lg text-sm font-medium text-Black-400 transition-colors hover:text-Black-500 dark:text-Black-400 dark:hover:text-White"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
