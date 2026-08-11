import React, { useState } from 'react';
import UploadStep from '../components/data/UploadStep';
import MappingStep from '../components/data/MappingStep';
import PreviewStep from '../components/data/PreviewStep';
import SuccessStep from '../components/data/SuccessStep';

export default function Data() {
  const [step, setStep] = useState(1);
  
  // State to hold data passed between steps
  const [selectedFile, setSelectedFile] = useState(null);
  const [tempFileId, setTempFileId] = useState(null);
  const [sourceType, setSourceType] = useState('sales');
  const [headers, setHeaders] = useState([]);
  const [suggestedMappings, setSuggestedMappings] = useState([]);
  const [originalFilename, setOriginalFilename] = useState('');
  const [finalMapping, setFinalMapping] = useState({});

  const handleUploadSuccess = (data) => {
    setTempFileId(data.tempFileId);
    setSourceType(data.sourceType);
    setHeaders(data.headers);
    setSuggestedMappings(data.suggestedMappings);
    setOriginalFilename(data.originalFilename);
    setStep(2); // Go to Mapping Step
  };

  const handleMappingComplete = (mapping) => {
    setFinalMapping(mapping);
    setStep(3); // Go to Preview Step
  };

  const handlePreviewComplete = () => {
    setStep(4); // Go to Success/Commit Step
  };

  const resetWizard = () => {
    setSelectedFile(null);
    setTempFileId(null);
    setSourceType('sales');
    setHeaders([]);
    setSuggestedMappings([]);
    setOriginalFilename('');
    setFinalMapping({});
    setStep(1);
  };

  const goBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="py-6 space-y-6 animate-fade-in">

      {/* Wizard Progress Indicator */}
      {step < 4 && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {['Upload File', 'Map Columns', 'Preview & Validate'].map((label, idx) => {
              const stepNumber = idx + 1;
              const isActive = step === stepNumber;
              const isPast = step > stepNumber;
              
              return (
                <div key={stepNumber} className="flex flex-col items-center relative flex-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${
                      isActive ? 'bg-violet-600 text-white shadow-md' : 
                      isPast ? 'bg-violet-500/20 text-violet-300' : 
                      'glass-surface text-slate-500'
                    }`}
                  >
                    {isPast ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    isActive ? 'text-violet-400' : 'text-slate-500'
                  }`}>
                    {label}
                  </span>
                  
                  {/* Connector Line */}
                  {stepNumber < 3 && (
                    <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${
                      isPast ? 'bg-violet-500/30' : 'glass-surface'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Render Steps */}
      {step === 1 && (
        <UploadStep 
          onUploadSuccess={handleUploadSuccess} 
          initialFile={selectedFile}
          onFileSelect={setSelectedFile}
          initialSourceType={sourceType}
        />
      )}
      
      {step === 2 && (
        <MappingStep 
          headers={headers} 
          suggestedMappings={suggestedMappings} 
          sourceType={sourceType}
          onMappingComplete={handleMappingComplete}
          onBack={goBack}
        />
      )}

      {step === 3 && (
        <PreviewStep 
          tempFileId={tempFileId}
          sourceType={sourceType}
          mapping={finalMapping}
          onPreviewComplete={handlePreviewComplete}
          onBack={goBack}
        />
      )}

      {step === 4 && (
        <SuccessStep 
          tempFileId={tempFileId}
          sourceType={sourceType}
          mapping={finalMapping}
          originalFilename={originalFilename}
          onReset={resetWizard}
        />
      )}
    </div>
  );
}
