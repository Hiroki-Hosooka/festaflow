const PATHS: Record<string, string[]> = {
  clipboard: [
    "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z",
    "M6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Z",
    "M9 11h6",
    "M9 15h6",
  ],
  inbox: [
    "M4 12h4l1.5 3h5L16 12h4",
    "M4 12 5.5 5h13L20 12",
    "M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6",
  ],
  megaphone: [
    "M4 10v4a1 1 0 0 0 1 1h1l1 5h2l-1-5h2l8 4V6l-8 4H5a1 1 0 0 0-1 1Z",
    "M18 9v6",
  ],
  users: [
    "M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    "M3 20v-1a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v1",
    "M16 7.2a2.6 2.6 0 1 1 0 5.2",
    "M21 20v-1a4 4 0 0 0-2.8-3.8",
  ],
  receipt: [
    "M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21V3Z",
    "M9 8h6",
    "M9 12h6",
  ],
  package: [
    "m3.5 8 8.5-4.5L20.5 8 12 12.5 3.5 8Z",
    "M3.5 8v8L12 20.5",
    "M20.5 8v8L12 20.5",
    "M12 12.5V20.5",
  ],
  document: [
    "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
    "M14 3v5h5",
    "M9 13h6",
    "M9 17h6",
  ],
  calendar: [
    "M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6Z",
    "M8 3v4",
    "M16 3v4",
    "M5 10h14",
  ],
  checkSquare: ["M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6Z", "m8.5 12 2.3 2.3L15.5 9.5"],
  key: [
    "M14.5 9.5a4 4 0 1 0-4 4l-6.5 6.5",
    "m9 15 2 2",
    "m12.5 11.5 2 2",
  ],
  chat: [
    "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H5a1 1 0 0 1-1-1V5Z",
  ],
  flag: ["M6 3v18", "M6 4.5h12l-3 4 3 4H6"],
  settings: [
    "M4 6h16",
    "M9 6m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0",
    "M4 12h16",
    "M15 12m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0",
    "M4 18h16",
    "M7 18m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0",
  ],
  tag: [
    "M12 2h7a1 1 0 0 1 1 1v7l-9 9a1 1 0 0 1-1.4 0l-6.6-6.6a1 1 0 0 1 0-1.4l9-9Z",
    "M17 7m-1.3 0a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0",
  ],
  chevronRight: ["m9 5 7 7-7 7"],
};

export function Icon({
  name,
  className = "w-4 h-4",
}: {
  name: keyof typeof PATHS;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
