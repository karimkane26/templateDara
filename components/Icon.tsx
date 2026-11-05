/*
 * Icônes au trait (24×24), dessinées en SVG, sans aucune librairie.
 *
 * Utilisation : <Icon name="search" />  ou  <Icon name="close" size={16} />
 */

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

/** Renvoie le dessin (les traits) de l'icône demandée. */
function dessinDeLIcone(nom: string) {
  switch (nom) {
    case "dashboard":
      return (
        <>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </>
      );
    case "users":
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case "wallet":
      return (
        <>
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </>
      );
    case "book":
      return (
        <>
          <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
        </>
      );
    case "calendarCheck":
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </>
      );
    case "teacher":
      return (
        <>
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </>
      );
    case "settings":
      return (
        <>
          <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
          <path d="M1 14h6M9 8h6M17 16h6" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </>
      );
    case "menu":
      return <path d="M4 6h16M4 12h16M4 18h16" />;
    case "close":
      return <path d="M18 6 6 18M6 6l12 12" />;
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </>
      );
    case "moon":
      return <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;
    case "plus":
      return <path d="M5 12h14M12 5v14" />;
    case "message":
      return <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />;
    case "chevronRight":
      return <path d="m9 18 6-6-6-6" />;
    case "chevronUp":
      return <path d="m18 15-6-6-6 6" />;
    case "bell":
      return (
        <>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
      );
    case "check":
      return <path d="M20 6 9 17l-5-5" />;
    case "camera":
      return (
        <>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
          <circle cx="12" cy="13" r="3.5" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      );
    case "logout":
      return (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </>
      );
    case "video":
      return (
        <>
          <path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11" />
          <rect x="2" y="6" width="14" height="12" rx="2" />
        </>
      );
    case "trash":
      return (
        <>
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case "home":
      return (
        <>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
        </>
      );
    case "edit":
      return (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      );
    case "family":
      return (
        <>
          <circle cx="8" cy="6" r="3" />
          <path d="M3 21v-3a5 5 0 0 1 10 0v3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M14.5 21v-2a2.5 2.5 0 0 1 5 0v2" />
        </>
      );
    case "layers":
      return (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 13 9 5 9-5" />
        </>
      );
    case "megaphone":
      return (
        <>
          <path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1Z" />
          <path d="M17 9a4 4 0 0 1 0 6M7 14l1 6h3l-1-5" />
        </>
      );
    case "printer":
      return (
        <>
          <path d="M6 9V3h12v6" />
          <rect x="3" y="9" width="18" height="8" rx="2" />
          <path d="M6 14h12v7H6z" />
        </>
      );
    case "finance":
      return (
        <>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
          <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </>
      );
    default:
      // Nom inconnu : on n'affiche rien
      return null;
  }
}

export function Icon(props: IconProps) {
  let taille = 18;
  if (props.size) {
    taille = props.size;
  }

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      {dessinDeLIcone(props.name)}
    </svg>
  );
}
