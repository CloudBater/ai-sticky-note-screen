function SkeletonLine({ width = '100%', height = '12px' }: { width?: string; height?: string }) {
  return <div className="skeleton-line" style={{ width, height }} />
}

export function SkeletonCard() {
  return (
    <div className="profile-card skeleton-card" aria-busy="true" aria-label="Loading profile…">
      {/* avatar + name/login */}
      <div className="skeleton-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-header-info">
          <SkeletonLine width="55%" height="16px" />
          <SkeletonLine width="35%" height="12px" />
        </div>
      </div>

      {/* stat lines */}
      <div className="skeleton-section">
        <SkeletonLine width="60%" />
        <SkeletonLine width="45%" />
        <SkeletonLine width="52%" />
      </div>

      {/* score block */}
      <div className="skeleton-section">
        <SkeletonLine width="100%" height="80px" />
      </div>

      {/* repo lines */}
      <div className="skeleton-section">
        <SkeletonLine width="70%" />
        <SkeletonLine width="65%" />
      </div>
    </div>
  )
}
