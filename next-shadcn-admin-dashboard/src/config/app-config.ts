import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Gestion Inventaire",
  version: packageJson.version,
  copyright: `© ${currentYear}, Gestion Inventaire.`,
  meta: {
    title: "Gestion Inventaire - Admin Dashboard",
    description:
      "Gestion Inventaire connects the admin dashboard to your Laravel inventory backend for items, responsables, faculties, services, and movement tracking.",
  },
};
