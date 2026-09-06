import { useState, type PropsWithChildren } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './HeroEditor.module.css';

type HeroEditorSectionProps = PropsWithChildren<{
  title: string;
  defaultOpen?: boolean;
}>;

export function HeroEditorSection({ title, defaultOpen = true, children }: HeroEditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section className={styles.sectionCard}>
      <button className={styles.sectionHeader} type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}>
        <span>{title}</span>{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </section>
  );
}
