import type { ComponentProps } from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'text';
type ButtonSize = 'default' | 'small' | 'large';

type Shared = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

const classes = ({ variant = 'secondary', size = 'default', block }: Shared, extra?: string) =>
  [styles.button, styles[variant], size !== 'default' && styles[size], block && styles.block, extra].filter(Boolean).join(' ');

export function Button({
  variant,
  size,
  block,
  pending,
  disabled,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & Shared & { pending?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={classes({ variant, size, block }, className)}
    />
  );
}

export function LinkButton({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & Shared) {
  return <Link {...props} className={classes({ variant, size, block }, className)} />;
}
