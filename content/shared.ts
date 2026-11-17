// Facts that are the same in every language: links, contact details, images.

import { withBase } from "@/lib/paths";

export const EMAIL = "a.bokhary2077@gmail.com";

export const GITHUB_HANDLE = "abdullah2036";

export const SOCIAL = {
  linkedin: "https://www.linkedin.com/in/abdullah-bokhary-840315326/",
  github: `https://github.com/${GITHUB_HANDLE}`,
  githubRepos: `https://github.com/${GITHUB_HANDLE}?tab=repositories`,
  x: "https://x.com/a_dbokhary",
};

const gh = (repo: string) => `${SOCIAL.github}/${repo}`;

export const LINKS = {
  fireGuardianLive: "https://fireguardian.vercel.app",
  fireGuardianCode: gh("FireGuardian"),
  scinvites: gh("SCinvites"),
  pairingBoardLive: "https://chessresults.pageui.workers.dev/#1434355",
  pairingBoardCode: gh("chessUI"),
  maherOsLive: "https://abdullah2036.github.io/computerjymaherOS/",
  maherOsCode: gh("computerjymaherOS"),
  ibmVerify: "https://coursera.org/verify/professional-cert/ZYDXA0Y9YY1V",
  ibmImage: withBase("/certs/ibm-full-stack.webp"),
  ineImage: withBase("/certs/ine-ecppt.png"),
  nasaImage: withBase("/certs/nasa-space-apps.webp"),
  miyahthonImage: withBase("/certs/miyahthon.webp"),
};

export const IMAGES = {
  fireGuardian: { src: withBase("/projects/fireguardian.webp"), width: 1600, height: 1000 },
  scinvites: { src: withBase("/projects/scinvites.webp"), width: 2000, height: 955 },
  pairingBoard: { src: withBase("/projects/pairing-board.jpg"), width: 1280, height: 900 },
  maherOs: { src: withBase("/projects/maher-os.jpg"), width: 1440, height: 900 },
  ibm: { src: withBase("/certs/ibm-full-stack.webp"), width: 2000, height: 1545 },
  ine: { src: withBase("/certs/ine-ecppt.png"), width: 1262, height: 978 },
  nasa: { src: withBase("/certs/nasa-space-apps.webp"), width: 1056, height: 816 },
  miyahthon: { src: withBase("/certs/miyahthon.webp"), width: 2000, height: 1414 },
};

/** Fire Guardian's extra screens, for its detail card. Captions live in each language file. */
const fg = (name: string, height = 1000) => ({ src: withBase(`/projects/fireguardian/${name}.webp`), width: 1600, height });
export const FIRE_GUARDIAN_SCREENS = {
  sources: fg("sources"),
  forecast: fg("forecast"),
  analytics: fg("analytics", 1111),
  aiModel: fg("aimodel", 1111),
  drones: fg("drones"),
  phones: fg("phone", 1119),
};

/** Phone-sized screenshots and square certificate crops, for the hero mosaic and project cards. */
export const SHOTS = {
  fireGuardian: { src: withBase("/shots/fireguardian-phone.webp"), width: 720, height: 1575 },
  scinvitesInvite: { src: withBase("/shots/scinvites-invite.webp"), width: 350, height: 720 },
  scinvitesCard: { src: withBase("/shots/scinvites-card.webp"), width: 232, height: 385 },
  pairingBoard: { src: withBase("/shots/pairing-board-phone.webp"), width: 720, height: 1329 },
  maherOs: { src: withBase("/shots/maher-os-phone.webp"), width: 720, height: 1558 },
  maherOsChooser: { src: withBase("/shots/maher-os-chooser.webp"), width: 720, height: 1415 },
  ibm: { src: withBase("/shots/ibm-square.webp"), width: 640, height: 640 },
  ine: { src: withBase("/shots/ine-square.webp"), width: 640, height: 640 },
  nasa: { src: withBase("/shots/nasa-square.webp"), width: 640, height: 640 },
  miyahthon: { src: withBase("/shots/miyahthon-square.webp"), width: 640, height: 640 },
};

/** The words on the moving tapes: tools I actually use in the projects above. */
export const STACK = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Supabase",
  "Vercel",
  "Cloudflare Workers",
  "Docker",
  "Git",
  "Playwright",
  "SQL",
  "Flask",
  "Vite",
  "MapLibre GL",
  "scikit-learn",
  "pandas",
];

/** Official course titles, kept in English in both languages. */
export const IBM_COURSES = [
  "Introduction to Software Engineering",
  "Introduction to Cloud Computing",
  "Introduction to HTML, CSS, & JavaScript",
  "Getting Started with Git and GitHub",
  "Developing Front-End Apps with React",
  "Developing Back-End Apps with Node.js and Express",
  "Python for Data Science, AI & Development",
  "Developing AI Applications with Python and Flask",
  "Django Application Development with SQL and Databases",
  "Introduction to Containers w/ Docker, Kubernetes & OpenShift",
  "Application Development using Microservices and Serverless",
  "Full Stack Application Development Capstone Project",
  "Full Stack Software Developer Assessment",
  "Generative AI: Elevate your Software Development Career",
  "Software Developer Career Guide and Interview Preparation",
];
