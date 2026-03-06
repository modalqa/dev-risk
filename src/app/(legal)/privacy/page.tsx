import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - DevRisk AI',
  description: 'Privacy Policy for DevRisk AI Risk Intelligence Platform',
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: March 6, 2026</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
          <p className="leading-relaxed">
            DevRisk AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our risk intelligence platform and related services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-white mb-3">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, company name, job title, and password when you create an account.</li>
            <li><strong>Contact Information:</strong> Information you provide when requesting a demo or contacting support.</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through our payment providers.</li>
          </ul>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Information about how you interact with our platform, including features used and actions taken.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
            <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience and analyze usage patterns.</li>
          </ul>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">2.3 Integration Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Repository Data:</strong> When you connect Git repositories, we access commit history, pull request data, and deployment information for risk analysis.</li>
            <li><strong>CI/CD Data:</strong> Build and deployment metrics from connected CI/CD pipelines.</li>
            <li><strong>Analytics Data:</strong> Performance and error data from connected monitoring services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our risk intelligence services</li>
            <li>Calculate risk scores and generate predictive analytics</li>
            <li>Send notifications about risk alerts and system updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Analyze usage patterns to enhance platform features</li>
            <li>Detect and prevent fraud, abuse, or security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. AI and Machine Learning</h2>
          <p className="leading-relaxed">
            Our platform uses artificial intelligence and machine learning to analyze your development data 
            and provide risk insights. This processing is essential to deliver our core services. 
            We may use aggregated, anonymized data to improve our AI models, but we never use your 
            identifiable data to train models that benefit other customers without your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
          <p className="mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, analytics, payment processing).</li>
            <li><strong>AI Providers:</strong> When using external AI services (OpenAI, Anthropic, etc.) for analysis, data is transmitted securely and processed according to their privacy policies.</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
          </ul>
          <p className="mt-4">
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">6. Data Security</h2>
          <p className="leading-relaxed">
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure data centers with SOC 2 Type II compliance</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your data for as long as your account is active or as needed to provide services. 
            After account termination, we retain data for a reasonable period to comply with legal 
            obligations, resolve disputes, and enforce agreements. You may request data deletion 
            at any time, subject to legal retention requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">8. Your Rights</h2>
          <p className="mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate or incomplete data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at <a href="mailto:privacy@devrisk.ai" className="text-primary hover:underline">privacy@devrisk.ai</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">9. International Data Transfers</h2>
          <p className="leading-relaxed">
            Your data may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place, such as Standard Contractual Clauses, 
            to protect your data in accordance with applicable data protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
          <p className="leading-relaxed">
            Our services are not directed to individuals under 18 years of age. 
            We do not knowingly collect personal information from children. 
            If we become aware that we have collected data from a child, we will take steps to delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant 
            changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. 
            Your continued use of our services after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
            <p><strong>DevRisk AI</strong></p>
            <p>Email: <a href="mailto:privacy@devrisk.ai" className="text-primary hover:underline">privacy@devrisk.ai</a></p>
            <p>Address: Kelapa Dua, Tangerang Regency, Banten 15810, Indonesia</p>
          </div>
        </section>
      </div>
    </article>
  );
}
