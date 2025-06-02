import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | AIOS',
  description: 'Our terms of service outline the rules, guidelines, and legal terms that govern the use of AIOS services.',
};

const TermsOfService = () => {
  return (
    <div className="container-fluid py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-text-default">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-text-light mb-6">Last Updated: May 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using AIOS services, you agree to be bound by these Terms of Service and all 
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
              from using or accessing our services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">2. Use License</h2>
            <p className="mb-4">
              Subject to your compliance with these Terms of Service, Blackcode Research grants you a limited, 
              non-exclusive, non-transferable license to access and use the AIOS platform for your personal or 
              business purposes. This license does not include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Modifying or copying our materials</li>
              <li>Using the material for any commercial purpose or public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on AIOS</li>
              <li>Removing any copyright or other proprietary notations</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
            <p className="mb-4">
              This license shall automatically terminate if you violate any of these restrictions and may be 
              terminated by Blackcode Research at any time.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">3. User Accounts</h2>
            <p className="mb-4">
              You may need to create an account to use certain features of our services. You are responsible for 
              maintaining the confidentiality of your account credentials and for all activities that occur under 
              your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">4. Services and Subscription</h2>
            <p className="mb-4">
              AIOS provides AI integration tools and services according to the subscription plan you choose. 
              We reserve the right to modify, suspend, or discontinue any part of our services at any time 
              without prior notice.
            </p>
            <p className="mb-4">
              Subscription fees are charged according to the plan you select. You agree to pay all fees associated 
              with your account. Fees are non-refundable except as required by law or as explicitly stated in our 
              refund policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">5. Disclaimer</h2>
            <p className="mb-4">
              The materials on AIOS are provided on an 'as is' basis. Blackcode Research makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including, without 
              limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, 
              or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">6. Limitations</h2>
            <p className="mb-4">
              In no event shall Blackcode Research or its suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption) arising out of the 
              use or inability to use AIOS, even if Blackcode Research or a Blackcode Research authorized 
              representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">7. Updates to Terms</h2>
            <p className="mb-4">
              Blackcode Research may revise these Terms of Service at any time without notice. By using AIOS, 
              you agree to be bound by the current version of these Terms of Service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">8. Governing Law</h2>
            <p className="mb-4">
              These terms and conditions are governed by and construed in accordance with the laws of the country 
              of registration of Blackcode Research and you irrevocably submit to the exclusive jurisdiction of 
              the courts in that location.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-default">9. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-4">
              <strong>Email:</strong> legal@blackcode.ai<br />
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

export default TermsOfService; 