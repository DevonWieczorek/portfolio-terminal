"use client";

import { type FC } from "react";
import styles from "@/styles/Resume.module.scss";

const Resume: FC = () => {
    return (
        <article className={styles.resume}>
            <header>
                <h1>Devon Wieczorek</h1>
                <h2>Senior Full-Stack Engineer</h2>
                <p>
                    Location: New Jersey
                    <br />
                    Tel: <a href="tel:2015277500">(201) 527-7500</a>
                    <br />
                    Email:{" "}
                    <a href="mailto:Devon.Wieczorek@iCloud.com">
                        Devon.Wieczorek@iCloud.com
                    </a>
                    <br />
                    Website: <a href="https://devon.codes">Devon.Codes</a>
                    <br />
                    LinkedIn:{" "}
                    <a href="http://LinkedIn.com/in/DevonWieczorek">
                        LinkedIn.com/in/DevonWieczorek
                    </a>
                    <br />
                    Github:{" "}
                    <a href="http://github.com/DevonWieczorek">
                        Github.com/DevonWieczorek
                    </a>
                    <br />
                </p>
            </header>

            <section>
                <h2>Summary</h2>
                <p>
                    Senior full-stack engineer with 8 years of experience
                    building production web platforms, grounded in deep React
                    and front-end expertise and now shipping end-to-end systems:
                    Node and Postgres services, data pipelines, and third-party
                    API integrations (Meta, Google Ads, TikTok, Amazon, Shopify,
                    Bill.com). Backs every system with automated tests, CI, and
                    documented architecture decisions. Uses AI coding agents to
                    ship faster without lowering the bar for review,
                    reliability, or security.
                </p>
            </section>

            <section>
                <h2>Skills</h2>
                <ul>
                    <li>
                        <strong>Languages:</strong> TypeScript, JavaScript, SQL,
                        Python, HTML, CSS/SCSS/LESS, PHP, Bash
                    </li>
                    <li>
                        <strong>Front End:</strong> React, Next.js, React
                        Native/Expo, Redux, Zustand, Tailwind CSS, React Three
                        Fiber, AG Grid
                    </li>
                    <li>
                        <strong>Back End and Data:</strong> Node.js, Express,
                        PostgreSQL, Supabase, Airbyte, REST/GraphQL APIs,
                        webhooks, OAuth
                    </li>
                    <li>
                        <strong>Build and Infrastructure:</strong> Vercel,
                        DigitalOcean, Docker, GitHub Actions CI/CD, Webpack,
                        Vite, systemd
                    </li>
                    <li>
                        <strong>Testing and Quality:</strong> Vitest, Jest,
                        React Testing Library, Playwright, ESLint/Prettier, code
                        review, ADRs
                    </li>
                    <li>
                        <strong>AI Tooling:</strong> Claude Code, Model Context
                        Protocol (MCP) servers, OpenAI API, LLM-assisted
                        development workflows
                    </li>
                    <li>
                        <strong>Practices:</strong> Agile/Scrum, technical
                        documentation, mentorship and onboarding, accessibility
                        (a11y), i18n, A/B testing
                    </li>
                </ul>
            </section>

            <section>
                <h2>Professional Experience</h2>

                <article>
                    <h3>AI Developer</h3>
                    <p>
                        Wired2Scale, Remote
                        <br />
                        June 2026 – Present
                    </p>
                    <p>
                        CPG growth and media-buying agency. Own the
                        agency&apos;s reporting and billing platforms end to end
                        and build internal automation for a team managing paid
                        media for 30+ consumer brands.
                    </p>
                    <ul>
                        <li>
                            Built and own an automated reporting platform
                            (TypeScript/Node, Supabase, Playwright, Slack API)
                            that pulls spend and revenue from 11 ad and commerce
                            APIs, including Meta, Google Ads, TikTok, Shopify,
                            Amazon SP-API, and Northbeam, and posts per-client
                            KPI report cards on schedule, replacing ~3–5 hours a
                            day of manual reporting.
                        </li>
                        <li>
                            Brought reported metrics to parity with client
                            source-of-truth sheets, cutting one revenue gap from
                            ~30% to within ±2.5% and taking a daily ad-cost
                            metric from 0% to 100% agreement over 37 days;
                            backed by 440+ automated tests, CI, and ~100
                            documented architecture decisions.
                        </li>
                        <li>
                            Built a full-stack invoicing platform (Next.js,
                            Postgres/Supabase, Vercel) that ingests ad spend
                            from 6 platforms via Airbyte, applies tiered and
                            subscription fee logic, and pushes invoices to
                            Bill.com through its API and webhooks; automated the
                            twice-monthly spend pull, saving ~8 hours of manual
                            work a month.
                        </li>
                        <li>
                            Data audits surfaced ~$900K+ of ad spend under
                            accounts unmapped in the billing system, and
                            restored ~$140K of spend history previously judged
                            unrecoverable by fixing an ingestion lookback
                            window.
                        </li>
                        <li>
                            Shipped v1 of an ad-launch tool in the
                            company&apos;s internal AI platform that parses copy
                            docs, applies naming conventions, and builds ad
                            drafts through a third-party launcher API; led its
                            migration into the platform: schema, background
                            jobs, API, and UI.
                        </li>
                        <li>
                            Resolved a production database outage (disk full,
                            read-only state), wrote the incident report, and
                            authored a disaster-recovery plan covering all three
                            production systems; provisioned the production host
                            on DigitalOcean and migrated engineering to a GitHub
                            organization.
                        </li>
                        <li>
                            Built a Claude Code plugin marketplace for the team
                            (planner, builder, and auditor agents with a human
                            merge gate), added automated AI pull-request review
                            to CI, and launched an internal knowledge assistant
                            red-teamed for prompt injection.
                        </li>
                        <li>
                            Led the evaluation that approved a 1Password
                            rollout, moved team credentials out of Slack, and
                            designed SSO and access-control architecture (Google
                            Workspace identity, Supabase authorization) for ~35
                            staff; onboarded two engineers with setup and system
                            docs.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>Professional Development | Career Break</h3>
                    <p>
                        Self-directed
                        <br />
                        March 2025 – June 2026
                    </p>
                    <ul>
                        <li>
                            Expanded from front-end into back-end and data
                            engineering through the four certifications below,
                            and built personal projects in React, Next.js, and
                            TypeScript, including the 3D portfolio and a browser
                            roguelike game.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>Senior Front-End Engineer</h3>
                    <p>
                        Rockstar Games, New York, NY
                        <br />
                        January 2023 – March 2025
                    </p>
                    <ul>
                        <li>
                            Led the migration of a legacy React codebase to
                            TypeScript and added Jest test coverage, improving
                            type safety and maintainability across shared
                            components.
                        </li>
                        <li>
                            Helped consolidate scattered repositories into a
                            single codebase, simplifying builds, dependency
                            management, and releases.
                        </li>
                        <li>
                            Built and launched the Circoloco Records website in
                            React, and converted the legacy Red Dead Redemption
                            2 website to React.
                        </li>
                        <li>
                            Built internal tools that automated team workflows,
                            turned stakeholder requests into technical
                            requirements, and onboarded and mentored new
                            engineers through hands-on pairing and
                            documentation.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>Digital Marketing Developer</h3>
                    <p>
                        Rockstar Games, New York, NY
                        <br />
                        August 2020 – December 2022
                    </p>
                    <ul>
                        <li>
                            Designed and maintained the custom CMS behind most
                            content across Rockstar&apos;s web properties (~6M
                            visits a month), used by ~15 designers, content
                            managers, and engineers.
                        </li>
                        <li>
                            Built and released the Grand Theft Auto: The Trilogy
                            website, migrated the legacy GTA V and GTA Online
                            websites, and created CLI tools that automated
                            common build and deployment tasks.
                        </li>
                        <li>
                            Led documentation standards across the codebase and
                            interviewed engineering candidates.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>Software Developer II</h3>
                    <p>
                        Fluent, Inc., New York, NY
                        <br />
                        May 2019 – August 2020
                    </p>
                    <ul>
                        <li>
                            Built a React WYSIWYG editor and marketing-funnel
                            builder that boosted productivity for non-technical
                            teams.
                        </li>
                        <li>
                            Built a Node.js CLI to bootstrap, develop, and
                            deploy microsites, plus reusable React component and
                            SASS libraries shared across projects.
                        </li>
                        <li>
                            Interviewed stakeholders to find workflow
                            bottlenecks, then designed and built automated
                            solutions.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>Front-End Developer</h3>
                    <p>
                        Fluent, Inc., New York, NY
                        <br />
                        August 2017 – May 2019
                    </p>
                    <ul>
                        <li>
                            Led development of scalable consumer-facing sites,
                            including TheSmartWallet.com and FindDreamJobs.com;
                            built custom CI/CD pipelines and introduced git
                            workflows that sped up the release cycle.
                        </li>
                    </ul>
                </article>
            </section>

            <section>
                <h2>Selected Projects</h2>

                <article>
                    <h3>Portfolio Terminal (Devon.Codes)</h3>
                    <p>
                        Next.js 15, React 19, TypeScript, React Three Fiber,
                        OpenAI API
                    </p>
                    <ul>
                        <li>
                            Interactive 3D office scene with a terminal-mode
                            portfolio and an AI &quot;ask&quot; command served
                            by a server-side OpenAI route with file search;
                            Zustand state, Jest/RTL test suite, and CI/CD to
                            Vercel via GitHub Actions.
                        </li>
                    </ul>
                </article>

                <article>
                    <h3>React-WordPress Microsite Framework</h3>
                    <p>React, headless WordPress, Node.js CLI</p>
                    <ul>
                        <li>
                            Headless WordPress and React framework with a plugin
                            system and a CLI scaffolder (React-WP-CLI) for
                            spinning up new microsites.
                        </li>
                    </ul>
                </article>
            </section>

            <section>
                <h2>Certifications</h2>
                <ul>
                    <li>React Native &amp; Expo, Meta (April 2026)</li>
                    <li>Intro to Supabase, Scrimba (February 2026)</li>
                    <li>
                        Database Design and Basic SQL in PostgreSQL, University
                        of Michigan (December 2025)
                    </li>
                    <li>
                        Developing Back-End Apps with Node.js and Express, IBM
                        (December 2025)
                    </li>
                </ul>
            </section>

            <section>
                <h2>Education</h2>
                <p>
                    B.A., Communication and Media Studies
                    <br />
                    Ramapo College of New Jersey
                </p>
            </section>
        </article>
    );
};

export default Resume;
