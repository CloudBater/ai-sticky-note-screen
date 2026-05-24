type LoadingScreenProps = {
  variant: "loading" | "error";
};

export function LoadingScreen({ variant }: LoadingScreenProps) {
  const isError = variant === "error";

  return (
    <div
      aria-label={isError ? "Failed to load rates" : "Loading daily reference rates"}
      aria-live={isError ? undefined : "polite"}
      className="loading-screen"
      data-loading-screen={variant}
      role={isError ? "alert" : "status"}
    >
      <div className="loading-card">
        {/* Animated ring + icon */}
        <div
          aria-hidden="true"
          className={`loading-ring-wrap${isError ? " loading-ring-wrap--error" : ""}`}
          data-loading-animation
        >
          <span className="loading-ring" />
          <span className="loading-ring loading-ring--inner" />
          <span className="loading-ring-icon" aria-hidden="true">
            {isError ? (
              /* Two overlapping diagonal bars — "broken exchange" */
              <>
                <span className="loading-err-bar loading-err-bar--left" />
                <span className="loading-err-bar loading-err-bar--right" />
              </>
            ) : (
              /* Exchange arrows ⇄ made with CSS borders */
              <>
                <span className="loading-arrow loading-arrow--top" />
                <span className="loading-arrow loading-arrow--bottom" />
              </>
            )}
          </span>
        </div>

        {/* Text */}
        {isError ? (
          <>
            <p className="loading-headline loading-headline--error">
              Unable to load reference rates
            </p>
            <p className="loading-subtext">
              Check your connection and try refreshing the page.
            </p>
          </>
        ) : (
          <>
            <p className="loading-headline">
              Loading daily reference rates
            </p>
            <p className="loading-subtext">
              Fetching ECB reference data&hellip;
            </p>
          </>
        )}
      </div>
    </div>
  );
}
