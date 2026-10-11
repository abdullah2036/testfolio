import type { Content } from "./types";
import { EMAIL, GITHUB_HANDLE, IBM_COURSES, IMAGES, LINKS, SOCIAL, TINTS } from "./shared";

const en: Content = {
  locale: "en",
  dir: "ltr",
  meta: {
    title: "Abdullah Bokhary — Software engineer & web developer",
    description:
      "Software engineer and full-stack web developer in Saudi Arabia. I build practical solutions to interesting problems, from idea and design to deployment and maintenance.",
  },
  arrows: { forward: "→", external: "↗", up: "↑" },
  ui: {
    details: "Details",
    close: "Close",
    openDetails: "Open details",
    highlights: "Highlights",
    stack: "Built with",
    role: "My role",
    issued: "Issued",
    prev: "Previous project",
    next: "Next project",
    goTo: "Go to project",
  },
  nav: {
    wordmark: "ABDULLAH",
    about: "About",
    work: "Projects",
    certificates: "Certificates",
    contact: "Contact",
    cta: "Let's talk",
    menuLabel: "Menu",
    switchLabel: "عربي",
    switchAria: "اقرأ الموقع بالعربية",
    switchLocale: "ar",
  },
  hero: {
    eyebrow: { num: "01", label: "Hello" },
    heading: { lines: ["Abdullah"], accent: "Bokhary." },
    lede: "Software engineer and web developer. I build practical solutions to interesting problems.",
    cta: "Explore my work",
    meta: "Saudi Arabia · Open to client work",
    rail: ["Ideas", "Design", "Code", "Impact"],
  },
  about: {
    eyebrow: { num: "02", label: "About me" },
    heading: { lines: ["Built with"], accent: "intention." },
    body: "I start with the problem, then build toward it. Most of my clients found me through someone I'd already built for.",
    steps: [
      {
        label: "01 — Idea & design",
        plate: "Idea & design",
        text: "Who is it for, what does it need to do, how should it feel. I map the flow and design the interface first.",
      },
      {
        label: "02 — Code",
        plate: "Code",
        text: "Clean architecture across frontend and backend, so it stays fast and easy to change.",
      },
      {
        label: "03 — Deployment",
        plate: "Deployment",
        text: "Hosting, domains, databases and monitoring, set up properly and shipped to production.",
      },
      {
        label: "04 — Maintenance",
        plate: "Maintenance",
        text: "After launch I keep it running: updates, fixes and new features as the business grows.",
      },
    ],
  },
  work: {
    eyebrow: { num: "03", label: "Projects" },
    heading: { lines: ["Work"], lead: "that ", accent: "works." },
    featuredBadge: "Featured",
    moreTitle: "More projects",
    allWork: { label: "View all my work", handle: `@${GITHUB_HANDLE}`, href: SOCIAL.githubRepos },
    projects: [
      {
        id: "scinvites",
        label: "01 · Full-stack platform",
        featured: true,
        title: "SCinvites",
        description:
          "The invitation platform for the Science Club at Umm Al-Qura University: animated invitations, RSVPs and live attendance, built Arabic-first for launch-day traffic.",
        tech: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Vercel"],
        stats: [
          { value: "400", label: "visitors in 60 s, 0 failures" },
          { value: "249", label: "automated tests" },
          { value: "15", label: "Postgres tables" },
        ],
        primary: { label: "Case study & code", href: LINKS.scinvites },
        image: { ...IMAGES.scinvites, alt: "SCinvites home page: club leader sign-in and the event invitation designs" },
        tint: TINTS[0],
        role: "Engineering, deployment and operations. The club leader led the product and visual design.",
        story: [
          "SCinvites is the Arabic, right-to-left platform the Science Club at Umm Al-Qura University uses to invite guests, members and VIPs to its events. A guest opens a personal or public link on their phone and gets an animated invitation with their name and stamp, the venue with a map QR code, an RSVP and an add-to-calendar file.",
          "Club leaders sign in with their university email, pick an approved template, add names in bulk and send the batch for approval. The owner runs everything from a hidden studio: events, versioned templates, an approval queue, visitor exports and a live dashboard with attendance and peak hours.",
        ],
        highlights: [
          "Traced a production freeze to the Postgres wire protocol and patched the driver so every query goes out in one round trip.",
          "Load-tested before launch: 400 students in 60 seconds, 1,561 requests, 0 failures, p95 around 500 ms.",
          "Built for phones and in-app browsers: animations pause off-screen, long lists paginate, rate limits are sized for shared campus IPs.",
          "Private by default: server-only data access, row-level security, hashed session tokens, visitor data deleted after each event.",
          "205 unit and integration tests against real Postgres plus 44 Playwright end-to-end tests, all in CI.",
        ],
      },
      {
        id: "pairing-board",
        label: "02 · Real-world tool",
        title: "Pairing Board",
        description:
          "Chess players crowd around printed sheets to find their board. Paste a tournament link, type your name, and get your board, colour and opponent in seconds.",
        tech: ["JavaScript", "Cloudflare Workers", "Edge caching"],
        primary: { label: "Live site", href: LINKS.pairingBoardLive },
        secondary: { label: "Code", href: LINKS.pairingBoardCode },
        image: { ...IMAGES.pairingBoard, alt: "Pairing Board showing a player's board, colour and opponent" },
        tint: TINTS[1],
        story: [
          "At tournaments, players crowd around printed pairing sheets or scroll huge tables on their phones looking for their own board. Pairing Board shows only what a player needs: board number, colour, opponent, rating, points and result.",
          "chess-results.com has no API and no CORS headers, so a Cloudflare Worker sits in between. It scrapes the pairing and start-list pages, maps them to clean JSON, and caches at the edge so a whole hall refreshing at once costs the source a handful of requests.",
        ],
        highlights: [
          "Search in any order: John Doe, Doe John, a start number, a FIDE ID or a board number. Accents are ignored.",
          "A large card for each of your matches, refreshed every 15, 30 or 60 seconds while a round is live.",
          "A failed background refresh keeps the last good pairings on screen instead of wiping them.",
          "Shareable links: the tournament ID lives in the URL, so a link opens straight to that event.",
          "No framework and no build step. Mobile-first.",
        ],
      },
      {
        id: "eloria",
        label: "03 · Full-stack",
        title: "Eloria Story v2",
        description:
          "A publishing site for an Arabic novelist, moved onto a real backend: Postgres with row-level security, author sign-in, cover storage and email alerts for readers.",
        tech: ["Supabase", "PostgreSQL", "Auth", "Row-level security", "JavaScript"],
        primary: { label: "Live site", href: LINKS.eloriaLive },
        secondary: { label: "Code", href: LINKS.eloriaCode },
        image: { ...IMAGES.eloria, alt: "Eloria Story library page" },
        tint: TINTS[2],
        story: [
          "A self-publishing site for an Arabic novelist: a library, novel pages, a reader with font controls and a reading-progress bar, quotes and an about page.",
          "Version one kept everything in a JSON file committed through the GitHub API. Version two keeps the reading experience and moves it onto a real backend: Postgres tables, Supabase Auth for the author, covers in Storage, and row-level security deciding who can write.",
        ],
        highlights: [
          "The author edits everything in place. Edits are debounced and synced, and removed rows are deleted on the server.",
          "Readers subscribe, the author approves them, and they get an email when a new chapter is out. Nothing is announced twice.",
          "No secrets in the front end: the public key is public by design and the database policies enforce access.",
          "Full JSON export and import for backups.",
        ],
      },
      {
        id: "maher-os",
        label: "04 · Creative frontend",
        title: "Computerjy Maher OS",
        description:
          "A tech studio's website that hands you the machine. Pick laptop or phone, it boots, and you get a desktop or a home screen. Services are windows, and there's a shell.",
        tech: ["React", "Vite", "JavaScript", "SVG"],
        primary: { label: "Live site", href: LINKS.maherOsLive },
        secondary: { label: "Code", href: LINKS.maherOsCode },
        image: { ...IMAGES.maherOs, alt: "A macOS-style desktop with the Services and Terminal windows open" },
        tint: TINTS[3],
        story: [
          "A studio site is usually a list of services on a scrolling page. This one turns every section into something a computer already has a shape for: services become a settings app, the portfolio a browser with real URLs in the bar, reviews a message thread, contact a compose window that sends on WhatsApp, and the sitemap a file browser.",
          "One kernel drives two shells. A single store holds the device, language, appearance and window list, so opening an app behaves the same from the dock, from search, from a file or from the terminal.",
        ],
        highlights: [
          "A real window manager: dragging, eight resize handles, stacking order, focus, minimise, zoom and cascade placement.",
          "Drag and resize write straight to the element and commit on release, so moving a window never re-renders React.",
          "Dock magnification computed from resting positions, so the icons rise in a smooth wave instead of fighting each other.",
          "Arabic and English, every icon drawn in SVG, about 73 kB gzipped.",
        ],
      },
    ],
  },
  certificates: {
    eyebrow: { num: "04", label: "Certificates" },
    heading: { lines: ["Always"], accent: "learning." },
    body: "Certifications, workshops and achievements along the way.",
    items: [
      {
        id: "ibm",
        issuer: "IBM · Coursera",
        title: "Full Stack Software Developer",
        kind: "Professional certificate · 15 courses",
        issued: "September 17, 2026",
        credentialLabel: "Credential ID",
        credentialId: "ZYDXA0Y9YY1V",
        links: [
          { label: "Verify", href: LINKS.ibmVerify },
          { label: "Full size", href: LINKS.ibmImage },
        ],
        image: { ...IMAGES.ibm, alt: "IBM Full Stack Software Developer professional certificate" },
        about:
          "Fifteen courses on application development and cloud: HTML, CSS and JavaScript, React, Node.js and Express, Python, Flask and Django, SQL and NoSQL, Docker, Kubernetes and OpenShift, microservices, serverless and CI/CD. It ends with a capstone and a SaaS application deployed with cloud-native methods.",
        list: { label: "Courses", items: IBM_COURSES, ltr: true },
      },
      {
        id: "ine",
        issuer: "INE Security",
        title: "Certified Professional Penetration Tester (eCPPT)",
        kind: "Professional certification",
        issued: "September 17, 2026",
        credentialLabel: "Certification ID",
        credentialId: "194431871",
        links: [{ label: "Full size", href: LINKS.ineImage }],
        image: { ...IMAGES.ine, alt: "INE Security eCPPT certificate" },
        about:
          "INE Security's professional penetration testing certification, earned through a hands-on practical exam. It shapes how I build: I write web applications knowing how they get attacked.",
      },
    ],
  },
  contact: {
    eyebrow: { num: "05", label: "Contact" },
    heading: { lines: ["Let's make", "something"], accent: "matter." },
    body: "Open to client work, collaborations and interesting problems. Tell me what you're building.",
    email: EMAIL,
    cta: "Get in touch",
    socials: [
      { label: "LinkedIn", href: SOCIAL.linkedin },
      { label: "GitHub", href: SOCIAL.github },
      { label: "X", href: SOCIAL.x },
    ],
  },
  footer: {
    name: "ABDULLAH BOKHARY",
    credit: "© 2026 · Designed and built by me",
    backToTop: "Back to top",
  },
};

export default en;
