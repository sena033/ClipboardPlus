import { t } from '../i18n';
import type { GroupKey } from '../types';

interface Props {
  selected: GroupKey;
  counts: Record<string, number>;
  enabledGroups: GroupKey[];
  groupLabels: Record<string, string>;
  onSelect: (group: GroupKey) => void;
}

export default function Sidebar({ selected, counts, enabledGroups, groupLabels, onSelect }: Props) {
  return (
    <div className="sidebar">
      {enabledGroups.map(g => {
        const label = groupLabels[g] || t(`group.${g}`);
        return (
          <div
            key={g}
            className={`sidebar-item${selected === g ? ' active' : ''}`}
            onClick={() => onSelect(g)}
          >
            <span className="sidebar-label">{label}</span>
            <span className="sidebar-count">{counts[g] ?? 0}</span>
          </div>
        );
      })}
    </div>
  );
}