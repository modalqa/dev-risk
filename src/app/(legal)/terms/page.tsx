import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - DevRisk AI',
  description: 'Terms of Service for DevRisk AI Risk Intelligence Platform',
};

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: March 6, 2026</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
          <p className="leading-relaxed">
            By accessing or using DevRisk AI (&quot;Service&quot;), you agree to be bound by these Terms of Service 
            (&quot;Terms&quot;). If you disagree with any part of the terms, you may not access the Service. 
            These Terms apply to all visitors, users, and others who access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
          <p className="leading-relaxed">
            DevRisk AI is an AI-powered risk intelligence platform designed to help engineering teams 
            identify, assess, and mitigate risks in their software development lifecycle. Our Service includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Risk scoring and analytics for software releases</li>
            <li>Integration with version control and CI/CD systems</li>
            <li>AI-powered risk analysis and recommendations</li>
            <li>User journey risk mapping and visualization</li>
            <li>Predictive risk forecasting</li>
            <li>Team collaboration and notification features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
          <p className="leading-relaxed mb-4">
            To use certain features of the Service, you must register for an account. When you register, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Keep your password secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Subscription and Payment</h2>
          
          <h3 className="text-lg font-medium text-white mb-3">4.1 Pricing</h3>
          <p className="leading-relaxed">
            Access to certain features requires a paid subscription. Pricing is available on our website 
            or through our sales team. Prices are subject to change with 30 days&apos; notice.
          </p>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">4.2 Billing</h3>
          <p className="leading-relaxed">
            Subscriptions are billed in advance on a monthly or annual basis. You authorize us to charge 
            your designated payment method for all fees incurred. Failed payments may result in service suspension.
          </p>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">4.3 Refunds</h3>
          <p className="leading-relaxed">
            Annual subscriptions may be refunded within 14 days of purchase if you are not satisfied. 
            Monthly subscriptions are non-refundable. Contact support for refund requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">5. Acceptable Use</h2>
          <p className="leading-relaxed mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of any laws</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Scrape, crawl, or use automated means to access the Service without permission</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Share account credentials or allow unauthorized third-party access</li>
            <li>Use the Service to compete with DevRisk AI or develop a competing product</li>
            <li>Resell, sublicense, or redistribute the Service without authorization</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">6. Data and Integrations</h2>
          
          <h3 className="text-lg font-medium text-white mb-3">6.1 Your Data</h3>
          <p className="leading-relaxed">
            You retain all rights to the data you provide to the Service. By using the Service, 
            you grant us a limited license to use, process, and store your data solely for providing 
            and improving the Service.
          </p>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">6.2 Third-Party Integrations</h3>
          <p className="leading-relaxed">
            The Service integrates with third-party services (GitHub, GitLab, CI/CD platforms, etc.). 
            Your use of these integrations is subject to those services&apos; terms. We are not responsible 
            for third-party services or their availability.
          </p>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">6.3 AI Processing</h3>
          <p className="leading-relaxed">
            Our AI features may process your data using third-party AI providers. By using AI features, 
            you consent to this processing. AI-generated insights are provided &quot;as is&quot; and should be 
            reviewed before acting upon them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
          
          <h3 className="text-lg font-medium text-white mb-3">7.1 Our Property</h3>
          <p className="leading-relaxed">
            The Service, including its original content, features, functionality, design, and technology, 
            is owned by DevRisk AI and protected by intellectual property laws. Our trademarks and trade 
            dress may not be used without our prior written permission.
          </p>

          <h3 className="text-lg font-medium text-white mb-3 mt-6">7.2 Feedback</h3>
          <p className="leading-relaxed">
            Any feedback, suggestions, or ideas you provide about the Service may be used by us without 
            any obligation to compensate you. You grant us a perpetual, irrevocable license to use such feedback.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <p className="leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="leading-relaxed mt-4">
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, 
              OR THAT ANY DEFECTS WILL BE CORRECTED. RISK SCORES AND AI RECOMMENDATIONS ARE 
              INFORMATIONAL AND SHOULD NOT BE THE SOLE BASIS FOR BUSINESS DECISIONS.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <p className="leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEVRISK AI SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT 
              NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED 
              TO YOUR USE OF THE SERVICE.
            </p>
            <p className="leading-relaxed mt-4">
              OUR TOTAL LIABILITY FOR ANY CLAIMS UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT 
              YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
          <p className="leading-relaxed">
            You agree to indemnify, defend, and hold harmless DevRisk AI and its officers, directors, 
            employees, agents, and affiliates from any claims, damages, losses, liabilities, and 
            expenses (including legal fees) arising from your use of the Service, violation of these 
            Terms, or infringement of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>
          <p className="leading-relaxed mb-4">
            We may terminate or suspend your account and access to the Service immediately, without 
            prior notice, for any reason, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Breach of these Terms</li>
            <li>Non-payment of fees</li>
            <li>Request by law enforcement or government agencies</li>
            <li>Discontinuation of the Service</li>
          </ul>
          <p className="mt-4">
            Upon termination, your right to use the Service ceases immediately. You may export your 
            data before termination. We may retain certain data as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
          <p className="leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the State 
            of California, United States, without regard to its conflict of law provisions. Any disputes 
            arising under these Terms shall be resolved in the courts located in San Francisco County, California.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">13. Dispute Resolution</h2>
          <p className="leading-relaxed">
            Before filing a claim, you agree to attempt to resolve disputes informally by contacting us. 
            If we cannot resolve a dispute within 30 days, either party may pursue formal proceedings. 
            You agree to resolve disputes on an individual basis and waive any right to participate 
            in class action lawsuits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">14. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to modify these Terms at any time. We will provide notice of significant 
            changes by posting on this page and updating the &quot;Last updated&quot; date. Your continued use 
            of the Service after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">15. Severability</h2>
          <p className="leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
            shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">16. Contact Information</h2>
          <p className="leading-relaxed">
            For questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
            <p><strong>DevRisk AI</strong></p>
            <p>Email: <a href="mailto:legal@devrisk.ai" className="text-primary hover:underline">legal@devrisk.ai</a></p>
            <p>Address: Kelapa Dua, Tangerang Regency, Banten 15810, Indonesia</p>
          </div>
        </section>
      </div>
    </article>
  );
}
