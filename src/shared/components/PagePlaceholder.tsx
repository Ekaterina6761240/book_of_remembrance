import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './PagePlaceholder.module.css';

type PlaceholderLink = {
  to: string;
  label: string;
};

type PagePlaceholderProps = {
  area: 'screen' | 'staff';
  title: string;
  description?: string;
  links?: PlaceholderLink[];
  children?: ReactNode;
};

export function PagePlaceholder({ area, title, description, links = [], children }: PagePlaceholderProps) {
  return (
    <main className={styles.page}>
      <p className={styles.label}>{area}</p>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {children && <div className={styles.status}>{children}</div>}
      {links.length > 0 && (
        <nav className={styles.links} aria-label="Переходы раздела">
          {links.map((link) => <Link className={styles.link} key={link.to} to={link.to}>{link.label}</Link>)}
        </nav>
      )}
    </main>
  );
}
