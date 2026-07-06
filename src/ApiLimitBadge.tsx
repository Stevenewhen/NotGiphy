interface ApiLimitBadgeProps {
  used: number;
  limit: number;
}

export default function ApiLimitBadge({ used, limit }: ApiLimitBadgeProps) {
  const ratio = used / limit;
  const level = ratio >= 1 ? 'over' : ratio >= 0.85 ? 'warn' : 'ok';

  return (
    <div
      className={`api-limit-badge api-limit-badge--${level}`}
      title="Estimated Giphy API calls made from this browser in the last hour"
    >
      {used}/{limit} this hour
    </div>
  );
}
