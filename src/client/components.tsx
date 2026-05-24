import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

type TextProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
};

export function Eyebrow({ children, className = "", ...props }: TextProps) {
  return (
    <span className={joinClassNames("eyebrow", className)} {...props}>
      {children}
    </span>
  );
}

export function Num({
  children,
  className = "",
  size = "m",
  value,
  ...props
}: TextProps & { size?: "s" | "m" | "l"; value?: ReactNode }) {
  return (
    <span className={joinClassNames("num", `num-${size}`, className)} {...props}>
      {value ?? children}
    </span>
  );
}

export function Code({ children, className = "", ...props }: TextProps) {
  return (
    <span className={joinClassNames("code", className)} {...props}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  eyebrow,
  title,
  titleId,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
  titleId?: string;
}) {
  return (
    <section className={joinClassNames("card", className)} {...props}>
      {eyebrow || title ? (
        <div className="card-header">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {title ? <h2 id={titleId}>{title}</h2> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DisclaimerPanel() {
  const statements = [
    "Daily reference rates, not real-time quotes.",
    "Historical reference only — not a forecast.",
    "Not investment advice.",
    "No deposits, withdrawals, or trades.",
    "No trades are executed.",
  ];

  return (
    <section
      aria-label="Reference and safety notes"
      className="disclaimer-panel"
    >
      <Eyebrow>Reference &amp; safety</Eyebrow>
      <h2>What this product is, and isn't.</h2>
      <ul>
        {statements.map((statement) => (
          <li key={statement}>{statement}</li>
        ))}
      </ul>
    </section>
  );
}

export function RateCard({
  code,
  label,
  onClick,
  selected = false,
  value,
}: {
  code: string;
  label: string;
  onClick?: () => void;
  selected?: boolean;
  value: string;
}) {
  return (
    <button
      className="rate-card"
      data-active={selected ? "true" : undefined}
      onClick={onClick}
      type="button"
    >
      <Code>{code}</Code>
      <Num size="l" value={value} />
      <small>{label}</small>
    </button>
  );
}

export function Tab({
  active = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={joinClassNames("tab", className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function Slider({
  ariaLabel,
  className = "",
  max = 100,
  min = 0,
  readOnly,
  value,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ariaLabel: string;
  value: number;
}) {
  const numericMin = Number(min);
  const numericMax = Number(max);
  const numericValue = Number(value);
  const isReadOnly =
    Boolean(readOnly) ||
    (props.onChange === undefined && props.onInput === undefined);
  const filled =
    ((numericValue - numericMin) / Math.max(numericMax - numericMin, 1)) * 100;

  return (
    <input
      aria-label={ariaLabel}
      className={joinClassNames("slider", className)}
      max={max}
      min={min}
      readOnly={isReadOnly}
      style={{ backgroundSize: `${filled}% 100%` }}
      type="range"
      value={value}
      {...props}
    />
  );
}

function joinClassNames(...classNames: (string | undefined)[]) {
  return classNames.filter(Boolean).join(" ");
}
