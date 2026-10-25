"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Feather,
  Fingerprint,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { filterEvents, messages, type Category, type Locale } from "@/i18n/messages";

const githubUrl = "https://github.com/kunlong-luo/journeloom";
const categories: Category[] = ["all", "milestone", "memory", "growth"];

function TimelinePattern() {
  return (
    <div className="memory-orbit" aria-hidden="true">
      <span className="orbit orbit-one" />
      <span className="orbit orbit-two" />
      <span className="orbit orbit-three" />
      <span className="orbit-core">✺</span>
      <span className="orbit-star star-one">✦</span>
      <span className="orbit-star star-two">✳</span>
    </div>
  );
}

export function HomeExperience() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [category, setCategory] = useState<Category>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const copy = messages[locale];
  const visibleEvents = filterEvents(copy.events, category);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    void navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => {
      // Optional offline shell: failure should never block the UI.
    });
  }, []);

  function switchLocale() {
    setLocale((current) => (current === "zh" ? "en" : "zh"));
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--paper)] text-[var(--ink)]">
      <a href="#main-content" className="skip-link">
        {locale === "zh" ? "跳到正文" : "Skip to content"}
      </a>

      <header className="relative z-20 border-b border-[var(--border)]/80 bg-[var(--paper)]/95">
        <div className="site-container flex h-[82px] items-center justify-between gap-5">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Journeloom home">
            <BrandMark className="h-[49px] w-[49px]" />
            <span className="font-display text-[26px] font-semibold tracking-[-0.065em]">journeloom<span className="text-[var(--copper)]">.</span></span>
          </a>

          <nav className="hidden items-center gap-9 text-[13px] font-medium text-[var(--muted)] md:flex" aria-label="Main navigation">
            <Link href="/archive" className="nav-link">{copy.nav.archive}</Link>
            <a href="#timeline" className="nav-link">{copy.nav.timeline}</a>
            <a href="#philosophy" className="nav-link">{copy.nav.philosophy}</a>
            <a href="#roadmap" className="nav-link">{copy.nav.roadmap}</a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button type="button" onClick={switchLocale} className="language-button" aria-label={copy.language} title={copy.language}>
              <Globe2 size={16} aria-hidden="true" /> {locale === "zh" ? "EN" : "中文"}
            </button>
            <Link className="header-source" href="/archive">{copy.nav.archive} <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
        {mobileMenuOpen ? (
          <nav id="mobile-navigation" className="site-container flex flex-col gap-1 border-t border-[var(--border)] py-4 text-sm md:hidden" aria-label="Mobile navigation">
            <Link href="/archive" className="rounded-xl px-3 py-3 hover:bg-white" onClick={() => setMobileMenuOpen(false)}>{copy.nav.archive}</Link>
            {([
              ["#timeline", copy.nav.timeline],
              ["#philosophy", copy.nav.philosophy],
              ["#roadmap", copy.nav.roadmap],
            ] as const).map(([href, label]) => (
              <a key={href} className="rounded-xl px-3 py-3 hover:bg-white" href={href} onClick={() => setMobileMenuOpen(false)}>{label}</a>
            ))}
            <button type="button" className="rounded-xl px-3 py-3 text-left hover:bg-white" onClick={switchLocale}>{copy.language}</button>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-3 hover:bg-white">GitHub ↗</a>
          </nav>
        ) : null}
      </header>

      <main id="main-content">
        <section id="top" aria-labelledby="hero-title" className="hero-shell relative overflow-hidden">
          <div className="site-container relative grid min-h-[690px] items-center gap-10 pb-22 pt-21 lg:grid-cols-[1.02fr_0.98fr] lg:gap-0 lg:pb-28 lg:pt-24">
            <div className="relative z-10 max-w-[650px]">
              <div className="eyebrow flex items-center gap-2.5"><span className="eyebrow-dash" /> {copy.eyebrow}</div>
              <h1 id="hero-title" className="font-display mt-8 text-[clamp(3.25rem,5.65vw,5.7rem)] leading-[1.13] font-medium tracking-[-0.082em]">
                <span className="block">{copy.heroLines[0]}</span>
                <span className="block text-[var(--copper-dark)]">{copy.heroLines[1]}</span>
                <span className="block">{copy.heroLines[2]}</span>
              </h1>
              <p className="mt-8 max-w-[505px] text-[15px] leading-[1.95] text-[var(--muted)] sm:text-[16px]">{copy.heroBody}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/archive" className="primary-action">{copy.startArchive} <ArrowRight size={17} aria-hidden="true" /></Link>
                <a href="#timeline" className="text-action">{copy.explore} <ArrowUpRight size={16} aria-hidden="true" /></a>
              </div>
              <div className="mt-11 flex items-start gap-3 border-t border-[var(--border)] pt-5 text-[12px] leading-6 text-[var(--muted)]">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--sage-dark)]" aria-hidden="true" />
                <span>{copy.heroFootnote}</span>
              </div>
            </div>

            <div className="hero-art relative mx-auto flex h-[485px] w-full max-w-[545px] items-center justify-center sm:h-[555px] lg:translate-x-4" aria-label="Illustration of a personal memory journal">
              <div className="art-wash" aria-hidden="true" />
              <div className="art-index-note" aria-hidden="true">VOL. 001&nbsp; — &nbsp; LIFE ARCHIVE</div>
              <div className="art-card-shadow" aria-hidden="true" />
              <div className="art-journal">
                <div className="flex items-start justify-between gap-3">
                  <span className="art-overline">{copy.cover}</span>
                  <span className="art-folio">N° 001</span>
                </div>
                <div className="art-illustration"><TimelinePattern /></div>
                <div className="art-content">
                  <div className="art-rule" />
                  <p className="font-display text-[29px] leading-[1.18] tracking-[-0.055em] text-[var(--ink)] sm:text-[34px]">{copy.memoryTitle}</p>
                  <p className="mt-2 text-[12px] leading-[1.65] text-[var(--muted)] sm:text-[13px]">{copy.memoryBody}</p>
                  <div className="mt-5 flex justify-between border-t border-[#e2ded5] pt-3 text-[9px] tracking-[0.1em] text-[#8c8981] uppercase">
                    <span>{copy.memoryDate}</span><span>J / 001</span>
                  </div>
                </div>
              </div>
              <div className="art-floating-label"><span className="art-floating-icon"><BookOpenText size={17} aria-hidden="true" /></span><span>{copy.edition}</span></div>
              <div className="art-seal">JL<span>✳</span></div>
            </div>
          </div>
          <div className="hero-corner" aria-hidden="true">EST. 2026 <ArrowDownRight size={13} /></div>
        </section>

        <section className="border-y border-[var(--border)] bg-[#f4f0e8]" aria-label="Core principles">
          <div className="site-container grid gap-0 md:grid-cols-3">
            {copy.values.map((value, index) => (
              <div key={value.number} className={`flex gap-4 py-7 md:py-9 ${index > 0 ? "border-t border-[#dedbd3] md:border-t-0 md:border-l md:pl-10" : ""} ${index < 2 ? "md:pr-9" : ""}`}>
                <span className="font-display text-[32px] leading-none text-[#d0a587]">{value.number}</span>
                <div><h2 className="text-[14px] font-semibold">{value.title}</h2><p className="mt-2 text-[12px] leading-6 text-[var(--muted)]">{value.description}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="timeline" aria-labelledby="timeline-title" className="py-24 sm:py-30">
          <div className="site-container">
            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <div className="max-w-[725px]">
                <p className="eyebrow">{copy.timelineEyebrow}</p>
                <h2 id="timeline-title" className="section-title mt-5">{copy.timelineTitle}</h2>
                <p className="section-body mt-5 max-w-[660px]">{copy.timelineBody}</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e2dbd0] bg-[#f6f1e9] px-4 py-2 text-[11px] text-[#7c7265]"><LockKeyhole size={13} aria-hidden="true" /> DEMO / 001</div>
            </div>

            <div className="mt-11 flex flex-wrap gap-2" role="group" aria-label={locale === "zh" ? "筛选事件类别" : "Filter event category"}>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`category-chip ${category === item ? "category-chip-active" : ""}`}
                  aria-pressed={category === item}
                >{copy.categories[item]}</button>
              ))}
            </div>

            <div className="mt-9 grid gap-4 lg:grid-cols-[190px_1fr] lg:gap-9">
              <div className="hidden border-t border-[var(--border)] pt-7 lg:block">
                <span className="font-display text-[43px] text-[var(--sage-dark)]">2011—</span>
                <p className="mt-2 text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">{copy.journal}</p>
                <div className="mt-12 h-26 w-px bg-gradient-to-b from-[#a7ac9c] to-transparent" />
              </div>
              <div className="timeline-items" aria-live="polite">
                {visibleEvents.map((event, index) => (
                  <article key={event.year} className="timeline-entry relative grid gap-3 py-7 sm:grid-cols-[105px_1fr] sm:gap-7">
                    <div className="font-display text-[38px] leading-none tracking-[-0.065em] text-[var(--sage-dark)]">{event.year}</div>
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-[10px] font-medium tracking-[0.14em] text-[var(--copper-dark)] uppercase">{event.date}</span>
                        <span className="text-[10px] text-[#9d9b95]">/ {String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <h3 className="font-display text-[25px] leading-snug tracking-[-0.04em] sm:text-[30px]">{event.title}</h3>
                      <p className="mt-2 max-w-[620px] text-[13px] leading-[1.95] text-[var(--muted)]">{event.description}</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-[var(--sage-dark)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />{copy.categories[event.category]}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#e3ded3] bg-[#f7f2e9] px-4 py-3 text-[11px] leading-5 text-[var(--muted)]">
              <Fingerprint className="mt-0.5 shrink-0 text-[var(--sage-dark)]" size={15} aria-hidden="true" /><span>{copy.demoNotice}</span>
            </div>
          </div>
        </section>

        <section id="philosophy" aria-labelledby="philosophy-title" className="relative overflow-hidden bg-[var(--ink)] py-24 text-[#f9f6ef] sm:py-30">
          <div className="philosophy-grain" aria-hidden="true" />
          <div className="site-container relative">
            <p className="eyebrow text-[#b8c5b9]">{copy.featuresEyebrow}</p>
            <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <h2 id="philosophy-title" className="section-title max-w-[660px] text-[#faf8f2]">{copy.featuresTitle}</h2>
              <p className="max-w-[390px] text-[13px] leading-[1.95] text-[#b6c1c0]">{copy.featuresBody}</p>
            </div>
            <div className="mt-15 grid gap-4 md:grid-cols-3">
              {copy.features.map((feature, index) => {
                const FeatureIcon = [CalendarDays, Layers3, LockKeyhole][index];
                return (
                  <article key={feature.title} className="feature-card">
                    <div className="feature-icon"><FeatureIcon size={22} strokeWidth={1.5} aria-hidden="true" /></div>
                    <span className="mt-9 block text-[10px] tracking-[0.18em] text-[#a5b4ae]">0{index + 1} / JOURNELOOM</span>
                    <h3 className="font-display mt-4 text-[25px] tracking-[-0.04em]">{feature.title}</h3>
                    <p className="mt-3 text-[13px] leading-[1.85] text-[#b7c3bf]">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="roadmap" aria-labelledby="roadmap-title" className="py-23 sm:py-28">
          <div className="site-container grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
            <div>
              <p className="eyebrow">{copy.progressEyebrow}</p>
              <h2 id="roadmap-title" className="section-title mt-5">{copy.progressTitle}</h2>
              <p className="section-body mt-5">{copy.progressBody}</p>
              <a className="text-action mt-7 inline-flex" href={`${githubUrl}/blob/main/docs/ROADMAP.md`} target="_blank" rel="noreferrer">{copy.nav.roadmap} <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
            <div className="border-t border-[var(--border)]">
              {copy.steps.map((step) => (
                <div key={step.number} className="grid grid-cols-[75px_1fr] gap-4 border-b border-[var(--border)] py-6 sm:grid-cols-[95px_1fr_auto] sm:gap-5">
                  <span className="font-display text-[29px] text-[var(--copper-dark)]">{step.number}</span>
                  <div><h3 className="text-[15px] font-semibold">{step.title}</h3><p className="mt-2 text-[12px] leading-6 text-[var(--muted)]">{step.description}</p></div>
                  <span className="col-start-2 h-fit w-fit rounded-full bg-[#edf0e8] px-3 py-1.5 text-[10px] text-[var(--sage-dark)] sm:col-start-auto">{step.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[#e9eee8] py-22 text-center sm:py-25">
          <div className="site-container flex max-w-[810px] flex-col items-center">
            <Feather size={28} strokeWidth={1.3} className="mb-6 text-[var(--sage-dark)]" aria-hidden="true" />
            <h2 className="font-display text-[clamp(2.15rem,4.2vw,3.75rem)] tracking-[-0.065em]">{copy.closingTitle}</h2>
            <p className="mt-5 max-w-[550px] text-[14px] leading-7 text-[var(--muted)]">{copy.closingBody}</p>
            <Link href="/archive" className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#9eada2] px-6 py-3 text-[12px] text-[var(--sage-dark)] transition-colors hover:bg-white"><BookOpenText size={16} aria-hidden="true" /> {copy.futureButton}</Link>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--ink)] py-9 text-[#c8d0cd]">
        <div className="site-container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2"><BrandMark className="h-9 w-9" /><span className="font-display text-[21px] tracking-[-0.06em] text-white">journeloom.</span></div>
          <span className="max-w-[420px] text-[11px] leading-5">{copy.footerNote}</span>
          <a href={githubUrl} rel="noreferrer" target="_blank" className="inline-flex items-center gap-1.5 text-[12px] text-white hover:underline">GitHub <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  );
}
