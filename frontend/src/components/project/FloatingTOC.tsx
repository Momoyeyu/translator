import './FloatingTOC.less';

interface TOCSection {
  id: string;
  label: string;
  visible: boolean;
}

interface Props {
  sections: TOCSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export default function FloatingTOC({ sections, activeSection, onNavigate }: Props) {
  const visibleSections = sections.filter((s) => s.visible);

  if (visibleSections.length === 0) return null;

  return (
    <nav className="floating-toc">
      <div className="floating-toc__panel">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            className={`floating-toc__item${activeSection === section.id ? ' floating-toc__item--active' : ''}`}
            onClick={() => onNavigate(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="floating-toc__bar" />
    </nav>
  );
}
