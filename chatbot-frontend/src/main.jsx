import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient()

import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

datadogRum.init({
  applicationId: 'f56e01d9-58a2-4175-9f23-9736157b85b6',
  clientToken: 'pub9032f7a504b99ff9f55c1c021272a0b3',
  site: 'us5.datadoghq.com',
  service: 'chatbot-frontend',
  env: 'prod',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  defaultPrivacyLevel: 'mask-user-input',
  plugins: [reactPlugin({ router: true })],
});

datadogRum.startSessionReplayRecording();


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
