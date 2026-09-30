import { Link, useLocation } from 'react-router-dom';

const updated = '30 September 2026';
const operator = 'Anadi Tripathi';
const email = 'tripathiyash382@gmail.com';
const address = 'Vikas Nagar, Lucknow, India';

const sections = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains how Memoir handles personal data when you import chats, create scrapbooks, use guest mode, or create an account.',
    blocks: [
      ['Who operates Memoir', <p key="operator">Memoir is operated by {operator}, {address}. For privacy requests or complaints, contact <a href={`mailto:${email}`}>{email}</a>. Anadi Tripathi is the privacy and grievance contact.</p>],
      ['Data we process', <ul key="data"><li>Account data: your name, email address, encrypted account-key material, and authentication records.</li><li>Content you choose to provide: imported chat text, starred messages, scrapbook content, and associated dates or participant names.</li><li>Local data: guest content, preferences, and a random guest identifier stored in your browser.</li><li>Technical data: hosting and authentication providers may process security logs, IP address, browser or device information, and timestamps needed to operate and protect the service.</li></ul>],
      ['Why we use it', <p key="purpose">We process this data only to provide accounts, import and display memories, save and sync content, recover access, respond to requests, prevent abuse, maintain security, and comply with law. We do not use imported memories for advertising or sell personal data.</p>],
      ['Legal basis and consent', <p key="basis">We process account and content data to provide the service you request and, where required, on your consent. You may use guest mode without creating an account. You may withdraw consent by deleting your account or contacting us, although this does not affect earlier lawful processing and may prevent us from providing account features.</p>],
      ['Storage and service providers', <p key="providers">Guest data is stored in your browser. Account data and encrypted vault records are handled using Supabase. The website is hosted using Vercel. These providers process limited data on our behalf under their own security and legal obligations. Data may be processed outside your country, subject to applicable safeguards.</p>],
      ['Encryption and photos', <p key="security">Account vault content is encrypted before storage. Memoir is configured to upload chats and scrapbook records, not imported photo files. Photos selected from an imported archive may remain local to your browser. No security method is guaranteed to be completely secure, so keep your password and recovery phrase private.</p>],
      ['Retention', <p key="retention">We retain account data while your account is active and as reasonably necessary for security, dispute resolution, and legal obligations. Guest data remains on the device until you clear site data. You may request account deletion by email. Provider backups and security logs may persist for limited operational or legal periods.</p>],
      ['Your choices and rights', <p key="rights">Depending on applicable law, you may request access, correction, deletion, restriction, or a copy of your personal data, withdraw consent, nominate another person where Indian law permits, or complain to a regulator. Email us from your account address. We may verify your identity before acting. You may also complain to the Data Protection Board of India when the relevant provisions apply, or your local privacy authority.</p>],
      ['Other people’s data', <p key="others">WhatsApp imports can contain information about other people. Only upload content you are entitled to use. Tell relevant participants where legally required and avoid importing unnecessary sensitive information.</p>],
      ['Children', <p key="children">Memoir is for people aged 18 or older. We do not knowingly offer the service to children. Contact us if you believe a child has provided personal data.</p>],
      ['Changes and contact', <p key="changes">We may update this policy and will change the date above. Material changes will be communicated where required. Questions and grievances may be sent to <a href={`mailto:${email}`}>{email}</a>. We aim to acknowledge complaints promptly and resolve them within the period required by applicable law.</p>],
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    intro: 'These terms govern your use of Memoir. By creating an account or using the service, you agree to them.',
    blocks: [
      ['Operator and eligibility', <p key="eligibility">Memoir is operated by {operator}, {address}. You must be at least 18 and legally able to enter a contract. Contact: <a href={`mailto:${email}`}>{email}</a>.</p>],
      ['The service', <p key="service">Memoir lets you import chat exports, view and star messages, and create scrapbooks. The service is currently provided free of charge. Features may change, be suspended, or be discontinued with reasonable notice where practicable.</p>],
      ['Your account', <p key="account">Provide accurate information, protect your password and recovery phrase, and notify us of suspected unauthorised access. Because encryption keys are controlled through your credentials and recovery phrase, we may be unable to restore encrypted content if both are lost.</p>],
      ['Your content and permissions', <p key="content">You retain ownership of your content. You give us only the limited permission necessary to host, process, transmit, and display it to operate Memoir. You represent that you have the rights and permissions needed to import and use the content, including messages and images involving other people.</p>],
      ['Acceptable use', <ul key="acceptable"><li>Do not upload unlawful, infringing, abusive, malicious, or non-consensually intimate content.</li><li>Do not access another person’s account, disrupt the service, probe security, introduce malware, scrape at scale, or misuse recovery features.</li><li>Do not use Memoir to violate privacy, intellectual-property, confidentiality, or other legal rights.</li></ul>],
      ['Our intellectual property', <p key="ip">Memoir’s software, branding, interface, and original artwork are owned by or licensed to the operator. Open-source components remain subject to their respective licences. These terms do not transfer our intellectual property to you.</p>],
      ['Availability and disclaimers', <p key="disclaimer">Memoir is provided on an “as available” basis. We do not promise uninterrupted operation, permanent storage, or that every import will be complete. Export and maintain your own backups. Nothing in these terms excludes rights or warranties that cannot lawfully be excluded.</p>],
      ['Liability', <p key="liability">To the extent permitted by law, we are not liable for indirect or consequential loss, lost data, or loss caused by your credentials, imported content, third-party services, or events outside our reasonable control. This limitation does not apply to fraud, wilful misconduct, or liability that law does not permit us to limit.</p>],
      ['Suspension and termination', <p key="termination">You may stop using Memoir and request account deletion at any time. We may restrict or terminate access for serious or repeated violations, security risk, or legal necessity, using notice where reasonably possible.</p>],
      ['Law and disputes', <p key="law">These terms are governed by the laws of India. Courts with jurisdiction in Lucknow, Uttar Pradesh will have jurisdiction, subject to any mandatory consumer rights or dispute forum that applies where you live. Contact us first at <a href={`mailto:${email}`}>{email}</a> so we can try to resolve a concern.</p>],
    ],
  },
  cookies: {
    title: 'Cookie and Local Storage Policy',
    intro: 'Memoir does not currently use advertising cookies, behavioural tracking, or analytics cookies.',
    blocks: [
      ['What the site stores', <ul key="storage"><li>Authentication session information needed to keep signed-in users connected.</li><li>A random guest identifier and guest vault data needed to preserve guest work on that device.</li><li>Interface preferences and operational state, such as a dismissed notice.</li></ul>],
      ['Why consent is not requested', <p key="consent">The current site uses browser storage only where needed to provide a feature you request, keep the service secure, or remember essential state. We therefore do not show a non-essential cookie-consent banner. Refusing or clearing this storage may sign you out or erase guest content stored on that device.</p>],
      ['Third parties and analytics', <p key="third">We found no analytics trackers, advertising pixels, social-media widgets, or third-party embeds in the application code. Supabase and Vercel may process essential technical data to provide authentication, database, hosting, and security services. If optional analytics, advertising, or embedded media is added later, this policy must be updated and prior opt-in consent must be obtained where required before those technologies load.</p>],
      ['Managing storage', <p key="manage">You can clear cookies and site data through your browser settings. Do not clear site data before exporting anything you want to keep in guest mode. For questions, email <a href={`mailto:${email}`}>{email}</a>.</p>],
    ],
  },
  refunds: {
    title: 'Refund Policy',
    intro: 'Memoir is currently free and does not accept payments.',
    blocks: [
      ['No purchases or refunds', <p key="free">Because there are no subscriptions, paid plans, or in-app purchases, no payment is collected and no refund is due.</p>],
      ['Future paid services', <p key="future">If Memoir introduces a paid service, clear pricing, cancellation, and refund terms will be presented before payment. This policy will be updated before any payment is accepted. Statutory consumer rights will not be restricted.</p>],
      ['Billing questions', <p key="contact">If you believe you were charged in connection with Memoir, contact <a href={`mailto:${email}`}>{email}</a> with the date, amount, and payment reference. Do not email passwords or recovery phrases.</p>],
    ],
  },
};

