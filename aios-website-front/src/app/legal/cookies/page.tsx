import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | AIOS',
  description: 'Our cookie policy outlines how we use cookies and similar tracking technologies on our website.',
};

const CookiePolicy = () => {
  return (
    <div className="container-fluid py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-text-default">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-text-light mb-6">Last Updated: May 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">1. Introduction</h2>
            <p className="mb-4">
              This Cookie Policy explains how Blackcode Research ("we", "us", or "our") uses cookies and similar 
              technologies on our AIOS website and platform. It explains what these technologies are and why we 
              use them, as well as your rights to control our use of them.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">2. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your computer or mobile device when you visit a 
              website. They are widely used to make websites work more efficiently and provide information to 
              the website owners. Cookies enable our systems to recognize your browser or device and remember 
              certain information about your visit, such as your preferences and actions on our site.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">3. Types of Cookies We Use</h2>
            <p className="mb-4">We use the following types of cookies:</p>
            
            <h3 className="text-xl font-semibold mb-2 text-text-default">Essential Cookies</h3>
            <p className="mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, account management, and remembering your preferences. You can disable these by 
              changing your browser settings, but this may affect how the website functions.
            </p>
            
            <h3 className="text-xl font-semibold mb-2 text-text-default">Performance and Analytics Cookies</h3>
            <p className="mb-4">
              These cookies collect information about how visitors use our website, such as which pages they 
              visit most often and if they receive error messages. They help us improve our website's performance 
              and provide a better user experience.
            </p>
            
            <h3 className="text-xl font-semibold mb-2 text-text-default">Functionality Cookies</h3>
            <p className="mb-4">
              These cookies allow our website to remember choices you make (such as your username, language, or 
              region) and provide enhanced, more personal features.
            </p>
            
            <h3 className="text-xl font-semibold mb-2 text-text-default">Targeting or Advertising Cookies</h3>
            <p className="mb-4">
              These cookies are used to deliver advertisements that are more relevant to you and your interests. 
              They are also used to limit the number of times you see an advertisement and help measure the 
              effectiveness of advertising campaigns.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">4. Third-Party Cookies</h2>
            <p className="mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report usage 
              statistics of the service, deliver advertisements, and so on. These cookies may be placed by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Analytics providers (like Google Analytics)</li>
              <li>Advertising networks</li>
              <li>Social media platforms</li>
              <li>External service providers</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">5. Managing Cookies</h2>
            <p className="mb-4">
              Most web browsers allow you to control cookies through their settings preferences. Here's how to 
              manage cookies in common browsers:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
            </ul>
            <p className="mb-4">
              Please note that restricting cookies may impact your experience of our website, as some features 
              may not function properly.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">6. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time to reflect changes in technology, regulation, 
              or our business practices. Any changes will be posted on this page, and if the changes are 
              significant, we will provide a more prominent notice.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
            </p>
            <p className="mb-4">
              <strong>Email:</strong> privacy@blackcode.ai<br />
              <strong>Address:</strong> Blackcode Research, 123 AI Boulevard, Tech City, TC 12345
            </p>
          </section>
        </div>
        
        <div className="mt-12 flex justify-start">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy; 