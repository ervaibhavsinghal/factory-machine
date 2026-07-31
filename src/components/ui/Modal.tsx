"use client";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 520,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal dialog-enter"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && <h3>{title}</h3>}
        {subtitle && <div className="m-sub">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}