export default function LegalPage() {
  const document = useLocation().pathname.slice(1);
  const page = sections[document] || sections.privacy;
  return (
    <div className="min-h-screen bg-[#fdf8f0] text-memoir-900">
      <a href="#legal-content" className="skip-link">Skip to content</a>
      <header className="border-b border-memoir-100 bg-white"><div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between"><Link to="/" className="font-display text-xl font-bold text-memoir-800">Memoir</Link><Link to="/" className="text-sm font-medium text-memoir-600">Back to Memoir</Link></div></header>
      <main id="legal-content" className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-display font-bold">{page.title}</h1>
        <p className="mt-2 text-sm text-memoir-500">Last updated: {updated}</p>
        <p className="mt-5 text-memoir-700 leading-7">{page.intro}</p>
        <div className="mt-8 space-y-8 legal-copy">{page.blocks.map(([heading, body]) => <section key={heading}><h2 className="text-xl font-semibold text-memoir-800">{heading}</h2><div className="mt-2 text-memoir-700 leading-7">{body}</div></section>)}</div>
      </main>
      <footer className="border-t border-memoir-100 bg-white px-4 py-6"><nav aria-label="Legal documents" className="max-w-3xl mx-auto flex flex-wrap gap-4 text-sm"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link><Link to="/refunds">Refunds</Link></nav></footer>
    </div>
  );
}
