import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-6 font-sora">
        Test Page - Styled Content
      </h1>
      
      <div className="bg-primary-gradient-dark p-8 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-semibold text-secondary mb-4">
          Font and Styling Test
        </h2>
        
        <p className="text-text-light mb-4 font-montserrat">
          This is a test paragraph with Montserrat font. If you can see this properly styled,
          the CSS is working correctly.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded">
            <h3 className="text-white font-medium mb-2">Card 1</h3>
            <p className="text-text-light text-sm">Testing card with styling</p>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <h3 className="text-white font-medium mb-2">Card 2</h3>
            <p className="text-text-light text-sm">Testing card with styling</p>
          </div>
        </div>
        
        <Link 
          href="/" 
          className="btn-primary inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 