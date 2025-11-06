# Aegis Dashboard Landing Page Creative Brief

## Project goals
- Craft a static, marketing-focused landing page that mirrors the Aegis dashboard visual language and communicates product value pre-signup.
- Drive email capture as the single interactive element, storing addresses for future outreach.
- Reinforce the platform's credibility with motion-rich storytelling and UI previews that echo the authenticated experience.

## Target audience
- DevSecOps leads, platform engineers, and engineering managers evaluating automated security/quality tooling.
- Decision-makers seeking proof of reliable workflow integration, actionable insights, and rapid onboarding.

## Page structure & content modules

### 1. Hero (Above the fold)
- **Messaging:** Headline that encapsulates continuous security assurance (e.g., “Ship with confidence. Every commit.”) with subtext referencing automated scans and actionable insights.
- **Visual:** Animated hero composition inspired by the dashboard’s two-column layout—floating KPI tiles, repository cards, and status pills drifting into place.
- **CTA:** Prominent email capture form (name + email optional) with trust copy (“Join the early access list”). Include GDPR-compliant consent checkbox if required.
- **Theme:** Gradient background echoing `auth-background` with animated “floating blob” motif.

### 2. Credibility strip
- Logos or text badges for compliance standards met or notable customers (placeholder slots if none yet).
- Animated shimmer hover or subtle marquee to keep motion alive.

### 3. Platform value pillars
Use a three- or four-column grid with iconography from `src/components/Icon.tsx` for brand consistency.
- **Automated Quality Gates:** Describe enforcement toggles, thresholds, and security policies.
- **Real-time Findings:** Highlight consolidated SCA, SBOM, secrets, and vuln triage.
- **GitHub Actions Integration:** Emphasize plug-and-play workflow snippet with tenant-aware configuration.
- **Developer-Friendly Insights:** Mention intuitive timeline, repository filters, and drill-down capabilities.
Each block should include micro-animations (e.g., card lift on scroll, icon pulse).

### 4. Interactive dashboard showcase
- Scrollytelling section mimicking the authenticated tabs.
- **Tab chips:** “Dashboard” and “Setup” with on-scroll parallax to indicate active view.
- **Dashboard reel:** Carousel or layered mockups showing GlobalSummary KPIs, RepositoryList tiles, and ToolFindingsPanel snippets. Include tooltip-style callouts describing each feature.
- **Setup highlight:** Animated flip to reveal API key card, QualityGateForm controls, and GitHub Actions snippet.

### 5. Guided workflow timeline
- Vertical timeline illustrating onboarding steps: connect repo → run first scan → review findings → enforce gates.
- Use the same status pill colors (pass/attention/fail) to create continuity.
- Pair each step with short copy + supporting icon.

### 6. Social proof & stats
- Space for testimonials or quotes once available; for now, include placeholders.
- Feature metrics pulled from dashboard KPIs (e.g., “92% pass rate across teams”) with animated counters.

### 7. Email capture reinforcement
- Secondary email signup band near footer with contrasting background.
- Highlight value of joining the list (exclusive tips, launch invites).

### 8. Footer
- Minimal nav (Product, Docs, Support), company info, and social links.
- Include compliance/legal text relevant to email capture.

## Visual & motion direction
- Palette: Leverage Tailwind classes used in the dashboard—deep navy backgrounds, electric blues, lime accents.
- Typography: Continue with Plus Jakarta Sans; pair bold weights for headings with medium for body copy.
- Motion: Use staggered fade-ups, floating elements, and scroll-triggered parallax. Respect reduced-motion preferences by disabling complex animations when `prefers-reduced-motion` is true.
- Iconography: Reuse `StatusPill`, KPI icons, and repo avatars (initials in circular badges).

## Email capture implementation notes
- Keep form static (client-side only). Validate email format before submission.
- Provide success and failure messaging inline.
- Store submissions via your preferred API or form service; ensure fallback messaging if offline.

## Content tone & voice
- Confident, security-first, but developer-friendly.
- Use concise, benefit-driven copy with verbs (“Automate”, “Surface”, “Enforce”).
- Avoid jargon overload; clarify acronyms at first mention.

## Deliverables for designer/developer
- High-fidelity mockups of all sections, including desktop and mobile breakpoints.
- Motion storyboard or prototype demonstrating key animations.
- Asset kit: exported dashboard screenshots, icons, gradient overlays.
- Implementation checklist aligning Tailwind tokens, spacing scale, and component hierarchy with the React dashboard.

## Success metrics
- Email conversion rate from hero + secondary CTA.
- Scroll depth through interactive showcase.
- Time on page and interaction with motion sequences.

