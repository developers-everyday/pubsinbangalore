import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | PubsInBangalore",
  description:
    "Legal disclaimer and terms of use for PubsInBangalore. Information about data sources, liability, and user responsibility.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Disclaimer</h1>
          <p className="mt-2 text-sm text-slate-600">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Information Aggregation
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              PubsInBangalore aggregates information from multiple sources including but not limited
              to:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-base text-slate-600">
              <li>User-submitted contributions and reviews</li>
              <li>Publicly available business listings and directories</li>
              <li>Third-party platforms and websites</li>
              <li>Social media platforms</li>
              <li>Direct information from pub owners and management</li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              While we make reasonable efforts to ensure accuracy and reliability, we cannot
              guarantee that all information is complete, current, or error-free. Information may be
              outdated, incomplete, or inaccurate despite our best efforts.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. No Warranty or Guarantee
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              The information provided on this website is for general informational purposes only.
              All information is provided &quot;as is&quot; with no warranty of any kind, either express or
              implied. We do not warrant that:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-base text-slate-600">
              <li>The information is accurate, reliable, or complete</li>
              <li>The website will be available at all times or free from errors</li>
              <li>Any defects or errors will be corrected</li>
              <li>The website is free from viruses or other harmful components</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Verification of Information
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Users are strongly encouraged to verify all information directly with the respective
              venues before making any decisions or visiting. Key details that are subject to change
              include:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-base text-slate-600">
              <li>Operating hours and business days</li>
              <li>Cover charges and entry fees</li>
              <li>Entry policies (stag/couples entry)</li>
              <li>Menu prices and availability</li>
              <li>Events and special offers</li>
              <li>Dress codes and age restrictions</li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              These details may change without notice, and PubsInBangalore is not responsible for
              any inconvenience caused by outdated information.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. User Responsibility and Decision Making
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Users acknowledge and agree that:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-base text-slate-600">
              <li>
                You are solely responsible for your own decisions and actions based on information
                found on this website
              </li>
              <li>
                You must exercise your own judgment when selecting venues and making plans
              </li>
              <li>
                You are responsible for verifying information and conducting your own due diligence
              </li>
              <li>
                You understand that choices made based on this information are entirely at your own
                risk
              </li>
              <li>
                You will comply with all local laws, regulations, and venue policies when visiting
                establishments
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Limitation of Liability
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              To the maximum extent permitted by law, PubsInBangalore, its owners, operators,
              contributors, and affiliates shall not be liable for any:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-slate-600">
              <li>Direct, indirect, incidental, or consequential damages</li>
              <li>
                Losses or damages arising from reliance on information provided on this website
              </li>
              <li>Decisions made based on the information available on this platform</li>
              <li>
                Experiences, incidents, or issues encountered at any venue listed on this website
              </li>
              <li>Inaccuracies, errors, or omissions in the information provided</li>
              <li>
                Business closures, policy changes, or other modifications made by venue operators
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. No Endorsement or Affiliation
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              The listing of any pub, bar, or venue on this website does not constitute an
              endorsement, recommendation, or guarantee of quality. We are not affiliated with,
              sponsored by, or officially connected to any of the establishments listed unless
              explicitly stated. User reviews and ratings represent individual opinions and
              experiences.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Responsible Consumption
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              PubsInBangalore promotes responsible alcohol consumption. Users must:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-slate-600">
              <li>Be of legal drinking age in their jurisdiction</li>
              <li>Drink responsibly and never drink and drive</li>
              <li>Follow all local laws and regulations regarding alcohol consumption</li>
              <li>Respect venue policies and staff instructions</li>
              <li>Be aware of their personal limits and health conditions</li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              We are not responsible for any consequences arising from alcohol consumption or
              behavior at venues.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Third-Party Content and Links
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              This website may contain links to third-party websites and platforms. We are not
              responsible for the content, accuracy, or practices of these external sites. Clicking
              on external links is at your own risk, and you should review the terms and privacy
              policies of any third-party websites you visit.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              9. User-Generated Content
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Reviews, ratings, and comments submitted by users represent their personal opinions
              and experiences. PubsInBangalore does not verify the accuracy of user-generated
              content and is not responsible for its content. We reserve the right to moderate,
              edit, or remove any user-generated content at our discretion.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              10. Changes to Disclaimer
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              We reserve the right to modify this disclaimer at any time without prior notice.
              Changes will be effective immediately upon posting to the website. Your continued use
              of the website following any changes constitutes acceptance of the modified
              disclaimer.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">11. Contact Information</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              If you have questions about this disclaimer or need to report inaccurate information,
              please contact us through our{" "}
              <Link href="/contact" className="font-medium text-emerald-600 hover:text-emerald-700">
                contact page
              </Link>
              .
            </p>
          </section>

          {/* Important Notice */}
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
            <h3 className="font-semibold text-amber-900">⚠️ Important Notice</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              By using PubsInBangalore, you acknowledge that you have read, understood, and agree to
              be bound by this disclaimer. If you do not agree with any part of this disclaimer,
              you should not use this website.
            </p>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Return to Homepage
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PubsInBangalore. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

