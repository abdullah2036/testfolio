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
  scinvites: gh("SCinvites"),
  pairingBoardLive: "https://chessresults.pageui.workers.dev/#1434355",
  pairingBoardCode: gh("chessUI"),
  eloriaLive: "https://abdullah2036.github.io/eloriaprojectV2/",
  eloriaCode: gh("eloriaprojectV2"),
  maherOsLive: "https://abdullah2036.github.io/computerjymaherOS/",
  maherOsCode: gh("computerjymaherOS"),
  ibmVerify: "https://coursera.org/verify/professional-cert/ZYDXA0Y9YY1V",
  ibmImage: withBase("/certs/ibm-full-stack.webp"),
  ineImage: withBase("/certs/ine-ecppt.png"),
};

export const IMAGES = {
  scinvites: { src: withBase("/projects/scinvites.webp"), width: 2000, height: 955 },
  pairingBoard: { src: withBase("/projects/pairing-board.jpg"), width: 1280, height: 900 },
  eloria: { src: withBase("/projects/eloria.jpg"), width: 1440, height: 900 },
  maherOs: { src: withBase("/projects/maher-os.jpg"), width: 1440, height: 900 },
  ibm: { src: withBase("/certs/ibm-full-stack.webp"), width: 2000, height: 1545 },
  ine: { src: withBase("/certs/ine-ecppt.png"), width: 1262, height: 978 },
};

export const TINTS = ["rgba(52,230,190,0.30)", "rgba(64,180,240,0.30)", "rgba(110,130,255,0.30)", "rgba(160,90,255,0.30)"];

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
