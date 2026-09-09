import type { Metadata } from "next";
import Link from "next/link";
import HeroModelViewer from "./_hero-model/hero-model-viewer";
import { BuildCard } from "./_components/build-card";
import { LandingFooter } from "./_landing/landing-footer";
import { LandingHeader } from "./_landing/landing-header";
import { HeroCounters } from "./_motion/hero-counters";
import { Marquee } from "./_motion/marquee";
import { Preloader, introBootstrapScript } from "./_motion/preloader";
import { RevealTargets } from "./_motion/reveal-targets";
import { loadLandingBuilds } from "./_lib/feed";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "BuildVerdict — a verdict on unusual Dota 2 builds",
  description:
    "A forum for adventurous Dota 2 builds. Spin a random hero, judge the idea behind the items and publish your own.",
  alternates: { canonical: "/" },
};

const premise = [
  {
    title: "Meta guides hand you the answer",
    body: "Every other site tells you the optimal purchase. Useful in a match, useless as a conversation.",
  },
  {
    title: "Winrate ranking buries the interesting",
    body: "Sort a feed by winrate and the strange, clever, arguable builds wash out of it by definition.",
  },
  {
    title: "Nobody argues about a correct build",
    body: "There is nothing to say about a standard item set. The disagreement is the whole point.",
  },
];

const steps = [
  {
    title: "Spin a hero",
    body: "The app hands you a random hero with a random adventurous build. No filters, no meta, no winrate.",
  },
  {
    title: "Give a verdict",
    body: "Like it, call it situational or reject it. You are judging the idea, not the efficiency — and you do not need an account.",
  },
  {
    title: "Publish your own",
    body: "Name your build, pick the hero, drag the items into the inventory. The name carries the idea, so make it count.",
  },
];

const rules = [
  "It has one clear unusual idea — a changed role, an unexpected damage type, a tempo plan or a rare combination of effects.",
  "It carries at least one or two items that are not standard for that hero.",
  "The items support each other. A random pile is not a build.",
  "It stays playable in at least one specific scenario.",
  "It does not quietly copy the popular purchase with one slot swapped.",
];

const faq = [
  {
    q: "Do I need an account to vote?",
    a: "No. Anyone can give a verdict on a build. An account is only needed to comment, and a confirmed email is needed to publish your own build.",
  },
  {
    q: "Why is there no rating or winrate?",
    a: "Because the moment a feed is ranked by winrate, adventurous builds disappear from it. A build here has a name, a hero, items and an author — deliberately no score, no description and no author's note.",
  },
  {
    q: "What counts as an adventurous build?",
    a: "One you can explain in a sentence: why these items might work together. Being random is not the point — being arguable is.",
  },
  {
    q: "Is this affiliated with Valve?",
    a: "No. BuildVerdict is an independent fan project. Hero art and item icons belong to Valve Corporation.",
  },
];

function SectionLabel({ index, total, children }: { index: number; total: number; children: string }) {
  return (
    <span className="label section-marker">
      {children} <em>{String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}</em>
    </span>
  );
}

export default async function Landing() {
  const builds = await loadLandingBuilds(6);

  return (
    <div className="landing">
      <script dangerouslySetInnerHTML={{ __html: introBootstrapScript }} />
      <Preloader />
      <RevealTargets />
      <HeroCounters />
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="label">BuildVerdict — Dota 2</span>
          <h1 className="landing-title">
            Builds that look wrong<br />and might be right
          </h1>
          <p className="landing-lede">
            A forum for adventurous Dota 2 builds. Not the optimal purchase — the arguable one.
            Spin a hero, give a verdict, defend it in the comments.
          </p>
          <div className="landing-cta">
            <Link className="primary-button" href="/app">Spin a build</Link>
            <Link className="ghost-button" href="/app">Browse all builds</Link>
          </div>
          <dl className="landing-facts">
            <div>
              <dt className="label">Heroes modelled in 3D</dt>
              <dd data-count="125">125</dd>
            </div>
            <div>
              <dt className="label">Winrate ranking</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt className="label">Account needed to vote</dt>
              <dd>No</dd>
            </div>
          </dl>
        </div>
        <div className="landing-hero-stage dota-stage">
          <HeroModelViewer hero="Anti-Mage" slug="antimage" portrait="/assets/heroes/antimage.png" />
        </div>
      </section>

      {builds.length > 0 && <Marquee items={builds.map((build) => build.title)} />}

      <section className="landing-section" id="premise">
        <div className="landing-section-head reveal">
          <SectionLabel index={1} total={4}>The premise</SectionLabel>
          <h2 className="landing-h2">What every other Dota site gets right, and why that is the problem</h2>
        </div>
        <ol className="landing-grid landing-grid-3">
          {premise.map((item, index) => (
            <li className="landing-cell reveal" key={item.title}>
              <span className="landing-cell-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
        <p className="landing-statement reveal">We rank ideas, not winrates.</p>
      </section>

      <section className="landing-section" id="how">
        <div className="landing-section-head reveal">
          <SectionLabel index={2} total={4}>How it works</SectionLabel>
          <h2 className="landing-h2">Three moves, about thirty seconds</h2>
        </div>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li className="landing-step reveal" key={step.title}>
              <span className="landing-step-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" id="rules">
        <div className="landing-section-head reveal">
          <SectionLabel index={3} total={4}>House rules</SectionLabel>
          <h2 className="landing-h2">What makes a build worth publishing</h2>
        </div>
        <ol className="landing-rules">
          {rules.map((rule, index) => (
            <li className="reveal" key={rule}>
              <span className="landing-rule-index">{String(index + 1).padStart(2, "0")}</span>
              <p>{rule}</p>
            </li>
          ))}
        </ol>
        <p className="landing-note reveal">
          Randomness on its own is not the value. The value is being able to say, briefly, why these
          items might work together.
        </p>
      </section>

      {builds.length > 0 && (
        <section className="landing-section" id="feed">
          <div className="landing-section-head reveal">
            <SectionLabel index={4} total={4}>Live from the feed</SectionLabel>
            <h2 className="landing-h2">Builds people are arguing about right now</h2>
          </div>
          <div className="build-list reveal">
            {builds.map((build, index) => (
              <BuildCard key={build.id} build={build} index={index} />
            ))}
          </div>
          <div className="landing-cta reveal">
            <Link className="primary-button" href="/app">See the whole feed</Link>
          </div>
        </section>
      )}

      <section className="landing-section" id="faq">
        <div className="landing-section-head reveal">
          <span className="label section-marker">Questions</span>
          <h2 className="landing-h2">Frequently asked</h2>
        </div>
        <div className="landing-faq">
          {faq.map((item) => (
            <details className="landing-faq-item reveal" key={item.q}>
              <summary>
                <span>{item.q}</span>
                <i aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-closer">
        <div className="reveal">
          <h2 className="landing-title landing-title-closer">Go on then.<br />Judge something.</h2>
          <div className="landing-cta">
            <Link className="primary-button" href="/app">Spin a build</Link>
            <Link className="ghost-button" href="/register">Create an account</Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
