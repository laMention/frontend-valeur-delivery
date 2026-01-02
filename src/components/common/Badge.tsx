import { tailwindClasses } from '../../utils/tailwindClasses';
import type { OrderStatus } from '../../models/Order';

interface BadgeProps {
  status: OrderStatus | string;
  children?: React.ReactNode;
}

export default function Badge({ status, children }: BadgeProps) {
  const statusClass = tailwindClasses.badge.status[status as OrderStatus] || tailwindClasses.badge.status.pending;
  const displayText = children || status;

  return (
    <span className={statusClass}>
      {displayText}
    </span>
  );
}

