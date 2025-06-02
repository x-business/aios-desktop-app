import React from 'react';

// A simple component to demonstrate the Montserrat font
const FontExample = () => {
  return (
    <div className="p-8 bg-primary-gradient-dark rounded-lg">
      <h2 className="text-3xl font-bold text-text-default mb-6 font-sora">
        Font Demonstration
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium text-secondary mb-2">Sora Font</h3>
          <p className="text-text-light font-sora">
            This paragraph uses the Sora font, which is excellent for headings and titles.
            It has a modern, geometric character that works well for tech-focused interfaces.
          </p>
        </div>
        
        <div>
          <h3 className="text-xl font-medium text-secondary mb-2">Montserrat Font</h3>
          <p className="text-text-light font-montserrat">
            This paragraph uses Montserrat, which is a clean, elegant font that works well for body text.
            It has excellent readability and a contemporary feel that complements the Sora headings.
          </p>
          <div className="mt-4 space-y-2">
            <p className="font-montserrat font-normal">Montserrat Normal Weight (400)</p>
            <p className="font-montserrat font-medium">Montserrat Medium Weight (500)</p>
            <p className="font-montserrat font-semibold">Montserrat Semi-Bold Weight (600)</p>
            <p className="font-montserrat font-bold">Montserrat Bold Weight (700)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontExample; 