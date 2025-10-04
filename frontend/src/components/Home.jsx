import { useState } from 'react';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Welcome from './Welcome.jsx';
import Upload from './Upload.jsx';
import Report from './Report.jsx';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(null);
  const [uploadId, setUploadId] = useState(null);

  const steps = ['Welcome', 'Upload', 'Report'];

  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="p-4 w-full">
      <img
        className="w-full max-w-md mx-auto"
        src="https://cdn.sanity.io/images/s1vd82jm/production/16b320c118fe2a630aa9855b697c77e082412806-1005x132.svg"
        alt=""
      />
      <div
        className={`bg-white flex flex-col justify-between max-w-xl mx-auto mt-10 p-6 lg:px-16 border rounded-2xl shadow-2xl
        ${currentStep === 0 ? 'h-1/2' : 'h-max'}
        transition-all duration-500 ease-in-out`}
      >
        <Stepper activeStep={currentStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <div className="text-black">
          {currentStep === 0 && <Welcome />}
          {currentStep === 1 && (
            <Upload data={data} setData={setData} setUploadId={setUploadId} />
          )}
          {currentStep === 2 && <Report uploadId={uploadId} />}
        </div>

        {currentStep < 2 && (
          <div className="flex justify-around mt-5">
            <Button onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={currentStep === 1 && !data}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
