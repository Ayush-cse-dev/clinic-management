const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconPatients(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.2a3.2 3.2 0 0 1 0 6.2" />
      <path d="M21 20c0-2.7-1.8-5-4.3-5.7" />
    </svg>
  );
}

export function IconDoctors(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M9 3v4a3 3 0 0 0 6 0V3" />
      <path d="M6 3v5a6 6 0 0 0 12 0V3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 16.5v3M16.5 18h3" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconPrescription(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M6 3h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-3 3v-3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
      <path d="M8 8h7M8 12h5" />
    </svg>
  );
}

export function IconRecord(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconBilling(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function IconDocument(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13.5h6M9 16.5h6" />
    </svg>
  );
}

export function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...common} {...props}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M4 21h16" />
    </svg>
  );
}
