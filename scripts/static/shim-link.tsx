import type { AnchorHTMLAttributes, ReactNode } from 'react';

export default function Link({ href, children, prefetch: _p, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean }) {
  return <a href={href} {...rest}>{children}</a>;
}
