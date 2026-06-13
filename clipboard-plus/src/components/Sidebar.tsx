import { t } from '../i18n';
import type { GroupKey } from '../types';

interface Props {
  selected: GroupKey;
  counts: Record<string, number>;
  onSelect: (group: GroupKey) => void;
}

const GROUPS: GroupKey[] = ['all', 'favorites', 'today', 'yesterday', 'week', 'month', 'older'];

export default function Sidebar({ selected, counts, onSelect }: Props) {
  return (
    <div className="sidebar">
      {GROUPS.map(g => (
        <div
          key={g}
          className={`sidebar-item${selected === g ? ' active' : ''}`}
          onClick={() => onSelect(g)}
        >
          <span className="sidebar-label">{t(`group.${g}`)}</span>
          <span className="sidebar-count">{counts[g] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
