import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import SearchPlugin from "@easyops-cn/docusaurus-search-local";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Metiz Docs",
  tagline: "Metiz Documentation",
  favicon: "img/logos/favicon.ico",

  // Set the production url of your site here
  url: "https://github.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/metiz-docs/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Triologic-Automation", // Usually your GitHub org/user name.
  projectName: "metiz-docs", // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "sl", "pl"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        pages: false,
        theme: {
          customCss: "./static/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      SearchPlugin,
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: true,

        docsRouteBasePath: "/",

        hashed: true,
        language: ["en", "de"],
      },
    ],
  ],

  plugins: ["docusaurus-plugin-image-zoom"],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    docs: { sidebar: { hideable: true } },
    navbar: {
      title: "Metiz Docs",
      logo: {
        alt: "Logo",
        src: "img/logos/logo.svg",
        srcDark: "img/logos/logo.dark.svg",
      },
      items: [
        /*{
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Home",
        },*/
        {
          type: "localeDropdown",
          position: "right",
        },
      ],
    },
    footer: {
      logo: {
        src: "img/logos/triologic.svg",
        srcDark: "img/logos/triologic.dark.svg",
        alt: "Logo Triologic",
        height: 50,
        href: "https://www.triologic.at/",
      },
      style: "light",
      links: [
        {
          title: "About",
          items: [
            {
              label: "Imprint",
              to: "/imprint",
            },
            {
              label: "Homepage",
              href: "https://www.triologic.at/",
            },
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/company/triologic-automation-gmbh/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Triologic Automation GmbH`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    zoom: {
      selector: ".markdown > img",
      background: {
        light: "rgb(255, 255, 255)",
        dark: "rgb(50, 50, 50)",
      },
      config: {
        // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
