'use client';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileDataCard from './MobileDataCard';

export default function MobileTableView({
  data = [],
  columns = [],
  renderDesktopTable,
  mapRowToCard,
  darkMode = true,
  emptyMessage = 'No data available',
  onRowClick,
}: any) {
  const { isMobile } = useIsMobile();

  if (!isMobile) {
    return renderDesktopTable ? renderDesktopTable() : null;
  }

  if (data.length === 0) {
    return (
      <div className={`py-12 text-center text-sm ${darkMode ? 'text-content-muted' : 'text-gray-500'}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row: any, index: any) => {
        const cardProps = mapRowToCard(row, index);
        return (
          <MobileDataCard
            key={cardProps.key || index}
            darkMode={darkMode}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            {...cardProps}
          />
        );
      })}
    </div>
  );
}
