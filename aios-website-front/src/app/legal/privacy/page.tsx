import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | AIOS',
  description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
};

const PrivacyPolicy = () => {
  return (
    <div className="container-fluid py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-text-default">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-text-light mb-6">Last Updated: May 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">1. Introduction</h2>
            <p className="mb-4">
              At Blackcode Research, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, process, and store your personal information when 
              you use our AIOS platform and services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">2. Information We Collect</h2>
            <p className="mb-4">
              We may collect different types of information from you, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Personal information (name, email address, etc.) when you register for an account</li>
              <li>Usage data related to your interaction with our platform</li>
              <li>Information about your device and browser</li>
              <li>Data processed through our AI integration services, as specified in our service agreements</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">3. How We Use Your Information</h2>
            <p className="mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you and respond to inquiries</li>
              <li>To send you updates about our services and features</li>
              <li>To ensure the security and proper functioning of our platform</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Service providers who assist us in operating our platform</li>
              <li>Partners with whom we offer co-branded services or promotions</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p>
              We will never sell your personal information to third parties.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
              over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">6. Your Rights</h2>
            <p className="mb-4">
              Depending on your location, you may have rights regarding your personal data, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your personal information</li>
              <li>The right to object to or restrict processing of your data</li>
              <li>The right to data portability</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy; 