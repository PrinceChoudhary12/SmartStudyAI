import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  label: string;
};

export function IconButton({ children, label, ...props }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className="icon-button" {...props}>
      {children}
    </button>
  );
}
